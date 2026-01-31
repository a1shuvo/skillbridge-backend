import { prisma } from "../../lib/prisma";

const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      tutorProfile: {
        select: {
          isVerified: true,
          avgRating: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const updateUserStatus = async (
  id: string,
  payload: { status?: "ACTIVE" | "BANNED"; isVerified?: boolean },
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. If status (ACTIVE/BANNED) is provided, update the User table
    if (payload.status) {
      await tx.user.update({
        where: { id },
        data: { status: payload.status },
      });
    }

    // 2. If isVerified is provided, update the TutorProfile table
    if (payload.isVerified !== undefined) {
      // Check if tutor profile exists before updating
      const tutor = await tx.tutorProfile.findUnique({ where: { userId: id } });
      if (!tutor) {
        throw new Error("Tutor profile not found for this user");
      }

      await tx.tutorProfile.update({
        where: { userId: id },
        data: { isVerified: payload.isVerified },
      });
    }

    return { message: "User updated successfully" };
  });
};

const getAllBookings = async () => {
  return await prisma.booking.findMany({
    // Admin sees everything
    include: {
      slot: true,
      tutor: {
        select: { name: true, email: true },
      },
      student: {
        select: { name: true, email: true },
      },
      review: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getDashboardStats = async () => {
  const [userStats, bookingStats, verifiedTutors, completedBookings] =
    await Promise.all([
      // 1. Group users by role
      prisma.user.groupBy({
        by: ["role"],
        _count: true,
      }),

      // 2. Group bookings by status
      prisma.booking.groupBy({
        by: ["status"],
        _count: true,
      }),

      // 3. Count verified tutors
      prisma.tutorProfile.count({
        where: { isVerified: true },
      }),

      // 4. Fetch completed bookings to calculate revenue
      prisma.booking.findMany({
        where: { status: "COMPLETED" },
        include: {
          tutor: {
            include: {
              tutorProfile: true, // This is where hourlyRate lives
            },
          },
        },
      }),
    ]);

  // Calculate Total Revenue based on Tutor's hourly rate
  const totalRevenue = completedBookings.reduce((sum, booking) => {
    return sum + (booking.tutor?.tutorProfile?.hourlyRate || 0);
  }, 0);

  // Formatting the response for the frontend
  return {
    users: {
      totalStudents: userStats.find((u) => u.role === "STUDENT")?._count || 0,
      totalTutors: userStats.find((u) => u.role === "TUTOR")?._count || 0,
      verifiedTutors,
    },
    bookings: {
      total: bookingStats.reduce((acc, curr) => acc + curr._count, 0),
      pending: bookingStats.find((b) => b.status === "PENDING")?._count || 0,
      confirmed:
        bookingStats.find((b) => b.status === "CONFIRMED")?._count || 0,
      completed:
        bookingStats.find((b) => b.status === "COMPLETED")?._count || 0,
      cancelled:
        bookingStats.find((b) => b.status === "CANCELLED")?._count || 0,
    },
    revenue: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    },
  };
};

export const adminService = {
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  getDashboardStats,
};
