export type ModuleNavItem = {
  label: string;
  href: string;
  icon?: string;
  order: number;
  permission?: string;
  area?: "platform" | "tenant";
};

export type ModuleDefinition = {
  id: string;
  name: string;
  version?: string;
  nav: ModuleNavItem[];
  permissions: string[];
  dependsOn?: string[];
  prismaModels?: string[];
  seedData?: string[];
};

export type AdapterMap = Record<string, (...args: unknown[]) => unknown | Promise<unknown>>;
