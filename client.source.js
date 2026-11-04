import { textOnlyMarkdown } from './client-markdown.js';
import { BtwModelDirectory } from './client-model-directory.js';

// Keep the side conversation independent; share DSH theme tokens with the main chat.
window.__ModuleLoader__.load({
  id: 'dsh-btw',
  factory(require) {
    const React = require('react');
    const { MarkdownText, MarkdownDelegateProvider, IconCopyOutlineRegular, IconCheckOutlineRegular, IconChevronDownOutlineRegular, IconApiOutlineRegular, IconGaugeOutlineRegular, IconDatabaseOutlineRegular, Tooltip, useAnchoredPosition, useDismissOnOutsidePointer } = require('@deepseek-ai/dsh-client-ui-primitives');
    const { createPortal } = require('react-dom');
    const h = React.createElement;
    const { useState, useEffect, useRef, useCallback, useSyncExternalStore } = React;
    const words = {
      zh: {
        title: 'dsh-btw', ask: '顺便问一句', loading: '正在读取上下文…', retry: '重试连接',
        context: '上下文为截至这条回答的文字问答。',
        empty: '有什么想顺便问的？',
        placeholder: '围绕这条回答继续问…', send: '发送', stop: '停止', stopping: '正在停止…',
        thinking: '正在思考…', running: '正在回答', stopped: '已停止',
        settings: '模型设置', done: '返回追问', copy: '复制', copied: '已复制',
        code: '代码', wrap: '自动换行', unwrap: '取消换行', footnotes: '脚注', elapsed: '耗时', firstToken: '首字', outputTokens: '输出 token', usage:'用量', replyStats:'回复统计', discussionStats:'会话统计', llmTime:'模型用时', toolTime:'工具调用用时', avgTtft:'首 token 平均（TTFT）', decodeSpeed:'输出速度（TPS）', tokenUsage:'Token 用量', secondUnit:'秒', minuteUnit:'分', inputTokens:'输入 token', cacheRead:'缓存读取', cacheWrite:'缓存写入', replies:'次回复', recordedUsage:'已记录用量', turns:'轮', steps:'步', cacheHit:'缓存命中', contextUsed:'上下文占用', capacity:'上下文容量', latestUsage:'最近请求用量', noData:'暂无数据', updated:'更新于', justNow:'刚刚', minutesAgo:'分钟前', hoursAgo:'小时前', sessionCost:'会话费用', noPricing:'暂无计价', noPricingHint:'暂不支持费用统计。',
        you: '你', assistant: 'dsh-btw', hint: 'Enter 发送 · Shift+Enter 换行',
        follow: '跟随所点回答的模型', fixed: '使用指定模型', modelMode: '默认模型',
        provider: '提供商', model: '模型', select: '请选择', save: '保存设置', saved: '已保存',
        modelHint: '用于新讨论。',
        threadModel: '当前讨论模型',
        modelBusy: '回复结束或停止后可切换模型。',
        noProviders: '没有可用提供商，请先在 DSH 模型设置中配置。',
        missingModel: '请选择提供商和模型。',
        source: '引用的回答', noSource: '请从一条已完成回答旁的 BTW 按钮打开。',
        prompt1: '这段能不能说得更直白一点？', prompt2: '为什么选择这个方案？',
        connectionError: '连接中断，请重试。', unavailable: '当前页面无法打开右侧讨论。',
        tooLong: '问题不能超过 20,000 个字符。', noText: '请输入问题。',
      },
      en: {
        title: 'dsh-btw', ask: 'Ask on the side', loading: 'Loading context…', retry: 'Reconnect',
        context: 'Context includes text messages through this answer.',
        empty: 'A quick question on the side?',
        placeholder: 'Ask about this answer…', send: 'Send', stop: 'Stop', stopping: 'Stopping…',
        thinking: 'Thinking…', running: 'Answering', stopped: 'Stopped',
        settings: 'Model settings', done: 'Back to chat', copy: 'Copy', copied: 'Copied',
        code: 'Code', wrap: 'Wrap lines', unwrap: 'Unwrap lines', footnotes: 'Footnotes', elapsed: 'Elapsed', firstToken: 'First token', outputTokens: 'Output tokens', usage:'Usage', replyStats:'Reply statistics', discussionStats:'Session statistics', llmTime:'Model time', toolTime:'Tool time', avgTtft:'Average TTFT', decodeSpeed:'Decode speed (TPS)', tokenUsage:'Token usage', secondUnit:'s', minuteUnit:'m', inputTokens:'Input tokens', cacheRead:'Cache read', cacheWrite:'Cache write', replies:'replies', recordedUsage:'Recorded usage', turns:'turns', steps:'steps', cacheHit:'Cache hit', contextUsed:'Context usage', capacity:'Context capacity', latestUsage:'Last request tokens', noData:'Unavailable', updated:'Updated', justNow:'just now', minutesAgo:'min ago', hoursAgo:'hr ago', sessionCost:'Session cost', noPricing:'Unpriced', noPricingHint:'Cost tracking is not available yet.',
        you: 'You', assistant: 'dsh-btw', hint: 'Enter to send · Shift+Enter for a new line',
        follow: 'Use the source answer’s model', fixed: 'Use a specific model', modelMode: 'Default model',
        provider: 'Provider', model: 'Model', select: 'Choose…', save: 'Save settings', saved: 'Saved',
        modelHint: 'Applies to new threads.',
        threadModel: 'Current thread model',
        modelBusy: 'Stop or wait for the current reply before changing its model.',
        noProviders: 'No providers available. Configure one in DSH model settings first.',
        missingModel: 'Choose a provider and model.',
        source: 'Source answer', noSource: 'Open BTW next to a completed answer.',
        prompt1: 'Could you explain this more plainly?', prompt2: 'Why did you choose this approach?',
        connectionError: 'Connection interrupted. Please reconnect.', unavailable: 'The sidebar is unavailable on this page.',
        tooLong: 'Keep the question within 20,000 characters.', noText: 'Enter a question.',
      },
    };
    // Match rc.2's MessageItem, AssistantResponse and InputBar through public
    // theme variables. Their CSS-module class names are private build artifacts.
    const css = `
      .btw-root{--btw-bg:var(--dsw-alias-bg-base);--btw-border:var(--dsw-alias-border-l1);--btw-text:var(--dsw-alias-label-primary);--btw-muted:var(--dsw-alias-label-secondary);--btw-accent:var(--dsw-alias-state-business-primary);color:var(--btw-text);font-family:var(--dsw-font-family,inherit);font-size:var(--dsh-content-font-size,14px);line-height:calc(24px + var(--dsh-content-font-delta,0px));box-sizing:border-box;min-width:0}
      .btw-root *{box-sizing:border-box}.btw-panel{height:100%;min-height:0;display:flex;flex-direction:column;background:var(--btw-bg)}
      .btw-root button[data-btw-control],.btw-root select,.btw-root textarea,.btw-root input{font:inherit;color:inherit}
      .btw-root button[data-btw-control]{cursor:pointer;background:transparent;border:0;border-radius:var(--dsw-radius-sm,6px);padding:6px 8px;line-height:20px}
      .btw-root button[data-btw-control]:hover{background:var(--dsw-alias-interactive-bg-hover)}.btw-root button[data-btw-control]:disabled{opacity:.4;cursor:default}
      .btw-root :is(button[data-btw-control],input,select,textarea):focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--btw-accent));outline-offset:2px}
      .btw-icon{display:inline-flex;align-items:center;justify-content:center;gap:5px;font-size:12px!important;vertical-align:middle}
      .btw-action{position:relative;display:inline-flex}.btw-action>button{color:var(--dsw-alias-label-tertiary);width:calc(28px + var(--dsh-content-font-delta,0px));height:calc(28px + var(--dsh-content-font-delta,0px));padding:6px}.btw-action>button svg{width:calc(17px + var(--dsh-content-font-delta,0px));height:calc(17px + var(--dsh-content-font-delta,0px))}
      .btw-action-error{position:absolute;bottom:100%;right:0;z-index:3;width:240px;padding:8px;background:var(--dsw-specific-menu,var(--btw-bg));border:1px solid var(--btw-border);border-radius:var(--dsw-radius-md,8px);color:var(--dsw-alias-state-error-primary);font-size:12px}
      .btw-panel{container-type:inline-size;--btw-gutter:clamp(16px,4.8cqw,40px);--btw-width:var(--dsh-chat-content-width,748px)}
      .btw-scroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:24px var(--btw-gutter) 16px;scrollbar-gutter:stable;container-type:inline-size}
      .btw-column{width:100%;max-width:var(--btw-width);margin:0 auto;min-width:0}
      .btw-empty{padding:32px 0}.btw-empty>svg{color:var(--dsw-alias-label-tertiary)}.btw-empty h3{font-size:18px;font-weight:500;margin:12px 0 8px}.btw-empty p{font-size:var(--dsh-content-font-size-secondary,13px);line-height:22px;color:var(--btw-muted);margin:0 0 18px}
      .btw-suggestions{display:flex;align-items:flex-start;flex-direction:column;gap:8px}.btw-suggestions button{border:1px solid var(--btw-border);border-radius:var(--dsw-radius-lg,12px);text-align:left;font-size:12px}
      .btw-message{margin-bottom:28px;min-width:0;display:flex;flex-direction:column;align-items:flex-start}.btw-message[data-role=user]{align-items:flex-end;margin-bottom:24px}
      .btw-message-actions{display:flex;align-items:center;gap:8px;min-height:28px;margin-top:16px;margin-left:-6px;color:var(--dsw-alias-label-tertiary);font-size:12px}.btw-message[data-role=user] .btw-message-actions{margin:6px -6px 0 0}
      .btw-root .btw-message-actions button{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:6px}.btw-message-actions button svg{width:17px;height:17px}
      .btw-sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
      .btw-user{max-width:82%;white-space:pre-wrap;overflow-wrap:anywhere;padding:10px 16px;background:var(--dsw-specific-bubble);border-radius:var(--dsw-radius-xl,16px);line-height:calc(22px + var(--dsh-content-font-delta,0px))}
      .btw-markdown{width:100%;min-width:0;overflow-wrap:anywhere}.btw-markdown>div{min-width:0}
      .btw-stat{display:inline-flex;min-width:0;font-size:calc(var(--dsh-content-font-size-secondary,13px) - 1px);line-height:calc(20px + var(--dsh-content-font-delta-secondary,0px));font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-tertiary)}
      .btw-root button.btw-stat-trigger{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%;padding:1px 8px;font:inherit;color:var(--dsw-alias-label-tertiary);white-space:nowrap}.btw-stat-trigger:hover,.btw-stat-trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--btw-muted)}.btw-stat-trigger>svg{width:14px;height:14px;flex:none}.btw-stat-trigger>span{overflow:hidden;text-overflow:ellipsis}
      /* rc.2 ui-chat/stat-dialog.module.css: same geometry and typography,
         with an opaque base below the menu tint to keep sidebar text legible. */
      .btw-root.btw-stat-panel{z-index:1100;box-sizing:border-box;border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-base,#fff);background-image:linear-gradient(var(--dsw-specific-menu,transparent),var(--dsw-specific-menu,transparent));width:max-content;min-width:min(300px,100vw - 24px);max-width:min(440px,100vw - 24px);max-height:calc(100vh - 24px);overflow:auto;--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);box-shadow:var(--dsw-elevation-prominent);color:var(--dsw-alias-label-secondary);cursor:default;border:0;padding:16px;font-size:12px;line-height:18px;position:fixed}
      .btw-stat-title{color:var(--dsw-alias-label-primary);justify-content:space-between;gap:16px;margin-bottom:8px;font-weight:500;display:flex}.btw-stat-title-rule{border-top:.5px solid var(--dsw-alias-border-l2);margin-bottom:10px}.btw-stat-title-value{font-variant-numeric:tabular-nums}.btw-stat-title-label{align-items:center;gap:6px;min-width:0;display:inline-flex}.btw-stat-title-label svg{flex:none;width:14px;height:14px}
      .btw-stat-panel dl{color:var(--dsw-alias-label-tertiary);grid-template-columns:minmax(76px,auto) minmax(0,1fr);gap:6px 16px;margin:0;display:grid}.btw-stat-panel dt,.btw-stat-panel dd{min-width:0;margin:0}.btw-stat-panel dd{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;text-align:right}.btw-stat-panel p{margin:8px 0 0}
      .btw-note{font-size:12px;line-height:20px;color:var(--btw-muted);padding:8px 0}.btw-error{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:20px;white-space:pre-wrap;overflow-wrap:anywhere;padding:9px 12px;border-left:2px solid currentColor;margin:8px 0}.btw-status{font-size:var(--dsh-content-font-size-secondary,13px);color:var(--dsw-alias-label-deep-diving,var(--btw-muted))}
      .btw-composer{flex:none;min-width:0;padding:0 max(16px,calc(var(--btw-gutter) - 16px)) 4px;background:var(--btw-bg)}
      .btw-composer-inner{position:relative;max-width:calc(var(--btw-width) + 32px);width:100%;margin:0 auto}
      .btw-input-card{--dsw-elevation-stroke-color:var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-panel,24px);background:var(--dsw-specific-input-major);box-shadow:var(--dsw-elevation-soft);padding-top:8px;display:flex;flex-direction:column;gap:12px}
      .btw-composer textarea{box-sizing:border-box;display:block;width:100%;height:36px;min-height:36px;max-height:200px;resize:none;background:transparent;border:0;border-radius:var(--dsw-radius-md,8px);padding:4px 14px 0;line-height:inherit;outline:none;caret-color:var(--btw-accent)}.btw-composer textarea::placeholder{color:var(--dsw-alias-label-caption)}.btw-root .btw-composer textarea:focus-visible{outline:none}.btw-input-card:focus-within{--dsw-elevation-stroke-color:var(--dsw-alias-border-l2)}
      .btw-composer-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;min-width:0;padding:2px 8px 6px}
      .btw-root button.btw-context-toggle{display:inline-flex;align-items:center;gap:6px;min-width:28px;flex-shrink:0;height:28px;font-size:13px;color:var(--btw-muted);padding:0 6px}.btw-context-toggle svg{width:16px;height:16px;flex:none}
      .btw-composer-trailing{display:flex;align-items:center;justify-content:flex-end;min-width:0;gap:12px;margin-left:auto}
      .btw-native-model{min-width:0}.btw-native-model>div{min-width:0}.btw-model{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .btw-root button.btw-send{display:grid;place-items:center;width:34px;height:34px;flex:none;padding:0;border-radius:999px;background:var(--dsw-alias-button-info-fill);color:#fff;transform:translateY(-2px)}.btw-root button.btw-send:hover:not(:disabled){background:var(--dsw-alias-button-info-hover)}.btw-send svg{width:16px;height:16px}
      .btw-dock{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:4px 12px;min-height:28px;max-width:100%;padding-top:4px;color:var(--dsw-alias-label-tertiary)}.btw-dock:empty{display:none}.btw-dock .btw-stat{max-width:100%}.btw-dock time{font-size:12px;line-height:20px;white-space:nowrap}.btw-cost-badge{border:1px solid var(--btw-border);border-radius:4px;padding:0 3px;margin-left:4px;font-size:10px}
      .btw-root.btw-context-panel{width:min(480px,calc(100vw - 24px))}.btw-context-panel p{margin:8px 0 0}.btw-source{white-space:pre-wrap;border-left:2px solid var(--btw-border);padding-left:12px}
      .btw-root button.btw-primary{background:var(--dsw-alias-button-info-fill);color:#fff;border-radius:999px;padding:6px 12px;font-size:13px;font-weight:500}.btw-root button.btw-primary:hover{background:var(--dsw-alias-button-info-hover)}
      @container (width<440px){.btw-context-toggle>span{display:none}.btw-composer-trailing{gap:8px}.btw-native-model{max-width:calc(100cqw - 120px)}.btw-scroll{padding-top:16px}.btw-dock{gap:4px}}
      .btw-settings{padding:18px;overflow:auto;max-width:620px}.btw-settings h3{font-size:16px;font-weight:500;margin:0 0 12px}.btw-field{display:block;margin:16px 0;font-size:13px}.btw-field>span{display:block;margin-bottom:7px}.btw-field select,.btw-field input{display:block;width:100%;min-height:36px;background:var(--dsw-specific-input-major);border:1px solid var(--btw-border);border-radius:var(--dsw-radius-sm,6px);padding:7px 9px}.btw-settings p{font-size:12px;color:var(--btw-muted);line-height:20px}.btw-setting-actions{display:flex;align-items:center;gap:10px}.btw-saved{font-size:12px;color:var(--dsw-alias-state-success-primary)}
      @media(prefers-reduced-motion:no-preference){.btw-pulse{animation:btw-pulse 1.5s ease-in-out infinite}@keyframes btw-pulse{50%{opacity:.45}}}
    `;
    function Icon({ size = 16 }) {
      return h('svg', { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:1.6, 'aria-hidden':true },
        h('path', { d:'M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a8 8 0 1 1 18 0Z' }),
        h('path', { d:'M7 9h8M7 13h5', strokeLinecap:'round' }));
    }
    return {
      inject: ['slots', 'sidebarRight', 'sidebarRightTabs', 'connection', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register('btw', 'zh', words.zh));
        ctx.effect(() => ctx.locale.register('btw', 'en', words.en));
        const translate = ctx.locale.bind('btw');
        function useT() {
          useSyncExternalStore(fn => ctx.locale.subscribe(fn), () => ctx.locale.getLocale(), () => ctx.locale.getLocale());
          return translate;
        }
        const focusTargets = new Map();
        const lifetime = new AbortController();
        ctx.effect(() => () => lifetime.abort());
        async function rpc(action, data = {}, signal) {
          const result = await ctx.connection.rpc.call('/btw-rpc', 'dsh-btw/dispatch', { action, ...data }, signal ? AbortSignal.any([signal, lifetime.signal]) : lifetime.signal);
          if (!result.ok) throw Object.assign(new Error(result.error?.message || 'BTW request failed'), { code:result.error?.code });
          return result.value;
        }
        const address = (sessionId, messageId) => `dsh-resource://btw/${encodeURIComponent(sessionId)}/${encodeURIComponent(messageId)}`;
        function parseAddress(value) {
          try {
            const url = new URL(value);
            const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
            return url.protocol === 'dsh-resource:' && url.hostname === 'btw' && parts.length === 2 ? { sourceSessionId:parts[0], messageId:parts[1] } : null;
          } catch { return null; }
        }
        function Markdown({ text, streaming = false }) {
          const t = useT();
          const labels = React.useMemo(() => ({ code: { copyLabel:t('copy'), copiedLabel:t('copied'),
            toolbarLabels:{ codeLabel:t('code'), wrapLabel:t('wrap'), unwrapLabel:t('unwrap') } }, footnotes:t('footnotes') }), [t, ctx.locale.getLocale()]);
          const safeText = React.useMemo(() => textOnlyMarkdown(text || ''), [text]);
          return h('div', { className:'btw-markdown' }, h(MarkdownDelegateProvider, {
            openExternalLink:url => { if (/^(https?:|mailto:)/i.test(url)) window.open(url, '_blank', 'noopener,noreferrer'); },
          }, h(MarkdownText, { text:safeText, streaming, labels })));
        }
        const count = value => value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
        const validCount = value => Number.isFinite(value) && value >= 0;
        // Same formatting rules as rc.2 ui-chat/StatsPills and message-format.
        const speedText = value => `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} tok/s`;
        function durationText(ms, t) {
          if (ms < 60000) return `${Math.round(ms / 100) / 10}${t('secondUnit')}`;
          const seconds = Math.round(ms / 1000);
          return `${Math.floor(seconds / 60)}${t('minuteUnit')}${seconds % 60}${t('secondUnit')}`;
        }
        function readings(message, t) {
          const rows = [], metrics = message.metrics, usage = message.usage;
          if (validCount(metrics?.tokensPerSecond)) rows.push(['TPS', `${metrics.tokensPerSecond.toFixed(1)} tok/s`]);
          for (const [key, label] of [['inputTokens','inputTokens'], ['cacheReadTokens','cacheRead'], ['cacheWriteTokens','cacheWrite'], ['outputTokens','outputTokens']]) {
            if (validCount(usage?.[key])) rows.push([t(label), String(usage[key])]);
          }
          if (validCount(metrics?.durationMs)) rows.push([t('elapsed'), `${(metrics.durationMs / 1000).toFixed(1)}s`]);
          if (validCount(metrics?.firstTokenMs)) rows.push([t('firstToken'), `${(metrics.firstTokenMs / 1000).toFixed(2)}s`]);
          return rows;
        }
        function recordedTokens(usage) {
          if (validCount(usage?.totalTokens)) return usage.totalTokens;
          if (!validCount(usage?.outputTokens)) return null;
          return usage.outputTokens + ['inputTokens', 'cacheReadTokens', 'cacheWriteTokens'].reduce((sum, key) => sum + (validCount(usage[key]) ? usage[key] : 0), 0);
        }
        function FloatingPanel({ anchorRef, open, setOpen, title, icon:Glyph, titleValue, className = '', id, children }) {
          const panelRef = useRef(null);
          const position = useAnchoredPosition({ open, anchorRef, panelRef, side:'top', align:'start', gap:8, margin:12 });
          useDismissOnOutsidePointer(anchorRef, open, setOpen, panelRef);
          useEffect(() => {
            if (!open || typeof document === 'undefined') return;
            const close = event => { if (event.key === 'Escape') { setOpen(false); anchorRef.current?.focus(); } };
            document.addEventListener('keydown', close);
            return () => document.removeEventListener('keydown', close);
          }, [open, setOpen, anchorRef]);
          return open ? createPortal(h('div', { id, ref:panelRef, className:`btw-root btw-stat-panel ${className}`.trim(), style:position || { visibility:'hidden', left:0, top:0 }, role:'dialog', 'aria-label':title },
            h('div', { className:'btw-stat-title' }, h('span', { className:'btw-stat-title-label' }, Glyph && h(Glyph, { size:14 }), title), titleValue !== undefined && h('span', { className:'btw-stat-title-value' }, titleValue)), h('div', { className:'btw-stat-title-rule', 'aria-hidden':true }), children), document.body) : null;
        }
        function Stat({ icon:Glyph, label, title, titleValue, rows, children }) {
          const root = useRef(null), [open, setOpen] = useState(false);
          return h('span', { className:'btw-stat' },
            h('button', { 'data-btw-control':true, ref:root, type:'button', className:'btw-stat-trigger', 'aria-label':title, 'aria-haspopup':'dialog', 'aria-expanded':open, onClick:() => setOpen(value => !value) },
              Glyph && h(Glyph, { size:14 }), h('span', null, label)),
            h(FloatingPanel, { anchorRef:root, open, setOpen, title, icon:Glyph, titleValue },
              rows?.length ? h('dl', null, rows.map(([name, value]) => h(React.Fragment, { key:name }, h('dt', null, name), h('dd', null, value)))) : null, children));
        }
        function Metrics({ message }) {
          const t = useT(), rows = readings(message, t), tokens = recordedTokens(message.usage);
          if (!rows.length) return null;
          return h(Stat, { icon:IconDatabaseOutlineRegular, label:tokens === null ? t('replyStats') : `${t('usage')} ${count(tokens)} tok`, title:t('replyStats'), rows });
        }
        function ContextRing({ percent }) {
          const length = 2 * Math.PI * 5.5;
          return h('svg', { width:14, height:14, viewBox:'0 0 14 14', 'aria-hidden':true },
            h('circle', { cx:7, cy:7, r:5.5, fill:'none', stroke:'var(--dsw-alias-border-l3)', strokeWidth:2 }),
            Number.isFinite(percent) && h('circle', { cx:7, cy:7, r:5.5, fill:'none', stroke:'currentColor', strokeWidth:2, strokeLinecap:'round', strokeDasharray:`${length * Math.min(100, percent) / 100} ${length}`, transform:'rotate(-90 7 7)' }));
        }
        function DiscussionStats({ thread, contextWindow }) {
          const t = useT(), messages = thread?.messages || [], replies = messages.filter(message => message.role === 'assistant');
          const [now, setNow] = useState(Date.now);
          useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
          if (!replies.length && !thread?.statistics?.steps) return null;
          let tokens = 0, hasTokens = false, decodeSeconds = 0, decodeTokens = 0, elapsed = 0, hasElapsed = false;
          let input = 0, output = 0, cacheRead = 0, cacheWrite = 0, hasInput = false, hasCache = false, ttft = 0, ttftCount = 0;
          for (const message of replies) {
            const usage = message.usage, recorded = recordedTokens(usage);
            if (recorded !== null) { tokens += recorded; hasTokens = true; }
            if (validCount(usage?.inputTokens)) { input += usage.inputTokens; hasInput = true; }
            if (validCount(usage?.outputTokens)) output += usage.outputTokens;
            if (validCount(usage?.cacheReadTokens)) { cacheRead += usage.cacheReadTokens; hasCache = true; }
            if (validCount(usage?.cacheWriteTokens)) cacheWrite += usage.cacheWriteTokens;
            if (validCount(message.metrics?.durationMs)) { elapsed += message.metrics.durationMs; hasElapsed = true; }
            if (validCount(message.metrics?.firstTokenMs)) { ttft += message.metrics.firstTokenMs; ttftCount++; }
            if (message.metrics?.tokensPerSecond > 0 && usage?.outputTokens > 0) {
              decodeTokens += usage.outputTokens; decodeSeconds += usage.outputTokens / message.metrics.tokensPerSecond;
            }
          }
          const speed = decodeSeconds > 0 ? speedText(decodeTokens / decodeSeconds) : null;
          const turns = thread.statistics?.turns ?? messages.filter(message => message.role === 'user').length;
          const steps = thread.statistics?.steps ?? replies.length;
          const activity = `${turns} ${t('turns')} ${steps} ${t('steps')}`;
          const rows = [];
          if (hasElapsed && elapsed > 0) rows.push([t('llmTime'), durationText(elapsed, t)]);
          // ActivityPill omits tool time when zero. BTW never executes tools.
          if (ttftCount) rows.push([t('avgTtft'), durationText(ttft / ttftCount, t)]);
          if (speed) rows.push([t('decodeSpeed'), speed]);
          const billedInput = input + cacheRead + cacheWrite;
          const hit = hasInput && hasCache && billedInput > 0 ? cacheRead / billedInput * 100 : null;
          let precision = 0;
          while (hit !== null && hit < 100 && Number(hit.toFixed(precision)) >= 100 && precision < 8) precision++;
          const hitText = hit === null ? null : `${hit.toFixed(precision)}%`;
          const usageRows = [...(hitText ? [[t('cacheHit'), hitText]] : []), ...(hasInput ? [[t('inputTokens'), String(input)]] : []), ...(hasCache ? [[t('cacheRead'), String(cacheRead)]] : []), ...(cacheWrite ? [[t('cacheWrite'), String(cacheWrite)]] : []), [t('outputTokens'), String(output)]];
          const latest = [...replies].reverse().find(message => message.model?.provider === thread.model?.provider && message.model?.model === thread.model?.model);
          const used = latest && recordedTokens(latest.usage);
          const percent = validCount(used) && Number.isFinite(contextWindow) && contextWindow > 0 ? Math.min(100, Math.round(used / contextWindow * 100)) : null;
          const contextRows = [[t('latestUsage'), validCount(used) ? `${count(used)} tok` : t('noData')], [t('capacity'), contextWindow ? `${count(contextWindow)} tok` : t('noData')]];
          const updatedAt = thread.statistics?.updatedAt;
          const minutes = validCount(updatedAt) ? Math.max(0, Math.floor((now - updatedAt) / 60000)) : null;
          const updated = minutes === null ? null : minutes === 0 ? t('justNow') : minutes < 60 ? `${minutes} ${t('minutesAgo')}` : `${Math.floor(minutes / 60)} ${t('hoursAgo')}`;
          return h('div', { className:'btw-dock', 'aria-label':t('discussionStats') },
            h(Stat, { icon:IconGaugeOutlineRegular, label:`${activity}${speed ? ` · ${speed}` : ''}`, title:t('discussionStats'), rows }),
            hasTokens && h(Stat, { icon:IconDatabaseOutlineRegular, label:`${count(tokens)} tok${hitText ? ` · ${t('cacheHit')} ${hitText}` : ''}`, title:t('tokenUsage'), titleValue:`${count(tokens)} tok`, rows:usageRows }),
            h(Stat, { label:h(React.Fragment, null, `${t('sessionCost')} —`, h('span', { className:'btw-cost-badge' }, t('noPricing'))), title:t('sessionCost') }, h('p', null, t('noPricingHint'))),
            updated && h('time', { dateTime:new Date(updatedAt).toISOString(), title:new Date(updatedAt).toLocaleString() }, `${t('updated')} ${updated}`),
            h(Stat, { icon:() => h(ContextRing, { percent }), label:percent === null ? '—' : `${percent}%`, title:t('contextUsed'), rows:contextRows }));
        }
        function Copy({ text }) {
          const t = useT();
          const [state, setState] = useState('');
          const timer = useRef();
          useEffect(() => () => clearTimeout(timer.current), []);
          async function copy() {
            try {
              await navigator.clipboard.writeText(text);
              setState(t('copied'));
              clearTimeout(timer.current);
              timer.current = setTimeout(() => setState(''), 1500);
            } catch (error) { setState(error.message); }
          }
          return h('button', { 'data-btw-control':true, type:'button', onClick:copy, title:state || t('copy'), 'aria-label':t('copy') }, h(state === t('copied') ? IconCheckOutlineRegular : IconCopyOutlineRegular, { size:16 }), state && state !== t('copied') ? state : null);
        }
        function ModelControl({ thread, sourceSessionId, onSaved }) {
          const t = useT();
          useSyncExternalStore(fn => {
            const unsubscribers = ['conversation.input.model', 'conversation.input.model.label'].map(key => ctx.slots.subscribe(key, fn));
            return () => unsubscribers.forEach(unsubscribe => unsubscribe());
          }, () => `${ctx.slots.getVersion('conversation.input.model')}:${ctx.slots.getVersion('conversation.input.model.label')}`);
          const entry = ctx.slots.entriesOfSlot('conversation.input.model')[0];
          const directory = React.useMemo(() => thread?.id ? new BtwModelDirectory({ rpc, sourceSessionId, thread, onSaved, followLabel:t('follow') }) : null, [thread?.id, sourceSessionId]);
          useEffect(() => { if (thread) directory?.setThread(thread); }, [directory, thread]);
          useEffect(() => { directory?.load(); return () => directory?.dispose(); }, [directory]);
          if (!entry?.component || !directory) return h('span', { className:'btw-model' }, thread?.model?.model || t('loading'));
          return h('div', { className:'btw-native-model' }, h(entry.component, {
            locked:thread.status === 'running', available:true, directory,
            load:() => directory.load(), select:selection => directory.select(selection), t:ctx.locale.bind('model'),
            // Label extensions have a pure presentation contract. Never invoke a
            // Session slot injector: that would bind this control to the main chat.
            renderSlot:(key, owner, options) => {
              const label = ctx.slots.entriesOfSlot(key)[0];
              return label?.component ? h(label.component, owner) : options?.fallback ?? null;
            },
          }));
        }
        function Settings({ onClose, sourceSessionId, thread, onSaved }) {
          const t = useT();
          const threadId = thread?.id;
          const running = thread?.status === 'running';
          const target = threadId ? { sourceSessionId, threadId } : {};
          const [form, setForm] = useState(null);
          const [providers, setProviders] = useState([]);
          const [models, setModels] = useState([]);
          const [error, setError] = useState('');
          const [busy, setBusy] = useState(false);
          const [saved, setSaved] = useState(false);
          useEffect(() => {
            const ac = new AbortController();
            rpc('config', target, ac.signal).then(value => { setForm(value.settings); setProviders(value.providers || []); }).catch(e => { if (!ac.signal.aborted) setError(e.message); });
            return () => ac.abort();
          }, [threadId, sourceSessionId]);
          useEffect(() => {
            if (!form?.provider || form.mode !== 'fixed') { setModels([]); return; }
            const ac = new AbortController();
            setModels([]);
            rpc('models', { provider:form.provider }, ac.signal).then(value => setModels(value.models || [])).catch(e => { if (!ac.signal.aborted) setError(e.message); });
            return () => ac.abort();
          }, [form?.provider, form?.mode]);
          function update(next) { setForm(previous => ({ ...previous, ...next })); setSaved(false); setError(''); }
          async function save() {
            if (!form || busy || running) return;
            if (form.mode === 'fixed' && (!form.provider || !form.model)) { setError(t('missingModel')); return; }
            setBusy(true); setSaved(false); setError('');
            try {
              const settings = form.mode === 'follow' ? { mode:'follow' } : { mode:'fixed', provider:form.provider, model:form.model };
              const result = await rpc('config', { ...target, settings });
              setForm(result.settings);
              if (result.thread) onSaved?.(result.thread);
              setSaved(true);
            } catch (e) { setError(e.message); } finally { setBusy(false); }
          }
          return h('section', { className:'btw-root btw-settings', 'aria-label':t('settings') }, h('style', null, css),
            h('h3', null, t('settings')), !threadId && h('p', null, t('modelHint')),
            running && h('p', { role:'status' }, t('modelBusy')),
            error && h('div', { className:'btw-error', role:'alert' }, error),
            !form ? !error && h('p', null, t('loading')) : h(React.Fragment, null,
              h('label', { className:'btw-field' }, h('span', null, t(threadId ? 'threadModel' : 'modelMode')), h('select', { disabled:busy || running, value:form.mode, onChange:e => update({ mode:e.target.value }) }, h('option', { value:'follow' }, t('follow')), h('option', { value:'fixed' }, t('fixed')))),
              form.mode === 'fixed' && h(React.Fragment, null,
                providers.length === 0 && h('p', null, t('noProviders')),
                h('label', { className:'btw-field' }, h('span', null, t('provider')), h('select', { disabled:busy || running, value:form.provider || '', onChange:e => update({ provider:e.target.value, model:'' }) }, h('option', { value:'' }, t('select')), providers.map(p => h('option', { key:p.id, value:p.id }, p.name || p.id)))),
                h('label', { className:'btw-field' }, h('span', null, t('model')), h('input', { disabled:busy || running, value:form.model || '', list:'btw-model-list', placeholder:t('select'), onChange:e => update({ model:e.target.value }), autoComplete:'off' }), h('datalist', { id:'btw-model-list' }, models.map(m => h('option', { key:m.id, value:m.id }, m.name || m.id))))),
              h('div', { className:'btw-setting-actions' }, h('button', { 'data-btw-control':true, type:'button', className:'btw-primary', onClick:save, disabled:busy || running }, t('save')), saved && h('span', { className:'btw-saved', role:'status' }, t('saved')), onClose && h('button', { 'data-btw-control':true, type:'button', onClick:onClose, disabled:busy }, t('done')))));
        }
        function Action({ sessionId, messageId }) {
          const t = useT();
          const [error, setError] = useState('');
          function open() {
            try {
              if (ctx.sidebarRight.mounted.getSnapshot() !== sessionId) throw new Error(t('unavailable'));
              const uri = address(sessionId, messageId);
              ctx.sidebarRight.openResource(uri);
              focusTargets.get(uri)?.();
              setError('');
            } catch (e) { setError(e.message); }
          }
          return h('span', { className:'btw-root btw-action' }, h('style', null, css),
            h('button', { 'data-btw-control':true, type:'button', className:'btw-icon', title:t('ask'), 'aria-label':t('ask'), onClick:open }, h(Icon, null)),
            error && h('span', { className:'btw-action-error', role:'alert' }, error));
        }
        function Panel(props) {
          const t = useT();
          const info = props.useTabInfo();
          const source = parseAddress(info.tab.navigation.address);
          const sourceSessionId = source?.sourceSessionId;
          const messageId = source?.messageId;
          const [thread, setThread] = useState(null);
          const [error, setError] = useState('');
          const [draft, setDraft] = useState('');
          const [contextOpen, setContextOpen] = useState(false);
          const [contextWindow, setContextWindow] = useState(null);
          const contextAnchor = useRef(null);
          const contextId = React.useId();
          const [sending, setSending] = useState(false);
          const [stopping, setStopping] = useState(false);
          const [reload, setReload] = useState(0);
          const composer = useRef(null);
          const scroller = useRef(null);
          const followBottom = useRef(true);
          const pending = useRef(null);
          const threadRef = useRef(null);
          const accept = useCallback(next => {
            if (!next) return;
            setThread(previous => !previous || previous.id !== next.id || next.revision >= previous.revision ? next : previous);
            if (!threadRef.current || threadRef.current.id !== next.id || next.revision >= threadRef.current.revision) threadRef.current = next;
          }, []);
          useEffect(() => {
            setContextWindow(null);
            if (!thread?.id) return;
            const ac = new AbortController();
            rpc('config', { sourceSessionId, threadId:thread.id }, ac.signal).then(value => {
              if (!ac.signal.aborted) setContextWindow(value.contextWindow ?? null);
            }).catch(() => {});
            return () => ac.abort();
          }, [sourceSessionId, thread?.id, thread?.model?.provider, thread?.model?.model]);
          const draftKey = sourceSessionId && messageId ? `dsh-btw:draft:${sourceSessionId}:${messageId}` : null;
          useEffect(() => {
            try { setDraft(draftKey ? sessionStorage.getItem(draftKey) || '' : ''); } catch { setDraft(''); }
          }, [draftKey]);
          function changeDraft(text) {
            setDraft(text);
            if (pending.current?.text !== text) pending.current = null;
            try { if (draftKey) text ? sessionStorage.setItem(draftKey, text) : sessionStorage.removeItem(draftKey); } catch { /* Storage may be disabled; the live draft remains usable. */ }
          }
          useEffect(() => {
            if (!sourceSessionId || !messageId) return;
            const ac = new AbortController();
            setError('');
            let disposed = false;
            (async () => {
              const result = await rpc('open', { sourceSessionId, messageId }, ac.signal);
              if (disposed) return;
              let current = result.thread;
              accept(current);
              while (!ac.signal.aborted) {
                const result = await rpc('watch', { sourceSessionId, threadId:current.id, afterRevision:current.revision, timeoutMs:20000 }, ac.signal);
                if (disposed) return;
                current = result.thread;
                accept(current);
              }
            })().catch(e => { if (!disposed) setError(e.message || t('connectionError')); });
            return () => { disposed = true; ac.abort(); };
          }, [sourceSessionId, messageId, reload, accept]);
          useEffect(() => {
            if (!sourceSessionId || !messageId) return;
            const uri = address(sourceSessionId, messageId);
            const focus = () => { composer.current?.focus({ preventScroll:true }); };
            focusTargets.set(uri, focus);
            return () => { if (focusTargets.get(uri) === focus) focusTargets.delete(uri); };
          }, [sourceSessionId, messageId]);
          useEffect(() => {
            if (info.tab.visible) composer.current?.focus({ preventScroll:true });
          }, [info.tab.visible, thread?.id]);
          useEffect(() => {
            if (followBottom.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
          }, [thread?.revision]);
          useEffect(() => {
            const input = composer.current;
            if (!input || !Number.isFinite(input.scrollHeight)) return;
            input.style.height = '0px';
            input.style.height = `${Math.min(200, Math.max(36, input.scrollHeight))}px`;
          }, [draft]);
          const running = thread?.status === 'running';
          async function send() {
            if (sending || running || !thread) return;
            const text = draft.trim();
            if (!text) { setError(t('noText')); return; }
            if (text.length > 20000) { setError(t('tooLong')); return; }
            if (!pending.current || pending.current.text !== text) pending.current = { text, requestId:crypto.randomUUID() };
            const request = pending.current;
            setSending(true); setError(''); followBottom.current = true;
            try {
              const result = await rpc('send', { sourceSessionId, threadId:thread.id, ...request });
              accept(result.thread);
              changeDraft('');
            } catch (e) { setError(e.message); } finally { setSending(false); }
          }
          async function stop() {
            setStopping(true); setError('');
            try { accept((await rpc('stop', { sourceSessionId, threadId:thread.id })).thread); }
            catch (e) { setError(e.message); } finally { setStopping(false); }
          }
          if (!source) return h('div', { className:'btw-root btw-settings' }, t('noSource'));
          const inputArea = h('footer', { className:'btw-composer' }, h('div', { className:'btw-composer-inner' },
              h(FloatingPanel, { anchorRef:contextAnchor, open:contextOpen, setOpen:setContextOpen, id:contextId, className:'btw-context-panel', title:t('source') },
                h('p', null, t('context')), thread?.sourcePreview && h('p', { className:'btw-source' }, thread.sourcePreview)),
              h('div', { className:'btw-input-card', 'data-composer-card':'' },
                h('textarea', { ref:composer, rows:1, value:draft, onChange:e => changeDraft(e.target.value), placeholder:t('placeholder'), 'aria-label':t('placeholder'), title:t('hint'), maxLength:20000,
                  onKeyDown:e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); send(); } } }),
                h('div', { className:'btw-composer-footer' },
                  h('button', { 'data-btw-control':true, type:'button', className:'btw-context-toggle', ref:contextAnchor, 'aria-haspopup':'dialog', title:t('source'), 'aria-label':t('source'), 'aria-expanded':contextOpen, 'aria-controls':contextId, onClick:() => setContextOpen(value => !value) }, h(IconApiOutlineRegular, { size:16 }), h('span', null, t('source'))),
                  h('div', { className:'btw-composer-trailing' },
                    h(ModelControl, { thread, sourceSessionId, onSaved:accept }),
                    h(Tooltip, { label:running ? t(stopping ? 'stopping' : 'stop') : `${t('send')} · ${t('hint')}`, side:'top' },
                      h('button', { 'data-btw-control':true, type:'button', className:'btw-send', 'aria-label':running ? t('stop') : t('send'), disabled:running ? stopping : !thread || sending || !draft.trim(), onMouseDown:e => e.preventDefault(), onClick:running ? stop : send },
                        h('svg', { viewBox:'0 0 16 16', width:16, height:16, 'aria-hidden':true }, running
                          ? h('rect', { x:3, y:3, width:10, height:10, rx:3, fill:'currentColor' })
                          : h('path', { d:'M8.3125 0.980183C8.66767 1.0531 8.97902 1.20418 9.2627 1.43233C9.48724 1.61297 9.73029 1.85793 9.97949 2.10714L14.707 6.83468L13.293 8.24874L9 3.95577V15.0417H7V3.95577L2.70703 8.24874L1.29297 6.83468L6.02051 2.10714C6.26971 1.85793 6.51277 1.61297 6.7373 1.43233C6.97662 1.23986 7.28445 1.04402 7.6875 0.980183C7.8973 0.947006 8.1031 0.95516 8.3125 0.980183Z', fill:'currentColor' }))))))),
              h(DiscussionStats, { thread, contextWindow })));
          return h('section', { className:'btw-root btw-panel', 'aria-label':'dsh-btw' }, h('style', null, css),
            h('div', { className:'btw-scroll', ref:scroller, onScroll:() => { const el = scroller.current; followBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 70; } },
              h('div', { className:'btw-column' },
              !thread && !error && h('p', { className:'btw-note', role:'status' }, t('loading')),
              thread && thread.messages.length === 0 && !running && h('div', { className:'btw-empty' }, h(Icon, { size:28 }), h('h3', null, t('empty')),
                h('div', { className:'btw-suggestions' }, ['prompt1', 'prompt2'].map(key => h('button', { 'data-btw-control':true, type:'button', key, onClick:() => { changeDraft(t(key)); composer.current?.focus(); } }, t(key))))),
              thread?.messages.map(message => h('article', { key:message.id, className:'btw-message', 'data-role':message.role },
                h('span', { className:'btw-sr-only' }, t(message.role === 'user' ? 'you' : 'assistant')),
                message.role === 'user' ? h('div', { className:'btw-user' }, message.text) : h(Markdown, { text:message.text }),
                h('div', { className:'btw-message-actions' }, h(Copy, { text:message.text }), message.role === 'assistant' && h(Metrics, { message })))),
              running && h('article', { className:'btw-message', 'aria-busy':true }, h('span', { className:'btw-sr-only' }, t('assistant')), thread.draftAssistant ? h(Markdown, { text:thread.draftAssistant, streaming:true }) : h('span', { className:'btw-status btw-pulse', role:'status' }, t('thinking'))),
              thread?.status === 'stopped' && h('p', { className:'btw-note', role:'status' }, t('stopped')),
              (thread?.warnings || []).map((warning, i) => h('p', { key:i, className:'btw-note' }, warning)),
              thread?.error && h('div', { className:'btw-error', role:'alert' }, thread.error),
              error && h('div', { className:'btw-error', role:'alert' }, error, h('div', null, h('button', { 'data-btw-control':true, type:'button', onClick:() => setReload(n => n + 1) }, t('retry')))))),
            inputArea);
        }
        ctx.effect(() => ctx.sidebarRightTabs.register({ id:'dsh-btw', kind:'btw', patterns:['dsh-resource://btw/**'], canOpen:value => !!parseAddress(value), title:() => 'dsh-btw', multiple:true, keepMounted:false }));
        ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register({ name:'conversation.chat.assistant-actions', id:'dsh-btw', order:20, label:() => translate('ask') }, Action));
        ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({ name:'sidebar.right.pane.tab', key:'dsh-btw' }, Panel));
        ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({ name:'plugins.bundle.config', key:'dsh-btw' }, Settings));
      },
    };
  },
});
