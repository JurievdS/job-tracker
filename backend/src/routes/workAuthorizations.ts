import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import { WorkAuthorizationController } from "../controllers/WorkAuthorizationController.js";
import { WorkAuthorizationService } from "../services/WorkAuthorizationService.js";

const router = Router();

const service = new WorkAuthorizationService();
const controller = new WorkAuthorizationController(service);

router.get("/", authenticate, asyncHandler(controller.list));
router.get("/:id", authenticate, asyncHandler(controller.getById));
router.post("/", authenticate, asyncHandler(controller.create));
router.put("/:id", authenticate, asyncHandler(controller.update));
router.delete("/:id", authenticate, asyncHandler(controller.delete));

export default router;
