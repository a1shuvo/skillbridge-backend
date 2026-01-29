import { Router } from "express";

import auth, { UserRole } from "../../middlewares/auth";
import { authController } from "./auth.controller";

const router = Router();

router.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.STUDENT, UserRole.TUTOR),
  authController.getMe,
);

export const authRouter: Router = router;
