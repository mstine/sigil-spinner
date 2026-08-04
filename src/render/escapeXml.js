/**
 * Escape the five reserved XML characters. Used in exactly one place in this
 * codebase: the optional `<title>` element (D-16), so a statement containing
 * `<`, `>`, `&`, `"`, or `'` cannot break XML well-formedness of the
 * generated SVG.
 */

/** @type {Record<string, string>} */
const XML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/**
 * @param {string} str
 * @returns {string}
 */
export function escapeXml(str) {
  return str.replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]);
}
