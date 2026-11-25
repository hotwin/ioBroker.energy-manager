# Energy Manager setup

The adapter ID is now `hotwin-energy-manager`. ioBroker creates a new instance for it. Existing settings and consumption history stay with the old instance.

1. In ioBroker Admin, create a function enum called **Strommessung** or **Energy measurement**.
2. Add supported numeric measurement states, their channel, or their device. Use **W** or **kW** for live power and cumulative **Wh** or **kWh** to record consumption. Group a meter’s power and energy states under the same channel where possible.
3. Assign the devices to rooms through ioBroker room enums. Manually configured room names override the assignment. Existing Shelly meter discovery can be disabled in the instance settings.
4. Enable the Energy Manager instance and open its tab in Admin. An optional copy of the dashboard is served from `/hotwin-energy-manager/index.html` by the Web adapter. Use its integrated socket with WebSockets enabled.
5. Enter net contract components and VAT in the instance settings. Verify the components before enabling the calculated gross rate.

The adapter records energy from cumulative meter differences. Counter resets, long gaps and intervals crossing midnight establish a new baseline. It does not reconstruct history predating installation or estimate consumption from live power. If the price slot or tariff changes between samples, the energy is counted and its cost remains unassigned. Statistics display recorded variable cost and priced energy. Monthly fixed charges and the advance are shown separately under Electricity contract. aWATTar prices are a market reference for Germany, so verify that they match the index used by your provider.

Exclude overlapping sub-meters or main meters in the manually configured sources to avoid double counting. Devices with ambiguous state layouts can be assigned manually. The adapter keeps up to 400 daily records in ioBroker.

Select separate main-meter states for power (W or kW) and a cumulative reading (Wh or kWh). The overview distinguishes an unconfigured meter reading from an invalid one. Enable “Show unassigned power” only when all included power meters are downstream of the main meter and do not overlap. The difference requires valid power readings no more than 60 seconds old and no more than 30 seconds apart, with no duplicate states (including ioBroker aliases).

`info.connection` indicates whether the last local collection cycle succeeded. `info.awattarAvailable` indicates whether an aWATTar spot price is available for the current interval. During an API outage, a cached price can remain available until its interval ends. Failed requests are retried after a delay of between one and 15 minutes.

### Import from a legacy instance

Starting with the beta.9 development version, the optional host command copies settings, tariff details, device aliases and recorded consumption from an installed `energy-manager` instance to an installed `hotwin-energy-manager` instance. It copies daily, hourly, device and price history when present. The renamed instance starts with a fresh meter baseline.

1. Disable both instances in ioBroker Admin and wait for them to stop. Keep the old instance installed. Use the ioBroker host account and run from the installation directory (usually `/opt/iobroker`). On a multihost system, run the migration only on the target instance's host. Keep both instances disabled and avoid concurrent configuration edits during migration.
2. Run the preview. Replace `0` on either side with the actual instance number. The output shows the fields that would change, the history on each side and any target data that would be replaced.

   ```bash
   node node_modules/iobroker.hotwin-energy-manager/lib/migrate-legacy.js --from 0 --to 0
   ```

3. Create an ioBroker backup with `iobroker backup`. To apply, run the following command. Choose a new backup filename in a private directory. The command writes a private snapshot of both instances before changing the target.

   ```bash
   node node_modules/iobroker.hotwin-energy-manager/lib/migrate-legacy.js --from 0 --to 0 --apply --backup ./energy-migration-backup.json
   ```

   If the preview reports a conflict, add `--overwrite` only if you want to replace the listed target settings and, when flagged, the target's entire history. Histories are copied as a whole. The command never changes the legacy instance or its data.

4. After a successful import, enable the new instance and check the contract, aliases and statistics in Admin. Keep the old instance and both backups until you have verified the result.

If the command reports a partial failure, leave both instances disabled and run the preview again. An already copied setting or ledger is skipped on retry. Keep the original backup and use a new backup filename for each apply. You can recover the previous installation state from the ioBroker backup. If a killed process left `iobroker-data/.hotwin-energy-manager-migration.lock` behind, remove that file only after verifying that no migration is running.
