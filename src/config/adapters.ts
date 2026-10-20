import type { AdapterMap } from "@/core/module-registry/types";

/** Cross-module hooks. Modules must not import each other; wire via adapters. */
export const adapters: AdapterMap = {};

export const runAdapter = async (name: string, ...args: unknown[]) => {
  const fn = adapters[name];
  if (!fn) return undefined;
  return fn(...args);
};
