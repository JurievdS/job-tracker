import { z } from "zod";

const requirementTypeEnum = z.enum([
  "salary_min",
  "employer_condition",
  "language",
  "qualification",
  "other",
]);

/**
 * Visa Requirement Schema
 * Schema for creating a new visa requirement
 */
export const VisaRequirementSchema = z.object({
  visa_type_id: z.number().int(),
  requirement_type: requirementTypeEnum,
  condition_label: z.string().max(255).optional(),
  min_value: z.number().int().optional(),
  currency: z.string().max(10).optional(),
  period: z.string().max(20).optional(),
  description: z.string().optional(),
});

export type NewVisaRequirement = z.infer<typeof VisaRequirementSchema>;

export const UpdateVisaRequirementSchema = z.object({
  requirement_type: requirementTypeEnum.optional(),
  condition_label: z.string().max(255).optional(),
  min_value: z.number().int().nullable().optional(),
  currency: z.string().max(10).optional(),
  period: z.string().max(20).optional(),
  description: z.string().optional(),
});

export type UpdateVisaRequirement = z.infer<typeof UpdateVisaRequirementSchema>;
