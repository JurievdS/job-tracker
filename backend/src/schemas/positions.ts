import { z } from "zod";

export const PositionSchema = z.object({
  company_id: z.number().int(),
  title: z.string().min(1, "Title is required"),
  salary_min: z.number().int().optional(),
  salary_max: z.number().int().optional(),
  requirements: z.string().optional(),
  job_url: z.string().url().optional(),
});

export type NewPosition = z.infer<typeof PositionSchema>;

export const UpdatePositionSchema = PositionSchema.partial();

export type UpdatePosition = z.infer<typeof UpdatePositionSchema>;
