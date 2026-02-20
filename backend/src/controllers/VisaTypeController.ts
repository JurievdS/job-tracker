import { Request, Response } from "express";
import { VisaTypeService } from "../services/VisaTypeService.js";
import { VisaRequirementService } from "../services/VisaRequirementService.js";
import { VisaTypeSchema, UpdateVisaTypeSchema } from "../schemas/visaTypes.js";
import { VisaRequirementSchema } from "../schemas/visaRequirements.js";

/**
 * Visa Type Controller
 */
export class VisaTypeController {
  constructor(
    private visaTypeService: VisaTypeService,
    private visaRequirementService: VisaRequirementService
  ) {}

  /**
   * GET /visa-types
   * List all visa types (optional ?country=NLD filter)
   */
  list = async (req: Request, res: Response) => {
    const country = req.query.country as string | undefined;
    const items = await this.visaTypeService.findAll(country);
    res.json(items);
  };

  /**
   * GET /visa-types/:id
   */
  getById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const item = await this.visaTypeService.findByIdOrThrow(id);
    res.json(item);
  };

  /**
   * POST /visa-types
   */
  create = async (req: Request, res: Response) => {
    const data = VisaTypeSchema.parse(req.body);
    const item = await this.visaTypeService.create(data);
    res.status(201).json(item);
  };

  /**
   * PUT /visa-types/:id
   */
  update = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = UpdateVisaTypeSchema.parse(req.body);
    const item = await this.visaTypeService.update(id, data);
    res.json(item);
  };

  /**
   * DELETE /visa-types/:id
   */
  delete = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await this.visaTypeService.delete(id);
    res.status(204).send();
  };

  // ==================== Nested Requirements ====================

  /**
   * GET /visa-types/:id/requirements
   */
  listRequirements = async (req: Request, res: Response) => {
    const visaTypeId = Number(req.params.id);
    const items = await this.visaRequirementService.findByVisaType(visaTypeId);
    res.json(items);
  };

  /**
   * POST /visa-types/:id/requirements
   */
  createRequirement = async (req: Request, res: Response) => {
    const visaTypeId = Number(req.params.id);
    const data = VisaRequirementSchema.parse({ ...req.body, visa_type_id: visaTypeId });
    const item = await this.visaRequirementService.create(data);
    res.status(201).json(item);
  };
}
