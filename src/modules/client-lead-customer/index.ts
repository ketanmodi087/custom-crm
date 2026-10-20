import type { ModuleDefinition } from "@/core/module-registry/types";

/** Manifest for the client-specific Lead and customer master-data integration. */
export const clientLeadCustomerModule: ModuleDefinition = {
  id: "client-lead-customer",
  name: "Lead Customer Integration",
  version: "1.0.0",
  nav: [],
  permissions: [],
  dependsOn: ["leads", "customers"],
  prismaModels: [],
  seedData: [],
};
