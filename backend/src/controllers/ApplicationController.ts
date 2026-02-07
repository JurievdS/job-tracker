import { Request, Response } from "express";
import { ApplicationService } from "../services/ApplicationService.js";
import {
  ApplicationSchema,
  UpdateApplicationSchema,
  QuickCreateApplicationSchema,
  UpdateStatusSchema,
} from "../schemas/applications.js";
import { ApplicationTagsSchema } from "../schemas/tags.js";
import { ApplicationDocumentsSchema } from "../schemas/documents.js";

/**
 * Application Controller
 */
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  /**
   * GET /applications
   * List all applications for the authenticated user
   * with optional status filter
   */
  list = async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const applications = await this.applicationService.findAll(
      req.userId!,
      status
    );
    res.json(applications);
  };

  /**
   * GET /applications/status-counts
   * Get application counts grouped by status
   */
  getStatusCounts = async (req: Request, res: Response) => {
    const counts = await this.applicationService.getStatusCounts(req.userId!);
    res.json(counts);
  };

  /**
   * GET /applications/source-metrics
   * Get metrics grouped by source
   */
  getSourceMetrics = async (req: Request, res: Response) => {
    const metrics = await this.applicationService.getSourceMetrics(req.userId!);
    res.json(metrics);
  };

  /**
   * GET /applications/:id
   * Get a single application by ID
   */
  getById = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const application = await this.applicationService.findByIdWithDetails(
      applicationId,
      req.userId!
    );
    res.json(application);
  };

  /**
   * GET /applications/:id/status-history
   * Get status history for an application
   */
  getStatusHistory = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const history = await this.applicationService.getStatusHistory(
      applicationId,
      req.userId!
    );
    res.json(history);
  };

  /**
   * POST /applications
   * Create a new application
   */
  create = async (req: Request, res: Response) => {
    const data = ApplicationSchema.parse(req.body);
    const application = await this.applicationService.create(req.userId!, data);
    res.status(201).json(application);
  };

  /**
   * POST /applications/quick
   * Quick create - accepts company name and job title
   */
  quickCreate = async (req: Request, res: Response) => {
    const data = QuickCreateApplicationSchema.parse(req.body);
    const application = await this.applicationService.quickCreate(
      req.userId!,
      data
    );
    res.status(201).json(application);
  };

  /**
   * PUT /applications/:id
   * Update an application
   */
  update = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const data = UpdateApplicationSchema.parse(req.body);
    const application = await this.applicationService.update(
      applicationId,
      req.userId!,
      data
    );
    res.json(application);
  };

  /**
   * PATCH /applications/:id/status
   * Update only the status of an application
   */
  updateStatus = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const { status } = UpdateStatusSchema.parse(req.body);
    const application = await this.applicationService.updateStatus(
      applicationId,
      req.userId!,
      status
    );
    res.json(application);
  };

  /**
   * DELETE /applications/:id
   * Delete an application
   */
  delete = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    await this.applicationService.delete(applicationId, req.userId!);
    res.status(204).send();
  };

  /**
   * POST /applications/:id/tags
   * Add tags to an application
   */
  addTags = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const { tag_ids } = ApplicationTagsSchema.parse(req.body);
    await this.applicationService.addTags(applicationId, req.userId!, tag_ids);
    res.status(204).send();
  };

  /**
   * DELETE /applications/:id/tags
   * Remove tags from an application
   */
  removeTags = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const { tag_ids } = ApplicationTagsSchema.parse(req.body);
    await this.applicationService.removeTags(applicationId, req.userId!, tag_ids);
    res.status(204).send();
  };

  /**
   * PUT /applications/:id/tags
   * Set tags for an application (replace all)
   */
  setTags = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const { tag_ids } = ApplicationTagsSchema.parse(req.body);
    await this.applicationService.setTags(applicationId, req.userId!, tag_ids);
    res.status(204).send();
  };

  // ============================================================================
  // DOCUMENT ENDPOINTS
  // ============================================================================

  /**
   * GET /applications/:id/documents
   * Get documents attached to an application
   */
  getDocuments = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const documents = await this.applicationService.getDocuments(
      applicationId,
      req.userId!
    );
    res.json(documents);
  };

  /**
   * POST /applications/:id/documents
   * Attach documents to an application
   */
  addDocuments = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const { document_ids, doc_role } = ApplicationDocumentsSchema.parse(req.body);
    await this.applicationService.addDocuments(
      applicationId,
      req.userId!,
      document_ids,
      doc_role
    );
    res.status(204).send();
  };

  /**
   * DELETE /applications/:id/documents/:docId
   * Remove a document from an application
   */
  removeDocument = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const documentId = Number(req.params.docId);
    await this.applicationService.removeDocument(
      applicationId,
      req.userId!,
      documentId
    );
    res.status(204).send();
  };

  /**
   * PUT /applications/:id/documents
   * Set documents for an application (replace all)
   */
  setDocuments = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const { document_ids, doc_role } = ApplicationDocumentsSchema.parse(req.body);
    await this.applicationService.setDocuments(
      applicationId,
      req.userId!,
      document_ids,
      doc_role
    );
    res.status(204).send();
  };
}
