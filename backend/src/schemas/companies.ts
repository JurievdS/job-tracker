import { z } from "zod";

export const CompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export type NewCompany = z.infer<typeof CompanySchema>;

export const UpdateCompanySchema = CompanySchema.partial();

export type UpdateCompany = z.infer<typeof UpdateCompanySchema>;