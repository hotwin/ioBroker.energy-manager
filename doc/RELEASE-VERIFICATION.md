# Release verification policy

The official ioBroker test actions remain mandatory. See https://www.iobroker.com/docs/dev/adapterpublish.md and https://www.iobroker.com/docs/dev/adapternpm.md. This project policy is not an approval from the ioBroker maintainers.

- Preview: verify the exact SHA and package identity; a missing tag is expected before tagging.
- Prepublish: require the exact version tag, main ancestry, all platform tests and an unpublished npm version. For the one-time 0.6.1 migration only, independently verify npm latest is still 0.3.0-beta.8 before deferring the exact historical E2007/E2008/E3053 findings. The old release is not changed. W2002 is deferred only for the exact 0.6.1 versus 0.3.0-beta.8 mismatch under the same registry and identity conditions, in preview and prepublish only; it remains blocking after publication and in strict mode. W2004 is deferred only for the exact unpublished candidate. W4001 is expected until admission. Issues #39/#43 remain open for review of the workflow/changelog; their exact warnings are deferred only in this migration preview/prepublish phase.
- Postpublish: run the official checker again, require npm latest to equal 0.6.1 and reject the historical errors if still reported. W4001 is deferred for this first admission only. A failed post-check is visible as a failed workflow; do not claim admission or complete release verification.
- Strict: manual workflow dispatch reruns the checker without migration or admission deferrals.
- W0062 development tooling advisories are explicitly documented as follow-up; the current lint, package and integration tests remain mandatory. No unknown errors are suppressed. Checker failures, registry lookup failures, or identity mismatches block release.

Issue: https://github.com/hotwin/ioBroker.hotwin-energy-manager/issues/24
