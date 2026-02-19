import { db } from "../db/index.js";
import { visaRequirements, visaTypes } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../errors/index.js";
import type { NewVisaRequirement, UpdateVisaRequirement } from "../schemas/visaRequirements.js";

type VisaRequirement = typeof visaRequirements.$inferSelect;

/**
 * Visa Requirement Service
 * Manages requirements for visa types
 */
export class VisaRequirementService {
  /**
   * Get all requirements for a visa type
   */
  async findByVisaType(visaTypeId: number): Promise<VisaRequirement[]> {
    // Verify visa type exists
    const vt = await db
      .select()
      .from(visaTypes)
      .where(eq(visaTypes.id, visaTypeId));

    if (vt.length === 0) {
      throw new NotFoundError("Visa type not found");
    }

    return db
      .select()
      .from(visaRequirements)
      .where(eq(visaRequirements.visa_type_id, visaTypeId))
      .orderBy(visaRequirements.requirement_type);
  }

  /**
   * Get a requirement by ID
   */
  async findByIdOrThrow(id: number): Promise<VisaRequirement> {
    const result = await db
      .select()
      .from(visaRequirements)
      .where(eq(visaRequirements.id, id));

    if (result.length === 0) {
      throw new NotFoundError("Visa requirement not found");
    }

    return result[0];
  }

  /**
   * Create a new requirement
   */
  async create(data: NewVisaRequirement): Promise<VisaRequirement> {
    // Verify visa type exists
    const vt = await db
      .select()
      .from(visaTypes)
      .where(eq(visaTypes.id, data.visa_type_id));

    if (vt.length === 0) {
      throw new NotFoundError("Visa type not found");
    }

    const [requirement] = await db
      .insert(visaRequirements)
      .values({
        visa_type_id: data.visa_type_id,
        requirement_type: data.requirement_type,
        condition_label: data.condition_label,
        min_value: data.min_value,
        currency: data.currency,
        period: data.period,
        description: data.description,
      })
      .returning();

    return requirement;
  }

  /**
   * Update a requirement
   */
  async update(id: number, data: UpdateVisaRequirement): Promise<VisaRequirement> {
    await this.findByIdOrThrow(id);

    const [updated] = await db
      .update(visaRequirements)
      .set(data)
      .where(eq(visaRequirements.id, id))
      .returning();

    return updated;
  }

  /**
   * Delete a requirement
   */
  async delete(id: number): Promise<void> {
    await this.findByIdOrThrow(id);
    await db.delete(visaRequirements).where(eq(visaRequirements.id, id));
  }
}

export const visaRequirementService = new VisaRequirementService();
