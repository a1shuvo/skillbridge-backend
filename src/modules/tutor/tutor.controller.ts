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

const getTutorById = catchAsync(async (req, res) => {
  const id = req.params.id as string;
  const result = await tutorService.getTutorById(id);

  // No 'if (!result)' needed here because the service now throws the error
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutor profile retrieved successfully",
    data: result,
  });
});

const updateTutorProfile = catchAsync(async (req, res) => {
  const userId = req.user!.id;

  const result = await tutorService.updateTutorProfile(userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutor profile updated successfully",
    data: result,
  });
});

const updateAvailability = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const { slots } = req.body;

  const result = await tutorService.updateAvailability(userId, slots);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Availability slots updated successfully",
    data: result,
  });
});

export const tutorController = {
  getAllTutors,
  getTutorById,
  updateTutorProfile,
  updateAvailability,
};
