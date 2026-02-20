import { z } from "zod";

/**
 * Tag Schema
 * Schema for creating a new tag
 */
export const TagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code").optional(),
});

export type NewTag = z.infer<typeof TagSchema>;

export const UpdateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code").optional(),
});

export type UpdateTag = z.infer<typeof UpdateTagSchema>;

/**
 * Application Tags Schema
 * Schema for adding/removing tags to applications
 */
export const ApplicationTagsSchema = z.object({
  tag_ids: z.array(z.number().int()),
});

export type ApplicationTagsInput = z.infer<typeof ApplicationTagsSchema>;
