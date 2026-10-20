import type { ModuleDefinition } from "@/core/module-registry/types";

/** Module manifest for the Leads feature. */
export const leadsModule: ModuleDefinition = {
  id: "leads",
  name: "Leads",
  version: "1.0.0",
  nav: [
    {
      label: "Leads",
      href: "/leads",
      icon: "Leaderboard",
      order: 10,
      permission: "leads.read",
      area: "tenant",
    },
  ],
  permissions: ["leads.read", "leads.write", "leads.delete"],
  dependsOn: ["customers"],
  prismaModels: ["Lead"],
  seedData: [],
};
