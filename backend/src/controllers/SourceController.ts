import { Request, Response } from "express";
import { SourceService } from "../services/SourceService.js";
import { SourceSchema, UpdateSourceSchema } from "../schemas/sources.js";
import { UserSourceNotesSchema } from "../schemas/userSourceNotes.js";

/**
 * Source Controller
 * Handles HTTP requests for job sources (job boards, recruiters, etc.)
 */
export class SourceController {
  constructor(private sourceService: SourceService) {}

  /**
   * GET /sources
   * List all active sources, ordered by popularity
   */
  list = async (_req: Request, res: Response) => {
    const sources = await this.sourceService.findAll();
    res.json(sources);
  };

  /**
   * GET /sources/search?q=...
   * Search sources by name
   */
  search = async (req: Request, res: Response) => {
    const term = (req.query.q as string) || "";
    const sources = await this.sourceService.search(term);
    res.json(sources);
  };

  /**
   * GET /sources/:id
   * Get a single source by ID
   */
  getById = async (req: Request, res: Response) => {
    const sourceId = Number(req.params.id);
    const source = await this.sourceService.findByIdOrThrow(sourceId);
    res.json(source);
  };

  /**
   * POST /sources
   * Create a new source (or return existing if name matches)
   */
  create = async (req: Request, res: Response) => {
    const data = SourceSchema.parse(req.body);
    const source = await this.sourceService.create(data);
    res.status(201).json(source);
  };

  /**
   * POST /sources/find-or-create
   * Find existing source by name or create new one
   * Useful for quick-create flows
   */
  findOrCreate = async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const source = await this.sourceService.findOrCreate(name);
    res.json(source);
  };

  /**
   * PUT /sources/:id
   * Update a source
   */
  update = async (req: Request, res: Response) => {
    const sourceId = Number(req.params.id);
    const data = UpdateSourceSchema.parse(req.body);
    const source = await this.sourceService.update(sourceId, data);
    res.json(source);
  };

  /**
   * DELETE /sources/:id
   * Soft delete a source (set is_active = false)
   */
  delete = async (req: Request, res: Response) => {
    const sourceId = Number(req.params.id);
    await this.sourceService.delete(sourceId);
    res.status(204).send();
  };

  // ==================== User Notes ====================

  /**
   * GET /sources/:id/notes
   * Get user's personal notes for a source
   */
  getUserNotes = async (req: Request, res: Response) => {
    const sourceId = Number(req.params.id);
    const notes = await this.sourceService.getUserNotes(req.userId!, sourceId);
    res.json(notes);
  };

  /**
   * PUT /sources/:id/notes
   * Set user's personal notes/rating for a source (upsert)
   */
  setUserNotes = async (req: Request, res: Response) => {
    const sourceId = Number(req.params.id);
    const data = UserSourceNotesSchema.parse(req.body);
    const notes = await this.sourceService.setUserNotes(req.userId!, sourceId, data);
    res.json(notes);
  };

  /**
   * DELETE /sources/:id/notes
   * Delete user's personal notes for a source
   */
  deleteUserNotes = async (req: Request, res: Response) => {
    const sourceId = Number(req.params.id);
    await this.sourceService.deleteUserNotes(req.userId!, sourceId);
    res.status(204).send();
  };
}
