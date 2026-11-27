# Unofficial rebuild

The first prototype isolates cumulative meter delta calculation. Run `node --test test/meter-interval.test.js`. This prototype is not wired into the running adapter.

Next integration work: scaffold with `@iobroker/create-adapter`, subscribe to selected states, persist and migrate baselines, aggregate mutually exclusive meters, expose numeric states, and verify the full adapter before any release.
