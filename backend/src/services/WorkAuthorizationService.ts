import { db } from "../db/index.js";
import { workAuthorizations } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { NotFoundError, ConflictError } from "../errors/index.js";
import type { NewWorkAuthorization, UpdateWorkAuthorization } from "../schemas/workAuthorizations.js";

type WorkAuthorization = typeof workAuthorizations.$inferSelect;

/**
 * Work Authorization Service
 * Manages user work authorizations (citizenships, work permits, visas)
 */
export class WorkAuthorizationService {
  /**
   * Get all work authorizations for a user
   */
  async findAll(userId: number): Promise<WorkAuthorization[]> {
    return db
      .select()
      .from(workAuthorizations)
      .where(eq(workAuthorizations.user_id, userId))
      .orderBy(workAuthorizations.country_code);
  }

  /**
   * Get a work authorization by ID (user-scoped)
   */
  async findByIdOrThrow(id: number, userId: number): Promise<WorkAuthorization> {
    const result = await db
      .select()
      .from(workAuthorizations)
      .where(and(eq(workAuthorizations.id, id), eq(workAuthorizations.user_id, userId)));

    if (result.length === 0) {
      throw new NotFoundError("Work authorization not found");
    }

    return result[0];
  }

  /**
   * Create a new work authorization
   */
  async create(userId: number, data: NewWorkAuthorization): Promise<WorkAuthorization> {
    // Check for duplicate (user_id + country_code + status)
    const existing = await db
      .select()
      .from(workAuthorizations)
      .where(
        and(
          eq(workAuthorizations.user_id, userId),
          eq(workAuthorizations.country_code, data.country_code),
          eq(workAuthorizations.status, data.status)
        )
      );

    if (existing.length > 0) {
      throw new ConflictError(
        `You already have a ${data.status} entry for ${data.country_code}`
      );
    }

    const [authorization] = await db
      .insert(workAuthorizations)
      .values({
        user_id: userId,
        country_code: data.country_code,
        status: data.status,
        expiry_date: data.expiry_date,
        notes: data.notes,
      })
      .returning();

    return authorization;
  }

  /**
   * Update a work authorization
   */
  async update(id: number, userId: number, data: UpdateWorkAuthorization): Promise<WorkAuthorization> {
    await this.findByIdOrThrow(id, userId);

    // If country_code or status is changing, check for conflicts
    if (data.country_code || data.status) {
      const current = await this.findByIdOrThrow(id, userId);
      const checkCode = data.country_code || current.country_code;
      const checkStatus = data.status || current.status;

      const existing = await db
        .select()
        .from(workAuthorizations)
        .where(
          and(
            eq(workAuthorizations.user_id, userId),
            eq(workAuthorizations.country_code, checkCode),
            eq(workAuthorizations.status, checkStatus)
          )
        );

      if (existing.length > 0 && existing[0].id !== id) {
        throw new ConflictError(
          `You already have a ${checkStatus} entry for ${checkCode}`
        );
      }
    }

    const [updated] = await db
      .update(workAuthorizations)
      .set(data)
      .where(eq(workAuthorizations.id, id))
      .returning();

    return updated;
  }

  /**
   * Delete a work authorization
   */
  async delete(id: number, userId: number): Promise<void> {
    await this.findByIdOrThrow(id, userId);
    await db.delete(workAuthorizations).where(eq(workAuthorizations.id, id));
  }
}

export const workAuthorizationService = new WorkAuthorizationService();
