import { db } from "../db/index.js";
import { formTemplates } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { NotFoundError } from "../errors/index.js";
import type { NewFormTemplate, UpdateFormTemplate } from "../schemas/formTemplates.js";

type FormTemplate = typeof formTemplates.$inferSelect;

/**
 * Form Template Service
 */
export class FormTemplateService {
  /**
   * Get all form templates for a user
   */
  async findAll(userId: number): Promise<FormTemplate[]> {
    return db
      .select()
      .from(formTemplates)
      .where(eq(formTemplates.user_id, userId))
      .orderBy(desc(formTemplates.last_used));
  }

  /**
   * Get a form template by domain
   */
  async findByDomain(userId: number, domain: string): Promise<FormTemplate | null> {
    const result = await db
      .select()
      .from(formTemplates)
      .where(
        and(eq(formTemplates.user_id, userId), eq(formTemplates.domain, domain))
      );

    return result[0] || null;
  }

  /**
   * Get a form template by ID
   */
  async findByIdOrThrow(templateId: number, userId: number): Promise<FormTemplate> {
    const result = await db
      .select()
      .from(formTemplates)
      .where(
        and(eq(formTemplates.id, templateId), eq(formTemplates.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Form template not found");
    }

    return result[0];
  }

  /**
   * Create a new form template
   */
  async create(userId: number, data: NewFormTemplate): Promise<FormTemplate> {
    const [template] = await db
      .insert(formTemplates)
      .values({
        user_id: userId,
        domain: data.domain,
        field_mappings: data.field_mappings,
        success_rate: data.success_rate,
      })
      .returning();

    return template;
  }

  /**
   * Update a form template
   */
  async update(templateId: number, userId: number, data: UpdateFormTemplate): Promise<FormTemplate> {
    await this.findByIdOrThrow(templateId, userId);

    const [updated] = await db
      .update(formTemplates)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(formTemplates.id, templateId))
      .returning();

    return updated;
  }

  /**
   * Record template usage (updates last_used timestamp)
   */
  async recordUsage(templateId: number, userId: number): Promise<void> {
    await this.findByIdOrThrow(templateId, userId);

    await db
      .update(formTemplates)
      .set({ last_used: new Date() })
      .where(eq(formTemplates.id, templateId));
  }

  /**
   * Update success rate
   */
  async updateSuccessRate(templateId: number, userId: number, successRate: number): Promise<void> {
    await this.findByIdOrThrow(templateId, userId);

    await db
      .update(formTemplates)
      .set({ success_rate: successRate, updated_at: new Date() })
      .where(eq(formTemplates.id, templateId));
  }

  /**
   * Delete a form template
   */
  async delete(templateId: number, userId: number): Promise<void> {
    await this.findByIdOrThrow(templateId, userId);
    await db.delete(formTemplates).where(eq(formTemplates.id, templateId));
  }
}

export const formTemplateService = new FormTemplateService();
