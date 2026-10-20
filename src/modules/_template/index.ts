import type { ModuleDefinition } from "@/core/module-registry/types";

/**
 * Copy this folder to src/modules/<your-module>.
 * Do not import other feature modules.
 */
export const templateModule: ModuleDefinition = {
  id: "template",
  name: "Template",
  version: "0.0.1",
  nav: [
    {
      label: "Template",
      href: "/template",
      icon: "Dashboard",
      order: 100,
      permission: "template.read",
      area: "tenant",
    },
  ],
  permissions: ["template.read", "template.write", "template.delete"],
};
