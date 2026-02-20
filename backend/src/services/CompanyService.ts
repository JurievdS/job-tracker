import { db } from "../db/index.js";
import { companies, userCompanyNotes } from "../db/schema.js";
import { eq, ilike, and } from "drizzle-orm";
import { NotFoundError, ConflictError } from "../errors/index.js";
import type { NewCompany, UpdateCompany } from "../schemas/companies.js";
import { normalizeCompanyName } from "../utils/companyNormalization.js";

// Infer types from the schema
type Company = typeof companies.$inferSelect;
type UserCompanyNote = typeof userCompanyNotes.$inferSelect;

// Company with user's personal notes attached
export interface CompanyWithNotes extends Company {
  industry: string | null;
  user_notes?: string | null;
  user_rating?: number | null;
}

/**
 * Company Service
 */
export class CompanyService {

  /**
   * Get all companies (global)
   * @return List of companies
   */
  async findAll(): Promise<Company[]> {
    return db.select().from(companies);
  }

  /**
   * Get all companies with user's personal notes attached
   * @param userId ID of the user
   * @return List of companies with user notes
   */
  async findAllWithUserNotes(userId: number): Promise<CompanyWithNotes[]> {
    const result = await db
      .select({
        id: companies.id,
        name: companies.name,
        normalized_name: companies.normalized_name,
        website: companies.website,
        location: companies.location,
        industry: companies.industry,
        created_at: companies.created_at,
        user_notes: userCompanyNotes.notes,
        user_rating: userCompanyNotes.rating,
      })
      .from(companies)
      .leftJoin(
        userCompanyNotes,
        and(
          eq(userCompanyNotes.company_id, companies.id),
          eq(userCompanyNotes.user_id, userId)
        )
      );

    return result;
  }

  /**
   * Search companies by name (case-insensitive, global)
   * @param term Search term
   * @return List of matching companies
   */
  async search(term: string): Promise<Company[]> {
    return db
      .select()
      .from(companies)
      .where(ilike(companies.name, `%${term}%`))
      .limit(20);
  }

  /**
   * Get a company by ID
   * @param companyId ID of the company
   * @return Company
   * @throws NotFoundError if company doesn't exist
   */
  async findByIdOrThrow(companyId: number): Promise<Company> {
    const result = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId));

    if (result.length === 0) {
      throw new NotFoundError("Company not found");
    }

    return result[0];
  }

  /**
   * Get a company by ID with user's notes
   * @param companyId ID of the company
   * @param userId ID of the user
   * @return Company with user notes
   * @throws NotFoundError if company doesn't exist
   */
  async findByIdWithNotes(companyId: number, userId: number): Promise<CompanyWithNotes> {
    const result = await db
      .select({
        id: companies.id,
        name: companies.name,
        normalized_name: companies.normalized_name,
        website: companies.website,
        location: companies.location,
        industry: companies.industry,
        created_at: companies.created_at,
        user_notes: userCompanyNotes.notes,
        user_rating: userCompanyNotes.rating,
      })
      .from(companies)
      .leftJoin(
        userCompanyNotes,
        and(
          eq(userCompanyNotes.company_id, companies.id),
          eq(userCompanyNotes.user_id, userId)
        )
      )
      .where(eq(companies.id, companyId));

    if (result.length === 0) {
      throw new NotFoundError("Company not found");
    }

    return result[0];
  }

  /**
   * Get a company by ID (returns null if not found)
   * @param companyId ID of the company
   * @return Company or null
   */
  async findById(companyId: number): Promise<Company | null> {
    const result = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId));

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a company by exact name (case-sensitive)
   * @param name Name of the company
   * @return Company or null
   */
  async findByName(name: string): Promise<Company | null> {
    const result = await db
      .select()
      .from(companies)
      .where(eq(companies.name, name));

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a company by normalized name
   * @param normalizedName Normalized name to search for
   * @return Company or null
   */
  async findByNormalizedName(normalizedName: string): Promise<Company | null> {
    const result = await db
      .select()
      .from(companies)
      .where(eq(companies.normalized_name, normalizedName));

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create a new company (global)
   * @param data New company data
   * @return Created company
   * @throws ConflictError if a similar company already exists
   */
  async create(data: NewCompany): Promise<Company> {
    const normalizedName = normalizeCompanyName(data.name);

    // Check for existing company with same normalized name
    const existing = await this.findByNormalizedName(normalizedName);
    if (existing) {
      throw new ConflictError(
        `A similar company already exists: "${existing.name}". Use the existing company or provide a more distinct name.`
      );
    }

    const [company] = await db
      .insert(companies)
      .values({
        name: data.name,
        normalized_name: normalizedName,
        website: data.website,
        location: data.location,
        industry: data.industry,
      })
      .returning();

    return company;
  }

  /**
   * Update a company (global)
   * @param companyId ID of the company to update
   * @param data Partial company data
   * @return Updated company
   * @throws NotFoundError if company doesn't exist
   * @throws ConflictError if new name conflicts with another company
   */
  async update(companyId: number, data: UpdateCompany): Promise<Company> {
    await this.findByIdOrThrow(companyId);

    // If name is being changed, check for conflicts
    if (data.name) {
      const normalizedName = normalizeCompanyName(data.name);
      const existing = await this.findByNormalizedName(normalizedName);
      if (existing && existing.id !== companyId) {
        throw new ConflictError(
          `A similar company already exists: "${existing.name}". Use the existing company or provide a more distinct name.`
        );
      }
      (data as Record<string, unknown>).normalized_name = normalizedName;
    }

    const [updated] = await db
      .update(companies)
      .set(data as Record<string, unknown>)
      .where(eq(companies.id, companyId))
      .returning();

    return updated;
  }

  /**
   * Delete a company (global)
   * @param companyId ID of the company to delete
   * @throws NotFoundError if company doesn't exist
   */
  async delete(companyId: number): Promise<void> {
    await this.findByIdOrThrow(companyId);
    await db.delete(companies).where(eq(companies.id, companyId));
  }

  /**
   * Find or create a company by name (uses normalized matching)
   * Returns existing company if normalized name matches
   */
  async findOrCreate(name: string): Promise<Company> {
    const normalizedName = normalizeCompanyName(name);

    // First try to find by normalized name
    const existing = await this.findByNormalizedName(normalizedName);
    if (existing) {
      return existing;
    }

    // Create new company (this will also set normalized_name)
    return this.create({ name });
  }

  // ==================== User Notes ====================

  /**
   * Get user's notes for a company
   * @param userId ID of the user
   * @param companyId ID of the company
   * @return User's notes or null
   */
  async getUserNotes(userId: number, companyId: number): Promise<UserCompanyNote | null> {
    const result = await db
      .select()
      .from(userCompanyNotes)
      .where(
        and(
          eq(userCompanyNotes.user_id, userId),
          eq(userCompanyNotes.company_id, companyId)
        )
      );

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Set user's notes/rating for a company (upsert)
   * @param userId ID of the user
   * @param companyId ID of the company
   * @param data Notes and/or rating
   * @return Created or updated user company notes
   */
  async setUserNotes(
    userId: number,
    companyId: number,
    data: { notes?: string; rating?: number }
  ): Promise<UserCompanyNote> {
    // Verify company exists
    await this.findByIdOrThrow(companyId);

    const existing = await this.getUserNotes(userId, companyId);

    if (existing) {
      // Update existing notes
      const [updated] = await db
        .update(userCompanyNotes)
        .set({
          notes: data.notes,
          rating: data.rating,
          updated_at: new Date(),
        })
        .where(eq(userCompanyNotes.id, existing.id))
        .returning();

      return updated;
    } else {
      // Create new notes
      const [created] = await db
        .insert(userCompanyNotes)
        .values({
          user_id: userId,
          company_id: companyId,
          notes: data.notes,
          rating: data.rating,
        })
        .returning();

      return created;
    }
  }

  /**
   * Delete user's notes for a company
   * @param userId ID of the user
   * @param companyId ID of the company
   * @return void
   */
  async deleteUserNotes(userId: number, companyId: number): Promise<void> {
    await db
      .delete(userCompanyNotes)
      .where(
        and(
          eq(userCompanyNotes.user_id, userId),
          eq(userCompanyNotes.company_id, companyId)
        )
      );
  }
}

export const companyService = new CompanyService();
