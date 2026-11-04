import test from 'node:test';
import assert from 'node:assert/strict';
import { marked } from 'marked';
import { textOnlyMarkdown } from '../client-markdown.js';

test('native Markdown receives no image destinations, including nested/reference/table images', () => {
  for (const source of ['![alt](https://tracker.test/x)', '> **![alt](https://tracker.test/x)**',
    '- ![alt](https://tracker.test/x)', '- text\n  - ![alt](https://tracker.test/x)',
    'hello\r\n\r\n![alt](https://tracker.test/x)',
    '| a | b |\n|---|---|\n| ![alt](https://tracker.test/x) | text |']) {
    const result = textOnlyMarkdown(source);
    assert(!result.includes('https://tracker.test/x'), result);
    assert(result.includes('alt'));
  }
  const reference = textOnlyMarkdown('![alt][img]\n\n[img]: https://tracker.test/x');
  assert(!reference.includes('![alt]'));
  const nested = textOnlyMarkdown('![\\!\\[x\\]\\(https://tracker.test/x\\)](https://tracker.test/y)');
  marked.walkTokens(marked.lexer(nested), token => assert.notEqual(token.type, 'image'));
});

test('image filtering preserves code, links and streaming code fences', () => {
  const code = '`![alt](https://tracker.test/x)`\n\n```md\n![alt](https://tracker.test/x)\n```';
  assert.equal(textOnlyMarkdown(code), code);
  assert.equal(textOnlyMarkdown(code + '\n\n![alt](https://tracker.test/x)'), code + '\n\nalt');
  const partial = '**Hello**\n\n```js\nconst x = "![x](https://tracker.test/x)";';
  assert.equal(textOnlyMarkdown(partial), partial);
  const link = '[Example](https://example.com)';
  assert.equal(textOnlyMarkdown(link), link);
});
