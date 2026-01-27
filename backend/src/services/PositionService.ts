import { db } from "../db/index.js";
import { positions, companies } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { NotFoundError } from "../errors/index.js";
import { CompanyService } from "./CompanyService.js";
import type { NewPosition, UpdatePosition } from "../schemas/positions.js";

// Infer types from the schema
type Position = typeof positions.$inferSelect;

// Position with company name included
export interface PositionWithCompany {
  id: number;
  company_id: number | null;
  title: string;
  salary_min: number | null;
  salary_max: number | null;
  requirements: string | null;
  job_url: string | null;
  created_at: Date | null;
  company_name: string;
}

/**
 * Position Service
 */
export class PositionService {
  constructor(private companyService: CompanyService = new CompanyService()) {}

  /**
   * Get all positions with optional company filter
   * @param companyId Optional ID of the company to filter by
   * @return List of positions with company names
   */
  async findAll(companyId?: number): Promise<PositionWithCompany[]> {
    const baseQuery = db
      .select({
        id: positions.id,
        company_id: positions.company_id,
        title: positions.title,
        salary_min: positions.salary_min,
        salary_max: positions.salary_max,
        requirements: positions.requirements,
        job_url: positions.job_url,
        created_at: positions.created_at,
        company_name: companies.name,
      })
      .from(positions)
      .innerJoin(companies, eq(positions.company_id, companies.id))
      .orderBy(desc(positions.created_at));

    if (companyId) {
      return baseQuery.where(eq(positions.company_id, companyId));
    }

    return baseQuery;
  }

  /**
   * Get a position by ID with company name
   * @param positionId ID of the position
   * @return Position with company name
   * @throws NotFoundError if position doesn't exist
   */
  async findByIdWithDetails(positionId: number): Promise<PositionWithCompany> {
    const result = await db
      .select({
        id: positions.id,
        company_id: positions.company_id,
        title: positions.title,
        salary_min: positions.salary_min,
        salary_max: positions.salary_max,
        requirements: positions.requirements,
        job_url: positions.job_url,
        created_at: positions.created_at,
        company_name: companies.name,
      })
      .from(positions)
      .innerJoin(companies, eq(positions.company_id, companies.id))
      .where(eq(positions.id, positionId));

    if (result.length === 0) {
      throw new NotFoundError("Position not found");
    }

    return result[0];
  }

  /**
   * Get a position by ID
   * @param positionId ID of the position
   * @return Position
   * @throws NotFoundError if position doesn't exist
   */
  async findByIdOrThrow(positionId: number): Promise<Position> {
    const result = await db
      .select()
      .from(positions)
      .where(eq(positions.id, positionId));

    if (result.length === 0) {
      throw new NotFoundError("Position not found");
    }

    return result[0];
  }

  /**
   * Find or create a position by company and title
    * @param companyId ID of the company
    * @param title Title of the position
    * @return Position
   */
  async findOrCreate(companyId: number, title: string): Promise<Position> {
    // Check if position already exists for this company
    const existing = await db
      .select()
      .from(positions)
      .where(and(eq(positions.company_id, companyId), eq(positions.title, title)));

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new position
    const [newPosition] = await db
      .insert(positions)
      .values({
        company_id: companyId,
        title,
      })
      .returning();

    return newPosition;
  }

  /**
   * Create a new position
   * @param data New position data
   * @return Created position
   * @throws NotFoundError if company doesn't exist
   */
  async create(data: NewPosition): Promise<Position> {
    // Verify company exists
    await this.companyService.findByIdOrThrow(data.company_id);

    const [position] = await db
      .insert(positions)
      .values({
        company_id: data.company_id,
        title: data.title,
        salary_min: data.salary_min,
        salary_max: data.salary_max,
        requirements: data.requirements,
        job_url: data.job_url,
      })
      .returning();

    return position;
  }

  /**
   * Update a position
   * @param positionId ID of the position
   * @param data Updated position data
   * @return Updated position
   * @throws NotFoundError if position or company doesn't exist
   */
  async update(positionId: number, data: UpdatePosition): Promise<Position> {
    // Verify position exists
    await this.findByIdOrThrow(positionId);

    // If updating company_id, verify company exists
    if (data.company_id) {
      await this.companyService.findByIdOrThrow(data.company_id);
    }

    const [updated] = await db
      .update(positions)
      .set({
        company_id: data.company_id,
        title: data.title,
        salary_min: data.salary_min,
        salary_max: data.salary_max,
        requirements: data.requirements,
        job_url: data.job_url,
      })
      .where(eq(positions.id, positionId))
      .returning();

    return updated;
  }

  /**
   * Delete a position
   * @param positionId ID of the position
   * @return void
   * @throws NotFoundError if position doesn't exist
   */
  async delete(positionId: number): Promise<void> {
    // Verify position exists
    await this.findByIdOrThrow(positionId);

    await db.delete(positions).where(eq(positions.id, positionId));
  }
}

export const positionService = new PositionService();
