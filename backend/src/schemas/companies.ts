import { z } from "zod";

/**
 * Company Schema
 * Schema for creating or updating a company
 */
export const CompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
  industry: z.string().optional(),
});

export type NewCompany = z.infer<typeof CompanySchema>;

export const UpdateCompanySchema = CompanySchema.partial();

export type UpdateCompany = z.infer<typeof UpdateCompanySchema>;

/**
 * User Company Notes Schema
 * Schema for adding notes and ratings for a company by a user
 */
export const UserCompanyNotesSchema = z.object({
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export type UserCompanyNotesInput = z.infer<typeof UserCompanyNotesSchema>;