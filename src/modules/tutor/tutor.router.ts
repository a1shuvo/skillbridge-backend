import express, { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { tutorController } from "./tutor.controller";
import {
  tutorFilterSchema,
  tutorIdParamSchema,
  updateTutorProfileSchema,
} from "./tutor.validation";

const router = express.Router();

// --- Public Routes ---
router.get(
  "/",
  validateRequest(tutorFilterSchema),
  tutorController.getAllTutors,
);

router.get(
  "/:id",
  validateRequest(tutorIdParamSchema),
  tutorController.getTutorById,
);

// --- Tutor Private Routes ---
router.put(
  "/profile",
  auth(UserRole.TUTOR),
  validateRequest(updateTutorProfileSchema),
  tutorController.updateTutorProfile,
);

export const tutorRouter: Router = router;
