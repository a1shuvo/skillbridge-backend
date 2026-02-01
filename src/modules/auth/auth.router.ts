import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { authController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.TUTOR),
  authController.getMe,
);

router.put(
  "/me",
  auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.TUTOR),
  validateRequest(AuthValidation.updateProfileSchema),
  authController.updateMe,
);

export const authRouter: Router = router;