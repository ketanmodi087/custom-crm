import { z } from "zod";

export const leadCustomerLinkSchema = z
  .object({
    customerId: z.string().trim().min(1).nullable(),
    contactId: z.string().trim().min(1).nullable(),
  })
  .refine((value) => value.customerId !== null || value.contactId === null, {
    message: "A contact cannot be selected without a customer",
    path: ["contactId"],
  });

export type LeadCustomerLinkInput = z.infer<typeof leadCustomerLinkSchema>;

export type ContactOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
};

export type CustomerOption = {
  id: string;
  name: string;
  contacts: ContactOption[];
};

export type LeadConnection = {
  customerId: string | null;
  customerName: string | null;
  contactId: string | null;
  contactName: string | null;
  convertedAt: string | null;
};

export type RelatedLeadItem = {
  id: string;
  firstName: string;
  lastName: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST";
  convertedAt: string | null;
};
