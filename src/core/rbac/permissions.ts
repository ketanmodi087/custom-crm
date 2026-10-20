export type PermissionAction = "read" | "write" | "delete";

const LEAD_ACTIONS: PermissionAction[] = ["read", "write", "delete"];
const CUSTOMER_ACTIONS: PermissionAction[] = ["read", "write", "delete"];

/** Returns the complete permission catalog used by seed and authorization. */
export const listPermissionDefs = () => [
  ...CUSTOMER_ACTIONS.map((action) => ({
    key: `customers.${action}`,
    description:
      action === "read"
        ? "View customers and contacts"
        : action === "write"
          ? "Create and update customers and contacts"
          : "Delete customers and contacts",
  })),
  ...LEAD_ACTIONS.map((action) => ({
    key: `leads.${action}`,
    description:
      action === "read"
        ? "View leads"
        : action === "write"
          ? "Create and update leads"
          : "Delete leads",
  })),
];
