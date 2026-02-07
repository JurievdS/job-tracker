import { z } from "zod";

const workHistoryEntrySchema = z.object({
  company: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string().nullable(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

const educationEntrySchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  start: z.string(),
  end: z.string().nullable(),
  grade: z.string().optional(),
});

const languageEntrySchema = z.object({
  language: z.string(),
  proficiency: z.enum(["native", "fluent", "advanced", "intermediate", "basic"]),
});

/**
 * User Profile Schema
 * Schema for creating or updating a user profile
 */
export const UserProfileSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().max(50).optional(),
  location: z.string().optional(),
  nationality: z.string().max(100).optional(),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  github_url: z.string().url().optional().or(z.literal("")),
  portfolio_url: z.string().url().optional().or(z.literal("")),
  summary: z.string().optional(),
  work_history: z.array(workHistoryEntrySchema).optional(),
  education: z.array(educationEntrySchema).optional(),
  skills: z.record(z.string(), z.array(z.string())).optional(),
  languages: z.array(languageEntrySchema).optional(),
  visa_status: z.string().optional(),
  base_currency: z.string().max(10).optional(),
  salary_expectation_min: z.number().int().optional(),
  salary_expectation_max: z.number().int().optional(),
});

export type NewUserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof UserProfileSchema>;
