import type { ModuleDefinition, ModuleNavItem } from "./types";

let registered: ModuleDefinition[] = [];

export const registerModules = (modules: ModuleDefinition[]) => {
  const moduleIds = new Set(modules.map((module) => module.id));
  for (const definition of modules) {
    const missingDependency = definition.dependsOn?.find(
      (dependency) => !moduleIds.has(dependency),
    );
    if (missingDependency) {
      throw new Error(`Module ${definition.id} requires enabled module ${missingDependency}`);
    }
  }
  registered = modules;
};

export const getRegisteredModules = () => registered;

export const getModuleNav = (options?: {
  area?: "platform" | "tenant";
  permissions?: string[];
}): ModuleNavItem[] => {
  const area = options?.area ?? "tenant";
  const permissions = options?.permissions;

  return registered
    .flatMap((mod) => mod.nav.map((item) => ({ ...item, area: item.area ?? "tenant" })))
    .filter((item) => (item.area ?? "tenant") === area)
    .filter((item) => {
      if (!item.permission) return true;
      if (!permissions) return true;
      return permissions.includes(item.permission) || permissions.includes("*");
    })
    .sort((a, b) => a.order - b.order);
};

export const getPermissionCatalog = () => {
  const keys = new Set<string>();
  registered.forEach((mod) => mod.permissions.forEach((key) => keys.add(key)));
  return Array.from(keys).sort();
};
