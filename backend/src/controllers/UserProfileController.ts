import { Request, Response } from "express";
import { UserProfileService } from "../services/UserProfileService.js";
import { UserProfileSchema } from "../schemas/userProfiles.js";

/**
 * User Profile Controller
 */
export class UserProfileController {
  constructor(private userProfileService: UserProfileService) {}

  /**
   * GET /profile
   * Get the authenticated user's profile
   */
  get = async (req: Request, res: Response) => {
    const profile = await this.userProfileService.findByUserId(req.userId!);
    if (!profile) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }
    res.json(profile);
  };

  /**
   * PUT /profile
   * Create or update the authenticated user's profile
   */
  upsert = async (req: Request, res: Response) => {
    const data = UserProfileSchema.parse(req.body);
    const profile = await this.userProfileService.upsert(req.userId!, data);
    res.json(profile);
  };

  /**
   * DELETE /profile
   * Delete the authenticated user's profile
   */
  delete = async (req: Request, res: Response) => {
    await this.userProfileService.delete(req.userId!);
    res.status(204).send();
  };
}
