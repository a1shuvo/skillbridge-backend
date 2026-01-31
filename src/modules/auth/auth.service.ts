import { prisma } from "../../lib/prisma";

const getMe = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      status: true,
      createdAt: true,
      // Only include profile if they are a tutor
      tutorProfile: {
        select: {
          bio: true,
          categories: true,
          hourlyRate: true,
          isVerified: true,
          avgRating: true,
        },
      },
    },
  });

  if (!result) {
    // Better to use a custom AppError class if you have one
    throw new Error("User not found");
  }

  return result;
};

export const authService = {
  getMe,
};
