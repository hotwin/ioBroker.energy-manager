# Release archive / Release-Archiv

## Inventory / Bestand am 25. November 2026

GitHub hatte noch keine Tags und keine öffentlichen Releases. npm führte für `iobroker.hotwin-energy-manager` zwei Versionen. `0.0.0-stage` ist laut npm-Metadaten ein Platzhalter. `0.3.0-beta.8` steht derzeit sowohl unter `beta` als auch unter `latest`. Die Einträge unten dokumentieren die verfügbaren Installationspakete. Die historischen Pakete warten auf eine getrennte Archivprüfung und gelten durch diesen Eintrag nicht als neu freigegeben.

GitHub had no tags or public releases. npm listed two versions of `iobroker.hotwin-energy-manager`. npm describes `0.0.0-stage` as a staging placeholder. Both the `beta` and `latest` tags currently point to `0.3.0-beta.8`. The entries below document available installation packages. Historical packages require a separate archive review.

| Version | Provenance / Herkunft | SHA-256 | Version-bound package / Versionsgebundenes Paket |
| --- | --- | --- | --- |
| `0.3.0-beta.8` | npm package. npm `gitHead` is `99ea8fd79d502ae6041b490f9a5be7795ac007b1`. | `1fb02e412b8bd4e1832e5c3c43d994973c82a6aa30b80bd91aea28f10596dabd` | [npm .tgz](https://registry.npmjs.org/iobroker.hotwin-energy-manager/-/iobroker.hotwin-energy-manager-0.3.0-beta.8.tgz) |
| `0.3.0-beta.11` | PR #17 package commit `9fb87665ceb1c25d7eb084f1c6cac11def67d0bb`. Source `5cbd8069dc40fcdd270c2323f1a1f0dec3df15ad`. | `caf3a4e2de864edaf6222ac6542fbb319b39ba5a4af7e5480036e784cf323d92` | [GitHub .tgz](https://raw.githubusercontent.com/hotwin/ioBroker.energy-manager/9fb87665ceb1c25d7eb084f1c6cac11def67d0bb/iobroker.hotwin-energy-manager-0.3.0-beta.11.tgz) |
| `0.3.0-beta.12` | PR #18 package commit `0e7e673ff7a80ce0f51bd80deee1cb70b80a6e4c`. Source `e2ea47a7535b258b20f94c971bf17a593937f8de`. Installation confirmed in #23. | `6058c706e7b08eab3db9a38c12fa6c0470d09c358c062c2b303c269708d21a44` | [GitHub .tgz](https://raw.githubusercontent.com/hotwin/ioBroker.energy-manager/0e7e673ff7a80ce0f51bd80deee1cb70b80a6e4c/iobroker.hotwin-energy-manager-0.3.0-beta.12.tgz) |

All files in these archives matched their source Git trees byte for byte. Git records versions `0.1.0`, `0.2.0`, `0.2.1` and `0.3.0-beta.1` through `0.3.0-beta.10`. A version in Git is evidence of a build candidate. The table lists available adapter packages with verified provenance. Beta 13 and 14 are development candidates. Earlier entries under `iobroker.energy-manager` used a different adapter ID. Keep the original package and commit when documenting them.

## Planned publication workflow / Geplanter Ablauf

1. Select an approved development candidate by full commit SHA. Match the version in `package.json`, `package-lock.json`, `io-package.json` and the DE/EN changelog. For an existing `v<version>` tag, resolve its commit and stop on mismatch.
2. Run lint, dashboard parity, npm pack dry-run, the official package suite, and the unit, integration and Compact Mode tests on Node.js 22 and 24. If the official checker requires tag-triggered evidence, create the candidate tag at that SHA after approval and let the tag CI finish before evaluating the checker. The tag alone does not publish anything. Require the official Repository Checker report for the same commit and package. Link the test and checker runs in the release issue and release notes.
3. Build one `.tgz` from the same SHA for both registries and record its SHA-256. Inspect its package name and version and smoke-test installation from the tarball. Stage the binary and its `.sha256` file on a draft GitHub release. Include bilingual release notes, the commit, linked checks and installation/rollback instructions. Use GitHub immutable releases to protect the published tag and assets.
4. Require the release approval before publication. Publish the existing tarball to npm under `beta` for a beta, `rc` for a release candidate or `latest` for a stable version. Mark beta/RC GitHub releases as pre-releases. Verify the npm tarball's hash against the GitHub artifact before making the draft public.
5. Serialize publication across versions, since they share npm dist-tags. On retry, verify the tag target and hashes for any existing package or draft. Resume only if they match. Stop on any mismatch. Give test and build jobs read-only access, the publishing step GitHub release write access, and the npm publishing step access to its protected environment. Pin Actions to reviewed commit SHAs.

For historical archives, retain the existing package bytes and checksum, prove the version-to-commit mapping, and label the result as historical with the checks actually available. For releases without a verified package or unique source, keep the evidence in the inventory until provenance is established. Existing tags and npm dist-tags are separate operations. Review any historical correction before changing a public channel. [GitHub documentation on immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases)

## Rollback / Rückkehr zu einer früheren Version

1. Erstelle mit `iobroker backup` eine aktuelle Sicherung. Bewahre zusätzlich die Sicherung vor dem Upgrade und eine Kopie des zuletzt installierten Pakets auf.
2. Prüfe die Release-Hinweise für die Zielversion auf kompatible Adapterkennung, Einstellungen und Datenschema. Ein Versionswechsel stellt Einstellungen oder Messhistorie nicht wieder her. Falls das ältere Schema eine Wiederherstellung verlangt, prüfe die Sicherung vorab auf einer Testinstanz.
3. Deaktiviere die betroffene Instanz. Verwende im Expertenmodus von ioBroker Admin **Aus eigener URL installieren** mit der festen Download-URL des gewünschten Tags oder der exakten URL in der Tabelle. Vergleiche vorher die SHA-256-Prüfsumme, beispielsweise mit `sha256sum <paket>.tgz`.
4. Aktiviere die Instanz erst nach Prüfung der Einstellungen. Prüfe Hauptzähler, Tarif und vorhandene Historie. Stelle bei Bedarf die passende Sicherung gezielt wieder her. Der Ablauf löscht keine Adapterdaten automatisch.

For a rollback, back up the current installation and preserve the pre-upgrade backup. Check the target release's adapter ID and schema, disable the affected instance, verify the package checksum and install from the exact version-bound URL. Restore a compatible backup only when needed and then confirm the meter, tariff and history.
