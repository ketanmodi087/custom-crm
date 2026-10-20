import { z } from "zod";

export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "LOST"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

const optionalEmailSchema = z
  .string()
  .trim()
  .max(255)
  .refine((value) => value === "" || z.string().email().safeParse(value).success, {
    message: "Enter a valid email address",
  });

export const leadInputSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  companyName: z.string().trim().max(200),
  email: optionalEmailSchema,
  phone: z.string().trim().max(50),
  status: z.enum(LEAD_STATUSES),
  notes: z.string().trim().max(2000),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export const leadQuerySchema = z.object({
  q: z.string().trim().max(200).default(""),
  status: z.enum(LEAD_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type LeadQuery = z.infer<typeof leadQuerySchema>;

export type LeadItem = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadListResult = {
  data: LeadItem[];
  total: number;
  page: number;
  pageSize: number;
};
