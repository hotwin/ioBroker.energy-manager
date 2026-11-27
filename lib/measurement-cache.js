'use strict';

class MeasurementCache {
    constructor(adapter) {
        this.adapter = adapter;
        this.objects = new Map();
        this.lists = new Map();
        this.states = new Map();
        this.initialReads = new Map();
        this.requested = new Set();
    }

    get config() {
        return this.adapter.config;
    }

    invalidate(id) {
        const relevant = this.objects.has(id) || [...this.lists.keys()].some(pattern =>
            id.startsWith(pattern.slice(0, -1)));
        if (!relevant) return;
        this.objects.clear();
        this.lists.clear();
    }

    update(id, state) {
        if (this.states.has(id)) this.states.set(id, state);
    }

    getForeignObjectAsync(id) {
        if (!this.objects.has(id)) this.objects.set(id, this.adapter.getForeignObjectAsync(id));
        return this.objects.get(id).catch(error => {
            this.objects.delete(id);
            throw error;
        });
    }

    getForeignObjectsAsync(pattern, type) {
        if (!this.lists.has(pattern)) this.lists.set(pattern, this.adapter.getForeignObjectsAsync(pattern, type));
        return this.lists.get(pattern).catch(error => {
            this.lists.delete(pattern);
            throw error;
        });
    }

    getForeignStateAsync(id) {
        this.requested.add(id);
        if (this.initialReads.has(id)) return this.initialReads.get(id);
        if (this.states.has(id)) return Promise.resolve(this.states.get(id));
        const pending = this.subscribeAndRead(id).finally(() => this.initialReads.delete(id));
        this.initialReads.set(id, pending);
        return pending;
    }

    async subscribeAndRead(id) {
        this.states.set(id, undefined);
        try {
            await this.adapter.subscribeForeignStatesAsync(id);
            const state = await this.adapter.getForeignStateAsync(id);
            if (this.states.get(id) === undefined) this.states.set(id, state ?? null);
            return this.states.get(id);
        } catch (error) {
            this.states.delete(id);
            await this.adapter.unsubscribeForeignStatesAsync(id).catch(() => {});
            throw error;
        }
    }

    async finish() {
        const obsolete = [...this.states.keys()].filter(id => !this.requested.has(id));
        if (obsolete.length) {
            await this.adapter.unsubscribeForeignStatesAsync(obsolete);
            for (const id of obsolete) this.states.delete(id);
        }
    }
}

module.exports = MeasurementCache;
