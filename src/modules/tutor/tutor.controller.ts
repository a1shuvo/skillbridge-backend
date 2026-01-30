
import catchAsync from "../../utils/catchAsync";
import { tutorService } from "./tutor.service";


const getAllTutors = catchAsync(async (req, res) => {
  const result = await tutorService.getAllTutors(req.query);

  res.status(200).json({
    success: true,
    message: "Tutors retrieved successfully",
    data: result,
  });
});

export const tutorController = {
  getAllTutors,
};