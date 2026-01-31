import { prisma } from "../../lib/prisma";

const createReview = async (
  studentId: string,
  payload: { bookingId: string; rating: number; comment: string },
) => {
  const { bookingId, rating, comment } = payload;

  // 1. Fetch data and validate
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutor: {
        include: { tutorProfile: true },
      },
    },
  });

  if (!booking) throw new Error("Booking not found");
  if (booking.studentId !== studentId)
    throw new Error("Unauthorized: This is not your booking");
  if (booking.status !== "COMPLETED")
    throw new Error(
      "You can only review sessions that are marked as COMPLETED",
    );

  const tutorProfileId = booking.tutor?.tutorProfile?.id;
  if (!tutorProfileId)
    throw new Error("Tutor profile not found for this booking");

  // 2. Start Transaction
  return await prisma.$transaction(async (tx) => {
    // A. Check if review already exists
    const existingReview = await tx.review.findUnique({
      where: { bookingId },
    });
    if (existingReview)
      throw new Error("You have already reviewed this session");

    // B. Create the review
    const newReview = await tx.review.create({
      data: {
        bookingId,
        studentId,
        tutorProfileId,
        rating,
        comment,
      },
    });

    // C. Aggregate: Let the DB calculate the new average
    const stats = await tx.review.aggregate({
      where: { tutorProfileId },
      _avg: {
        rating: true,
      },
    });

    const newAvgRating = stats._avg.rating || 0;

    // D. Update the TutorProfile with the fresh average
    await tx.tutorProfile.update({
      where: { id: tutorProfileId },
      data: {
        avgRating: parseFloat(newAvgRating.toFixed(2)),
      },
    });

    return newReview;
  });
};

export const reviewService = { createReview };
