// Business adapter for rc.2's registered ModelSelect presentation component.
// Never instantiate the main Session ModelDirectory or call session.selectModel.
export class BtwModelDirectory {
  constructor({ rpc, sourceSessionId, thread, onSaved, followLabel }) {
    Object.assign(this, { rpc, sourceSessionId, thread, onSaved, followLabel });
    this.followProvider = `btw-follow:${globalThis.crypto.randomUUID()}`;
    this.listeners = new Set(); this.disposed = false; this.generation = 0;
    this.state = { current:this.current(), groups:[], failures:[], status:'idle', pending:null, error:null, routable:null };
    this.publish({ groups:this.withRetained([]) });
  }
  current() {
    return this.thread.modelSettings?.mode === 'follow'
      ? { provider:this.followProvider, model:'source' } : { ...this.thread.model };
  }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  getSnapshot() { return this.state; }
  publish(patch) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  withRetained(groups) {
    const result = groups.filter(group => group.id !== this.followProvider).map(group => ({ ...group, models:[...group.models] }));
    const route = this.thread.model;
    let group = result.find(group => group.id === route.provider);
    if (!group) { group = { id:route.provider, name:route.provider, models:[] }; result.push(group); }
    if (!group.models.some(model => model.id === route.model)) group.models.push({ id:route.model, name:route.model });
    const source = this.thread.sourceModel ?? (this.thread.modelSettings?.mode === 'follow' ? route : null);
    const sourceName = source && result.find(group => group.id === source.provider)?.models.find(model => model.id === source.model)?.name;
    result.push({ id:this.followProvider, name:this.followLabel, models:[{ id:'source', name:sourceName || source?.model || this.followLabel }] });
    return result;
  }
  setThread(thread) {
    if (this.disposed || thread.id !== this.thread.id || thread.revision < this.thread.revision) return;
    const before = JSON.stringify(this.current());
    this.thread = thread;
    if (before !== JSON.stringify(this.current())) this.publish({ current:this.current(), groups:this.withRetained(this.state.groups) });
  }
  async load() {
    this.loading?.abort();
    const controller = new AbortController(); this.loading = controller;
    const generation = this.generation;
    this.publish({ status:this.state.pending ? 'selecting' : 'loading', error:null });
    try {
      const config = await this.rpc('config', { sourceSessionId:this.sourceSessionId, threadId:this.thread.id }, controller.signal);
      const groups = [], failures = [];
      const results = await Promise.allSettled((config.providers || []).map(async provider => {
        const result = await this.rpc('models', { provider:provider.id }, controller.signal);
        return { id:provider.id, name:provider.name || provider.id,
          models:(result.models || []).map(model => ({ id:model.id, name:model.name || model.id })) };
      }));
      if (this.disposed || controller.signal.aborted) return;
      results.forEach((result, index) => result.status === 'fulfilled' ? groups.push(result.value)
        : failures.push({ id:config.providers[index].id, name:config.providers[index].name || config.providers[index].id, message:result.reason?.message || String(result.reason) }));
      if (generation === this.generation && !this.state.pending && config.thread?.revision >= this.thread.revision) {
        this.thread = { ...config.thread, modelSettings:config.settings };
      }
      this.publish({ groups:this.withRetained(groups), failures, current:this.current(), status:this.state.pending ? 'selecting' : 'ready', routable:true });
    } catch (error) {
      if (!controller.signal.aborted) this.publish({ status:this.state.pending ? 'selecting' : 'error', error:error.message });
    }
  }
  async select(selection) {
    if (this.disposed) return;
    if (this.thread.status === 'running' || this.state.pending) return { ok:false, error:{ code:'THREAD_BUSY', message:'Stop or wait for the current reply before changing its model.' } };
    // The follow entry is UI-only; its synthetic identity never reaches the Host.
    const settings = selection.provider === this.followProvider && selection.model === 'source'
      ? { mode:'follow' } : { mode:'fixed', provider:selection.provider, model:selection.model };
    this.generation++;
    this.publish({ status:'selecting', pending:selection, error:null });
    try {
      const result = await this.rpc('config', { sourceSessionId:this.sourceSessionId, threadId:this.thread.id, settings });
      if (this.disposed) return;
      if (!result.thread || result.thread.id !== this.thread.id) throw new Error('Model save returned no matching BTW thread.');
      this.thread = { ...result.thread, modelSettings:result.settings };
      this.publish({ current:this.current(), groups:this.withRetained(this.state.groups), pending:null, status:'ready', error:null });
      this.onSaved(result.thread);
      return { ok:true, value:undefined };
    } catch (error) {
      this.publish({ status:'error', pending:null, error:error.message });
      return { ok:false, error:{ code:error.code || 'BTW_ERROR', message:error.message } };
    }
  }
  dispose() { this.disposed = true; this.loading?.abort(); this.listeners.clear(); }
}
