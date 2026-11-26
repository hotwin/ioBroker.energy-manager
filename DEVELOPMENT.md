# Development

Run `npm ci`, `npm run lint`, `npm test`, `npm run test:integration` and `npm pack --dry-run`. The official integration suite uses a real ioBroker controller and a temporary object and state database. The official test tools require Node.js 22.19 or newer.

Edit the Admin dashboard in `admin/` and run `npm run sync:dashboard` to regenerate its optional Web adapter copy. CI verifies they match.

The [ioBroker Adapter Checker](https://www.iobroker.dev/adapter-check) checks repository and release requirements. It requires signing in. Follow the [ioBroker adapter development guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide) for repository submissions.

## Preliminary repository audit (2026-11-24)

Reviewed `45e1ec9` (0.3.0-beta.6) against the [ioBroker repository requirements](https://github.com/ioBroker/ioBroker.repositories/blob/master/README.md) and the linked developer guide.

- [CI run 45491226727](https://github.com/hotwin/ioBroker.hotwin-energy-manager/actions/runs/45491226727) passed lint, dashboard synchronization, official package checks, package validation, and unit, integration and compact-mode tests on Node.js 22 and 24. An additional local run passed all 18 unit tests. The local npm pack dry run listed 20 entries. The adapter icon is a 256 × 256 RGBA PNG.
- The adapter creates the `info` channel and assigns explicit types and roles to read-only states. `info.connection` tracks the local collection cycle. A failed aWATTar request is logged and does not cause that state to become false by itself.
- Unload clears the polling timer, aborts the in-flight price fetch, awaits the pending operation and clears `info.connection`. The source review confirms the cleanup path. An integration test that deliberately unloads during a stalled fetch remains to be verified.
- Logging messages owned by the adapter are written in English. Errors from external calls are passed through. German and English assets are present. Translation coverage still needs a full UI review.
- The `www` directory serves the Web adapter dashboard. Investigate remaining documentation directories before removing any paths. The English README has inline release entries through beta.2 and links to the bilingual changelog, which lists beta.6. Consolidate the duplicated version history or keep both lists synchronized.
- The workflow currently validates the package on both supported Node.js versions. A comparison with a freshly generated Creator scaffold and its exact workflow template is still pending. Historical use of Creator has not been established.
- Official repochecker 5.24.3 was invoked against the development branch. Initialization failed with E0000/E9999 after a proxy timeout on the GitHub repository API. A successful checker run and resolution of any resulting findings remain pending.
- npm publication and granting the ioBroker organization package ownership require the corresponding account authorization.

### Repository Checker follow-up

Repository Checker 5.24.3 completed against `f599957`. Its CLI returned `OK` but still listed 25 errors, so this is not a clean repository check.

- Package metadata: redundant Mocha dependency (E0063), nine missing metadata and Admin translation locales (E1027, E1034, E1054, E5010), and more than seven release-news entries (E1032).
- GitHub Actions: align concurrency, job dependencies, deployment and the Node.js/OS test matrix with the current template (E3009, E3012, E3014, E3025, E3027). The checker could not retrieve the job logs for run 45495429792.
- Release and repository settings: npm package missing (E2000), beta.6 tag missing (E3032), author and copyright email metadata missing (E4048, E4050, E4051), and repository topics missing (E8002).
- The inline README changelog now includes beta.6 (commit `af06c72`, addressing W6030). The separate changelog still triggers W6017 and W6032; consolidate the layout before the final repository check.

## npm Trusted Publishing

Configure npm Trusted Publishing for `iobroker.hotwin-energy-manager`, owner `hotwin`, repository `ioBroker.hotwin-energy-manager`, workflow `test-and-release.yml`, environment `npm-beta`. No npm token is required. The official ioBroker deploy action uses the npm `next` dist-tag for prereleases and the default tag for stable versions. Enable immutable GitHub releases before publication. Configure the environment to permit approved version tags and restrict deployment to maintainers where supported.

## Standard release procedure

Use the standard ioBroker testing actions and the existing @alcalzone/release-script plugins. The release script must run on main; verify changelog entries, version and tag before publishing. The standard tag-triggered workflow performs check/lint, unit, integration and compact-mode tests across Node.js 22/24/26 and Linux/Windows/macOS. The repository checker is an additional release gate; its tagged candidate must belong to main. A manual workflow dispatch runs validation only, not publication. Never create a release tag merely to test npm authentication. The official deploy action creates the npm publication and GitHub release. Do not edit a GitHub release after npm publication. The npm tarball is the canonical package; separate custom archive publishing is no longer part of this workflow.

## Repository Checker

Use the official checker on the exact candidate SHA and document all findings. The checker job uses the official checkout and existing wrapper; no new findings are suppressed. External prerequisites (npm ownership, historical tags, incorrect latest dist-tag and repository admission) must be resolved before publishing. The existing full-SHA-only policy is incompatible with the official composite actions, as stated by the ioBroker maintainer in issue #39. The repository owner disabled the mandatory full-SHA policy on 2026-11-25. The official workflow passed all nine platform combinations in run 45703898371. Retain read-only default workflow permissions and scope write permissions to deploy.

The release workflow is intentionally tested before creating any version tag. Keep the development branch and the 0.4 roadmap separate until the approved 0.3 candidate is integrated and tested.


Historical bilingual release notes are retained in [doc/RELEASE-HISTORY.md](doc/RELEASE-HISTORY.md). The root README and changelog archive are English only. User documentation is in doc/en and doc/de; existing beta.12 screenshots are preserved under doc/screenshots.
