import express, { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { tutorController } from "./tutor.controller";
import { tutorFilterSchema } from "./tutor.validation";

const router = express.Router();

router.get(
  "/",
  validateRequest(tutorFilterSchema), // The guard is now active
  tutorController.getAllTutors,
);

router.get("/:id", tutorController.getTutorById);

export const tutorRouter: Router = router;
