import { db } from "../db/index.js";
import { applications, companies, statusHistory, tags, applicationTags, documents, applicationDocuments, sources, workAuthorizations, visaTypes } from "../db/schema.js";
import { eq, desc, and, count, inArray, sql } from "drizzle-orm";
import { NotFoundError } from "../errors/index.js";
import { CompanyService } from "./CompanyService.js";
import { SourceService } from "./SourceService.js";
import type { NewApplication, UpdateApplication, QuickCreateApplication } from "../schemas/applications.js";

// Infer types from the schema
type Application = typeof applications.$inferSelect;
type WorkAuthorization = typeof workAuthorizations.$inferSelect;

// Eligibility status computed from work authorizations
export interface Eligibility {
  status: 'authorized' | 'sponsorship_available' | 'not_authorized' | 'expired' | 'unknown';
  auth_type?: string;
  expiry_date?: string;
}

/**
 * Compute eligibility for an application based on user's work authorizations.
 */
export function computeEligibility(
  roleCountryCode: string | null,
  visaSponsorship: string | null,
  userAuths: WorkAuthorization[]
): Eligibility | null {
  if (!roleCountryCode) return null;

  const matching = userAuths.filter(
    (a) => a.country_code === roleCountryCode
  );

  if (matching.length > 0) {
    // Find best match: prefer non-expired, then by strongest status
    const now = new Date().toISOString().split('T')[0];
    const valid = matching.filter((a) => !a.expiry_date || a.expiry_date >= now);

    if (valid.length > 0) {
      // Pick the strongest auth (citizen > permanent_resident > others)
      const priority = ['citizen', 'permanent_resident', 'work_permit', 'schengen_visa', 'student_visa', 'dependent_visa'];
      valid.sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status));
      const best = valid[0];
      return {
        status: 'authorized',
        auth_type: best.status,
        ...(best.expiry_date ? { expiry_date: best.expiry_date } : {}),
      };
    }

    // All matches are expired — return the most recently expired
    matching.sort((a, b) => (b.expiry_date || '').localeCompare(a.expiry_date || ''));
    const mostRecent = matching[0];
    return {
      status: 'expired',
      auth_type: mostRecent.status,
      expiry_date: mostRecent.expiry_date || undefined,
    };
  }

  // No matching work auth for this country
  if (visaSponsorship === 'yes') return { status: 'sponsorship_available' };
  if (visaSponsorship === 'no') return { status: 'not_authorized' };
  return { status: 'unknown' };
}

// Application with joined company and source details
export interface ApplicationWithDetails {
  id: number;
  company_id: number | null;
  source_id: number | null;
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
  visa_sponsorship: string | null;
  role_country_code: string | null;
  status: string | null;
  source_name: string | null;
  source_url: string | null;
  date_applied: string | null;
  date_responded: string | null;
  notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  company_name: string | null;
  visa_type_id: number | null;
  visa_type_name: string | null;
  tags?: { id: number; name: string; color: string | null }[];
  eligibility: Eligibility | null;
}

/**
 * Application Service
 */
export class ApplicationService {
  constructor(
    private companyService: CompanyService = new CompanyService(),
    private sourceService: SourceService = new SourceService()
  ) {}

  /**
   * Get all applications for a user (with optional status filter)
   */
  async findAll(userId: number, status?: string, companyId?: number): Promise<ApplicationWithDetails[]> {
    // Fetch user's work authorizations once for eligibility computation
    const userAuths = await db
      .select()
      .from(workAuthorizations)
      .where(eq(workAuthorizations.user_id, userId));

    const baseQuery = db
      .select({
        id: applications.id,
        company_id: applications.company_id,
        source_id: applications.source_id,
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
        visa_sponsorship: applications.visa_sponsorship,
        role_country_code: applications.role_country_code,
        visa_type_id: applications.visa_type_id,
        visa_type_name: visaTypes.name,
        status: applications.status,
        source_name: sources.name,
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
      .leftJoin(sources, eq(applications.source_id, sources.id))
      .leftJoin(visaTypes, eq(applications.visa_type_id, visaTypes.id))
      .orderBy(desc(applications.updated_at));

    const conditions = [eq(applications.user_id, userId)];
    if (status) {
      conditions.push(eq(applications.status, status));
    }
    if (companyId) {
      conditions.push(eq(applications.company_id, companyId));
    }

    const rows = await baseQuery.where(and(...conditions));

    // Batch-fetch tags for all applications (avoids N+1)
    const appIds = rows.map((r) => r.id);
    const allAppTags = appIds.length > 0
      ? await db
          .select({
            application_id: applicationTags.application_id,
            id: tags.id,
            name: tags.name,
            color: tags.color,
          })
          .from(applicationTags)
          .innerJoin(tags, eq(applicationTags.tag_id, tags.id))
          .where(inArray(applicationTags.application_id, appIds))
      : [];

    const tagsByAppId = new Map<number, { id: number; name: string; color: string | null }[]>();
    for (const t of allAppTags) {
      if (!tagsByAppId.has(t.application_id)) tagsByAppId.set(t.application_id, []);
      tagsByAppId.get(t.application_id)!.push({ id: t.id, name: t.name, color: t.color });
    }

    return rows.map((row) => ({
      ...row,
      tags: tagsByAppId.get(row.id) || [],
      eligibility: computeEligibility(row.role_country_code, row.visa_sponsorship, userAuths),
    }));
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
        source_id: applications.source_id,
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
        visa_sponsorship: applications.visa_sponsorship,
        role_country_code: applications.role_country_code,
        visa_type_id: applications.visa_type_id,
        visa_type_name: visaTypes.name,
        status: applications.status,
        source_name: sources.name,
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
      .leftJoin(sources, eq(applications.source_id, sources.id))
      .leftJoin(visaTypes, eq(applications.visa_type_id, visaTypes.id))
      .where(
        and(eq(applications.id, applicationId), eq(applications.user_id, userId))
      );

    if (result.length === 0) {
      throw new NotFoundError("Application not found");
    }

    // Fetch work authorizations and tags in parallel
    const [appTags, userAuths] = await Promise.all([
      db
        .select({
          id: tags.id,
          name: tags.name,
          color: tags.color,
        })
        .from(applicationTags)
        .innerJoin(tags, eq(applicationTags.tag_id, tags.id))
        .where(eq(applicationTags.application_id, applicationId)),
      db
        .select()
        .from(workAuthorizations)
        .where(eq(workAuthorizations.user_id, userId)),
    ]);

    const row = result[0];
    return {
      ...row,
      tags: appTags,
      eligibility: computeEligibility(row.role_country_code, row.visa_sponsorship, userAuths),
    };
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
        source_id: applications.source_id,
        source_name: sources.name,
        total: count(applications.id),
        applied: sql<number>`COUNT(*) FILTER (WHERE ${applications.status} != 'bookmarked')`,
        responded: sql<number>`COUNT(*) FILTER (WHERE ${applications.date_responded} IS NOT NULL)`,
        interviews: sql<number>`COUNT(*) FILTER (WHERE ${applications.status} = 'phone_screen' OR ${applications.status} = 'technical' OR ${applications.status} = 'final_round')`,
        offers: sql<number>`COUNT(*) FILTER (WHERE ${applications.status} = 'offer')`,
      })
      .from(applications)
      .leftJoin(sources, eq(applications.source_id, sources.id))
      .where(eq(applications.user_id, userId))
      .groupBy(applications.source_id, sources.name);

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

    // Find or create source by name
    const source = await this.sourceService.findOrCreate(data.source);
    await this.sourceService.incrementUsage(source.id);

    const [application] = await db
      .insert(applications)
      .values({
        user_id: userId,
        company_id: companyId,
        source_id: source.id,
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
        visa_sponsorship: data.visa_sponsorship,
        role_country_code: data.role_country_code,
        visa_type_id: data.visa_type_id,
        status: data.status,
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
   * Quick create - finds/creates company and source, then creates application
   */
  async quickCreate(
    userId: number,
    data: QuickCreateApplication
  ): Promise<ApplicationWithDetails> {
    // Find or create company
    const company = await this.companyService.findOrCreate(data.company_name);

    // Find or create source by name
    const source = await this.sourceService.findOrCreate(data.source);
    await this.sourceService.incrementUsage(source.id);

    // Create application
    const [newApplication] = await db
      .insert(applications)
      .values({
        user_id: userId,
        company_id: company.id,
        source_id: source.id,
        job_title: data.job_title,
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

    // Convert source name to source_id if provided
    let sourceId: number | undefined;
    if (data.source) {
      const source = await this.sourceService.findOrCreate(data.source);
      await this.sourceService.incrementUsage(source.id);
      sourceId = source.id;
    }

    // Extract source from data to avoid spreading it (it's a name, not an id)
    const { source: _sourceName, ...updateData } = data;

    const [updated] = await db
      .update(applications)
      .set({
        ...updateData,
        ...(sourceId !== undefined && { source_id: sourceId }),
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
