import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { bookingController } from "./booking.controller";
import { BookingValidation } from "./booking.validation";

const router = Router();

router.get(
  "/",
  auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  bookingController.getUserBookings,
);

router.get(
  "/:id",
  auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  bookingController.getSingleBooking,
);

router.post(
  "/",
  auth(UserRole.STUDENT),
  validateRequest(BookingValidation.createBookingSchema),
  bookingController.createBooking,
);

export const bookingRouter: Router = router;
