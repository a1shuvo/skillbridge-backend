import { prisma } from "../../lib/prisma";
import { UserRole } from "../../middlewares/auth";

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

const getUserBookings = async (userId: string, role: UserRole) => {
  let whereCondition = {};

  // Define filter based on role
  if (role === UserRole.STUDENT) {
    whereCondition = { studentId: userId };
  } else if (role === UserRole.TUTOR) {
    whereCondition = { tutorId: userId };
  } else if (role === UserRole.ADMIN) {
    whereCondition = {}; // Admin sees all
  }

  const result = await prisma.booking.findMany({
    where: whereCondition,
    include: {
      // Include slot details (time/date)
      slot: true,
      // If student is asking, show tutor details. If tutor is asking, show student details.
      tutor: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      student: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const getSingleBooking = async (
  bookingId: string,
  userId: string,
  role: UserRole,
) => {
  // 1. Fetch the booking with all related details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      slot: true,
      tutor: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      student: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  // 2. Check if booking exists
  if (!booking) {
    throw new Error("Booking not found");
  }

  // 3. Security Check: Is the user authorized to see this?
  const isAuthorized =
    role === UserRole.ADMIN ||
    booking.studentId === userId ||
    booking.tutorId === userId;

  if (!isAuthorized) {
    throw new Error("You are not authorized to view this booking details");
  }

  return booking;
};

export const bookingService = {
  createBooking,
  getUserBookings,
  getSingleBooking,
};
