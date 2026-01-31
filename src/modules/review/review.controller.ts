import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { reviewService } from "./review.service";

const createReview = catchAsync(async (req, res) => {
  const studentId = req.user!.id;
  const result = await reviewService.createReview(studentId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review submitted successfully!",
    data: result,
  });
});

export const reviewController = { createReview };
