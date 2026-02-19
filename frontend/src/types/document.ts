/**
 * Document Types
 *
 * These types match the backend API response shapes.
 * See: backend/src/routes/documents.ts
 */

/** Valid document type values */
export type DocumentType = 'cv' | 'cover_letter' | 'portfolio' | 'certificate' | 'other';

/** Document as returned from GET /documents */
export interface Document {
  id: number;
  user_id: number;
  doc_type: DocumentType;
  label: string;
  file_path: string | null;
  content: string | null;
  is_default: boolean | null;
  created_at: string;
  updated_at: string;
}

/** Payload for POST /documents */
export interface CreateDocumentDto {
  doc_type: DocumentType;
  label: string;
  file_path?: string;
  content?: string;
  is_default?: boolean;
}

/** Payload for PUT /documents/:id */
export interface UpdateDocumentDto {
  doc_type?: DocumentType;
  label?: string;
  file_path?: string;
  content?: string;
  is_default?: boolean;
}

/** Document type options for dropdowns */
export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'cv', label: 'CV / Resume' },
  { value: 'cover_letter', label: 'Cover Letter' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'other', label: 'Other' },
];
