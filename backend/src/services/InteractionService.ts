import { db } from "../db/index.js";
import {
  interactions,
  applications,
  contacts,
  companies,
} from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { NotFoundError } from "../errors/index.js";
import type { NewInteraction, UpdateInteraction } from "../schemas/interactions.js";

// Infer types from the schema
type Interaction = typeof interactions.$inferSelect;

// Interaction with related entity names
export interface InteractionWithDetails {
  id: number;
  application_id: number | null;
  contact_id: number | null;
  interaction_type: string;
  direction: string | null;
  interaction_date: string | null;
  notes: string | null;
  created_at: Date | null;
  contact_name: string | null;
  job_title: string;
  company_name: string | null;
}

/**
 * Interaction Service
 */
export class InteractionService {

  /**
   * Get all interactions for a user with optional application filter
   */
  async findAll(
    userId: number,
    applicationId?: number
  ): Promise<InteractionWithDetails[]> {
    const baseQuery = db
      .select({
        id: interactions.id,
        application_id: interactions.application_id,
        contact_id: interactions.contact_id,
        interaction_type: interactions.interaction_type,
        direction: interactions.direction,
        interaction_date: interactions.interaction_date,
        notes: interactions.notes,
        created_at: interactions.created_at,
        contact_name: contacts.name,
        job_title: applications.job_title,
        company_name: companies.name,
      })
      .from(interactions)
      .leftJoin(contacts, eq(interactions.contact_id, contacts.id))
      .innerJoin(applications, eq(interactions.application_id, applications.id))
      .leftJoin(companies, eq(applications.company_id, companies.id))
      .orderBy(desc(interactions.interaction_date));

    if (applicationId) {
      return baseQuery.where(
        and(
          eq(interactions.application_id, applicationId),
          eq(applications.user_id, userId)
        )
      );
    }

    return baseQuery.where(eq(applications.user_id, userId));
  }

  /**
   * Get an interaction by ID with related details
   */
  async findByIdWithDetails(
    interactionId: number,
    userId: number
  ): Promise<InteractionWithDetails> {
    const result = await db
      .select({
        id: interactions.id,
        application_id: interactions.application_id,
        contact_id: interactions.contact_id,
        interaction_type: interactions.interaction_type,
        direction: interactions.direction,
        interaction_date: interactions.interaction_date,
        notes: interactions.notes,
        created_at: interactions.created_at,
        contact_name: contacts.name,
        job_title: applications.job_title,
        company_name: companies.name,
      })
      .from(interactions)
      .leftJoin(contacts, eq(interactions.contact_id, contacts.id))
      .innerJoin(applications, eq(interactions.application_id, applications.id))
      .leftJoin(companies, eq(applications.company_id, companies.id))
      .where(
        and(eq(interactions.id, interactionId), eq(applications.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Interaction not found");
    }

    return result[0];
  }

  /**
   * Get an interaction by ID (verifies ownership via application)
   */
  async findByIdOrThrow(interactionId: number, userId: number): Promise<Interaction> {
    const result = await db
      .select({
        id: interactions.id,
        application_id: interactions.application_id,
        contact_id: interactions.contact_id,
        interaction_type: interactions.interaction_type,
        direction: interactions.direction,
        interaction_date: interactions.interaction_date,
        notes: interactions.notes,
        created_at: interactions.created_at,
      })
      .from(interactions)
      .innerJoin(applications, eq(interactions.application_id, applications.id))
      .where(
        and(eq(interactions.id, interactionId), eq(applications.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Interaction not found");
    }

    return result[0];
  }

  /**
   * Verify an application belongs to a user
   */
  private async verifyApplicationOwnership(
    applicationId: number,
    userId: number
  ): Promise<void> {
    const result = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(eq(applications.id, applicationId), eq(applications.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Application not found");
    }
  }

  /**
   * Verify a contact belongs to a user
   */
  private async verifyContactOwnership(
    contactId: number,
    userId: number
  ): Promise<void> {
    const result = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.user_id, userId)));

    if (result.length === 0) {
      throw new NotFoundError("Contact not found");
    }
  }

  /**
   * Create a new interaction
   */
  async create(userId: number, data: NewInteraction): Promise<Interaction> {
    // Verify application belongs to user
    await this.verifyApplicationOwnership(data.application_id, userId);

    // If contact provided, verify it belongs to user
    if (data.contact_id) {
      await this.verifyContactOwnership(data.contact_id, userId);
    }

    const [interaction] = await db
      .insert(interactions)
      .values({
        application_id: data.application_id,
        contact_id: data.contact_id,
        interaction_type: data.interaction_type,
        direction: data.direction,
        interaction_date: data.interaction_date,
        notes: data.notes,
      })
      .returning();

    return interaction;
  }

  /**
   * Update an interaction
   */
  async update(
    interactionId: number,
    userId: number,
    data: UpdateInteraction
  ): Promise<Interaction> {
    // Verify interaction exists and belongs to user
    await this.findByIdOrThrow(interactionId, userId);

    // If updating application_id, verify new application belongs to user
    if (data.application_id) {
      await this.verifyApplicationOwnership(data.application_id, userId);
    }

    // If updating contact_id, verify new contact belongs to user
    if (data.contact_id) {
      await this.verifyContactOwnership(data.contact_id, userId);
    }

    const [updated] = await db
      .update(interactions)
      .set({
        application_id: data.application_id,
        contact_id: data.contact_id === null ? null : data.contact_id,
        interaction_type: data.interaction_type,
        direction: data.direction,
        interaction_date: data.interaction_date,
        notes: data.notes,
      })
      .where(eq(interactions.id, interactionId))
      .returning();

    return updated;
  }

  /**
   * Delete an interaction
   */
  async delete(interactionId: number, userId: number): Promise<void> {
    // Verify interaction exists and belongs to user
    await this.findByIdOrThrow(interactionId, userId);

    await db.delete(interactions).where(eq(interactions.id, interactionId));
  }
}

export const interactionService = new InteractionService();
