import { prisma } from "../../lib/prisma";

const getAllCategories = async () => {
  const result = await prisma.category.findMany({
    include: { _count: { select: { tutorCategories: true } } },
  });

  return result.map((category) => ({
    ...category,
    totalTutors: category._count.tutorCategories,
  }));
};

export const categoryService = {
  getAllCategories,
};
