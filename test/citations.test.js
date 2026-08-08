import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Citation-integrity checker (MAINT-01, 05-01-PLAN.md).
 *
 * Walks every `.js` file under `src/` and `bin/`, extracts its comment text
 * only (JSDoc block comments and `//` line-comment runs), and enforces two
 * rules plus one anti-appeasement floor:
 *
 *   R1 — every markdown-filename token in a comment must be fully qualified
 *        (begin with `.planning/`, or be exactly `README.md`), resolve to a
 *        real file on disk, and have a double-quoted excerpt in the same
 *        citation window whose text is a substring of a real heading line
 *        in that target file.
 *
 *   R2 — every bare `Pitfall <N-or-letter>` / `Pattern <N>` / `Anti-Pattern
 *        <N>` label must be backed, somewhere in the SAME source file, by
 *        an R1-valid citation whose quoted excerpt begins with that exact
 *        label string. File-scoped, not window-scoped: a file cites a
 *        document in full once per label and may then refer to the label
 *        freely.
 *
 * Findings are collected across every file, sorted by file path then line
 * number, and reported together in one failure message — stable across
 * repeat runs, and naming every offender in one pass.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const SOURCE_DIRS = ['src', 'bin'];

/**
 * Plan-time enumerated citation-site count (05-01-PLAN.md § Citation
 * Resolution Table, verified against the live tree on 2026-08-08). A
 * deliberate future addition to a source file's citations should RAISE
 * this constant; it must never be lowered — lowering it is the cheapest
 * way to silently "fix" a citation-rot regression by deleting evidence
 * instead of repairing it.
 */
const MINIMUM_CITATION_SITE_COUNT = 34;

const MD_TOKEN_RE = /[.\w/-]+\.md\b/g;
const QUOTE_RE = /"([^"]+)"/g;
const LABEL_RE = /\b(?:Pitfall\s+[A-Za-z0-9]+|Pattern\s+\d+|Anti-Pattern\s+\d+)\b/g;
const HEADING_RE = /^#+\s+(.*)$/;
const PAREN_WINDOW_FALLBACK_CHARS = 200;

/**
 * @typedef {{ text: string, lineNo: number }} RawLine
 * @typedef {{ normalized: string, lineForChar: number[] }} Blob
 * @typedef {{ file: string, line: number | undefined, rule: 'R1' | 'R2', message: string }} Finding
 */

/** Recursively collect every `.js` file path under `dir`, repo-relative-sorted.
 * @param {string} dir
 * @returns {string[]}
 */
function walkJsFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walkJsFiles(full));
    } else if (entry.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

/** Strip block/line comment syntax and leading star prefixes from one raw source line.
 * @param {string} rawLine
 * @returns {string}
 */
function stripCommentSyntax(rawLine) {
  let s = rawLine.trim();
  if (s.startsWith('/**')) s = s.slice(3);
  else if (s.startsWith('/*')) s = s.slice(2);
  if (s.endsWith('*/')) s = s.slice(0, -2);
  s = s.trim();
  if (s.startsWith('*')) s = s.slice(1);
  else if (s.startsWith('//')) s = s.slice(2);
  return s.trim();
}

/**
 * Build one comment "blob" from a run of raw `{ text, lineNo }` lines
 * belonging to the same JSDoc block or the same contiguous `//` run: a
 * single whitespace-collapsed, prefix-stripped string, plus a parallel
 * per-character array mapping each normalized character back to the
 * 1-indexed source line that produced it. This is what lets a citation
 * that only exists because several JSDoc lines were joined still be
 * reported at the line the reader would actually look at.
 * @param {RawLine[]} rawLines
 * @returns {Blob}
 */
function buildBlob(rawLines) {
  let normalized = '';
  /** @type {number[]} */
  const lineForChar = [];
  for (const { text, lineNo } of rawLines) {
    const content = stripCommentSyntax(text);
    if (content.length === 0) continue;
    if (normalized.length > 0) {
      normalized += ' ';
      lineForChar.push(lineNo);
    }
    const collapsed = content.replace(/\s+/g, ' ');
    for (const ch of collapsed) {
      normalized += ch;
      lineForChar.push(lineNo);
    }
  }
  return { normalized, lineForChar };
}

/**
 * Extract comment blobs from a source file's raw text: contiguous block
 * comments (collected line-by-line so multi-line JSDoc becomes one
 * blob), and contiguous runs of `//` line comments (a blank line or a code
 * line breaks the run).
 * @param {string} source
 * @returns {Blob[]}
 */
function extractCommentBlobs(source) {
  const lines = source.split('\n');
  /** @type {Blob[]} */
  const blobs = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('/*')) {
      /** @type {RawLine[]} */
      const rawLines = [];
      let j = i;
      for (; j < lines.length; j++) {
        rawLines.push({ text: lines[j], lineNo: j + 1 });
        if (lines[j].includes('*/')) {
          j++;
          break;
        }
      }
      blobs.push(buildBlob(rawLines));
      i = j;
    } else if (trimmed.startsWith('//')) {
      /** @type {RawLine[]} */
      const rawLines = [];
      let j = i;
      for (; j < lines.length; j++) {
        if (!lines[j].trim().startsWith('//')) break;
        rawLines.push({ text: lines[j], lineNo: j + 1 });
      }
      blobs.push(buildBlob(rawLines));
      i = j;
    } else {
      i++;
    }
  }
  return blobs;
}

/** Read a markdown file's heading lines (`^#+ ...`) once per target file, cached across calls.
 * @type {Map<string, string[]>}
 */
const headingCache = new Map();
/**
 * @param {string} targetPath
 * @returns {string[]}
 */
function headingsFor(targetPath) {
  const cached = headingCache.get(targetPath);
  if (cached) return cached;
  /** @type {string[]} */
  let headings = [];
  if (existsSync(targetPath)) {
    const text = readFileSync(targetPath, 'utf-8');
    headings = text
      .split('\n')
      .map((line) => line.match(HEADING_RE))
      .filter((m) => m !== null)
      .map((m) => m[1]);
  }
  headingCache.set(targetPath, headings);
  return headings;
}

/**
 * The citation window around a token at `[start, end)` in `text`: the
 * enclosing parenthetical if the token sits inside one that closes at or
 * after the token, otherwise a bounded span of `PAREN_WINDOW_FALLBACK_CHARS`
 * characters either side.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @returns {[number, number]}
 */
function citationWindow(text, start, end) {
  let openIdx = -1;
  let depth = 0;
  for (let k = start - 1; k >= 0; k--) {
    if (text[k] === ')') {
      depth++;
    } else if (text[k] === '(') {
      if (depth === 0) {
        openIdx = k;
        break;
      }
      depth--;
    }
  }
  if (openIdx !== -1) {
    let d = 1;
    for (let k = openIdx + 1; k < text.length; k++) {
      if (text[k] === '(') d++;
      else if (text[k] === ')') {
        d--;
        if (d === 0) {
          if (k >= end - 1) return [openIdx, k + 1];
          break;
        }
      }
    }
  }
  return [Math.max(0, start - PAREN_WINDOW_FALLBACK_CHARS), Math.min(text.length, end + PAREN_WINDOW_FALLBACK_CHARS)];
}

/**
 * Ranges of `normalized` that fall INSIDE a double-quoted excerpt (the
 * quoted heading text itself, not the quote marks). Citation tokens and
 * bare labels are only meaningful in citing prose — a quoted heading may
 * legitimately mention a filename or a label as part of its own title (see
 * curve.js's "...03-RESEARCH.md's curve code example" Planner Note
 * heading), and that mention must not be re-scanned as a fresh site.
 * @param {string} normalized
 * @returns {[number, number][]}
 */
function quoteSpans(normalized) {
  /** @type {[number, number][]} */
  const spans = [];
  QUOTE_RE.lastIndex = 0;
  let m;
  while ((m = QUOTE_RE.exec(normalized)) !== null) {
    const innerStart = m.index + 1;
    spans.push([innerStart, innerStart + m[1].length]);
  }
  return spans;
}

/**
 * @param {number} idx
 * @param {[number, number][]} spans
 * @returns {boolean}
 */
function insideAnySpan(idx, spans) {
  return spans.some(([s, e]) => idx >= s && idx < e);
}

/**
 * Evaluate one file's comment blobs against R1 and R2, returning
 * `{ findings, siteCount }`. `siteCount` counts every markdown-path token
 * and every bare label occurrence — the raw site total the anti-appeasement
 * floor is measured against.
 * @param {string} filePath
 * @param {string} relPath
 * @returns {{ findings: Finding[], siteCount: number }}
 */
function checkFile(filePath, relPath) {
  const source = readFileSync(filePath, 'utf-8');
  const blobs = extractCommentBlobs(source);

  /** @type {Finding[]} */
  const findings = [];
  /** Excerpts proven R1-valid anywhere in this file, for R2's file-scoped backing check.
   * @type {string[]}
   */
  const validExcerpts = [];
  let siteCount = 0;

  for (const blob of blobs) {
    const { normalized, lineForChar } = blob;
    const quotedSpans = quoteSpans(normalized);

    MD_TOKEN_RE.lastIndex = 0;
    let match;
    while ((match = MD_TOKEN_RE.exec(normalized)) !== null) {
      const token = match[0];
      const start = match.index;
      const end = start + token.length;
      if (insideAnySpan(start, quotedSpans)) continue;
      siteCount++;
      const lineNo = lineForChar[start];
      const fullyQualified = token.startsWith('.planning/') || token === 'README.md';

      if (!fullyQualified) {
        findings.push({
          file: relPath,
          line: lineNo,
          rule: 'R1',
          message: `path token "${token}" is not fully qualified (must start with ".planning/" or be exactly "README.md")`,
        });
        continue;
      }

      const targetPath = path.join(REPO_ROOT, token);
      if (!existsSync(targetPath)) {
        findings.push({
          file: relPath,
          line: lineNo,
          rule: 'R1',
          message: `path token "${token}" does not exist on disk`,
        });
        continue;
      }

      const [winStart, winEnd] = citationWindow(normalized, start, end);
      const windowText = normalized.slice(winStart, winEnd);
      const headings = headingsFor(targetPath);

      QUOTE_RE.lastIndex = 0;
      let quoteMatch;
      let resolved = false;
      /** @type {string | null} */
      let resolvedExcerpt = null;
      while ((quoteMatch = QUOTE_RE.exec(windowText)) !== null) {
        const excerpt = quoteMatch[1].trim();
        if (headings.some((h) => h.includes(excerpt))) {
          resolved = true;
          resolvedExcerpt = excerpt;
          break;
        }
      }

      if (!resolved || resolvedExcerpt === null) {
        findings.push({
          file: relPath,
          line: lineNo,
          rule: 'R1',
          message: `path token "${token}" has no quoted excerpt in its citation window matching a real heading in that file`,
        });
      } else {
        validExcerpts.push(resolvedExcerpt);
      }
    }
  }

  // R2 pass: every bare label occurrence, across every blob, must be backed
  // in this same file by an R1-valid excerpt that begins with that label.
  const reportedLabelLines = new Set();
  for (const blob of blobs) {
    const { normalized, lineForChar } = blob;
    const quotedSpans = quoteSpans(normalized);
    LABEL_RE.lastIndex = 0;
    let labelMatch;
    while ((labelMatch = LABEL_RE.exec(normalized)) !== null) {
      if (insideAnySpan(labelMatch.index, quotedSpans)) continue;
      siteCount++;
      const label = labelMatch[0];
      const lineNo = lineForChar[labelMatch.index];
      const backed = validExcerpts.some((excerpt) => excerpt.startsWith(label));
      if (!backed) {
        const key = `${lineNo}:${label}`;
        if (!reportedLabelLines.has(key)) {
          reportedLabelLines.add(key);
          findings.push({
            file: relPath,
            line: lineNo,
            rule: 'R2',
            message: `bare label "${label}" is not backed by a fully-qualified, heading-resolved citation for "${label}" anywhere in this file`,
          });
        }
      }
    }
  }

  return { findings, siteCount };
}

/**
 * @returns {{ findings: Finding[], totalSiteCount: number }}
 */
function collectFindings() {
  /** @type {Finding[]} */
  const allFindings = [];
  let totalSiteCount = 0;

  for (const dir of SOURCE_DIRS) {
    const absDir = path.join(REPO_ROOT, dir);
    for (const filePath of walkJsFiles(absDir)) {
      const relPath = path.relative(REPO_ROOT, filePath).split(path.sep).join('/');
      const { findings, siteCount } = checkFile(filePath, relPath);
      allFindings.push(...findings);
      totalSiteCount += siteCount;
    }
  }

  allFindings.sort((a, b) => {
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    return (a.line ?? 0) - (b.line ?? 0);
  });

  return { findings: allFindings, totalSiteCount };
}

/**
 * @param {Finding[]} findings
 * @returns {string}
 */
function formatFindings(findings) {
  return findings.map((f) => `${f.file}:${f.line} [${f.rule}] ${f.message}`).join('\n');
}

describe('Citation integrity (MAINT-01)', () => {
  it('has zero findings across src/ and bin/, and at least the plan-time-enumerated site count', () => {
    const { findings, totalSiteCount } = collectFindings();
    expect(totalSiteCount).toBeGreaterThanOrEqual(MINIMUM_CITATION_SITE_COUNT);
    expect(findings, `Citation findings:\n${formatFindings(findings)}`).toHaveLength(0);
  });

  it('produces byte-identical findings output across two runs', () => {
    const first = formatFindings(collectFindings().findings);
    const second = formatFindings(collectFindings().findings);
    expect(first).toBe(second);
  });
});
