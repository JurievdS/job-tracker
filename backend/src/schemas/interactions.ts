import { z } from "zod";

const interactionTypeEnum = z.enum([
  "email",
  "call",
  "interview",
  "linkedin_msg",
  "assessment",
  "offer",
  "rejection",
  "other",
]);

const directionEnum = z.enum(["inbound", "outbound"]);

export const InteractionSchema = z.object({
  application_id: z.number().int(),
  interaction_type: interactionTypeEnum,
  direction: directionEnum.default("inbound"),
  interaction_date: z.string(),
  contact_id: z.number().int().optional(),
  notes: z.string().optional(),
});

export type NewInteraction = z.infer<typeof InteractionSchema>;

export const UpdateInteractionSchema = z.object({
  application_id: z.number().int().optional(),
  interaction_type: interactionTypeEnum.optional(),
  direction: directionEnum.optional(),
  interaction_date: z.string().optional(),
  contact_id: z.number().int().optional().nullable(),
  notes: z.string().optional(),
});

export type UpdateInteraction = z.infer<typeof UpdateInteractionSchema>;
