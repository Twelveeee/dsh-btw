import { randomUUID } from 'node:crypto';
import { DEFAULT_UI_SETTINGS, MAX_QUICK_PROMPTS, MAX_QUICK_PROMPT_CHARS } from './preferences.js';
import { PRIVATE_STORAGE, mountPrivatePersistence, migrateLegacyThread, isWithin, canonicalStorageRoot } from './persistence.js';
import {
  BtwError, assert, validateRequest, captureContext, contextText, chooseModel,
  threadKey, questionId, normaliseChoices, textOf, errorMessage, throwIfAborted,
  KeyedMutex, foldThread, SYSTEM_PROMPT,
} from './core.js';

export const name = 'dsh-btw';
export const inject = ['llm', 'sessionQuery', 'sessionPersistence', 'storageDomain', 'connection', 'webServer', 'tools', 'dshHomePath'];
export const RPC_ENDPOINT = 'dsh-btw/dispatch';

export function domainSpec(z) {
  const id = z.string().min(1).max(512);
  const model = z.object({ provider: id, model: id }).strict();
  const selection = z.union([z.object({ mode: z.literal('follow') }).strict(), z.object({ mode: z.literal('fixed'), provider: id, model: id }).strict()]);
  const ui = z.object({ showButton: z.boolean(), quickPrompts: z.array(z.string().trim().min(1).max(MAX_QUICK_PROMPT_CHARS)).max(MAX_QUICK_PROMPTS) }).strict();
  return {
    name: 'dsh_btw', version: 1, layout: 'per-record',
    global: {
      schema: z.union(selection.options.map(option => option.extend({ ui: ui.optional() }))),
      initial: { mode: 'follow' },
    },
    tables: { threads: { valueSchema: z.object({
      id, sourceSessionId: id, sourceMessageId: id, sourceSeq: z.number().int().nonnegative(),
      createdAt: z.number().int().nonnegative(), contextMessageId: id,
      storage: z.literal(PRIVATE_STORAGE).optional(),
      model, modelSettings: selection.optional(), sourceModel: model.nullable().optional(), sourcePreview: z.string(), contextCount: z.number().int().nonnegative(), contextChars: z.number().int().nonnegative(),
    }).strict() } },
  };
}

/** The only business implementation: used by both owner-only RPC and the scoped agent tool. */
export class BtwService {
  constructor(ctx, domain, runtime, options = {}) {
    this.ctx = ctx; this.domain = domain; this.runtime = runtime;
    this.persistence = options.persistence ?? ctx.sessionPersistence;
    this.disposePersistence = options.disposePersistence;
    this.threads = new Map(); this.locks = new KeyedMutex(); this.closing = false;
    this.now = options.now ?? Date.now;
    this.generationTimeoutMs = options.generationTimeoutMs ?? 180_000;
    this.notifyIntervalMs = options.notifyIntervalMs ?? 100;
    this.maxOutputChars = options.maxOutputChars ?? 128_000;
    this.pending = new Set(); this.operations = new Set(); this.activeRequests = 0; this.disposePromise = null;
  }

  dispatch(input, signal) {
    const operation = this.dispatchOperation(input, signal);
    this.operations.add(operation);
    const done = () => this.operations.delete(operation);
    operation.then(done, done);
    return operation;
  }

  async dispatchOperation(input, signal) {
    const request = validateRequest(input);
    assert(!this.closing, 'DISPOSED', 'BTW is shutting down.');
    throwIfAborted(signal);
    if (request.action === 'config') {
      if (request.threadId) return this.configureThread(request, signal);
      return this.locks.run('global-config', async () => {
        throwIfAborted(signal);
        const { ui, ...settings } = this.domain.global.get();
        const next = { ...(request.settings ?? settings), ...(request.ui || ui ? { ui: request.ui ?? ui } : {}) };
        if (request.settings || request.ui) await this.domain.global.set(next);
        return { settings: request.settings ?? settings, ui: next.ui ?? DEFAULT_UI_SETTINGS, providers: normaliseChoices(this.ctx.llm.listProviders()) };
      });
    }
    if (request.action === 'models') return { models: normaliseChoices(await this.ctx.llm.listModels(request.provider)) };
    if (request.action === 'open') return this.locks.run(threadKey(request.sourceSessionId, request.messageId), async () => {
      throwIfAborted(signal);
      const existing = [...this.domain.table('threads').entries()].find(([, m]) => m.sourceSessionId === request.sourceSessionId && m.sourceMessageId === request.messageId)?.[1];
      const thread = existing ? await this.load(existing.id, request.sourceSessionId) : await this.create(request, signal);
      return { thread: this.snapshot(thread) };
    });
    const thread = await this.load(request.threadId, request.sourceSessionId);
    assert(!this.closing, 'DISPOSED', 'BTW is shutting down.');
    throwIfAborted(signal);
    if (request.action === 'get') return { thread: this.snapshot(thread) };
    if (request.action === 'send') return this.locks.run(thread.meta.id, () => this.send(thread, request, signal));
    if (request.action === 'stop') {
      thread.controller?.abort(new BtwError('STOPPED', 'Stopped by user.'));
      return { thread: this.snapshot(thread) };
    }
    await this.watch(thread, request.afterRevision, request.timeoutMs, signal);
    return { thread: this.snapshot(thread) };
  }

  async configureThread(request, signal) {
    const thread = await this.load(request.threadId, request.sourceSessionId);
    const result = await this.locks.run(thread.meta.id, async () => {
      assert(!this.closing, 'DISPOSED', 'BTW is shutting down.');
      throwIfAborted(signal);
      if (request.settings) {
        assert(!thread.controller, 'THREAD_BUSY', 'Stop or wait for the current reply before changing its model.');
        assert(!thread.poisoned, 'PERSISTENCE_FAILED', thread.fatalError);
        let sourceModel = thread.meta.sourceModel;
        if (request.settings.mode === 'follow' && sourceModel === undefined) {
          const source = await this.ctx.sessionQuery.readSession(thread.meta.sourceSessionId);
          sourceModel = captureContext(source.events, thread.meta.sourceMessageId).model;
        }
        throwIfAborted(signal);
        const model = chooseModel(request.settings, { model: sourceModel });
        const meta = { ...thread.meta, model, modelSettings: { ...request.settings },
          ...(sourceModel !== undefined ? { sourceModel } : {}) };
        // This index is the durable selection for FUTURE requests. Do not rewrite
        // past request headers or answers; send records the selected model next.
        await this.domain.table('threads').put(meta.id, meta);
        thread.meta = meta;
        this.notify(thread, true);
      }
      return { settings: thread.meta.modelSettings ?? { mode: 'fixed', ...thread.meta.model },
        providers: normaliseChoices(this.ctx.llm.listProviders()), thread: this.snapshot(thread) };
    });
    // Optional display metadata is resolved outside the send/model-selection lock.
    // This is route metadata only: never run a model to obtain a context capacity.
    if (!request.settings && typeof this.ctx.llm.resolveModelInfo === 'function') {
      try {
        const timeout = AbortSignal.timeout(2000);
        const info = await this.ctx.llm.resolveModelInfo(result.thread.model.provider, result.thread.model.model,
          signal ? AbortSignal.any([signal, timeout]) : timeout);
        const capacity = info?.context?.contextWindow;
        if (Number.isFinite(capacity) && capacity > 0) result.contextWindow = capacity;
      } catch { /* Unknown metadata must not disable an otherwise usable discussion. */ }
    }
    return result;
  }

  async create(request, signal) {
    const source = await this.ctx.sessionQuery.readSession(request.sourceSessionId);
    throwIfAborted(signal);
    const captured = captureContext(source.events, request.messageId);
    const { ui: _ui, ...modelSettings } = this.domain.global.get();
    const model = chooseModel(modelSettings, captured);
    const id = `btw-${randomUUID()}`;
    const session = this.runtime.Session.create(id, [], {
      version: this.runtime.SESSION_FORMAT_VERSION, id, createdAt: this.now(), isSeeded: false,
      parentSession: request.sourceSessionId,
      ...(source.session.cwd ? { cwd: source.session.cwd } : {}),
    });
    const context = this.runtime.createUserMessage({ content: [{ type: 'text', text: contextText(captured) }], source: { kind: 'dsh-btw', form: 'recall' } });
    // The durable V4 reader requires system/header records inside a real lifecycle bracket.
    // This setup turn commits the frozen context only; it performs no model call.
    session.append('turn/start', { turn: 1 });
    session.append('step/start', { turn: 1, step: 1 });
    session.append('system/message', { turn: 1, step: 1, message: this.runtime.createSystemMessage(SYSTEM_PROMPT) }, { surfaceOp: 'append' });
    session.append('user/message', context, { surfaceOp: 'append' });
    session.append('request/header', { reason: 'initial', header: { config: model } });
    session.append('step/end', { turn: 1, step: 1 });
    session.append('turn/end', { turn: 1, reason: { kind: 'completed' } });
    const meta = {
      id, sourceSessionId: request.sourceSessionId, sourceMessageId: request.messageId,
      sourceSeq: captured.seq, createdAt: session.header.createdAt, contextMessageId: context.id,
      model, modelSettings, sourceModel: captured.model, sourcePreview: captured.preview, contextCount: captured.messages.length, contextChars: captured.chars,
      storage: PRIVATE_STORAGE,
    };
    const handle = await this.persistence.create(session.header);
    const thread = this.makeThread(meta, session, handle, 0);
    try {
      await this.commit(thread);
      // Index publication follows the durable canonical history. No successful open precedes either barrier.
      await this.domain.table('threads').put(id, meta);
      this.threads.set(id, thread);
      return thread;
    } catch (error) { await handle.close(); throw error; }
  }

  async load(id, sourceSessionId) {
    let meta = this.domain.table('threads').get(id);
    assert(meta && meta.sourceSessionId === sourceSessionId, 'THREAD_NOT_FOUND', 'This BTW thread does not belong to the requested source session.');
    if (this.threads.has(id)) return this.threads.get(id);
    return this.locks.run(`load:${id}`, async () => {
      if (this.threads.has(id)) return this.threads.get(id);
      let handle;
      if (meta.storage !== PRIVATE_STORAGE) {
        ({ meta, handle } = await migrateLegacyThread(meta, this.ctx.sessionPersistence, this.persistence, this.domain.table('threads')));
      } else handle = await this.persistence.open(id, 'write');
      try {
        const { events } = await handle.read();
        // Detached Session: never publish an Agent, never invoke main-session lifecycle or selection APIs.
        const session = this.runtime.Session.create(id, events, handle.header, handle.inheritedEventCount);
        const thread = this.makeThread(meta, session, handle, events.length);
        const folded = foldThread(events, meta.contextMessageId);
        if (folded.running) {
          if (folded.stepOpen) session.append('step/end', { turn: folded.turn, step: 1 });
          session.append('turn/end', { turn: folded.turn, reason: { kind: 'error', error: { code: 'INTERRUPTED', message: 'Reply interrupted by Host restart. Send a follow-up to continue.' } } });
          await this.commit(thread);
        } else if (session.snapshotEvents().length > events.length) await this.commit(thread);
        this.threads.set(id, thread);
        return thread;
      } catch (error) { await handle.close(); throw error; }
    });
  }

  makeThread(meta, session, handle, persisted) {
    return { meta, session, handle, persisted, revision: this.now(), draftAssistant: '', controller: null, job: null,
      waiters: new Set(), notifyTimer: null, poisoned: false, fatalError: undefined };
  }
  async commit(thread) {
    assert(!thread.poisoned, 'PERSISTENCE_FAILED', 'This thread needs a Host restart after a storage error.');
    try {
      const events = thread.session.snapshotEvents().slice(thread.persisted);
      if (events.length) await thread.handle.append(events);
      await thread.handle.flush();
      thread.persisted += events.length;
    } catch (error) {
      thread.poisoned = true;
      thread.fatalError = `BTW could not save its session: ${errorMessage(error)}. No further generation will run until the Host is restarted.`;
      throw new BtwError('PERSISTENCE_FAILED', thread.fatalError);
    }
  }
  snapshot(thread) {
    const folded = foldThread(thread.session.snapshotEvents().slice(0, thread.persisted), thread.meta.contextMessageId, this.runtime);
    const value = { ...thread.meta, model: { ...thread.meta.model }, revision: thread.revision,
      status: thread.fatalError ? 'error' : folded.status, messages: folded.messages,
      statistics: folded.statistics,
      warnings: [],
    };
    delete value.contextMessageId;
    if (thread.draftAssistant) value.draftAssistant = thread.draftAssistant;
    if (thread.fatalError || folded.error) value.error = thread.fatalError || folded.error;
    return value;
  }
  notify(thread, immediate = false) {
    if (!immediate && thread.notifyTimer) return;
    const publish = () => {
      thread.notifyTimer = null;
      thread.revision = Math.max(this.now(), thread.revision + 1);
      for (const resolve of [...thread.waiters]) resolve();
    };
    if (immediate) { clearTimeout(thread.notifyTimer); publish(); }
    else thread.notifyTimer = setTimeout(publish, this.notifyIntervalMs);
  }
  async watch(thread, afterRevision, timeoutMs, signal) {
    if (thread.revision !== afterRevision) return;
    throwIfAborted(signal);
    await new Promise((resolve, reject) => {
      let timer;
      const done = (error) => {
        clearTimeout(timer); thread.waiters.delete(changed); signal?.removeEventListener('abort', aborted);
        error ? reject(error) : resolve();
      };
      const changed = () => done();
      const aborted = () => done(new BtwError('ABORTED', 'The watch was cancelled.'));
      thread.waiters.add(changed);
      signal?.addEventListener('abort', aborted, { once: true });
      timer = setTimeout(changed, timeoutMs);
      if (signal?.aborted) aborted();
    });
  }

  async send(thread, request, signal) {
    throwIfAborted(signal);
    assert(!thread.poisoned, 'PERSISTENCE_FAILED', thread.fatalError);
    const id = questionId(request.requestId);
    const previous = thread.session.snapshotEvents().find(e => e.type === 'user/message' && e.data.id === id);
    if (previous) {
      assert(textOf(previous.data) === request.text, 'REQUEST_ID_CONFLICT', 'A requestId cannot be reused for a different question.');
      return { thread: this.snapshot(thread) };
    }
    assert(!thread.controller, 'THREAD_BUSY', 'Stop or wait for the current reply before sending another question.');
    assert(this.activeRequests < 4, 'TOO_MANY_REQUESTS', 'At most four BTW responses can run simultaneously.');
    const messages = thread.session.deriveMessages();
    assert(messages.reduce((n, m) => n + textOf(m).length, request.text.length) <= 2_000_000, 'CONTEXT_TOO_LARGE', 'Context exceeds the 2,000,000-character limit.');
    const turn = foldThread(thread.session.snapshotEvents(), thread.meta.contextMessageId).turn + 1;
    const user = this.runtime.freezeMessage({ ...this.runtime.createUserMessage({ content: [{ type: 'text', text: request.text }], source: { kind: 'user' } }), id });
    this.activeRequests++;
    thread.controller = new AbortController();
    try {
      thread.session.append('turn/start', { turn });
      thread.session.append('user/message', user, { surfaceOp: 'append' });
      thread.session.append('step/start', { turn, step: 1 });
      const previousModel = thread.session.requestHeader()?.config;
      if (previousModel?.provider !== thread.meta.model.provider || previousModel?.model !== thread.meta.model.model) {
        thread.session.append('request/header', { reason: 'change', header: { config: { ...thread.meta.model } } });
      }
      await this.commit(thread); // Persist accepted input BEFORE invoking the provider.
    } catch (error) {
      this.activeRequests--; thread.controller = null; this.notify(thread, true); throw error;
    }
    if (this.closing) thread.controller.abort();
    thread.draftAssistant = '';
    this.notify(thread, true);
    const accepted = this.snapshot(thread);
    const job = this.generate(thread, turn).catch(error => {
      thread.fatalError = errorMessage(error); this.notify(thread, true);
    }).finally(() => { this.pending.delete(job); this.activeRequests--; thread.job = null; });
    thread.job = job; this.pending.add(job);
    return { thread: accepted };
  }

  async generate(thread, turn) {
    const { BlockAssembler, AssistantStreamAccumulator, createAssistantMessage } = this.runtime;
    const assembler = new BlockAssembler();
    const stream = new AssistantStreamAccumulator();
    const controller = thread.controller;
    let failure, timedOut = false, sawFinish = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, this.generationTimeoutMs);
    try {
      throwIfAborted(controller.signal);
      const messages = thread.session.deriveMessages();
      // Every model-visible value above comes exclusively from committed Session events.
      for await (const chunk of this.ctx.llm.stream({ ...thread.meta.model, messages, tools: [], signal: controller.signal, sessionId: thread.meta.id })) {
        if (controller.signal.aborted) break;
        const retained = stream.push({ time: this.now(), chunk });
        assembler.push(retained.chunk);
        if (chunk.type === 'finish') sawFinish = true;
        if (chunk.type === 'text-delta' || chunk.type === 'block-end') {
          thread.draftAssistant = assembler.interruptedBlocks().filter(b => b.type === 'text').map(b => b.text).join('\n');
          assert(thread.draftAssistant.length <= this.maxOutputChars, 'OUTPUT_TOO_LARGE', 'Response exceeded the output limit.');
          this.notify(thread);
        }
        assert(chunk.type !== 'tool-call-delta' && !(chunk.type === 'block-start' && chunk.blockType === 'tool-call') && !(chunk.type === 'block-end' && chunk.block.type === 'tool-call'), 'TOOLS_DISABLED', 'The model requested an unsupported tool call.');
      }
      if (!controller.signal.aborted) {
        assert(sawFinish, 'INCOMPLETE_STREAM', 'The provider stream ended without a completion marker.');
        const finish = assembler.finish;
        if (finish.kind === 'error') throw new BtwError(finish.failure?.code ?? 'MODEL_ERROR', finish.failure?.message ?? 'The model request failed.');
        if (finish.kind === 'aborted') throw new BtwError('MODEL_ABORTED', 'The provider interrupted this response.');
        if (finish.kind === 'tool-calls') throw new BtwError('TOOLS_DISABLED', 'The model requested an unsupported tool call.');
        if (finish.kind === 'max-tokens') throw new BtwError('MAX_TOKENS', 'The response reached the model output limit. Send a follow-up to continue.');
      }
    } catch (error) { failure = error; }
    finally { clearTimeout(timeout); }

    try {
      let reason;
      if (timedOut) reason = { kind: 'error', error: { code: 'TIMEOUT', message: 'Response timed out after 180 seconds. Try again.' } };
      else if (controller.signal.aborted) reason = { kind: 'aborted', reason: { kind: 'user' } };
      else if (failure) reason = { kind: 'error', error: { code: failure.code ?? 'MODEL_ERROR', message: errorMessage(failure) } };
      else reason = { kind: 'completed' };
      const blocks = (reason.kind === 'completed' ? assembler.blocks() : assembler.interruptedBlocks()).filter(b => b.type === 'text' && b.text.trim());
      if (blocks.length) {
        const message = createAssistantMessage({ content: blocks, source: { ...thread.meta.model } });
        thread.session.append('assistant/message', { turn, step: 1, message, stream: stream.snapshot(),
          ...(assembler.usage ? { usage: assembler.usage } : {}), ...(reason.kind !== 'completed' ? { interrupted: true } : {}),
        }, { surfaceOp: 'append' });
      } else {
        thread.session.append('assistant/attempt', { turn, step: 1, stream: stream.snapshot() });
        if (reason.kind === 'completed') reason = { kind: 'error', error: { code: 'EMPTY_RESPONSE', message: 'The provider returned no visible text.' } };
      }
      thread.session.append('step/end', { turn, step: 1 });
      thread.session.append('turn/end', { turn, reason });
      await this.commit(thread); // A completed UI state is published only after its durable settlement.
      thread.draftAssistant = '';
    } finally {
      thread.controller = null;
      this.notify(thread, true);
    }
  }

  dispose() {
    if (this.disposePromise) return this.disposePromise;
    this.closing = true;
    this.disposePromise = (async () => {
      // Stop generators and release long-polls before draining in-flight mutations.
      const stop = () => {
        for (const thread of this.threads.values()) {
          thread.controller?.abort(); clearTimeout(thread.notifyTimer);
          for (const wake of [...thread.waiters]) wake();
        }
      };
      stop();
      await Promise.allSettled([...this.operations]);
      stop(); // A create/send admitted before disposal may have finished its storage barrier.
      await Promise.allSettled([...this.pending]);
      stop();
      const results = await Promise.allSettled([...this.threads.values()].map(thread => thread.handle.close()));
      const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
      try { await this.domain.close(); } catch (error) { errors.push(error); }
      try { await this.disposePersistence?.(); } catch (error) { errors.push(error); }
      if (errors.length) throw new AggregateError(errors, 'BTW storage shutdown failed');
    })();
    return this.disposePromise;
  }
}

export function createRpcHandler(service) {
  return async (_endpoint, payload, signal, peer) => {
    if (peer?.principal?.kind !== 'owner') return { ok: false, error: { code: 'FORBIDDEN', message: 'BTW is available only to the authenticated Host owner.', details: {} } };
    if (_endpoint !== RPC_ENDPOINT) return { ok: false, error: { code: 'NOT_FOUND', message: 'Unknown BTW endpoint.', details: {} } };
    try { return { ok: true, value: await service.dispatch(payload, signal) }; }
    catch (error) { return { ok: false, error: { code: error.code ?? 'BTW_ERROR', message: errorMessage(error), details: {} } }; }
  };
}

export function registerTool(ctx, service, defineTool) {
  ctx.tools.register(defineTool({
    name: 'btw_chat',
    description: 'Ask follow-up questions about an answer in the current session. open needs that assistant messageId; get/send/stop/watch use the returned thread id. send starts a background response and accepts a caller-generated requestId for safe retries; use watch/get to read it.',
    parameters: {
      action: { type: 'string', required: true, enum: ['open', 'get', 'send', 'stop', 'watch', 'config', 'models'] },
      messageId: { type: 'string' }, threadId: { type: 'string' },
      text: { type: 'string' }, requestId: { type: 'string' },
      afterRevision: { type: 'integer' }, timeoutMs: { type: 'integer' },
      provider: { type: 'string' },
    },
    output: { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
    execute: async (args, exec) => {
      assert(exec.agent?.session?.id, 'NO_SESSION', 'BTW requires a calling agent session.');
      assert(!Object.hasOwn(args, 'settings') && !Object.hasOwn(args, 'ui'), 'FORBIDDEN', 'Change plugin options in BTW settings.');
      return service.dispatch({ ...args, sourceSessionId: exec.agent.session.id }, exec.signal);
    },
  }));
}

export async function apply(ctx) {
  const [session, llm, { defineTool }, { z }] = await Promise.all([
    import('@deepseek-ai/dsh-session'), import('@deepseek-ai/dsh-llm'), import('@deepseek-ai/dsh-tools'), import('zod'),
  ]);
  const privateRoot = await canonicalStorageRoot(ctx.dshHomePath('btw', 'sessions'));
  // rc.2 JSONL exposes its resolved root; refuse a custom main root that contains ours.
  const mainRoot = await canonicalStorageRoot(ctx.sessionPersistence.root ?? ctx.dshHomePath('sessions'));
  assert(!isWithin(mainRoot, privateRoot) && !isWithin(privateRoot, mainRoot), 'STORAGE_OVERLAP', 'BTW and main session roots must be separate.');
  const privateStore = await mountPrivatePersistence(privateRoot);
  let domain;
  try { domain = await ctx.storageDomain.open(domainSpec(z)); }
  catch (error) { await privateStore.dispose(); throw error; }
  const service = new BtwService(ctx, domain, { ...session, ...llm }, { persistence: privateStore.persistence, disposePersistence: privateStore.dispose });
  try {
    ctx.effect(() => () => service.dispose());
    ctx.provide('btw', service);
    // DSH 0.2.1-rc.2 rpc.handle captures the Connection provider's shadowed
    // context. Its underlying registration accepts the real caller explicitly,
    // retaining native admission, RPC framing and caller-owned route disposal.
    ctx.effect(() => ctx.connection.register(ctx, '/btw-rpc', createRpcHandler(service)));
    registerTool(ctx, service, defineTool);
  } catch (error) {
    // A failed mount may not receive a normal dispose event; release storage immediately.
    await service.dispose();
    throw error;
  }
}
export default { name, inject, apply };
