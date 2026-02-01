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
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
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
    throw new Error("User not found");
  }

  return result;
};

const updateMe = async (
  userId: string,
  payload: { name?: string; image?: string | null },
) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  // Update user
  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(payload.name && { name: payload.name }),
      ...(payload.image !== undefined && { image: payload.image }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
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

  return result;
};

export const authService = {
  getMe,
  updateMe,
};
