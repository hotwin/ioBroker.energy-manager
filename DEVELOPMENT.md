# Development

Run `npm ci`, `npm run lint`, `npm test`, `npm run test:integration` and `npm pack --dry-run`. The official integration suite uses a real ioBroker controller and a temporary object and state database. The official test tools require Node.js 22.19 or newer.

Edit the Admin dashboard in `admin/` and run `npm run sync:dashboard` to regenerate its optional Web adapter copy. CI verifies they match.

The [ioBroker Adapter Checker](https://www.iobroker.dev/adapter-check) checks repository and release requirements. It requires signing in. Follow the [ioBroker adapter development guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide) for repository submissions.

## Preliminary repository audit (2026-11-24)

Reviewed `45e1ec9` (0.3.0-beta.6) against the [ioBroker repository requirements](https://github.com/ioBroker/ioBroker.repositories/blob/master/README.md) and the linked developer guide.

- [CI run 45491226727](https://github.com/hotwin/ioBroker.energy-manager/actions/runs/45491226727) passed lint, dashboard synchronization, official package checks, package validation, and unit, integration and compact-mode tests on Node.js 22 and 24. An additional local run passed all 18 unit tests. The local npm pack dry run listed 20 entries. The adapter icon is a 256 × 256 RGBA PNG.
- The adapter creates the `info` channel and assigns explicit types and roles to read-only states. `info.connection` tracks the local collection cycle. A failed aWATTar request is logged and does not cause that state to become false by itself.
- Unload clears the polling timer, aborts the in-flight price fetch, awaits the pending operation and clears `info.connection`. The source review confirms the cleanup path. An integration test that deliberately unloads during a stalled fetch remains to be verified.
- Logging messages owned by the adapter are written in English. Errors from external calls are passed through. German and English assets are present. Translation coverage still needs a full UI review.
- The `www` directory serves the Web adapter dashboard. Investigate remaining documentation directories before removing any paths. The English README has inline release entries through beta.2 and links to the bilingual changelog, which lists beta.6. Consolidate the duplicated version history or keep both lists synchronized.
- The workflow currently validates the package on both supported Node.js versions. A comparison with a freshly generated Creator scaffold and its exact workflow template is still pending. Historical use of Creator has not been established.
- Official repochecker 5.24.3 was invoked against the development branch. Initialization failed with E0000/E9999 after a proxy timeout on the GitHub repository API. A successful checker run and resolution of any resulting findings remain pending.
- npm publication and granting the ioBroker organization package ownership require the corresponding account authorization.
