import { db } from "../db/index.js";
import { applications, companies, statusHistory, tags, applicationTags, documents, applicationDocuments } from "../db/schema.js";
import { eq, desc, and, count, inArray, sql } from "drizzle-orm";
import { NotFoundError } from "../errors/index.js";
import { CompanyService } from "./CompanyService.js";
import type { NewApplication, UpdateApplication, QuickCreateApplication } from "../schemas/applications.js";

// Infer types from the schema
type Application = typeof applications.$inferSelect;

// Application with joined company details
export interface ApplicationWithDetails {
  id: number;
  company_id: number | null;
  job_title: string;
  job_url: string | null;
  job_description: string | null;
  requirements: string | null;
  location: string | null;
  remote_type: string | null;
  salary_advertised_min: number | null;
  salary_advertised_max: number | null;
  salary_offered: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  status: string | null;
  source: string;
  source_url: string | null;
  date_applied: string | null;
  date_responded: string | null;
  notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  company_name: string | null;
  tags?: { id: number; name: string; color: string | null }[];
}

/**
 * Application Service
 */
export class ApplicationService {
  constructor(
    private companyService: CompanyService = new CompanyService()
  ) {}

  /**
   * Get all applications for a user (with optional status filter)
   */
  async findAll(userId: number, status?: string): Promise<ApplicationWithDetails[]> {
    const baseQuery = db
      .select({
        id: applications.id,
        company_id: applications.company_id,
        job_title: applications.job_title,
        job_url: applications.job_url,
        job_description: applications.job_description,
        requirements: applications.requirements,
        location: applications.location,
        remote_type: applications.remote_type,
        salary_advertised_min: applications.salary_advertised_min,
        salary_advertised_max: applications.salary_advertised_max,
        salary_offered: applications.salary_offered,
        salary_currency: applications.salary_currency,
        salary_period: applications.salary_period,
        status: applications.status,
        source: applications.source,
        source_url: applications.source_url,
        date_applied: applications.date_applied,
        date_responded: applications.date_responded,
        notes: applications.notes,
        created_at: applications.created_at,
        updated_at: applications.updated_at,
        company_name: companies.name,
      })
      .from(applications)
      .leftJoin(companies, eq(applications.company_id, companies.id))
      .orderBy(desc(applications.updated_at));

    const conditions = [eq(applications.user_id, userId)];
    if (status) {
      conditions.push(eq(applications.status, status));
    }

    return baseQuery.where(and(...conditions));
  }

  /**
   * Get a single application by ID with joined details
   */
  async findByIdWithDetails(
    applicationId: number,
    userId: number
  ): Promise<ApplicationWithDetails> {
    const result = await db
      .select({
        id: applications.id,
        company_id: applications.company_id,
        job_title: applications.job_title,
        job_url: applications.job_url,
        job_description: applications.job_description,
        requirements: applications.requirements,
        location: applications.location,
        remote_type: applications.remote_type,
        salary_advertised_min: applications.salary_advertised_min,
        salary_advertised_max: applications.salary_advertised_max,
        salary_offered: applications.salary_offered,
        salary_currency: applications.salary_currency,
        salary_period: applications.salary_period,
        status: applications.status,
        source: applications.source,
        source_url: applications.source_url,
        date_applied: applications.date_applied,
        date_responded: applications.date_responded,
        notes: applications.notes,
        created_at: applications.created_at,
        updated_at: applications.updated_at,
        company_name: companies.name,
      })
      .from(applications)
      .leftJoin(companies, eq(applications.company_id, companies.id))
      .where(
        and(eq(applications.id, applicationId), eq(applications.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Application not found");
    }

    // Get tags for this application
    const appTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(applicationTags)
      .innerJoin(tags, eq(applicationTags.tag_id, tags.id))
      .where(eq(applicationTags.application_id, applicationId));

    return { ...result[0], tags: appTags };
  }

  /**
   * Get a single application by ID (basic, no joins)
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
   * Get metrics by source
   */
  async getSourceMetrics(userId: number) {
    const results = await db
      .select({
        source: applications.source,
        total: count(applications.id),
        applied: sql<number>`COUNT(*) FILTER (WHERE ${applications.status} != 'bookmarked')`,
        responded: sql<number>`COUNT(*) FILTER (WHERE ${applications.date_responded} IS NOT NULL)`,
        interviews: sql<number>`COUNT(*) FILTER (WHERE ${applications.status} = 'phone_screen' OR ${applications.status} = 'technical' OR ${applications.status} = 'final_round')`,
        offers: sql<number>`COUNT(*) FILTER (WHERE ${applications.status} = 'offer')`,
      })
      .from(applications)
      .where(eq(applications.user_id, userId))
      .groupBy(applications.source);

    return results;
  }

  /**
   * Create a new application
   */
  async create(userId: number, data: NewApplication): Promise<Application> {
    let companyId = data.company_id;

    // If company_name is provided but not company_id, find or create the company
    if (data.company_name && !companyId) {
      const company = await this.companyService.findOrCreate(data.company_name);
      companyId = company.id;
    }

    const [application] = await db
      .insert(applications)
      .values({
        user_id: userId,
        company_id: companyId,
        job_title: data.job_title,
        job_url: data.job_url === "" ? null : data.job_url,
        job_description: data.job_description,
        requirements: data.requirements,
        location: data.location,
        remote_type: data.remote_type,
        salary_advertised_min: data.salary_advertised_min,
        salary_advertised_max: data.salary_advertised_max,
        salary_currency: data.salary_currency,
        salary_period: data.salary_period,
        status: data.status,
        source: data.source,
        source_url: data.source_url === "" ? null : data.source_url,
        date_applied: data.date_applied,
        notes: data.notes,
      })
      .returning();

    // Record initial status in history
    await db.insert(statusHistory).values({
      application_id: application.id,
      from_status: null,
      to_status: application.status || "bookmarked",
    });

    return application;
  }

  /**
   * Quick create - finds/creates company, then creates application
   */
  async quickCreate(
    userId: number,
    data: QuickCreateApplication
  ): Promise<ApplicationWithDetails> {
    // Find or create company
    const company = await this.companyService.findOrCreate(data.company_name);

    // Create application
    const [newApplication] = await db
      .insert(applications)
      .values({
        user_id: userId,
        company_id: company.id,
        job_title: data.job_title,
        source: data.source,
        status: data.status,
        job_url: data.job_url === "" ? null : data.job_url,
        date_applied: data.date_applied,
        notes: data.notes,
      })
      .returning();

    // Record initial status in history
    await db.insert(statusHistory).values({
      application_id: newApplication.id,
      from_status: null,
      to_status: newApplication.status || "bookmarked",
    });

    return this.findByIdWithDetails(newApplication.id, userId);
  }

  /**
   * Update an application
   */
  async update(
    applicationId: number,
    userId: number,
    data: UpdateApplication
  ): Promise<Application> {
    const existing = await this.findByIdOrThrow(applicationId, userId);

    // Track status change if status is being updated
    if (data.status && data.status !== existing.status) {
      await db.insert(statusHistory).values({
        application_id: applicationId,
        from_status: existing.status,
        to_status: data.status,
      });
    }

    const [updated] = await db
      .update(applications)
      .set({
        ...data,
        job_url: data.job_url === "" ? null : data.job_url,
        source_url: data.source_url === "" ? null : data.source_url,
        updated_at: new Date(),
      })
      .where(eq(applications.id, applicationId))
      .returning();

    return updated;
  }

  /**
   * Update only the status of an application
   */
  async updateStatus(
    applicationId: number,
    userId: number,
    status: string
  ): Promise<Application> {
    const existing = await this.findByIdOrThrow(applicationId, userId);

    // Record status change
    await db.insert(statusHistory).values({
      application_id: applicationId,
      from_status: existing.status,
      to_status: status,
    });

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
   */
  async delete(applicationId: number, userId: number): Promise<void> {
    await this.findByIdOrThrow(applicationId, userId);
    await db.delete(applications).where(eq(applications.id, applicationId));
  }

  /**
   * Get status history for an application
   */
  async getStatusHistory(applicationId: number, userId: number) {
    await this.findByIdOrThrow(applicationId, userId);

    return db
      .select()
      .from(statusHistory)
      .where(eq(statusHistory.application_id, applicationId))
      .orderBy(desc(statusHistory.changed_at));
  }

  /**
   * Add tags to an application
   */
  async addTags(applicationId: number, userId: number, tagIds: number[]): Promise<void> {
    await this.findByIdOrThrow(applicationId, userId);

    // Verify all tags belong to the user
    const userTags = await db
      .select()
      .from(tags)
      .where(and(inArray(tags.id, tagIds), eq(tags.user_id, userId)));

    if (userTags.length !== tagIds.length) {
      throw new NotFoundError("One or more tags not found");
    }

    // Insert tags (ignore duplicates)
    for (const tagId of tagIds) {
      await db
        .insert(applicationTags)
        .values({ application_id: applicationId, tag_id: tagId })
        .onConflictDoNothing();
    }
  }

  /**
   * Remove tags from an application
   */
  async removeTags(applicationId: number, userId: number, tagIds: number[]): Promise<void> {
    await this.findByIdOrThrow(applicationId, userId);

    await db
      .delete(applicationTags)
      .where(
        and(
          eq(applicationTags.application_id, applicationId),
          inArray(applicationTags.tag_id, tagIds)
        )
      );
  }

  /**
   * Set tags for an application (replace all)
   */
  async setTags(applicationId: number, userId: number, tagIds: number[]): Promise<void> {
    await this.findByIdOrThrow(applicationId, userId);

    // Remove all existing tags
    await db
      .delete(applicationTags)
      .where(eq(applicationTags.application_id, applicationId));

    // Add new tags
    if (tagIds.length > 0) {
      await this.addTags(applicationId, userId, tagIds);
    }
  }

  // ============================================================================
  // DOCUMENT METHODS
  // ============================================================================

  /**
   * Get documents attached to an application
   */
  async getDocuments(applicationId: number, userId: number) {
    await this.findByIdOrThrow(applicationId, userId);

    return db
      .select({
        id: documents.id,
        doc_type: documents.doc_type,
        label: documents.label,
        file_path: documents.file_path,
        is_default: documents.is_default,
        doc_role: applicationDocuments.doc_role,
        attached_at: applicationDocuments.attached_at,
      })
      .from(applicationDocuments)
      .innerJoin(documents, eq(applicationDocuments.document_id, documents.id))
      .where(eq(applicationDocuments.application_id, applicationId))
      .orderBy(desc(applicationDocuments.attached_at));
  }

  /**
   * Attach documents to an application
   */
  async addDocuments(
    applicationId: number,
    userId: number,
    documentIds: number[],
    docRole?: string
  ): Promise<void> {
    await this.findByIdOrThrow(applicationId, userId);

    // Verify all documents belong to the user
    const userDocs = await db
      .select()
      .from(documents)
      .where(and(inArray(documents.id, documentIds), eq(documents.user_id, userId)));

    if (userDocs.length !== documentIds.length) {
      throw new NotFoundError("One or more documents not found");
    }

    // Insert document links (ignore duplicates)
    for (const docId of documentIds) {
      await db
        .insert(applicationDocuments)
        .values({
          application_id: applicationId,
          document_id: docId,
          doc_role: docRole,
        })
        .onConflictDoNothing();
    }
  }

  /**
   * Remove a document from an application
   */
  async removeDocument(
    applicationId: number,
    userId: number,
    documentId: number
  ): Promise<void> {
    await this.findByIdOrThrow(applicationId, userId);

    await db
      .delete(applicationDocuments)
      .where(
        and(
          eq(applicationDocuments.application_id, applicationId),
          eq(applicationDocuments.document_id, documentId)
        )
      );
  }

  /**
   * Set documents for an application (replace all)
   */
  async setDocuments(
    applicationId: number,
    userId: number,
    documentIds: number[],
    docRole?: string
  ): Promise<void> {
    await this.findByIdOrThrow(applicationId, userId);

    // Remove all existing document links
    await db
      .delete(applicationDocuments)
      .where(eq(applicationDocuments.application_id, applicationId));

    // Add new documents
    if (documentIds.length > 0) {
      await this.addDocuments(applicationId, userId, documentIds, docRole);
    }
  }
}

export const applicationService = new ApplicationService();
