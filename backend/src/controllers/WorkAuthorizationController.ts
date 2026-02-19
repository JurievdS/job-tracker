import { Request, Response } from "express";
import { WorkAuthorizationService } from "../services/WorkAuthorizationService.js";
import { WorkAuthorizationSchema, UpdateWorkAuthorizationSchema } from "../schemas/workAuthorizations.js";

/**
 * Work Authorization Controller
 */
export class WorkAuthorizationController {
  constructor(private service: WorkAuthorizationService) {}

  /**
   * GET /work-authorizations
   */
  list = async (req: Request, res: Response) => {
    const items = await this.service.findAll(req.userId!);
    res.json(items);
  };

  /**
   * GET /work-authorizations/:id
   */
  getById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const item = await this.service.findByIdOrThrow(id, req.userId!);
    res.json(item);
  };

  /**
   * POST /work-authorizations
   */
  create = async (req: Request, res: Response) => {
    const data = WorkAuthorizationSchema.parse(req.body);
    const item = await this.service.create(req.userId!, data);
    res.status(201).json(item);
  };

  /**
   * PUT /work-authorizations/:id
   */
  update = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = UpdateWorkAuthorizationSchema.parse(req.body);
    const item = await this.service.update(id, req.userId!, data);
    res.json(item);
  };

  /**
   * DELETE /work-authorizations/:id
   */
  delete = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await this.service.delete(id, req.userId!);
    res.status(204).send();
  };
}
