import { Request, Response } from "express";
import { VisaRequirementService } from "../services/VisaRequirementService.js";
import { UpdateVisaRequirementSchema } from "../schemas/visaRequirements.js";

/**
 * Visa Requirement Controller
 * Handles update/delete for individual requirements
 */
export class VisaRequirementController {
  constructor(private service: VisaRequirementService) {}

  /**
   * PUT /visa-requirements/:id
   */
  update = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = UpdateVisaRequirementSchema.parse(req.body);
    const item = await this.service.update(id, data);
    res.json(item);
  };

  /**
   * DELETE /visa-requirements/:id
   */
  delete = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await this.service.delete(id);
    res.status(204).send();
  };
}
