import { prisma } from "../../lib/prisma";

const createCategory = async (name: string) => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return await prisma.category.create({
    data: { name, slug },
  });
};

const getAllCategories = async () => {
  const result = await prisma.category.findMany({
    include: { _count: { select: { tutorCategories: true } } },
  });

  return result.map((category) => ({
    ...category,
    totalTutors: category._count.tutorCategories,
  }));
};

const updateCategory = async (id: string, name: string) => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "-");
  return await prisma.category.update({
    where: { id },
    data: { name, slug },
  });
};

const deleteCategory = async (id: string) => {
  return await prisma.category.delete({
    where: { id },
  });
};

export const categoryService = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
