import { Router } from "express";
import { UserProfileController } from "../controllers/UserProfileController.js";
import { UserProfileService } from "../services/UserProfileService.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const userProfileService = new UserProfileService();
const controller = new UserProfileController(userProfileService);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: Profile not found
 */
router.get("/", authenticate, controller.get);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Create or update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfile'
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.put("/", authenticate, controller.upsert);

/**
 * @swagger
 * /api/profile:
 *   delete:
 *     summary: Delete user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Profile deleted
 */
router.delete("/", authenticate, controller.delete);

export default router;
