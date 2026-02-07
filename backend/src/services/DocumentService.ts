import { db } from "../db/index.js";
import { documents } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { NotFoundError } from "../errors/index.js";
import type { NewDocument, UpdateDocument } from "../schemas/documents.js";

type Document = typeof documents.$inferSelect;

/**
 * Document Service
 * Manages user documents (CVs, cover letters, portfolios, etc.)
 * Documents can be linked to applications via the application_documents junction table
 */
export class DocumentService {
  /**
   * Get all documents for a user
   */
  async findAll(userId: number, docType?: string): Promise<Document[]> {
    const conditions = [eq(documents.user_id, userId)];
    if (docType) {
      conditions.push(eq(documents.doc_type, docType));
    }

    return db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.updated_at));
  }

  /**
   * Get default documents for a user (one per doc_type)
   */
  async findDefaults(userId: number): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(
        and(eq(documents.user_id, userId), eq(documents.is_default, true))
      )
      .orderBy(desc(documents.updated_at));
  }

  /**
   * Get a document by ID
   */
  async findByIdOrThrow(documentId: number, userId: number): Promise<Document> {
    const result = await db
      .select()
      .from(documents)
      .where(
        and(eq(documents.id, documentId), eq(documents.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Document not found");
    }

    return result[0];
  }

  /**
   * Create a new document
   */
  async create(userId: number, data: NewDocument): Promise<Document> {
    // If setting as default, unset other defaults of the same type
    if (data.is_default) {
      await db
        .update(documents)
        .set({ is_default: false })
        .where(
          and(
            eq(documents.user_id, userId),
            eq(documents.doc_type, data.doc_type),
            eq(documents.is_default, true)
          )
        );
    }

    const [document] = await db
      .insert(documents)
      .values({
        user_id: userId,
        doc_type: data.doc_type,
        label: data.label,
        file_path: data.file_path,
        content: data.content,
        is_default: data.is_default,
      })
      .returning();

    return document;
  }

  /**
   * Update a document
   */
  async update(documentId: number, userId: number, data: UpdateDocument): Promise<Document> {
    const existing = await this.findByIdOrThrow(documentId, userId);

    // If setting as default, unset other defaults of the same type
    if (data.is_default && !existing.is_default) {
      await db
        .update(documents)
        .set({ is_default: false })
        .where(
          and(
            eq(documents.user_id, userId),
            eq(documents.doc_type, data.doc_type || existing.doc_type),
            eq(documents.is_default, true)
          )
        );
    }

    const [updated] = await db
      .update(documents)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(documents.id, documentId))
      .returning();

    return updated;
  }

  /**
   * Delete a document
   */
  async delete(documentId: number, userId: number): Promise<void> {
    await this.findByIdOrThrow(documentId, userId);
    await db.delete(documents).where(eq(documents.id, documentId));
  }
}

export const documentService = new DocumentService();
