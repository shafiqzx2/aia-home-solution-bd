// PLAN ONLY. There is no database adapter in Phase A.1 and no CLI apply path.
import { demoSeedPlan } from "../lib/business/demo-seed.ts";
if (process.argv.includes("--apply"))
  throw Error(
    "Database seeding is unavailable. Review and approve an isolated target and implement/test its adapter in Phase B.",
  );
const plan = demoSeedPlan();
console.log(
  JSON.stringify(
    {
      scope: plan.scope,
      strategy: plan.strategy,
      counts: Object.fromEntries(
        Object.entries(plan.dataset).map(([key, rows]) => [key, rows.length]),
      ),
      databaseConnected: false,
      seedExecuted: false,
    },
    null,
    2,
  ),
);
