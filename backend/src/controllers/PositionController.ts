import { Request, Response } from "express";
import { PositionService } from "../services/PositionService.js";
import { PositionSchema, UpdatePositionSchema } from "../schemas/positions.js";

/**
 * Position Controller
*/
export class PositionController {
  constructor(private positionService: PositionService) {}

  /**
   * GET /positions
   * List all positions (optionally filtered by company)
   * Returns a list of positions with company details
   */
  list = async (req: Request, res: Response) => {
    const companyId = req.query.company_id
      ? Number(req.query.company_id)
      : undefined;
    const positions = await this.positionService.findAll(companyId);
    res.json(positions);
  };

  /**
   * GET /positions/:id
   * Get a single position by ID
   * Returns the position with company details
   */
  getById = async (req: Request, res: Response) => {
    const positionId = Number(req.params.id);
    const position = await this.positionService.findByIdWithDetails(positionId);
    res.json(position);
  };

  /**
   * POST /positions
   * Create a new position
   * Returns the created position
   */
  create = async (req: Request, res: Response) => {
    const data = PositionSchema.parse(req.body);
    const position = await this.positionService.create(data);
    res.status(201).json(position);
  };

  /**
   * PUT /positions/:id
   * Update a position
   * Returns the updated position
   */
  update = async (req: Request, res: Response) => {
    const positionId = Number(req.params.id);
    const data = UpdatePositionSchema.parse(req.body);
    const position = await this.positionService.update(positionId, data);
    res.json(position);
  };

  /**
   * DELETE /positions/:id
   * Delete a position
   * Returns 204 No Content on success
   */
  delete = async (req: Request, res: Response) => {
    const positionId = Number(req.params.id);
    await this.positionService.delete(positionId);
    res.status(204).send();
  };
}
