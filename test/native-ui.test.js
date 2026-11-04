import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

// Optional integration harness: uses the actual pinned DSH browser bundle and
// its own React. No fake Markdown renderer, network, Host, or model requests.
test('actual rc.2 shared Markdown renders code controls, copy and stats without images/HTML execution', {
  skip: !process.env.BTW_DOM_PACKAGE_JSON || !process.env.BTW_DSH_PACKAGE_JSON,
}, async () => {
  const requireDom = createRequire(process.env.BTW_DOM_PACKAGE_JSON);
  const { parseHTML } = requireDom('linkedom');
  const runtime = createRequire(process.env.BTW_DSH_PACKAGE_JSON);
  const frontend = dirname(runtime.resolve('@deepseek-ai/dsh-web-frontend/package.json'));
  const assets = join(frontend, 'dist/assets');
  const filename = (await readdir(assets)).find(name => /^index-.*\.js$/.test(name));
  let source = await readFile(join(assets, filename), 'utf8');
  // Test-only export of rc.2's shared module table; never boot a second app.
  const boundary = source.indexOf('const Ms=globalThis.dshDesktopBoot');
  assert(boundary > 0); assert(source.includes('function SZ()'));
  source = source.slice(0, boundary).replace(/from"\.\/([^"\n]+)"/g,
    (_, file) => `from${JSON.stringify(pathToFileURL(join(assets, file)).href)}`) + '\nexport const modules=SZ();';
  const root = await mkdtemp(join(tmpdir(), 'btw-native-test-'));
  let reactRoot;
  const disposers = [];
  const previousGlobals = new Map();
  function provide(key, value) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable:true, writable:true, value });
  }
  try {
    const { window } = parseHTML('<!doctype html><html><head></head><body><div id="root"></div></body></html>');
    for (const key of ['document', 'HTMLElement', 'HTMLInputElement', 'HTMLButtonElement', 'Element', 'Node', 'MutationObserver', 'DOMParser']) provide(key, window[key]);
    provide('window', window);
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.innerWidth = 1000; window.innerHeight = 900;
    window.HTMLElement.prototype.getBoundingClientRect = function () { return { top:760, bottom:788, left:40, right:160, width:120, height:28 }; };
    Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', { configurable:true, get:() => 280 });
    Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', { configurable:true, get:() => 200 });
    const copied = [];
    provide('navigator', { userAgent:'node', clipboard:{ writeText:async value => { copied.push(value); } } });
    provide('requestAnimationFrame', fn => setTimeout(fn, 0)); provide('cancelAnimationFrame', clearTimeout);
    window.matchMedia = () => ({ matches:false, addEventListener() {}, removeEventListener() {} });
    window.getComputedStyle = () => ({ getPropertyValue:() => '', fontSize:'14px' });
    provide('getComputedStyle', window.getComputedStyle);
    provide('sessionStorage', { getItem:() => null, setItem() {}, removeItem() {} });
    window.location = { href:'file:///btw-test' }; provide('location', window.location);
    const bundleFile = join(root, 'native.mjs'); await writeFile(bundleFile, source);
    const { modules } = await import(pathToFileURL(bundleFile).href);
    const slots = new Map(), modelEntries = new Map(), namespaces = {};
    const locale = {
      register:(ns, language, dict) => { if (typeof language === 'object') namespaces[ns] = language; else (namespaces[ns] ||= {})[language] = dict; return () => {}; },
      bind:ns => (key, args = {}) => (namespaces[ns]?.zh[key] || key).replace(/\{(\w+)\}/g, (_, name) => String(args[name] ?? '')),
      getLocale:() => 'zh', subscribe:() => () => {},
    };
    // Obtain the actual registered native component through the same public
    // registry face the plugin uses. Never run its main-session injection.
    let modelBundle;
    window.__ModuleLoader__ = { load:value => { modelBundle = value; } };
    vm.runInThisContext(await readFile(runtime.resolve('@deepseek-ai/dsh-client-ui-model-selection/client'), 'utf8'));
    const modelScope = {
      sessions:new Proxy({}, { get:() => { throw new Error('main session must not be accessed'); } }),
      modelDirectories:{ directoryFor:() => { throw new Error('main ModelDirectory must not be accessed'); } },
      slots:{ inject:(_, fn) => fn(), register:(options, component) => { modelEntries.set(options.name, [{ options, component }]); return () => {}; } },
    };
    modelBundle.factory(name => modules[name]).apply({
      locale, effect:fn => { disposers.push(fn()); }, plugin() {},
      inject:(deps, fn) => { if (!deps.includes('commandUi')) fn(modelScope); },
    });
    let plugin;
    window.__ModuleLoader__ = { load:value => { plugin = value; } };
    vm.runInThisContext(await readFile(new URL('../client.js', import.meta.url), 'utf8'));
    let thread = { id:'btw-test', revision:1, status:'idle', model:{ provider:'demo-provider', model:'gemini-3.8-flash' }, statistics:{ turns:1, steps:1, updatedAt:Date.now() }, messages:[
      { id:'q', role:'user', text:'解释一下这个方案，保留代码示例。' },
      { id:'a', role:'assistant', text:'**回答**\n\n这段讨论围绕原回答展开。消息正文保持与主聊天相同的排版，长段落会在内容列内换行，代码块和表格也沿用官方组件。\n\n## 方案说明\n\n将当前讨论的模型选择放进输入卡片底部，保留已有历史和草稿。回复后的操作栏只展示复制和用量入口；详细速度、首字延迟及耗时可以展开查看。\n\n```js\nconst n = 42;\n```\n\n![tracker](https://tracker.invalid/x)\n\n<script>window.pwned=true</script>',
        model:{ provider:'demo-provider', model:'gemini-3.8-flash' }, usage:{ inputTokens:20, cacheReadTokens:180, outputTokens:80 }, metrics:{ tokensPerSecond:40, durationMs:2200, firstTokenMs:200 } },
    ] };
    plugin.factory(name => modules[name]).apply({
      effect:fn => { disposers.push(fn()); },
      locale,
      sidebarRight:{ mounted:{ getSnapshot:() => 'source' }, openResource() {} },
      sidebarRightTabs:{ register:() => () => {} },
      slots:{ subscribe:() => () => {}, getVersion:() => 0, entriesOfSlot:key => modelEntries.get(key) || [], inject:(_, fn) => fn(), register:(definition, component) => { slots.set(definition.name, component); return () => {}; } },
      connection:{ rpc:{ call:async (_, __, request, signal) => {
        if (request.action === 'watch') return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once:true }));
        if (request.action === 'models') return { ok:true, value:{ models:request.provider === 'demo-provider'
          ? [{ id:'gemini-3.8-flash', name:'Gemini Flash' }, { id:'other-model', name:'Other Model' }, { id:'third', name:'Third Model' }, { id:'fourth', name:'Fourth Model' }]
          : [{ id:'second-model', name:'Second Provider Model' }] } };
        if (request.settings) thread = { ...thread, revision:thread.revision + 1, model:{ provider:request.settings.provider, model:request.settings.model }, modelSettings:request.settings };
        return { ok:true, value:{ thread, settings:thread.modelSettings || { mode:'fixed', ...thread.model }, providers:[{ id:'demo-provider', name:'Demo Provider' }, { id:'second-provider', name:'Second Provider' }], contextWindow:1000 } };
      } } },
    });
    reactRoot = modules['react-dom/client'].createRoot(document.getElementById('root'));
    reactRoot.render(modules.react.createElement(slots.get('sidebar.right.pane.tab'), {
      useTabInfo:() => ({ tab:{ visible:true, navigation:{ address:'dsh-resource://btw/source/answer' } } }),
    }));
    for (let i = 0; i < 100 && !document.querySelector('.md-code-block'); i++) await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(document.querySelectorAll('.md-code-block').length, 1);
    assert.equal(document.querySelectorAll('.btw-markdown strong').length, 1);
    assert.equal(document.querySelectorAll('#root script, #root img').length, 0);
    assert(!window.pwned);
    const copy = [...document.querySelectorAll('button')].filter(button => button.getAttribute('aria-label') === '复制');
    assert.equal(copy.length, 3, 'user, assistant and native code block each expose copy');
    assert([...document.querySelectorAll('button')].some(button => button.getAttribute('aria-label') === '自动换行'));
    assert(document.querySelector('.btw-dock').textContent.includes('40 tok/s'));
    const card = document.querySelector('.btw-input-card');
    const modelTrigger = card.querySelector('[aria-haspopup="menu"]');
    assert(modelTrigger);
    for (let i = 0; i < 30 && modelTrigger.title !== 'Gemini Flash'; i++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(modelTrigger.title, 'Gemini Flash');
    const send = card.querySelector('[aria-label="发送"]');
    assert(send.querySelector('svg'));
    assert.equal(send.textContent, '');
    assert.equal(document.querySelector('textarea').getAttribute('rows'), '1');
    assert.equal(document.querySelectorAll('.btw-toolbar, .btw-composer-footer .btw-metrics').length, 0);
    assert.equal(document.querySelector('.btw-dock').parentElement, card.parentElement);
    const replyUsage = document.querySelector('.btw-column .btw-message-actions .btw-stat-trigger');
    assert(replyUsage);
    replyUsage.click();
    for (let i = 0; i < 30 && !document.querySelector('[role="dialog"]'); i++) await new Promise(resolve => setTimeout(resolve, 10));
    const usagePanel = document.querySelector('[role="dialog"]');
    assert.equal(usagePanel.parentElement, document.body, 'usage must escape the scrolling message column');
    assert.equal(usagePanel.style.top, '552px', 'native anchor places the measured panel above the usage button');
    assert(usagePanel.textContent.includes('输出 token'));
    replyUsage.click();
    await new Promise(resolve => setTimeout(resolve, 20));
    assert(document.querySelector('.btw-dock').textContent.includes('缓存命中 90%'));
    assert(document.querySelector('.btw-dock').textContent.includes('28%'));
    const activity = document.querySelector('.btw-dock .btw-stat-trigger');
    activity.click();
    for (let i = 0; i < 30 && !document.querySelector('[role="dialog"]'); i++) await new Promise(resolve => setTimeout(resolve, 10));
    const activityPanel = document.querySelector('[role="dialog"]');
    assert.equal(activityPanel.querySelector('.btw-stat-title-label').textContent, '会话统计');
    assert.equal(activityPanel.querySelectorAll('.btw-stat-title-label svg').length, 1);
    assert.deepEqual([...activityPanel.querySelectorAll('dt')].map(node => node.textContent), ['模型用时', '首 token 平均（TTFT）', '输出速度（TPS）']);
    assert.deepEqual([...activityPanel.querySelectorAll('dd')].map(node => node.textContent), ['2.2秒', '0.2秒', '40 tok/s']);
    activity.click();
    await new Promise(resolve => setTimeout(resolve, 20));
    copy[2].click();
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(copied.at(-1), thread.messages[1].text);
    const contextToggle = document.querySelector('[aria-label="引用的回答"]');
    contextToggle.click();
    for (let i = 0; i < 20 && !document.querySelector('.btw-context-panel'); i++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(contextToggle.getAttribute('aria-expanded'), 'true');
    assert(document.querySelector('.btw-context-panel').textContent.includes('截至这条回答的文字问答'));
    assert.equal(document.querySelector('.btw-context-panel').parentElement, document.body);
    assert.equal(document.querySelector('.btw-context-panel').style.top, '552px');
    document.body.dispatchEvent(new window.Event('pointerdown', { bubbles:true }));
    for (let i = 0; i < 20 && document.querySelector('.btw-context-panel'); i++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(document.querySelector('.btw-context-panel'), null);
    modelTrigger.click();
    for (let i = 0; i < 30 && !document.querySelector('[role="menuitem"]'); i++) await new Promise(resolve => setTimeout(resolve, 10));
    const modelCell = document.querySelector('[role="menuitem"]');
    assert(modelCell.textContent.includes('模型'));
    modelCell.click();
    for (let i = 0; i < 30 && !document.querySelector('[role="menuitemradio"]'); i++) await new Promise(resolve => setTimeout(resolve, 10));
    assert(document.querySelector('input[placeholder="搜索模型…"]'));
    assert(document.body.textContent.includes('Demo Provider'));
    assert(document.body.textContent.includes('Second Provider'));
    const option = [...document.querySelectorAll('[role="menuitemradio"]')].find(node => node.textContent.includes('Other Model'));
    assert(option); option.click();
    for (let i = 0; i < 30 && modelTrigger.title !== 'Other Model'; i++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(modelTrigger.title, 'Other Model');
    assert.equal(thread.model.provider, 'demo-provider'); assert.equal(thread.model.model, 'other-model');
    assert.equal(document.querySelector('.btw-column').querySelectorAll('.btw-message').length, 2);
    assert.equal(document.querySelector('[role="menuitemradio"]'), null);
    if (process.env.BTW_UI_PREVIEW_PATH) {
      // Remove visible security-test payloads from the human review artifact.
      for (const paragraph of document.querySelectorAll('.btw-markdown p')) {
        if (paragraph.textContent.includes('window.pwned') || paragraph.textContent === 'tracker') paragraph.remove();
      }
      const theme = await readFile(runtime.resolve('@deepseek-ai/dsh-client-ui-theme/client'), 'utf8');
      const styles = [...theme.matchAll(/var \w+_css_default = ("(?:\\.|[^"\\])*");/g)].map(match => JSON.parse(match[1])).join('\n');
      const nativeCss = await readFile(join(assets, (await readdir(assets)).find(name => /^index-.*\.css$/.test(name))), 'utf8');
      await writeFile(process.env.BTW_UI_PREVIEW_PATH, `<!doctype html><html lang="zh" data-platform="darwin"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BTW 布局预览</title><style>${styles}\n${nativeCss}\n${[...document.head.querySelectorAll('style')].map(node => node.textContent).join('\n')}\nhtml,body{height:100%;margin:0}body{--dsh-content-font-size:14px;--dsh-content-font-size-secondary:13px;background:var(--dsw-alias-bg-base)}#root{height:100%}.preview-theme{position:fixed;right:16px;top:8px;z-index:10;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);font-size:12px;padding:4px 8px}</style></head><body data-ds-dark-theme><button class="preview-theme" onclick="document.body.toggleAttribute('data-ds-dark-theme')">切换深浅主题</button>${document.getElementById('root').outerHTML}</body></html>`);
    }
  } finally {
    reactRoot?.unmount();
    for (const dispose of disposers.reverse()) dispose?.();
    for (const [key, descriptor] of previousGlobals) descriptor
      ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key];
    await rm(root, { recursive:true, force:true });
  }
});
