import { z } from "zod";

/**
 * Form Template Schema
 * Schema for creating a new form template
 */
export const FormTemplateSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  field_mappings: z.record(z.string(), z.unknown()),
  success_rate: z.number().int().min(0).max(100).optional(),
});

export type NewFormTemplate = z.infer<typeof FormTemplateSchema>;

export const UpdateFormTemplateSchema = z.object({
  domain: z.string().min(1).optional(),
  field_mappings: z.record(z.string(), z.unknown()).optional(),
  success_rate: z.number().int().min(0).max(100).optional(),
});

export type UpdateFormTemplate = z.infer<typeof UpdateFormTemplateSchema>;

export const UpdateSuccessRateSchema = z.object({
  success_rate: z.number().int().min(0).max(100),
});

export type UpdateSuccessRate = z.infer<typeof UpdateSuccessRateSchema>;
