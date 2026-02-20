import { Request, Response } from "express";
import { TagService } from "../services/TagService.js";
import { TagSchema, UpdateTagSchema } from "../schemas/tags.js";

/**
 * Tag Controller
 */
export class TagController {
  constructor(private tagService: TagService) {}

  /**
   * GET /tags
   * List all tags for the authenticated user
   */
  list = async (req: Request, res: Response) => {
    const tags = await this.tagService.findAll(req.userId!);
    res.json(tags);
  };

  /**
   * GET /tags/:id
   * Get a single tag by ID
   */
  getById = async (req: Request, res: Response) => {
    const tagId = Number(req.params.id);
    const tag = await this.tagService.findByIdOrThrow(tagId, req.userId!);
    res.json(tag);
  };

  /**
   * GET /tags/:id/applications
   * Get applications with a specific tag
   */
  getApplications = async (req: Request, res: Response) => {
    const tagId = Number(req.params.id);
    const applications = await this.tagService.getApplicationsByTag(
      tagId,
      req.userId!
    );
    res.json(applications);
  };

  /**
   * POST /tags
   * Create a new tag
   */
  create = async (req: Request, res: Response) => {
    const data = TagSchema.parse(req.body);
    const tag = await this.tagService.create(req.userId!, data);
    res.status(201).json(tag);
  };

  /**
   * PUT /tags/:id
   * Update a tag
   */
  update = async (req: Request, res: Response) => {
    const tagId = Number(req.params.id);
    const data = UpdateTagSchema.parse(req.body);
    const tag = await this.tagService.update(tagId, req.userId!, data);
    res.json(tag);
  };

  /**
   * DELETE /tags/:id
   * Delete a tag
   */
  delete = async (req: Request, res: Response) => {
    const tagId = Number(req.params.id);
    await this.tagService.delete(tagId, req.userId!);
    res.status(204).send();
  };
}
