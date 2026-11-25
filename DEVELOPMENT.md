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

### Repository Checker follow-up

Repository Checker 5.24.3 completed against `f599957`. Its CLI returned `OK` but still listed 25 errors, so this is not a clean repository check.

- Package metadata: redundant Mocha dependency (E0063), nine missing metadata and Admin translation locales (E1027, E1034, E1054, E5010), and more than seven release-news entries (E1032).
- GitHub Actions: align concurrency, job dependencies, deployment and the Node.js/OS test matrix with the current template (E3009, E3012, E3014, E3025, E3027). The checker could not retrieve the job logs for run 45495429792.
- Release and repository settings: npm package missing (E2000), beta.6 tag missing (E3032), author and copyright email metadata missing (E4048, E4050, E4051), and repository topics missing (E8002).
- The inline README changelog now includes beta.6 (commit `af06c72`, addressing W6030). The separate changelog still triggers W6017 and W6032; consolidate the layout before the final repository check.

## First npm beta from GitHub Actions

The Test and Release workflow includes a manual beta publish option. GitHub requires the workflow to be on the default branch before the manual option is available. The workflow is available on the default branch. The publish job runs only when explicitly requested on `develop/0.3.0-beta.1` and after lint, package validation, both adapter test matrix jobs and the official Repository Checker succeed. A push, tag, or GitHub Release does not trigger npm publishing through this job.

1. Create the GitHub Actions environment `npm-beta`. Allow deployments from the development branch and store a short-lived granular npm token as the environment secret `NPM_TOKEN`. The token must permit creating the unscoped package and have Bypass 2FA enabled. Keep the token in GitHub Secrets.
2. Under **Actions → Test and Release → Run workflow**, select the development branch. First run with the publish checkbox cleared to exercise validation only. Verify the version and select the publish checkbox only when ready to release.
3. Confirm the published version with `npm view iobroker.hotwin-energy-manager@beta version`. Revoke the bootstrap token after use. Subsequent releases can use npm Trusted Publishing after configuring an OIDC workflow and its npm package settings.


## Prepare a beta with the ioBroker release script

The `release` npm script uses the ioBroker Creator plugin configuration (ioBroker, license, manual review). Run it from an up-to-date development branch. The manual npm workflow remains the publication gate. Version tags trigger CI validation without publishing.

1. Add a `## **WORK IN PROGRESS**` section at the top of `CHANGELOG.md` with both German and English entries. Add the localized release summary under `common.news.NEXT` in `io-package.json` so the script can reuse the supplied text without calling a translation service. Commit the release notes.
2. Run `npm run release prerelease beta -- --dry`. Review the next version and proposed tag. The script updates the npm manifest and lockfile, adapter metadata, and bilingual changelog together during a real release.
3. When approved, run `npm run release prerelease beta` and review the resulting changes at the manual review prompt. Verify the tagged commit's CI results before requesting publication through the manual workflow above.

The Developer Portal reads the default branch. Its detection can be verified after this configuration is approved for the default branch. Release preparation is scoped to development branches. The portal must support targeting a development branch for execution with this configuration.

## Repository Checker release gate

For every beta and stable candidate, let the tag-triggered tests finish, then dispatch **Test and Release** for the same revision with **Run the official repository gate for this candidate** enabled and npm publishing disabled. Record the workflow URL, reported commit and npm package in the release issue, and review the findings before creating the GitHub Release or dispatching npm publication. The npm publishing job also runs the checker and requires it to pass.

The workflow pins the official ioBroker Repository Checker. Version 5.24.3 exposes its checks through `index.js`. The wrapper uses its structured report to verify the SHA, npm name, adapter name, checker completion, errors and unresolved warnings. The SHA-specific W3031 branch lookup is documented by the wrapper because CI verifies the exact revision independently. The checker can also be run from the adapter checkout with `node scripts/check-repository.js /path/to/ioBroker.repochecker` after installing the checker's dependencies. The candidate must be available on GitHub at the local checkout's SHA.

A tag, package registration and ioBroker repository admission are separate steps. For initial admission, record the approval and applicable checker findings in a GitHub issue or pull request and supply its URL in the dispatch input `admission_issue`. The gate records the URL and actual deferred findings. It only defers W4001 for this adapter or E2000 for this exact package if the public npm registry independently confirms that the package does not exist. The transport, report, SHA and package identity must verify even during admission. Unpublish notices and other findings still block release. Run the gate again after publication or admission, with the exception removed when it no longer applies.
