import type { IconName } from "../../components/ui/icon";

export type ModuleState = "Local tool" | "Demo view" | "Planned";
export type WorkspaceModule = {
  id: string;
  label: string;
  icon: IconName;
  state: ModuleState;
  phase: "A.1" | "B" | "C" | "D";
};
type Group = {
  id: string;
  label: string;
  icon: IconName;
  modules: WorkspaceModule[];
};
const m = (
  id: string,
  label: string,
  icon: IconName,
  state: ModuleState = "Planned",
  phase: WorkspaceModule["phase"] = "D",
): WorkspaceModule => ({ id, label, icon, state, phase });
export const moduleGroups: Group[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "dashboard",
    modules: [
      m("dashboard", "Executive Dashboard", "dashboard", "Demo view", "A.1"),
      m("notifications", "Notifications", "bell"),
      m("activities", "Activities", "activity"),
      m("tasks", "Tasks", "clipboard"),
    ],
  },
  {
    id: "sales",
    label: "Sales & customers",
    icon: "wallet",
    modules: [
      m("customers", "Customers / CRM", "users", "Demo view", "A.1"),
      m("requests", "Guest Requests", "clipboard", "Demo view", "A.1"),
      m("consultations", "Consultations", "calendar"),
      m("quotation-register", "Quotations", "file", "Demo view", "A.1"),
      m("sales-memos", "Sales Memos", "receipt", "Demo view", "A.1"),
      m("invoices", "Invoices", "file", "Demo view", "A.1"),
      m("payments", "Payments & Receipts", "wallet", "Demo view", "A.1"),
      m("orders", "Orders / Sales Records", "box", "Demo view", "A.1"),
      m("returns", "Returns / Adjustments", "swap", "Planned", "C"),
      m("bookings", "Bookings", "calendar", "Demo view", "A.1"),
      m("site-visits", "Site Visits", "pin", "Demo view", "A.1"),
    ],
  },
  {
    id: "catalog",
    label: "Products & services",
    icon: "box",
    modules: [
      m("products", "Products", "box", "Local tool", "A.1"),
      m("categories", "Product Categories", "folder", "Demo view", "A.1"),
      m("collections", "Collections", "layers"),
      m("inventory", "Inventory", "box", "Local tool", "A.1"),
      m("private-pricing", "Private Pricing", "wallet", "Local tool", "A.1"),
      m("services", "Services", "controls", "Demo view", "A.1"),
      m("service-categories", "Service Categories", "folder"),
      m("product-service-mapping", "Product-Service Mapping", "swap"),
    ],
  },
  {
    id: "content",
    label: "Content management",
    icon: "globe",
    modules: [
      m("homepage", "Homepage", "globe"),
      m("about", "About", "file"),
      m("projects", "Projects & Portfolio", "architecture"),
      m("media", "Media Library", "folder"),
      m("reviews", "Reviews", "clipboard"),
      m("careers", "Careers", "users"),
      m("navigation", "Navigation", "menu"),
      m("footer", "Footer", "file"),
      m("seo", "SEO Manager", "search"),
      m("translations", "English / Bengali Content", "globe"),
    ],
  },
  {
    id: "documents-group",
    label: "Documents & communication",
    icon: "file",
    modules: [
      m("quotations", "Quotation Studio", "file", "Local tool", "A.1"),
      m("memo-studio", "Memo / Invoice Studio", "receipt", "Local tool", "A.1"),
      m("documents", "Document Studio", "file", "Local tool", "A.1"),
      m("email", "Email Center", "mail", "Local tool", "A.1"),
      m("templates", "Templates", "folder", "Planned", "C"),
      m("dispatch", "Dispatch History", "mail", "Planned", "C"),
    ],
  },
  {
    id: "reports",
    label: "Reports & analytics",
    icon: "chart",
    modules: [
      m("sales-analytics", "Sales Analytics", "chart", "Demo view", "A.1"),
      m("quotation-analytics", "Quotation Analytics", "chart"),
      m("customer-analytics", "Customer Analytics", "users"),
      m(
        "product-performance",
        "Product Performance",
        "chart",
        "Demo view",
        "A.1",
      ),
      m("service-performance", "Service Performance", "chart"),
      m("staff-activity", "Staff Activity", "activity"),
      m("financial-reports", "Financial Reports", "wallet"),
      m("operations", "Operational Maps", "pin", "Demo view", "A.1"),
      m("exports", "Data Export", "download"),
    ],
  },
  {
    id: "administration",
    label: "Administration",
    icon: "shield",
    modules: [
      m("root-admin", "Root Admin", "shield", "Local tool", "A.1"),
      m("users", "Users", "users", "Demo view", "A.1"),
      m("roles", "Roles", "shield", "Local tool", "A.1"),
      m("permissions", "Permissions", "lock", "Local tool", "A.1"),
      m("staff", "Staff Management", "users", "Local tool", "A.1"),
      m("audit-logs", "Audit Logs", "activity", "Planned", "B"),
      m("settings", "Company Settings", "settings", "Local tool", "A.1"),
      m("system-settings", "System Settings", "settings"),
    ],
  },
];
export const workspaceModules = moduleGroups.flatMap((g) => g.modules);
