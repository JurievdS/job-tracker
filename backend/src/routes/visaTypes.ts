import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import { VisaTypeController } from "../controllers/VisaTypeController.js";
import { VisaTypeService } from "../services/VisaTypeService.js";
import { VisaRequirementService } from "../services/VisaRequirementService.js";

const router = Router();

const visaTypeService = new VisaTypeService();
const visaRequirementService = new VisaRequirementService();
const controller = new VisaTypeController(visaTypeService, visaRequirementService);

// Visa type CRUD
router.get("/", authenticate, asyncHandler(controller.list));
router.get("/:id", authenticate, asyncHandler(controller.getById));
router.post("/", authenticate, asyncHandler(controller.create));
router.put("/:id", authenticate, asyncHandler(controller.update));
router.delete("/:id", authenticate, asyncHandler(controller.delete));

// Nested requirements
router.get("/:id/requirements", authenticate, asyncHandler(controller.listRequirements));
router.post("/:id/requirements", authenticate, asyncHandler(controller.createRequirement));

export default router;
