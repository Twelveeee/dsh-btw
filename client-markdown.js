import { marked } from 'marked';

// DSH's renderer loads Markdown images by default. Preserve BTW's text-only
// boundary before handing it the document, without changing fenced/inline code.
export function textOnlyMarkdown(text) {
  // Match the lexer's newline normalization so raw-token locations remain exact.
  text = text.replace(/\r\n?/g, '\n');
  function rewrite(source, tokens) {
    let offset = 0, output = '';
    for (const token of tokens || []) {
      if (!token.raw) continue;
      const index = source.indexOf(token.raw, offset);
      if (index < 0) continue;
      output += source.slice(offset, index);
      let replacement = token.raw;
      if (token.type === 'image') {
        replacement = (token.text || '[image]').replace(/[\\`*_{}\[\]()#+.!<>|~-]/g, '\\$&');
      } else {
        const children = token.tokens || token.items || (token.type === 'table'
          ? [...token.header, ...token.rows.flat()].flatMap(cell => cell.tokens || []) : []);
        replacement = rewrite(replacement, children);
      }
      output += replacement;
      offset = index + token.raw.length;
    }
    return output + source.slice(offset);
  }
  return rewrite(text, marked.lexer(text, { gfm: true }));
}
