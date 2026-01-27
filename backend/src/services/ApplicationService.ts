import { db } from "../db/index.js";
import { applications, positions, companies } from "../db/schema.js";
import { eq, desc, and, count } from "drizzle-orm";
import { NotFoundError } from "../errors/index.js";
import { CompanyService } from "./CompanyService.js";
import { PositionService } from "./PositionService.js";
import type { NewApplication, UpdateApplication } from "../schemas/applications.js";

// Infer types from the schema
type Application = typeof applications.$inferSelect;

// Application with joined position/company details
export interface ApplicationWithDetails {
  id: number;
  position_id: number | null;
  status: string | null;
  date_applied: string | null;
  notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  position_title: string;
  company_name: string;
}

// Input type for quick-create
export interface QuickCreateInput {
  company_name: string;
  position_title: string;
  status: "bookmarked" | "applied" | "phone_screen" | "technical" | "final_round" | "offer" | "rejected";
  date_applied?: string;
  notes?: string;
}

/**
 * Application Service
 */
export class ApplicationService {
  constructor(
    private companyService: CompanyService = new CompanyService(),
    private positionService: PositionService = new PositionService()
  ) {}

  /**
   * Get all applications for a user (with optional status filter)
   * @param status Optional status to filter by
   * @return List of applications with joined details
   */
  async findAll(userId: number, status?: string): Promise<ApplicationWithDetails[]> {
    const baseQuery = db
      .select({
        id: applications.id,
        position_id: applications.position_id,
        status: applications.status,
        date_applied: applications.date_applied,
        notes: applications.notes,
        created_at: applications.created_at,
        updated_at: applications.updated_at,
        position_title: positions.title,
        company_name: companies.name,
      })
      .from(applications)
      .innerJoin(positions, eq(applications.position_id, positions.id))
      .innerJoin(companies, eq(positions.company_id, companies.id))
      .orderBy(desc(applications.updated_at));

    if (status) {
      return baseQuery.where(
        and(eq(applications.status, status), eq(applications.user_id, userId))
      );
    }

    return baseQuery.where(eq(applications.user_id, userId));
  }

  /**
   * Get a single application by ID with joined details
   * @param applicationId ID of the application
   * @param userId ID of the user
   * @return Application with position and company details
   * @throws NotFoundError if not found or doesn't belong to user
   */
  async findByIdWithDetails(
    applicationId: number,
    userId: number
  ): Promise<ApplicationWithDetails> {
    const result = await db
      .select({
        id: applications.id,
        position_id: applications.position_id,
        status: applications.status,
        date_applied: applications.date_applied,
        notes: applications.notes,
        created_at: applications.created_at,
        updated_at: applications.updated_at,
        position_title: positions.title,
        company_name: companies.name,
      })
      .from(applications)
      .innerJoin(positions, eq(applications.position_id, positions.id))
      .innerJoin(companies, eq(positions.company_id, companies.id))
      .where(
        and(eq(applications.id, applicationId), eq(applications.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Application not found");
    }

    return result[0];
  }

  /**
   * Get a single application by ID (basic, no joins)
   * @param applicationId ID of the application
   * @param userId ID of the user
   * @return Application
   * @throws NotFoundError if not found or doesn't belong to user
   */
  async findByIdOrThrow(applicationId: number, userId: number): Promise<Application> {
    const result = await db
      .select()
      .from(applications)
      .where(
        and(eq(applications.id, applicationId), eq(applications.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Application not found");
    }

    return result[0];
  }

  /**
   * Get application counts grouped by status
   * @param userId ID of the user
   * @return Record mapping status to count
   */
  async getStatusCounts(userId: number): Promise<Record<string, number>> {
    const results = await db
      .select({
        status: applications.status,
        count: count(applications.id).as("count"),
      })
      .from(applications)
      .where(eq(applications.user_id, userId))
      .groupBy(applications.status);

    const counts: Record<string, number> = {};
    results.forEach((row) => {
      if (row.status) {
        counts[row.status] = Number(row.count);
      }
    });

    return counts;
  }

  /**
   * Create a new application
   * @param userId ID of the user
   * @param data Application data
   * @return Created application
   * @throws NotFoundError if position doesn't exist
   */
  async create(userId: number, data: NewApplication): Promise<Application> {
    // Verify position exists
    await this.positionService.findByIdOrThrow(data.position_id);

    const [application] = await db
      .insert(applications)
      .values({
        user_id: userId,
        position_id: data.position_id,
        status: data.status,
        date_applied: data.date_applied,
        notes: data.notes,
      })
      .returning();

    return application;
  }

  /**
   * Quick create - finds/creates company and position, then creates application
   * @param userId ID of the user
   * @param data Quick create application data
   * @return Application with position and company details
   */
  async quickCreate(
    userId: number,
    data: QuickCreateInput
  ): Promise<ApplicationWithDetails> {
    // 1. Find or create company (global)
    const company = await this.companyService.findOrCreate(data.company_name);

    // 2. Find or create position (global, tied to company)
    const position = await this.positionService.findOrCreate(
      company.id,
      data.position_title
    );

    // 3. Create application (user-specific)
    const [newApplication] = await db
      .insert(applications)
      .values({
        user_id: userId,
        position_id: position.id,
        status: data.status,
        date_applied: data.date_applied,
        notes: data.notes,
      })
      .returning();

    // 4. Return with joined data
    return this.findByIdWithDetails(newApplication.id, userId);
  }

  /**
   * Update an application
   * @param applicationId ID of the application
   * @param userId ID of the user
   * @param data Update data
   * @return Updated application
   * @throws NotFoundError if not found or doesn't belong to user
   */
  async update(
    applicationId: number,
    userId: number,
    data: UpdateApplication
  ): Promise<Application> {
    // Verify application exists and belongs to user
    await this.findByIdOrThrow(applicationId, userId);

    // If updating position_id, verify position exists
    if (data.position_id) {
      await this.positionService.findByIdOrThrow(data.position_id);
    }

    const [updated] = await db
      .update(applications)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(applications.id, applicationId))
      .returning();

    return updated;
  }

  /**
   * Update only the status of an application
   * @param applicationId ID of the application
   * @param userId ID of the user
   * @param status New status
   * @return Updated application
   * @throws NotFoundError if not found or doesn't belong to user
   */
  async updateStatus(
    applicationId: number,
    userId: number,
    status: string
  ): Promise<Application> {
    // Verify application exists and belongs to user
    await this.findByIdOrThrow(applicationId, userId);

    const [updated] = await db
      .update(applications)
      .set({
        status,
        updated_at: new Date(),
      })
      .where(eq(applications.id, applicationId))
      .returning();

    return updated;
  }

  /**
   * Delete an application
   * @param applicationId ID of the application
   * @param userId ID of the user
   * @return void
   * @throws NotFoundError if not found or doesn't belong to user
   */
  async delete(applicationId: number, userId: number): Promise<void> {
    // Verify application exists and belongs to user
    await this.findByIdOrThrow(applicationId, userId);

    await db.delete(applications).where(eq(applications.id, applicationId));
  }
}

export const applicationService = new ApplicationService();
