import { z } from "zod";

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    image: z.string().url("Invalid image URL").optional().nullable(),
  }),
});

export const AuthValidation = {
  updateProfileSchema,
};