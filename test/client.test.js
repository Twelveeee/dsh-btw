import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { act, create } from 'react-test-renderer';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function fixture(options = {}) {
  let bundle;
  const calls = [], registrations = new Map(), disposers = [], opened = [];
  const dictionaries = {};
  const locale = { active:'zh', revision:0 };
  let defaults = { mode:'follow' };
  let ui = options.ui || { showButton:true, quickPrompts:['这段能不能说得更直白一点？', '说人话'] };
  let thread = { id:'btw-1', sourceSessionId:'s1', sourceMessageId:'a1', revision:1, status:options.status || 'idle', model:{ provider:'p', model:'m' }, messages:options.messages || [] };
  const store = new Map();
  const context = {
    window:{ __ModuleLoader__:{ load:value => { bundle = value; } } },
    AbortController, AbortSignal, URL, crypto:globalThis.crypto, setTimeout, clearTimeout, setInterval, clearInterval,
    sessionStorage:{ getItem:key => store.get(key), setItem:(key,value) => store.set(key,value), removeItem:key => store.delete(key) },
    navigator:{ clipboard:{ writeText:async () => {} } },
  };
  vm.runInNewContext(readFileSync(new URL('../client.js', import.meta.url), 'utf8'), context);
  const nativeMarkdown = [];
  const primitives = {
    MarkdownText:props => { nativeMarkdown.push(props); return React.createElement('div', { 'data-native-markdown':true }, props.text); },
    MarkdownDelegateProvider:props => React.createElement(React.Fragment, null, props.children),
    IconCopyOutlineRegular:() => React.createElement('svg', { 'data-copy-icon':true }),
    IconCheckOutlineRegular:() => React.createElement('svg', { 'data-check-icon':true }),
    Tooltip:props => React.createElement(React.Fragment, null, props.children),
    useAnchoredPosition:() => ({ left:20, top:20 }), useDismissOnOutsidePointer:() => {},
    ...Object.fromEntries(['IconChevronDownOutlineRegular','IconApiOutlineRegular','IconGaugeOutlineRegular','IconDatabaseOutlineRegular'].map(name => [name, () => React.createElement('svg', { 'data-icon':name })])),
  };
  function NativeModelSelect({ directory, load, select, locked }) {
    const state = React.useSyncExternalStore(fn => directory.subscribe(fn), () => directory.getSnapshot());
    const [open, setOpen] = React.useState(false);
    const current = state.groups.find(group => group.id === state.current?.provider)?.models.find(model => model.id === state.current?.model);
    return React.createElement('div', null,
      React.createElement('button', { 'aria-label':'模型设置', 'aria-haspopup':'menu', disabled:locked, onClick:() => { setOpen(value => !value); load(); } },
        React.createElement('span', { className:'native-model-label' }, current?.name || '请选择模型')),
      open && state.groups.flatMap(group => group.models.map(model => React.createElement('button', {
        key:group.id + model.id, role:'menuitemradio', 'data-provider':group.id, 'data-model':model.id,
        onClick:async () => { const result = await select({ provider:group.id, model:model.id }); if (result?.ok) setOpen(false); },
      }, model.name))),
      state.error && React.createElement('div', { role:'alert' }, state.error));
  }
  bundle.factory(name => {
    if (name === 'react') return React;
    if (name === 'react-dom') return { createPortal:node => node };
    assert.equal(name, '@deepseek-ai/dsh-client-ui-primitives'); return primitives;
  }).apply({
    effect:fn => { disposers.push(fn()); },
    locale:{ register:(ns,language,dict) => { dictionaries[language] = dict; return () => {}; }, bind:() => key => dictionaries.zh[key], subscribe:() => () => {}, getLocale:() => locale },
    sidebarRight:{ mounted:{ getSnapshot:() => 's1' }, openResource:uri => opened.push(uri) },
    sidebarRightTabs:{ register:definition => { assert.equal(definition.canOpen('dsh-resource://btw/s1/a1'), true); return () => {}; } },
    slots:{ subscribe:() => () => {}, getVersion:() => 0, entriesOfSlot:key => key === 'conversation.input.model' ? [{ component:NativeModelSelect }] : [], inject:(_name,fn) => fn(), register:(definition,component) => { registrations.set(definition.name, component); return () => {}; } },
    connection:{ rpc:{ call:async (channel,endpoint,request,signal) => {
      assert.equal(channel, '/btw-rpc'); assert.equal(endpoint, 'dsh-btw/dispatch'); calls.push(request);
      if (request.action === 'watch') return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once:true }));
      if (request.action === 'config') {
        if ((request.settings || request.ui) && options.failSave) return { ok:false, error:{ message:'Model could not be saved' } };
        if (request.threadId) {
          assert.equal(request.threadId, thread.id); assert.equal(request.sourceSessionId, 's1');
          if (request.settings) thread = { ...thread, revision:thread.revision + 1,
            model:request.settings.mode === 'fixed' ? { provider:request.settings.provider, model:request.settings.model } : { provider:'p', model:'m' }, modelSettings:request.settings };
          return { ok:true, value:{ settings:thread.modelSettings || { mode:'fixed', ...thread.model }, providers:[{ id:'p' }, { id:'p-next' }], thread } };
        }
        if (request.settings) defaults = request.settings;
        if (request.ui) ui = request.ui;
        return { ok:true, value:{ settings:defaults, ...(!options.legacyHost ? { ui } : {}), providers:[{ id:'p' }, { id:'p-next' }] } };
      }
      if (request.action === 'models') return { ok:true, value:{ models:[{ id:'m' }, { id:'m-new' }] } };
      if (request.action === 'send') thread = { ...thread, revision:thread.revision + 1, status:'running', messages:[{ id:'q1', role:'user', text:request.text }], draftAssistant:'**Hello**\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))\n\n![tracker](https://evil.test/a.png)' };
      if (request.action === 'stop') thread = { ...thread, revision:thread.revision + 1, status:'stopped' };
      return { ok:true, value:{ thread } };
    } } },
  });
  return { calls, registrations, opened, nativeMarkdown, getThread:() => thread, getDefaults:() => defaults, dispose:() => disposers.reverse().forEach(fn => fn?.()) };
}

test('BTW action opens native resource without invoking the model or creating a thread', async () => {
  const f = fixture(); let view;
  await act(async () => { view = create(React.createElement(f.registrations.get('conversation.chat.assistant-actions'), { sessionId:'s1', messageId:'a1' })); });
  const button = view.root.findByType('button');
  assert.equal(button.children.some(child => typeof child === 'string'), false, 'The action must be icon-only');
  assert.equal(button.findAllByType('svg').length, 1);
  assert.equal(button.props.title, '顺便问一句');
  assert.equal(button.props['aria-label'], '顺便问一句');
  await act(async () => button.props.onClick());
  assert.deepEqual(f.opened, ['dsh-resource://btw/s1/a1']);
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].action, 'config');
  await act(async () => view.unmount()); f.dispose();
});

test('panel loads snapshot, accepts IME-safe followups, stops, and never renders executable model HTML', async () => {
  const f = fixture(); let view;
  await act(async () => { view = create(React.createElement(f.registrations.get('sidebar.right.pane.tab'), { useTabInfo:() => ({ tab:{ visible:true, navigation:{ address:'dsh-resource://btw/s1/a1' } } }) })); });
  assert.deepEqual(f.calls.filter(x => x.action !== 'config').slice(0, 2).map(x => x.action), ['open', 'watch']);
  const textarea = () => view.root.findByType('textarea');
  await act(async () => textarea().props.onChange({ target:{ value:'为什么？' } }));
  await act(async () => textarea().props.onKeyDown({ key:'Enter', shiftKey:false, nativeEvent:{ isComposing:true }, preventDefault:() => assert.fail('Must not submit during IME composition') }));
  assert.equal(f.calls.some(x => x.action === 'send'), false);
  await act(async () => textarea().props.onKeyDown({ key:'Enter', shiftKey:false, nativeEvent:{ isComposing:false }, preventDefault:() => {} }));
  const sent = f.calls.find(x => x.action === 'send');
  assert.equal(sent.text, '为什么？'); assert.equal(sent.sourceSessionId, 's1'); assert.ok(sent.requestId);
  assert.equal(view.root.findAllByType('script').length, 0);
  assert.equal(view.root.findAllByType('img').length, 0);
  assert.equal(view.root.findAllByType('a').length, 0);
  const rendered = f.nativeMarkdown.at(-1);
  assert.equal(rendered.streaming, true);
  assert(rendered.text.includes('**Hello**'));
  assert(!rendered.text.includes('https://evil.test/a.png'));
  assert.equal(rendered.labels.code.copyLabel, '复制');
  assert.equal(rendered.labels.code.toolbarLabels.wrapLabel, '自动换行');
  await act(async () => view.root.findAllByType('button').find(b => b.props['aria-label'] === '停止').props.onClick());
  assert.equal(f.calls.filter(x => x.action === 'stop').length, 1);
  await act(async () => view.unmount()); f.dispose();
});

test('global plugin settings load without forging a source session', async () => {
  const f = fixture(); let view;
  await act(async () => { view = create(React.createElement(f.registrations.get('plugins.bundle.config'))); });
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].action, 'config'); assert.equal(f.calls[0].sourceSessionId, undefined);
  assert.equal(view.root.findByType('select').props.value, 'follow');
  assert.equal(view.root.findByProps({ role:'switch' }).props.checked, true);
  assert.deepEqual(view.root.findAllByProps({ type:'text' }).map(input => input.props.value), ['这段能不能说得更直白一点？', '说人话']);
  await act(async () => view.unmount()); f.dispose();
});

test('a new settings page tells an old Host to restart before sending unsupported fields', async () => {
  const f = fixture({ legacyHost:true }); let view;
  await act(async () => { view = create(React.createElement(f.registrations.get('plugins.bundle.config'))); });
  assert(view.root.findByProps({ role:'alert' }).children.includes('请重启 DSH Host 后刷新页面，以加载新版插件设置。'));
  await act(async () => view.root.findByProps({ role:'switch' }).props.onChange({ target:{ checked:false } }));
  await act(async () => buttonWithText(view, '保存设置').props.onClick());
  assert.equal(f.calls.some(call => call.settings || call.ui), false);
  assert(view.root.findByProps({ role:'alert' }).children.includes('请重启 DSH Host 后刷新页面，以加载新版插件设置。'));
  await act(async () => view.unmount()); f.dispose();
});


const panelProps = { useTabInfo:() => ({ tab:{ visible:true, navigation:{ address:'dsh-resource://btw/s1/a1' } } }) };
const buttonWithText = (view, text) => view.root.findAllByType('button').find(button => button.children.includes(text) || button.props['aria-label'] === text);

test('saved plugin preferences update the action and quick questions in mounted views', async () => {
  const f = fixture(); let action, panel, settings;
  await act(async () => {
    action = create(React.createElement(f.registrations.get('conversation.chat.assistant-actions'), { sessionId:'s1', messageId:'a1' }));
    panel = create(React.createElement(f.registrations.get('sidebar.right.pane.tab'), panelProps));
    settings = create(React.createElement(f.registrations.get('plugins.bundle.config')));
  });
  assert.equal(action.root.findAllByType('button').length, 1);
  await act(async () => buttonWithText(panel, '说人话').props.onClick());
  assert.equal(panel.root.findByType('textarea').props.value, '说人话');
  assert.equal(f.calls.some(call => call.action === 'send'), false);
  await act(async () => {
    settings.root.findByProps({ role:'switch' }).props.onChange({ target:{ checked:false } });
    settings.root.findAllByProps({ type:'text' })[0].props.onChange({ target:{ value:'给个例子' } });
  });
  await act(async () => buttonWithText(settings, '添加提问').props.onClick());
  await act(async () => settings.root.findAllByProps({ type:'text' })[2].props.onChange({ target:{ value:' 列出关键点 ' } }));
  // Remove the old second entry through its adjacent remove button.
  await act(async () => settings.root.findAllByProps({ className:'btw-prompt-row' })[1].findByType('button').props.onClick());
  await act(async () => buttonWithText(settings, '保存设置').props.onClick());
  const saved = f.calls.find(call => call.ui);
  assert.equal(saved.sourceSessionId, undefined);
  assert.equal(saved.ui.showButton, false);
  assert.deepEqual(Array.from(saved.ui.quickPrompts), ['给个例子', '列出关键点']);
  assert.equal(action.toJSON(), null);
  assert.deepEqual(panel.root.findByProps({ className:'btw-suggestions' }).findAllByType('button').map(button => button.children[0]), ['给个例子', '列出关键点']);
  assert.equal(panel.root.findByType('textarea').props.value, '说人话', 'saving preferences preserves the current draft');
  await act(async () => settings.root.findByProps({ role:'switch' }).props.onChange({ target:{ checked:true } }));
  await act(async () => buttonWithText(settings, '保存设置').props.onClick());
  assert.equal(action.root.findAllByType('button').length, 1);
  await act(async () => { action.unmount(); panel.unmount(); settings.unmount(); }); f.dispose();
});

test('persisted disabled action and empty quick questions survive mounting', async () => {
  const f = fixture({ ui:{ showButton:false, quickPrompts:[] } }); let action, panel;
  await act(async () => {
    action = create(React.createElement(f.registrations.get('conversation.chat.assistant-actions'), { sessionId:'s1', messageId:'a1' }));
    panel = create(React.createElement(f.registrations.get('sidebar.right.pane.tab'), panelProps));
  });
  assert.equal(action.toJSON(), null);
  assert.equal(panel.root.findByProps({ className:'btw-suggestions' }).findAllByType('button').length, 0);
  assert.equal(f.calls.filter(call => call.action === 'config' && !call.threadId).length, 1, 'mounted actions share one preference fetch');
  await act(async () => { action.unmount(); panel.unmount(); }); f.dispose();
});

test('failed plugin preference saves leave the mounted action and questions unchanged', async () => {
  const f = fixture({ failSave:true }); let action, panel, settings;
  await act(async () => {
    action = create(React.createElement(f.registrations.get('conversation.chat.assistant-actions'), { sessionId:'s1', messageId:'a1' }));
    panel = create(React.createElement(f.registrations.get('sidebar.right.pane.tab'), panelProps));
    settings = create(React.createElement(f.registrations.get('plugins.bundle.config')));
  });
  await act(async () => settings.root.findByProps({ role:'switch' }).props.onChange({ target:{ checked:false } }));
  await act(async () => buttonWithText(settings, '保存设置').props.onClick());
  assert.equal(action.root.findAllByType('button').length, 1);
  assert(buttonWithText(panel, '说人话'));
  assert(settings.root.findByProps({ role:'alert' }).children.includes('Model could not be saved'));
  await act(async () => { action.unmount(); panel.unmount(); settings.unmount(); }); f.dispose();
});

test('native model selection saves the current thread immediately and preserves draft/history/defaults', async () => {
  const messages = [{ id:'old-q', role:'user', text:'已有问题' }, { id:'old-a', role:'assistant', text:'已有回答' }];
  const f = fixture({ messages }); let view;
  await act(async () => { view = create(React.createElement(f.registrations.get('sidebar.right.pane.tab'), panelProps)); });
  await act(async () => view.root.findByType('textarea').props.onChange({ target:{ value:'保留草稿' } }));
  await act(async () => buttonWithText(view, '模型设置').props.onClick());
  const choice = view.root.findAllByType('button').find(button => button.props['data-provider'] === 'p-next' && button.props['data-model'] === 'm-new');
  await act(async () => choice.props.onClick());
  const saved = f.calls.find(call => call.action === 'config' && call.settings);
  assert.equal(saved.threadId, 'btw-1'); assert.equal(saved.sourceSessionId, 's1'); assert.equal(saved.settings.model, 'm-new');
  assert.deepEqual(f.getDefaults(), { mode:'follow' }); assert.deepEqual(f.getThread().messages, messages);
  assert.deepEqual(view.root.findByProps({ className:'native-model-label' }).children, ['m-new']);
  assert.equal(view.root.findByType('textarea').props.value, '保留草稿');
  assert.equal(view.root.findAllByType('select').length, 0);
  await act(async () => view.unmount()); f.dispose();
});

test('a failed native model save keeps the selection and composer unchanged', async () => {
  const f = fixture({ failSave:true }); let view;
  await act(async () => { view = create(React.createElement(f.registrations.get('sidebar.right.pane.tab'), panelProps)); });
  await act(async () => buttonWithText(view, '模型设置').props.onClick());
  const choice = view.root.findAllByType('button').find(button => button.props['data-provider'] === 'p' && button.props['data-model'] === 'm-new');
  await act(async () => choice.props.onClick());
  assert(view.root.findByProps({ role:'alert' }).children.includes('Model could not be saved'));
  assert.deepEqual(view.root.findByProps({ className:'native-model-label' }).children, ['m']);
  assert.equal(view.root.findByType('textarea').props.value, '');
  await act(async () => view.unmount()); f.dispose();
});

test('native model trigger is locked during an active reply', async () => {
  const f = fixture({ status:'running' }); let view;
  await act(async () => { view = create(React.createElement(f.registrations.get('sidebar.right.pane.tab'), panelProps)); });
  assert.equal(buttonWithText(view, '模型设置').props.disabled, true);
  assert.equal(f.calls.some(call => call.action === 'config' && call.settings), false);
  await act(async () => view.unmount()); f.dispose();
});

test('completed answers expose an accessible native copy icon and real metrics', async () => {
  const f = fixture({ messages:[{ id:'answer', role:'assistant', text:'```js\nlet x = 1;\n```', usage:{ outputTokens:80 }, metrics:{ tokensPerSecond:40, durationMs:2200, firstTokenMs:200 } }] });
  let view;
  await act(async () => { view = create(React.createElement(f.registrations.get('sidebar.right.pane.tab'), panelProps)); });
  const copy = view.root.findAllByType('button').find(button => button.props['aria-label'] === '复制');
  assert(copy); assert.equal(copy.findAllByType('svg').length, 1);
  assert.equal(f.nativeMarkdown.at(-1).streaming, false);
  assert.equal(f.nativeMarkdown.at(-1).text, '```js\nlet x = 1;\n```');
  const text = JSON.stringify(view.toJSON());
  assert(text.includes('40 tok/s')); assert(text.includes('80 tok'));
  await act(async () => copy.props.onClick());
  assert.equal(copy.props.title, '已复制');
  await act(async () => view.unmount()); f.dispose();
});

test('discussion dock aggregates recorded usage and weights TPS by decoding time', async () => {
  const f = fixture({ messages:[
    { id:'a1', role:'assistant', text:'One', usage:{ inputTokens:20, outputTokens:80 }, metrics:{ tokensPerSecond:40, durationMs:2200 } },
    { id:'a2', role:'assistant', text:'Two', usage:{ inputTokens:10, outputTokens:40 }, metrics:{ tokensPerSecond:10, durationMs:4200 } },
    { id:'old', role:'assistant', text:'Legacy answer without accounting' },
  ] });
  let view;
  await act(async () => { view = create(React.createElement(f.registrations.get('sidebar.right.pane.tab'), panelProps)); });
  const dock = view.root.findByProps({ className:'btw-dock' });
  const labels = dock.findAllByProps({ className:'btw-stat-trigger' }).map(button => button.findAllByType('span').map(span => span.children.filter(child => typeof child === 'string').join('')).join(''));
  assert.equal(labels[0], '0 轮 3 步 · 20 tok/s'); assert.equal(labels[1], '150 tok');
  const card = view.root.findByProps({ className:'btw-input-card' });
  assert(card.findAllByType('button').some(button => button.props['aria-label'] === '模型设置'));
  const send = card.findAllByType('button').find(button => button.props['aria-label'] === '发送');
  assert.equal(send.findAllByType('svg').length, 1);
  assert.equal(send.children.some(child => typeof child === 'string'), false);
  await act(async () => view.unmount()); f.dispose();
});
