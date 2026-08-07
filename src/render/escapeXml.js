/**
 * Escape the five reserved XML characters. Used at two call sites in this
 * codebase: the optional `<title>` element (D-16), so a statement containing
 * `<`, `>`, `&`, `"`, or `'` cannot break XML well-formedness of the
 * generated SVG; and the root element's caller-supplied `idPrefix`-derived
 * `id` attribute (D-44) — the first and only caller-controlled string this
 * project emits into SVG markup outside `<title>`. Escaping both quote forms
 * (`"` and `'`) is what makes this function correct in an attribute-value
 * context, not only in element content.
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
