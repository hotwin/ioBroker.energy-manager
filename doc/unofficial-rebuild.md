# Unofficial rebuild

The first prototype isolates cumulative meter delta calculation. Run `node --test test/meter-interval.test.js`. This prototype is not wired into the running adapter.

Next integration work: scaffold with `@iobroker/create-adapter`, subscribe to selected states, persist and migrate baselines, aggregate mutually exclusive meters, expose numeric states, and verify the full adapter before any release.

The source subscription prototype accepts resolved state IDs, subscribes before initial reads, and discards older readings. Wire object and enum subscriptions to source discovery and call reconciliation when those objects or instance configuration change. Run `node --test test/source-subscriptions.test.js`.
