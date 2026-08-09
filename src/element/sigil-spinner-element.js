/* global HTMLElement, customElements, console */
/**
 * `<sigil-spinner>` custom element (WRAP-01, WRAP-02, WRAP-03).
 *
 * A value-neutral convenience wrapper around the raw-SVG embed path that
 * already works — not a second, safer, different embedding model. It reads
 * attributes, calls the public `generateSigil` API, and writes the whole,
 * unmodified result into its own light-DOM children (D-82: no shadow root,
 * ever). If the element's output or theming reach would ever differ from a
 * hand-pasted `<svg>` for the same inputs, that is a defect in this file,
 * not an acceptable variation.
 *
 * This is the ONE file in the tree permitted to reference the browser
 * globals `HTMLElement` and `customElements` (D-83) — every other module
 * under `src/` stays universal (runs unmodified in Node and the browser).
 */

// D-85: only the package's public surface, never a deeper relative path —
// that resolves fine in-repo but throws ERR_PACKAGE_PATH_NOT_EXPORTED for
// any external consumer.
import { generateSigil, SigilError } from '../index.js';

/** The registered custom-element tag name (D-83). */
const TAG_NAME = 'sigil-spinner';

export class SigilSpinnerElement extends HTMLElement {
  /**
   * The full attribute contract (D-79, D-80, D-87): the CLI's long-flag
   * names with the leading `--` dropped, kebab-case preserved, with one
   * deliberate exception — `show-title` rather than `title`, because
   * `title` is a global HTML attribute that renders a browser tooltip and
   * collides with `options.title`'s unrelated meaning (embedding the
   * statement in the SVG's own `<title>` element). `--json`/`--output` are
   * CLI transport concerns with no element analog and are deliberately
   * absent. Every attribute that changes rendered output is observed here;
   * nothing else is — `data-sigil-error` is intentionally NOT included, so
   * writing it from inside a render (see below) cannot re-enter
   * `attributeChangedCallback`.
   */
  static get observedAttributes() {
    return ['statement', 'planet', 'curve', 'glyph', 'id-prefix', 'show-title'];
  }

  connectedCallback() {
    this.#render();
  }

  /**
   * Gated on `isConnected` (D-88) so `setAttribute` calls made before
   * `appendChild` — which fire this callback immediately once the element
   * is upgraded — are absorbed rather than triggering a half-configured
   * render; `connectedCallback` performs that first real render. This gate
   * does not collapse every attribute-write path to exactly one render (an
   * element already sitting in parsed HTML, upgraded later by a deferred
   * script, is already connected for every pre-existing attribute reaction
   * and renders once per attribute plus once via `connectedCallback`) —
   * every render reads full, current attribute state via `getAttribute`, so
   * each one independently produces the correct output; the extra calls are
   * an accepted cost (D-89), not a bug.
   */
  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  /**
   * Read current attributes, call `generateSigil`, and write the result
   * into this element's own light-DOM children. One synchronous try/catch
   * performing all DOM writes in a single pass — no diffing, no batching,
   * no coalescing, and no asynchronous primitive of any kind (D-89).
   */
  #render() {
    const statement = this.getAttribute('statement');
    const planet = this.getAttribute('planet');

    // A genuinely absent statement or planet (the attribute itself is not
    // present) is a normal transient state — e.g. an element that has had
    // only one of its two required attributes set so far — not an error
    // (D-91). Inert and silent: clear content, clear any stale error flag,
    // throw nothing, log nothing. An attribute that is PRESENT but EMPTY is
    // a different state and must never be coerced into this branch: it is
    // passed straight through to `generateSigil` below, whose own
    // E_MISSING_STATEMENT/E_MISSING_PLANET checks are the single place
    // that validation happens — this element validates nothing itself
    // (D-85, D-92), the same library-owns-validation posture the CLI
    // already takes.
    if (statement === null || planet === null) {
      this.innerHTML = '';
      this.removeAttribute('data-sigil-error');
      return;
    }

    // Boolean options use HTML presence semantics (D-81), exactly like the
    // platform's own `disabled`/`hidden`: `curve="false"` still enables
    // curves. Removing the attribute is the only way to disable it — a
    // deliberate, documented footgun, not an oversight. The mapping from
    // kebab-case attribute to camelCase option happens only here, at this
    // call boundary; these camelCase names are never exposed as attributes.
    const options = {
      curve: this.hasAttribute('curve'),
      glyph: this.hasAttribute('glyph'),
      idPrefix: this.getAttribute('id-prefix'),
      title: this.hasAttribute('show-title'),
    };

    try {
      const { svg } = generateSigil(statement, planet, options);
      // D-86: the whole, unmodified generateSigil output, or nothing —
      // never a template literal, string concatenation, or a hand-built
      // wrapper around it. Attribute values are attacker-reachable, and the
      // library's own escaping only protects what passes through
      // generateSigil; a locally-built markup string here would be a
      // second injection surface that escaping never touches.
      this.innerHTML = svg;
      this.removeAttribute('data-sigil-error');
    } catch (err) {
      if (err instanceof SigilError) {
        // D-92: clear content, log the full unmodified error object (never
        // re-wrapped, never re-summarized — its .message, .code, and
        // .details stay intact), and reflect its code on the host as an
        // observable DOM signal a page's own CSS or a test can select on.
        // The element never renders a placeholder graphic — it has no
        // visual vocabulary of its own.
        this.innerHTML = '';
        console.error('<sigil-spinner> failed to render:', err);
        this.setAttribute('data-sigil-error', err.code);
      } else {
        // Not a SigilError — not this element's failure mode to own.
        // Never swallowed silently.
        throw err;
      }
    }
  }
}

// D-90: customElements.define throws NotSupportedError on a duplicate tag
// name or duplicate constructor, and the platform ships no unregister or
// redefine API — an unguarded double load (a generated page including this
// module's script twice, a dev-server hot reload, a page that pulls the
// module both directly and through something that also inlines it) is
// unrecoverable within the page. One guard line closes it.
if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, SigilSpinnerElement);
}
