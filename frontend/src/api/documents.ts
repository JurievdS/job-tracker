import { apiClient } from './client';
import type { Document, CreateDocumentDto, UpdateDocumentDto } from '@/types/document';

/**
 * Documents API Service
 *
 * Handles all CRUD operations for user documents (CVs, cover letters, etc.).
 * Documents can be linked to multiple applications via the application_documents junction table.
 * All endpoints require authentication (handled by apiClient interceptors).
 */
export const documentsApi = {
  /**
   * List all documents for the current user
   * GET /documents
   */
  list: async (): Promise<Document[]> => {
    const response = await apiClient.get<Document[]>('/documents');
    return response.data;
  },

  /**
   * Get default documents for the current user
   * GET /documents/defaults
   */
  getDefaults: async (): Promise<Document[]> => {
    const response = await apiClient.get<Document[]>('/documents/defaults');
    return response.data;
  },

  /**
   * Get a single document by ID
   * GET /documents/:id
   */
  get: async (id: number): Promise<Document> => {
    const response = await apiClient.get<Document>(`/documents/${id}`);
    return response.data;
  },

  /**
   * Create a new document
   * POST /documents
   */
  create: async (data: CreateDocumentDto): Promise<Document> => {
    const response = await apiClient.post<Document>('/documents', data);
    return response.data;
  },

  /**
   * Update an existing document
   * PUT /documents/:id
   */
  update: async (id: number, data: UpdateDocumentDto): Promise<Document> => {
    const response = await apiClient.put<Document>(`/documents/${id}`, data);
    return response.data;
  },

  /**
   * Delete a document
   * DELETE /documents/:id
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },
};
