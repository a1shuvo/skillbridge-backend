import express, { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { tutorController } from "./tutor.controller";
import {
  tutorFilterSchema,
  tutorIdParamSchema,
  updateAvailabilitySchema,
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
router.get(
  "/profile/me",
  auth(UserRole.TUTOR),
  tutorController.getMyTutorProfile,
);

router.put(
  "/profile",
  auth(UserRole.TUTOR),
  validateRequest(updateTutorProfileSchema),
  tutorController.updateTutorProfile,
);

router.put(
  "/availability",
  auth(UserRole.TUTOR),
  validateRequest(updateAvailabilitySchema),
  tutorController.updateAvailability,
);

export const tutorRouter: Router = router;