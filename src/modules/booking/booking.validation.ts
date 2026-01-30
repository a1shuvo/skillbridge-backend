import { z } from "zod";

const createBookingSchema = z.object({
  body: z.object({
    tutorId: z.string({ error: "Tutor ID is required" }),
    slotId: z.string({ error: "Please select an availability slot" }),
    note: z.string().max(500, "Note is too long").optional(),
  }),
});

export const BookingValidation = {
  createBookingSchema,
};
