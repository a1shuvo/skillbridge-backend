import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { tutorService } from "./tutor.service";
import { ITutorQuery } from "./tutor.validation";

const getAllTutors = catchAsync(async (req, res) => {
  const query = req.query as unknown as ITutorQuery;
  const { meta, data } = await tutorService.getAllTutors(query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutors retrieved successfully",
    meta,
    data,
  });
});

export const tutorController = {
  getAllTutors,
};
