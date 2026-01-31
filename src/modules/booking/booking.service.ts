import { prisma } from "../../lib/prisma";
import { UserRole } from "../../middlewares/auth";

const createBooking = async (
  studentId: string,
  payload: { tutorId: string; slotId: string; note?: string },
) => {
  const { tutorId, slotId, note } = payload;

  if (studentId === tutorId) {
    throw new Error("You cannot book a session with yourself.");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Check if the Slot exists
    const slot = await tx.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) throw new Error("The selected time slot does not exist.");
    if (slot.isBooked) throw new Error("This slot has already been booked.");

    // 2. Check if the Tutor User exists
    const tutorUser = await tx.user.findUnique({
      where: { id: tutorId },
    });

    if (!tutorUser) {
      throw new Error("The specified tutor does not exist in the User table.");
    }

    // 3. Create the booking
    const booking = await tx.booking.create({
      data: {
        studentId,
        tutorId,
        slotId,
        note: note ?? null,
        status: "CONFIRMED",
      },
      include: {
        slot: true,
        tutor: { select: { name: true, email: true } },
      },
    });

    // 4. Update the slot
    await tx.availabilitySlot.update({
      where: { id: slotId },
      data: { isBooked: true },
    });

    // Manually fix the response object to reflect the updated slot status
    if (booking.slot) {
      booking.slot.isBooked = true;
    }

    return booking;
  });
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

const completeBooking = async (bookingId: string, tutorId: string) => {
  // 1. Find the booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // 2. Authorization: Only the specific tutor assigned to this booking can complete it
  if (booking.tutorId !== tutorId) {
    throw new Error(
      "Only the assigned tutor can mark this session as completed",
    );
  }

  // 3. State Validation: Can't complete a booking that is already cancelled or finished
  if (booking.status !== "CONFIRMED") {
    throw new Error(
      `Cannot complete a booking that is currently ${booking.status}`,
    );
  }

  // 4. Update status and timestamp
  return await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
    include: {
      slot: true,
      student: { select: { name: true, email: true } },
    },
  });
};

const cancelBooking = async (bookingId: string, studentId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Find the booking
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error("Booking not found");

    // 2. Security: Only the student who made the booking can cancel it
    if (booking.studentId !== studentId) {
      throw new Error("You are not authorized to cancel this booking");
    }

    // 3. Logic: Only 'CONFIRMED' bookings can be cancelled
    if (booking.status !== "CONFIRMED") {
      throw new Error(`Cannot cancel a booking that is ${booking.status}`);
    }

    // 4. Update Booking Status
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    if (!booking.slotId) {
      throw new Error("This booking is not associated with a valid time slot.");
    }

    // 5. Mark the slot as available again!
    await tx.availabilitySlot.update({
      where: { id: booking.slotId },
      data: { isBooked: false },
    });

    return updatedBooking;
  });
};

export const bookingService = {
  createBooking,
  getUserBookings,
  getSingleBooking,
  completeBooking,
  cancelBooking,
};
