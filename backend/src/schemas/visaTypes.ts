import { z } from "zod";

/**
 * Visa Type Schema
 * Schema for creating a new visa type reference entry
 */
export const VisaTypeSchema = z.object({
  country_code: z.string().length(3, "Country code must be 3 characters (ISO 3166-1 alpha-3)"),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  source_url: z.string().url("Must be a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
  valid_from: z.string().min(1, "Valid from date is required"),
  valid_until: z.string().optional(),
});

export type NewVisaType = z.infer<typeof VisaTypeSchema>;

export const UpdateVisaTypeSchema = z.object({
  country_code: z.string().length(3).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  source_url: z.string().url("Must be a valid URL (e.g. https://example.com)").optional().or(z.literal("")),
  valid_from: z.string().optional(),
  valid_until: z.string().nullable().optional(),
});

export type UpdateVisaType = z.infer<typeof UpdateVisaTypeSchema>;
