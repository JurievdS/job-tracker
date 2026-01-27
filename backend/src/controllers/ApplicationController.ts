import { Request, Response } from "express";
import { ApplicationService } from "../services/ApplicationService.js";
import {
  ApplicationSchema,
  UpdateApplicationSchema,
  QuickCreateApplicationSchema,
} from "../schemas/applications.js";

/**
 * Application Controller
 */
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  /**
   * GET /applications
   * List all applications for the authenticated user
   * with optional status filter
   * Returns a list of applications with related details
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
   * Returns an object with status counts
   */
  getStatusCounts = async (req: Request, res: Response) => {
    const counts = await this.applicationService.getStatusCounts(req.userId!);
    res.json(counts);
  };

  /**
   * GET /applications/:id
   * Get a single application by ID
   * Returns the application with related details
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
   * POST /applications
   * Create a new application
   * Returns the created application
   */
  create = async (req: Request, res: Response) => {
    const data = ApplicationSchema.parse(req.body);
    const application = await this.applicationService.create(req.userId!, data);
    res.status(201).json(application);
  };

  /**
   * POST /applications/quick
   * Quick create - accepts company name and position title instead of IDs
   * Creates company/contact if they don't exist and links them to the application
   * Returns the created application
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
   * Returns the updated application
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
   * Returns the updated application
   */
  updateStatus = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    const { status } = ApplicationSchema.pick({ status: true }).parse(req.body);
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
   * Returns 204 No Content on success
   */
  delete = async (req: Request, res: Response) => {
    const applicationId = Number(req.params.id);
    await this.applicationService.delete(applicationId, req.userId!);
    res.status(204).send();
  };
}
