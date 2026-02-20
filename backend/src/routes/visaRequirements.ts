import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import { VisaRequirementController } from "../controllers/VisaRequirementController.js";
import { VisaRequirementService } from "../services/VisaRequirementService.js";

const router = Router();

const service = new VisaRequirementService();
const controller = new VisaRequirementController(service);

router.put("/:id", authenticate, asyncHandler(controller.update));
router.delete("/:id", authenticate, asyncHandler(controller.delete));

export default router;
