import { db } from "../db/index.js";
import { sources, userSourceNotes } from "../db/schema.js";
import { eq, ilike, and, sql } from "drizzle-orm";
import { NotFoundError, ConflictError } from "../errors/index.js";
import type { NewSource, UpdateSource } from "../schemas/sources.js";

// Infer types from the schema
type Source = typeof sources.$inferSelect;
type UserSourceNote = typeof userSourceNotes.$inferSelect;

/**
 * Normalize a source name for duplicate detection
 * Converts to lowercase, trims, and collapses whitespace
 */
function normalizeSourceName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Source Service
 * Handles CRUD operations for job sources (job boards, recruiters, etc.)
 * Sources are global/shared across all users (like companies)
 */
export class SourceService {
  /**
   * Get all active sources, ordered by usage count (most popular first)
   */
  async findAll(): Promise<Source[]> {
    return db
      .select()
      .from(sources)
      .where(eq(sources.is_active, true))
      .orderBy(sql`${sources.usage_count} DESC NULLS LAST`);
  }

  /**
   * Search sources by name (case-insensitive)
   * @param term Search term
   * @return List of matching active sources
   */
  async search(term: string): Promise<Source[]> {
    return db
      .select()
      .from(sources)
      .where(
        and(
          eq(sources.is_active, true),
          ilike(sources.name, `%${term}%`)
        )
      )
      .orderBy(sql`${sources.usage_count} DESC NULLS LAST`)
      .limit(20);
  }

  /**
   * Get a source by ID
   * @throws NotFoundError if source doesn't exist
   */
  async findByIdOrThrow(sourceId: number): Promise<Source> {
    const result = await db
      .select()
      .from(sources)
      .where(eq(sources.id, sourceId));

    if (result.length === 0) {
      throw new NotFoundError("Source not found");
    }

    return result[0];
  }

  /**
   * Get a source by ID (returns null if not found)
   */
  async findById(sourceId: number): Promise<Source | null> {
    const result = await db
      .select()
      .from(sources)
      .where(eq(sources.id, sourceId));

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a source by normalized name
   */
  async findByNormalizedName(normalizedName: string): Promise<Source | null> {
    const result = await db
      .select()
      .from(sources)
      .where(eq(sources.normalized_name, normalizedName));

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create a new source
   * @throws ConflictError if a similar source already exists
   */
  async create(data: NewSource): Promise<Source> {
    const normalizedName = normalizeSourceName(data.name);

    // Check for existing source with same normalized name
    const existing = await this.findByNormalizedName(normalizedName);
    if (existing) {
      throw new ConflictError(
        `A similar source already exists: "${existing.name}". Use the existing source or provide a more distinct name.`
      );
    }

    const [source] = await db
      .insert(sources)
      .values({
        name: data.name,
        normalized_name: normalizedName,
        url: data.url || null,
        logo_url: data.logo_url || null,
        category: data.category || null,
        region: data.region || null,
        description: data.description || null,
        is_active: true,
        usage_count: 0,
      })
      .returning();

    return source;
  }

  /**
   * Find or create a source by name (uses normalized matching)
   * Returns existing source if normalized name matches
   */
  async findOrCreate(name: string): Promise<Source> {
    const normalizedName = normalizeSourceName(name);

    // First try to find by normalized name
    const existing = await this.findByNormalizedName(normalizedName);
    if (existing) {
      return existing;
    }

    // Create new source
    return this.create({ name });
  }

  /**
   * Update a source
   */
  async update(sourceId: number, data: UpdateSource): Promise<Source> {
    // Verify source exists
    await this.findByIdOrThrow(sourceId);

    // If name is changing, check for conflicts
    if (data.name) {
      const normalizedName = normalizeSourceName(data.name);
      const existing = await this.findByNormalizedName(normalizedName);
      if (existing && existing.id !== sourceId) {
        throw new ConflictError(
          `A similar source already exists: "${existing.name}".`
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.normalized_name = normalizeSourceName(data.name);
    }
    if (data.url !== undefined) updateData.url = data.url || null;
    if (data.logo_url !== undefined) updateData.logo_url = data.logo_url || null;
    if (data.category !== undefined) updateData.category = data.category || null;
    if (data.region !== undefined) updateData.region = data.region || null;
    if (data.description !== undefined) updateData.description = data.description || null;

    const [updated] = await db
      .update(sources)
      .set(updateData)
      .where(eq(sources.id, sourceId))
      .returning();

    return updated;
  }

  /**
   * Soft delete a source (set is_active = false)
   */
  async delete(sourceId: number): Promise<void> {
    await this.findByIdOrThrow(sourceId);

    await db
      .update(sources)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(sources.id, sourceId));
  }

  /**
   * Increment usage count for a source
   */
  async incrementUsage(sourceId: number): Promise<void> {
    await db
      .update(sources)
      .set({
        usage_count: sql`COALESCE(${sources.usage_count}, 0) + 1`,
        updated_at: new Date(),
      })
      .where(eq(sources.id, sourceId));
  }

  // ==================== User Notes ====================

  /**
   * Get user's notes for a source
   */
  async getUserNotes(userId: number, sourceId: number): Promise<UserSourceNote | null> {
    const result = await db
      .select()
      .from(userSourceNotes)
      .where(
        and(
          eq(userSourceNotes.user_id, userId),
          eq(userSourceNotes.source_id, sourceId)
        )
      );

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Set user's notes/rating for a source (upsert)
   */
  async setUserNotes(
    userId: number,
    sourceId: number,
    data: { notes?: string; rating?: number }
  ): Promise<UserSourceNote> {
    await this.findByIdOrThrow(sourceId);

    const existing = await this.getUserNotes(userId, sourceId);

    if (existing) {
      const [updated] = await db
        .update(userSourceNotes)
        .set({
          notes: data.notes,
          rating: data.rating,
          updated_at: new Date(),
        })
        .where(eq(userSourceNotes.id, existing.id))
        .returning();

      return updated;
    } else {
      const [created] = await db
        .insert(userSourceNotes)
        .values({
          user_id: userId,
          source_id: sourceId,
          notes: data.notes,
          rating: data.rating,
        })
        .returning();

      return created;
    }
  }

  /**
   * Delete user's notes for a source
   */
  async deleteUserNotes(userId: number, sourceId: number): Promise<void> {
    await db
      .delete(userSourceNotes)
      .where(
        and(
          eq(userSourceNotes.user_id, userId),
          eq(userSourceNotes.source_id, sourceId)
        )
      );
  }
}

export const sourceService = new SourceService();
