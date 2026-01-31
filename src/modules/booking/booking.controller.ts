import { UserRole } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { bookingService } from "./booking.service";

const createBooking = catchAsync(async (req, res) => {
  const studentId = req.user?.id as string;
  const result = await bookingService.createBooking(studentId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Booking confirmed successfully!",
    data: result,
  });
});

const getUserBookings = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new Error("You are not authenticated!");
  }
  const { id, role } = req.user;

  const result = await bookingService.getUserBookings(id, role as UserRole);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved successfully",
    data: result,
  });
});

export const bookingController = {
  createBooking,
  getUserBookings,
};
