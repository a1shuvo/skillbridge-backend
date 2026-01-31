import * as z from "zod";

const updateUserStatusSchema = z.object({
  body: z
    .object({
      status: z.enum(["ACTIVE", "BANNED"]).optional(),
      isVerified: z.boolean().optional(),
    })
    .refine(
      (data) => data.status !== undefined || data.isVerified !== undefined,
      {
        message: "At least one field (status or isVerified) must be provided",
      },
    ),
});

export const AdminValidation = {
  updateUserStatusSchema,
};
