import { Router } from "express";
import { tutorController } from "./tutor.controller";

const router = Router();

router.get("/", tutorController.getAllTutors);

export const tutorRouter: Router = router;
