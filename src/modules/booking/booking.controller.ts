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

export const bookingController = {
  createBooking,
};
