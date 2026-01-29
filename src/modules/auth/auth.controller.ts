import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";


const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.getMe(req.user?.id as string);

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  getMe,
};