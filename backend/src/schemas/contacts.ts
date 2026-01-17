import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  company_id: z.number().int(),
  role: z.string().optional(),
  email: z.string().email().optional(),
  linkedin: z.string().url().optional(),
  notes: z.string().optional(),
});

export type NewContact = z.infer<typeof ContactSchema>;

export const UpdateContactSchema = ContactSchema.partial();

export type UpdateContact = z.infer<typeof UpdateContactSchema>;
