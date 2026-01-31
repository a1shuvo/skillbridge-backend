import express, { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { adminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = express.Router();

// Get dashboard statistics
router.get("/stats", auth(UserRole.ADMIN), adminController.getDashboardStats);

// Get all users for the admin dashboard
router.get("/users", auth(UserRole.ADMIN), adminController.getAllUsers);

// Get all bookings for the admin dashboard
router.get("/bookings", auth(UserRole.ADMIN), adminController.getAllBookings);

// Update status or verify a tutor
router.patch(
  "/users/:id",
  auth(UserRole.ADMIN),
  validateRequest(AdminValidation.updateUserStatusSchema),
  adminController.updateUserStatus,
);

export const adminRouter: Router = router;
