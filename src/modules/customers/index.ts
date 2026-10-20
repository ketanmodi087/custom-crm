import type { ModuleDefinition } from "@/core/module-registry/types";

/** Module manifest for customer and contact master data. */
export const customersModule: ModuleDefinition = {
  id: "customers",
  name: "Customers",
  version: "1.0.0",
  nav: [
    {
      label: "Customers",
      href: "/customers",
      icon: "Business",
      order: 5,
      permission: "customers.read",
      area: "tenant",
    },
  ],
  permissions: ["customers.read", "customers.write", "customers.delete"],
  dependsOn: [],
  prismaModels: ["Customer", "Contact"],
  seedData: [],
};
