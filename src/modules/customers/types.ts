import { z } from "zod";

export const CUSTOMER_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

const optionalEmailSchema = z
  .string()
  .trim()
  .max(255)
  .refine((value) => value === "" || z.string().email().safeParse(value).success, {
    message: "Enter a valid email address",
  });

const optionalWebsiteSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || z.url().safeParse(value).success, {
    message: "Enter a complete URL, including https://",
  });

export const customerInputSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required").max(200),
  email: optionalEmailSchema,
  phone: z.string().trim().max(50),
  website: optionalWebsiteSchema,
  address: z.string().trim().max(1000),
  status: z.enum(CUSTOMER_STATUSES),
  notes: z.string().trim().max(2000),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

export const customerQuerySchema = z.object({
  q: z.string().trim().max(200).default(""),
  status: z.enum(CUSTOMER_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CustomerQuery = z.infer<typeof customerQuerySchema>;

export const contactInputSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  jobTitle: z.string().trim().max(150),
  email: optionalEmailSchema,
  phone: z.string().trim().max(50),
  notes: z.string().trim().max(2000),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

export type CustomerItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  status: CustomerStatus;
  notes: string | null;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ContactItem = {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerDetail = CustomerItem & { contacts: ContactItem[] };

export type CustomerListResult = {
  data: CustomerItem[];
  total: number;
  page: number;
  pageSize: number;
};
