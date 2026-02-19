import { z } from "zod";

/**
 * Source category enum
 */
export const sourceCategoryEnum = z.enum([
  "job_board",
  "aggregator",
  "company_site",
  "government",
  "recruiter",
  "referral",
  "community",
  "other",
]);

export type SourceCategory = z.infer<typeof sourceCategoryEnum>;

/**
 * Source Schema
 * Schema for creating a new source
 */
export const SourceSchema = z.object({
  name: z.string().min(1, "Source name is required").max(100),
  url: z.string().url("Must be a valid URL (e.g. https://example.com)").max(500).optional().or(z.literal("")),
  logo_url: z.string().url("Must be a valid URL (e.g. https://example.com)").max(500).optional().or(z.literal("")),
  category: sourceCategoryEnum.optional(),
  region: z.string().max(100).optional(),
  description: z.string().optional(),
});

export type NewSource = z.infer<typeof SourceSchema>;

/**
 * Update Source Schema
 * All fields are optional for partial updates
 */
export const UpdateSourceSchema = SourceSchema.partial();

export type UpdateSource = z.infer<typeof UpdateSourceSchema>;
