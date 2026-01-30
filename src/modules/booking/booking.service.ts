import { prisma } from "../../lib/prisma";

const createBooking = async (
  studentId: string,
  payload: { tutorId: string; slotId: string; note?: string },
) => {
  const { tutorId, slotId, note } = payload;

  // 1. Prevent self-booking
  if (studentId === tutorId) {
    throw new Error("You cannot book a session with yourself.");
  }

  // 2. Use a Transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Check if slot exists and is not already booked
    const slot = await tx.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new Error("The selected time slot does not exist.");
    }

    if (slot.isBooked) {
      throw new Error("This slot has already been booked by another student.");
    }

    // Create the booking record
    const booking = await tx.booking.create({
      data: {
        studentId,
        tutorId,
        slotId,
        note: note ?? null,
        status: "CONFIRMED",
      },
      include: {
        slot: true, // Returns the time details in the response
        tutor: { select: { name: true, email: true } },
      },
    });

    // Mark the slot as booked
    await tx.availabilitySlot.update({
      where: { id: slotId },
      data: { isBooked: true },
    });

    return booking;
  });

  return result;
};

export const bookingService = {
  createBooking,
};
