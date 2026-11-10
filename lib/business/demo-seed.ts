import { createDemoDataset } from "./demo-fixtures.ts";
export type DemoSeedTarget = {
  id: string;
  environment: "DEVELOPMENT" | "TEST" | "STAGING" | "PRODUCTION";
  isolatedDemoDatabase: boolean;
  reviewedSchemaReady: boolean;
};
export interface DemoSeedAdapter {
  inspectTarget(): Promise<DemoSeedTarget>;
  transaction(
    work: (tx: {
      upsertDemoDataset: (
        scope: string,
        data: ReturnType<typeof createDemoDataset>,
      ) => Promise<void>;
    }) => Promise<void>,
  ): Promise<void>;
}
export function demoSeedPlan() {
  return {
    scope: "AIA_PHASE_A1_DEMO_V1",
    strategy:
      "Idempotent upsert by scoped DEMO identifiers; never overwrite unmarked records",
    dataset: createDemoDataset(),
  };
}
export async function seedApprovedDemoTarget(
  adapter: DemoSeedAdapter,
  approval: { approvedTargetId: string; explicitSeedApproval: boolean },
) {
  if (!approval.explicitSeedApproval || !approval.approvedTargetId)
    throw Error(
      "Explicit approval of a named isolated demo target is required.",
    );
  const target = await adapter.inspectTarget();
  if (
    target.id !== approval.approvedTargetId ||
    !["DEVELOPMENT", "TEST"].includes(target.environment) ||
    !target.isolatedDemoDatabase ||
    !target.reviewedSchemaReady
  )
    throw Error(
      "Demo seed target is not an approved, isolated Development/Test database with the reviewed schema.",
    );
  const plan = demoSeedPlan();
  await adapter.transaction((tx) =>
    tx.upsertDemoDataset(plan.scope, plan.dataset),
  );
}
