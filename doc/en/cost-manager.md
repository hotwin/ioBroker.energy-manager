# Cost manager (0.4 beta)

The read-only string state `hotwin-energy-manager.N.costSummary` contains JSON with recorded today/month/year energy, variable costs, priced energy, coverage (0–1 or null), fixed monthly charge, advance, forecast and seven-day records. Missing values are null, not zero. The snapshot includes the same object under costs. Monetary values are EUR; energy is kWh.

Monthly and annual forecasts are run-rate estimates from the last 30 days, excluding today. At least seven recorded days and 95% priced-energy coverage are required for cost estimates; recorded days may be incomplete. Assumes unchanged current fixed charges, usage and prices. Annual forecast represents a full-year run rate, not a settlement balance or a projection of actual historical annual payments. Fixed charges and advances are separated from recorded variable costs. Alternative-rate comparisons cover the same priced energy and exclude fixed charges. Budget and alternative rate are stored in the browser per instance. CSV exports recorded daily totals only.

Not included yet: new provider APIs, per-device actual priced costs, billing period reconciliation, notifications, investment payback and other roadmap versions. See issue #19.
