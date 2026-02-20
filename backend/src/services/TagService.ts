import { db } from "../db/index.js";
import { tags, applicationTags, applications } from "../db/schema.js";
import { eq, and, count } from "drizzle-orm";
import { NotFoundError, ConflictError } from "../errors/index.js";
import type { NewTag, UpdateTag } from "../schemas/tags.js";

type Tag = typeof tags.$inferSelect;

export interface TagWithCount extends Tag {
  application_count: number;
}

/**
 * Tag Service
 */
export class TagService {
  /**
   * Get all tags for a user with application counts
   */
  async findAll(userId: number): Promise<TagWithCount[]> {
    const results = await db
      .select({
        id: tags.id,
        user_id: tags.user_id,
        name: tags.name,
        color: tags.color,
        application_count: count(applicationTags.application_id),
      })
      .from(tags)
      .leftJoin(applicationTags, eq(tags.id, applicationTags.tag_id))
      .where(eq(tags.user_id, userId))
      .groupBy(tags.id)
      .orderBy(tags.name);

    return results.map((r) => ({
      ...r,
      application_count: Number(r.application_count),
    }));
  }

  /**
   * Get a tag by ID
   */
  async findByIdOrThrow(tagId: number, userId: number): Promise<Tag> {
    const result = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, tagId), eq(tags.user_id, userId)));

    if (result.length === 0) {
      throw new NotFoundError("Tag not found");
    }

    return result[0];
  }

  /**
   * Get a tag by name
   */
  async findByName(userId: number, name: string): Promise<Tag | null> {
    const result = await db
      .select()
      .from(tags)
      .where(and(eq(tags.user_id, userId), eq(tags.name, name)));

    return result[0] || null;
  }

  /**
   * Create a new tag
   */
  async create(userId: number, data: NewTag): Promise<Tag> {
    // Check for duplicate name
    const existing = await this.findByName(userId, data.name);
    if (existing) {
      throw new ConflictError("Tag with this name already exists");
    }

    const [tag] = await db
      .insert(tags)
      .values({
        user_id: userId,
        name: data.name,
        color: data.color,
      })
      .returning();

    return tag;
  }

  /**
   * Update a tag
   */
  async update(tagId: number, userId: number, data: UpdateTag): Promise<Tag> {
    await this.findByIdOrThrow(tagId, userId);

    // Check for duplicate name if name is being changed
    if (data.name) {
      const existing = await this.findByName(userId, data.name);
      if (existing && existing.id !== tagId) {
        throw new ConflictError("Tag with this name already exists");
      }
    }

    const [updated] = await db
      .update(tags)
      .set(data)
      .where(eq(tags.id, tagId))
      .returning();

    return updated;
  }

  /**
   * Delete a tag
   */
  async delete(tagId: number, userId: number): Promise<void> {
    await this.findByIdOrThrow(tagId, userId);
    await db.delete(tags).where(eq(tags.id, tagId));
  }

  /**
   * Get applications with a specific tag
   */
  async getApplicationsByTag(tagId: number, userId: number) {
    await this.findByIdOrThrow(tagId, userId);

    return db
      .select({
        id: applications.id,
        job_title: applications.job_title,
        status: applications.status,
        created_at: applications.created_at,
      })
      .from(applicationTags)
      .innerJoin(applications, eq(applicationTags.application_id, applications.id))
      .where(
        and(
          eq(applicationTags.tag_id, tagId),
          eq(applications.user_id, userId)
        )
      );
  }
}

export const tagService = new TagService();
