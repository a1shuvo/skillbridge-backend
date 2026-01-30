import * as z from "zod";

const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({
        message: "Category name must be a valid string",
      })
      .min(2, "Category name must be at least 2 characters long")
      .max(50, "Category name cannot exceed 50 characters"),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Category name must be at least 2 characters long")
      .max(50, "Category name cannot exceed 50 characters")
      .optional(),
  }),
});

export const CategoryValidation = {
  createCategorySchema,
  updateCategorySchema,
};
