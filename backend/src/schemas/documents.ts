import { z } from "zod";

const docTypeEnum = z.enum(["cv", "cover_letter", "portfolio", "certificate", "other"]);

/**
 * Document Schema
 * Schema for creating a new document
 * Note: Documents are linked to applications via the application_documents junction table
 */
export const DocumentSchema = z.object({
  doc_type: docTypeEnum,
  label: z.string().min(1, "Label is required"),
  file_path: z.string().optional(),
  content: z.string().optional(),
  is_default: z.boolean().default(false),
});

export type NewDocument = z.infer<typeof DocumentSchema>;

export const UpdateDocumentSchema = z.object({
  doc_type: docTypeEnum.optional(),
  label: z.string().min(1).optional(),
  file_path: z.string().optional(),
  content: z.string().optional(),
  is_default: z.boolean().optional(),
});

export type UpdateDocument = z.infer<typeof UpdateDocumentSchema>;

/**
 * Application Document Schema
 * Schema for attaching documents to applications
 */
export const ApplicationDocumentSchema = z.object({
  document_id: z.number().int(),
  doc_role: z.string().max(50).optional(), // "cv_submitted", "cover_letter", "portfolio"
});

export type NewApplicationDocument = z.infer<typeof ApplicationDocumentSchema>;

export const ApplicationDocumentsSchema = z.object({
  document_ids: z.array(z.number().int()).min(1, "At least one document is required"),
  doc_role: z.string().max(50).optional(),
});

export type ApplicationDocumentsInput = z.infer<typeof ApplicationDocumentsSchema>;
