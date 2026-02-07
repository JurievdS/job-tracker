import { Request, Response } from "express";
import { DocumentService } from "../services/DocumentService.js";
import { DocumentSchema, UpdateDocumentSchema } from "../schemas/documents.js";

/**
 * Document Controller
 */
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  /**
   * GET /documents
   * List all documents for the authenticated user
   */
  list = async (req: Request, res: Response) => {
    const docType = req.query.type as string | undefined;
    const documents = await this.documentService.findAll(req.userId!, docType);
    res.json(documents);
  };

  /**
   * GET /documents/defaults
   * Get default documents for the authenticated user
   */
  getDefaults = async (req: Request, res: Response) => {
    const documents = await this.documentService.findDefaults(req.userId!);
    res.json(documents);
  };

  /**
   * GET /documents/:id
   * Get a single document by ID
   */
  getById = async (req: Request, res: Response) => {
    const documentId = Number(req.params.id);
    const document = await this.documentService.findByIdOrThrow(
      documentId,
      req.userId!
    );
    res.json(document);
  };

  /**
   * POST /documents
   * Create a new document
   */
  create = async (req: Request, res: Response) => {
    const data = DocumentSchema.parse(req.body);
    const document = await this.documentService.create(req.userId!, data);
    res.status(201).json(document);
  };

  /**
   * PUT /documents/:id
   * Update a document
   */
  update = async (req: Request, res: Response) => {
    const documentId = Number(req.params.id);
    const data = UpdateDocumentSchema.parse(req.body);
    const document = await this.documentService.update(
      documentId,
      req.userId!,
      data
    );
    res.json(document);
  };

  /**
   * DELETE /documents/:id
   * Delete a document
   */
  delete = async (req: Request, res: Response) => {
    const documentId = Number(req.params.id);
    await this.documentService.delete(documentId, req.userId!);
    res.status(204).send();
  };
}
