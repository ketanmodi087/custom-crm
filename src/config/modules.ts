import { registerModules } from "@/core/module-registry/registry";
import { leadsModule } from "@/modules/leads";
import { customersModule } from "@/modules/customers";
import { clientLeadCustomerModule } from "@/modules/client-lead-customer";

export const enabledModules = [customersModule, leadsModule, clientLeadCustomerModule];

registerModules(enabledModules);
