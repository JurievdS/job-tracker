import { Request, Response } from "express";
import { FormTemplateService } from "../services/FormTemplateService.js";
import { FormTemplateSchema, UpdateFormTemplateSchema, UpdateSuccessRateSchema } from "../schemas/formTemplates.js";

/**
 * Form Template Controller
 */
export class FormTemplateController {
  constructor(private formTemplateService: FormTemplateService) {}

  /**
   * GET /form-templates
   * List all form templates for the authenticated user
   */
  list = async (req: Request, res: Response) => {
    const templates = await this.formTemplateService.findAll(req.userId!);
    res.json(templates);
  };

  /**
   * GET /form-templates/domain/:domain
   * Get a form template by domain
   */
  getByDomain = async (req: Request, res: Response) => {
    const domain = req.params.domain;
    const template = await this.formTemplateService.findByDomain(
      req.userId!,
      domain
    );
    if (!template) {
      res.status(404).json({ message: "Template not found for this domain" });
      return;
    }
    res.json(template);
  };

  /**
   * GET /form-templates/:id
   * Get a form template by ID
   */
  getById = async (req: Request, res: Response) => {
    const templateId = Number(req.params.id);
    const template = await this.formTemplateService.findByIdOrThrow(
      templateId,
      req.userId!
    );
    res.json(template);
  };

  /**
   * POST /form-templates
   * Create a new form template
   */
  create = async (req: Request, res: Response) => {
    const data = FormTemplateSchema.parse(req.body);
    const template = await this.formTemplateService.create(req.userId!, data);
    res.status(201).json(template);
  };

  /**
   * PUT /form-templates/:id
   * Update a form template
   */
  update = async (req: Request, res: Response) => {
    const templateId = Number(req.params.id);
    const data = UpdateFormTemplateSchema.parse(req.body);
    const template = await this.formTemplateService.update(
      templateId,
      req.userId!,
      data
    );
    res.json(template);
  };

  /**
   * POST /form-templates/:id/usage
   * Record template usage
   */
  recordUsage = async (req: Request, res: Response) => {
    const templateId = Number(req.params.id);
    await this.formTemplateService.recordUsage(templateId, req.userId!);
    res.status(204).send();
  };

  /**
   * PATCH /form-templates/:id/success-rate
   * Update template success rate
   */
  updateSuccessRate = async (req: Request, res: Response) => {
    const templateId = Number(req.params.id);
    const { success_rate } = UpdateSuccessRateSchema.parse(req.body);
    await this.formTemplateService.updateSuccessRate(templateId, req.userId!, success_rate);
    res.status(204).send();
  };

  /**
   * DELETE /form-templates/:id
   * Delete a form template
   */
  delete = async (req: Request, res: Response) => {
    const templateId = Number(req.params.id);
    await this.formTemplateService.delete(templateId, req.userId!);
    res.status(204).send();
  };
}
