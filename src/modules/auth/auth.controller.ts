import catchAsync from "../../utils/catchAsync";
import { authService } from "./auth.service";

const getMe = catchAsync(async (req, res) => {
  const result = await authService.getMe(req.user?.id as string);

  res.status(200).json({
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const updateMe = catchAsync(async (req, res) => {
  const result = await authService.updateMe(req.user?.id as string, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

export const authController = { getMe, updateMe };