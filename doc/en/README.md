# Energy Manager setup

The adapter ID is now `hotwin-energy-manager`. ioBroker creates a new instance for it. Existing settings and consumption history stay with the old instance.

1. In ioBroker Admin, create a function enum called **Strommessung** or **Energy measurement**.
2. Add supported numeric measurement states, their channel, or their device. Use **W** or **kW** for live power and cumulative **Wh** or **kWh** to record consumption. Group a meter’s power and energy states under the same channel where possible.
3. Assign the devices to rooms through ioBroker room enums. Manually configured room names override the assignment. Existing Shelly meter discovery can be disabled in the instance settings.
4. Enable the Energy Manager instance and open its tab in Admin. An optional copy of the dashboard is served from `/hotwin-energy-manager/index.html` by the Web adapter. Use its integrated socket with WebSockets enabled.
5. Enter net contract components and VAT in the instance settings. Verify the components before enabling the calculated gross rate.

The adapter records energy from cumulative meter differences. Counter resets, long gaps and intervals crossing midnight establish a new baseline. It does not reconstruct history predating installation or estimate consumption from live power. If the price slot or tariff changes between samples, the energy is counted and its cost remains unassigned. Statistics display recorded variable cost and priced energy. Monthly fixed charges and the advance are shown separately under Electricity contract. aWATTar prices are a market reference for Germany, so verify that they match the index used by your provider.

Exclude overlapping sub-meters or main meters in the manually configured sources to avoid double counting. Devices with ambiguous state layouts can be assigned manually. The adapter keeps up to 400 daily records in ioBroker.
