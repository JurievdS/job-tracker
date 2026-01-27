import { Request, Response } from "express";
import { InteractionService } from "../services/InteractionService.js";
import {
  InteractionSchema,
  UpdateInteractionSchema,
} from "../schemas/interactions.js";

/**
 * Interaction Controller
 */
export class InteractionController {
  constructor(private interactionService: InteractionService) {}

  /**
   * GET /interactions
   * List all interactions for the authenticated user
   * with optional application filter
   */
  list = async (req: Request, res: Response) => {
    const applicationId = req.query.application_id
      ? Number(req.query.application_id)
      : undefined;
    const interactions = await this.interactionService.findAll(
      req.userId!,
      applicationId
    );
    res.json(interactions);
  };

  /**
   * GET /interactions/:id
   * Get a single interaction by ID
   * Returns the interaction with related details
   */
  getById = async (req: Request, res: Response) => {
    const interactionId = Number(req.params.id);
    const interaction = await this.interactionService.findByIdWithDetails(
      interactionId,
      req.userId!
    );
    res.json(interaction);
  };

  /**
   * POST /interactions
   * Create a new interaction
   * Returns the created interaction
   */
  create = async (req: Request, res: Response) => {
    const data = InteractionSchema.parse(req.body);
    const interaction = await this.interactionService.create(req.userId!, data);
    res.status(201).json(interaction);
  };

  /**
   * PUT /interactions/:id
   * Update an interaction
   * Returns the updated interaction
   */
  update = async (req: Request, res: Response) => {
    const interactionId = Number(req.params.id);
    const data = UpdateInteractionSchema.parse(req.body);
    const interaction = await this.interactionService.update(
      interactionId,
      req.userId!,
      data
    );
    res.json(interaction);
  };

  /**
   * DELETE /interactions/:id
   * Delete an interaction
   * Returns 204 No Content on success
   */
  delete = async (req: Request, res: Response) => {
    const interactionId = Number(req.params.id);
    await this.interactionService.delete(interactionId, req.userId!);
    res.status(204).send();
  };
}
