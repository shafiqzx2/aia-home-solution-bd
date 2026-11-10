export const permissionActions = [
  "view",
  "create",
  "edit",
  "publish",
  "approve",
  "issue",
  "send",
  "export",
  "archive",
  "manage",
] as const;
export const permissionResources = [
  "products",
  "services",
  "inventory",
  "requests",
  "quotations",
  "sales",
  "payments",
  "documents",
  "email",
  "content",
  "reports",
  "company",
  "staff",
  "roles",
  "system",
] as const;
export type MatrixScope =
  `${(typeof permissionResources)[number]}.${(typeof permissionActions)[number]}`;
export type DemoRole = {
  id: string;
  name: string;
  kind: "SUPER_ADMIN" | "ADMIN" | "STAFF";
  scopes: MatrixScope[];
};
const scopes = (resources: readonly string[], actions: readonly string[]) =>
  resources.flatMap((r) => actions.map((a) => `${r}.${a}` as MatrixScope));
export function initialDemoRoles(): DemoRole[] {
  return [
    {
      id: "DEMO-ROOT",
      name: "Root Admin",
      kind: "SUPER_ADMIN",
      scopes: scopes(permissionResources, permissionActions),
    },
    {
      id: "DEMO-CONTENT",
      name: "Content Admin",
      kind: "ADMIN",
      scopes: scopes(
        ["products", "services", "content"],
        ["view", "create", "edit", "publish", "export"],
      ),
    },
    {
      id: "DEMO-PRODUCT",
      name: "Product Staff",
      kind: "STAFF",
      scopes: scopes(["products", "inventory"], ["view", "create", "edit"]),
    },
    {
      id: "DEMO-OPERATIONS",
      name: "Operations Staff",
      kind: "STAFF",
      scopes: scopes(["requests", "services"], ["view", "create", "edit"]),
    },
    {
      id: "DEMO-ACCOUNTS",
      name: "Accounts Staff",
      kind: "STAFF",
      scopes: scopes(
        ["quotations", "sales", "payments", "documents"],
        ["view", "create", "edit", "export"],
      ),
    },
  ];
}
export function assertRoleChange(
  actor: DemoRole | null,
  before: DemoRole,
  after: DemoRole,
) {
  if (!actor || actor.kind !== "SUPER_ADMIN")
    throw new Error(
      "Only the Root Admin review profile may change this matrix. Live server access remains disabled.",
    );
  if (before.kind === "SUPER_ADMIN" || after.kind === "SUPER_ADMIN")
    throw new Error(
      "Root Admin is provisioned separately and cannot be edited through this matrix.",
    );
  const allowed = new Set(scopes(permissionResources, permissionActions));
  if (after.scopes.some((s) => !allowed.has(s)))
    throw new Error("Unknown permission scope.");
}
