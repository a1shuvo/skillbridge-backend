import express, { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { tutorFilterSchema } from './tutor.validation';
import { tutorController } from './tutor.controller';

const router = express.Router();

router.get(
  '/', 
  validateRequest(tutorFilterSchema), // The guard is now active
  tutorController.getAllTutors
);

export const tutorRouter: Router = router;