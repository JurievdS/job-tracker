import { db } from "../db/index.js";
import { visaTypes } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { NotFoundError, ConflictError } from "../errors/index.js";
import type { NewVisaType, UpdateVisaType } from "../schemas/visaTypes.js";

type VisaType = typeof visaTypes.$inferSelect;

/**
 * Visa Type Service
 * Manages global visa type reference data
 */
export class VisaTypeService {
  /**
   * Get all visa types (optionally filtered by country)
   */
  async findAll(countryCode?: string): Promise<VisaType[]> {
    if (countryCode) {
      return db
        .select()
        .from(visaTypes)
        .where(eq(visaTypes.country_code, countryCode))
        .orderBy(visaTypes.country_code, visaTypes.name);
    }

    return db
      .select()
      .from(visaTypes)
      .orderBy(visaTypes.country_code, visaTypes.name);
  }

  /**
   * Get current visa types for a country (valid_until is null)
   */
  async findCurrentByCountry(countryCode: string): Promise<VisaType[]> {
    return db
      .select()
      .from(visaTypes)
      .where(
        and(
          eq(visaTypes.country_code, countryCode),
          isNull(visaTypes.valid_until)
        )
      )
      .orderBy(visaTypes.name);
  }

  /**
   * Get a visa type by ID
   */
  async findByIdOrThrow(id: number): Promise<VisaType> {
    const result = await db
      .select()
      .from(visaTypes)
      .where(eq(visaTypes.id, id));

    if (result.length === 0) {
      throw new NotFoundError("Visa type not found");
    }

    return result[0];
  }

  /**
   * Create a new visa type
   */
  async create(data: NewVisaType): Promise<VisaType> {
    // Check for duplicate (country_code + name + valid_from)
    const existing = await db
      .select()
      .from(visaTypes)
      .where(
        and(
          eq(visaTypes.country_code, data.country_code),
          eq(visaTypes.name, data.name),
          eq(visaTypes.valid_from, data.valid_from)
        )
      );

    if (existing.length > 0) {
      throw new ConflictError(
        `Visa type "${data.name}" for ${data.country_code} with valid_from ${data.valid_from} already exists`
      );
    }

    const [visaType] = await db
      .insert(visaTypes)
      .values({
        country_code: data.country_code,
        name: data.name,
        description: data.description,
        source_url: data.source_url === "" ? null : data.source_url,
        valid_from: data.valid_from,
        valid_until: data.valid_until,
      })
      .returning();

    return visaType;
  }

  /**
   * Update a visa type
   */
  async update(id: number, data: UpdateVisaType): Promise<VisaType> {
    await this.findByIdOrThrow(id);

    const [updated] = await db
      .update(visaTypes)
      .set({
        ...data,
        source_url: data.source_url === "" ? null : data.source_url,
        updated_at: new Date(),
      })
      .where(eq(visaTypes.id, id))
      .returning();

    return updated;
  }

  /**
   * Delete a visa type (cascades to requirements)
   */
  async delete(id: number): Promise<void> {
    await this.findByIdOrThrow(id);
    await db.delete(visaTypes).where(eq(visaTypes.id, id));
  }
}

export const visaTypeService = new VisaTypeService();
