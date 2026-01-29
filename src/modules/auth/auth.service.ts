import { prisma } from "../../lib/prisma";

const getMe = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tutorProfile: true,
    },
  });

  if (!result) {
    throw new Error("User not found in database");
  }

  return result;
};

export const authService = {
  getMe,
};
