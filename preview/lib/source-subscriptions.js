'use strict';

// Call reconcile serially at startup and when source configuration changes.
function sourceSubscriptions(adapter, onReading) {
    const active = new Map();

    function stateChange(id, state) {
        if (!active.has(id)) return;
        const latest = active.get(id);
        if (state && (!Number.isFinite(state.ts) || (latest && state.ts < latest.ts))) return;
        active.set(id, state);
        onReading(id, state);
    }

    async function reconcile(ids) {
        const wanted = new Set(ids);
        for (const id of active.keys()) {
            if (wanted.has(id)) continue;
            await adapter.unsubscribeForeignStatesAsync(id);
            active.delete(id);
            onReading(id, null);
        }
        for (const id of wanted) {
            if (active.has(id)) continue;
            active.set(id, undefined);
            try {
                await adapter.subscribeForeignStatesAsync(id);
            } catch (error) {
                active.delete(id);
                throw error;
            }
        }
        for (const id of wanted) {
            if (active.get(id) !== undefined) continue;
            const initial = await adapter.getForeignStateAsync(id);
            if (active.get(id) === undefined || initial) stateChange(id, initial);
        }
    }

    return { reconcile, stateChange };
}

module.exports = { sourceSubscriptions };
