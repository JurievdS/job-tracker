import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  company_id: z.number().int().optional(),
  role: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  linkedin: z.string().url("Must be a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type NewContact = z.infer<typeof ContactSchema>;

export const UpdateContactSchema = z.object({
  name: z.string().min(1).optional(),
  company_id: z.number().int().optional().nullable(),
  role: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  linkedin: z.string().url("Must be a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type UpdateContact = z.infer<typeof UpdateContactSchema>;
