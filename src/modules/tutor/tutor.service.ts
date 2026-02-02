import { Prisma, TutorProfile } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ITutorQuery } from "./tutor.validation";

const getAllTutors = async (query: ITutorQuery) => {
  const { search, category, minPrice, maxPrice, sortBy, page, limit } = query;
  const skip = (page - 1) * limit;

  // 1. Build the filter object
  const whereConditions: Prisma.TutorProfileWhereInput = {
    isVerified: true,
    user: {
      status: "ACTIVE",
    },
  };

  // Search Logic (Name, Bio, or Headline)
  if (search) {
    whereConditions.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { bio: { contains: search, mode: "insensitive" } },
      { headline: { contains: search, mode: "insensitive" } },
    ];
  }

  // Price Range Filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    whereConditions.hourlyRate = {
      gte: minPrice ?? 0,
      lte: maxPrice ?? 999999,
    };
  }

  // Category Filter
  if (category) {
    whereConditions.categories = {
      some: {
        category: {
          name: { equals: category, mode: "insensitive" },
        },
      },
    };
  }

  // 2. Refined Sorting Logic
  let orderBy:
    | Prisma.TutorProfileOrderByWithRelationInput
    | Prisma.TutorProfileOrderByWithRelationInput[] = [
    { avgRating: "desc" },
    { createdAt: "desc" },
  ];

  if (sortBy === "price_low") {
    orderBy = [{ hourlyRate: "asc" }, { avgRating: "desc" }];
  } else if (sortBy === "price_high") {
    orderBy = [{ hourlyRate: "desc" }, { avgRating: "desc" }];
  } else if (sortBy === "rating") {
    orderBy = [{ avgRating: "desc" }, { createdAt: "desc" }];
  }

  // 3. Parallel Query execution
  const [result, total] = await prisma.$transaction([
    prisma.tutorProfile.findMany({
      where: whereConditions,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy,
    }),
    prisma.tutorProfile.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getTutorById = async (id: string) => {
  const result = await prisma.tutorProfile.findUnique({
    where: {
      id,
      isVerified: true,
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
          email: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      reviews: {
        include: {
          student: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      availability: {
        where: {
          isBooked: false,
          startTime: { gte: new Date() },
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
  });

  if (!result) {
    throw new Error("Tutor profile not found or is currently unavailable.");
  }

  return result;
};

// NEW: Get my tutor profile with all slots (booked and available)
const getMyTutorProfile = async (userId: string) => {
  const result = await prisma.tutorProfile.findUnique({
    where: {
      userId,
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
          email: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      reviews: {
        include: {
          student: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      // Include ALL availability slots (both booked and unbooked) for the tutor dashboard
      availability: {
        where: {
          startTime: { gte: new Date() },
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
  });

  if (!result) {
    throw new Error("Tutor profile not found. Please complete your profile setup.");
  }

  return result;
};

const updateTutorProfile = async (
  userId: string,
  payload: { categories?: string[] } & Partial<TutorProfile>,
) => {
  const {
    categories,
    id,
    userId: _,
    avgRating,
    isVerified,
    ...profileData
  } = payload;

  const result = await prisma.$transaction(async (tx) => {
    const profile = await tx.tutorProfile.upsert({
      where: { userId },
      update: profileData,
      create: { ...profileData, userId },
    });

    if (categories !== undefined) {
      await tx.tutorCategory.deleteMany({
        where: { tutorId: profile.id },
      });

      if (categories.length > 0) {
        await tx.tutorCategory.createMany({
          data: categories.map((categoryId) => ({
            tutorId: profile.id,
            categoryId,
          })),
        });
      }
    }

    return await tx.tutorProfile.findUnique({
      where: { id: profile.id },
      include: {
        user: { select: { name: true, image: true } },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  });

  return result;
};

const updateAvailability = async (
  userId: string,
  slots: { startTime: string; endTime: string }[],
) => {
  return await prisma.$transaction(async (tx) => {
    const tutor = await tx.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutor)
      throw new Error(
        "Tutor profile not found. Please complete your profile first.",
      );

    const now = new Date();
    const validSlots = slots
      .map((slot) => ({
        tutorId: tutor.id,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
      }))
      .filter((slot) => slot.startTime > now && slot.startTime < slot.endTime);

    if (validSlots.length === 0 && slots.length > 0) {
      throw new Error("All provided slots are invalid or in the past.");
    }

    const bookedSlots = await tx.availabilitySlot.findMany({
      where: { tutorId: tutor.id, isBooked: true },
    });

    for (const newSlot of validSlots) {
      const overlap = bookedSlots.find(
        (booked) =>
          newSlot.startTime < booked.endTime &&
          newSlot.endTime > booked.startTime,
      );
      if (overlap) {
        throw new Error(
          `New slot ${newSlot.startTime.toLocaleString()} overlaps with an existing booking.`,
        );
      }
    }

    await tx.availabilitySlot.deleteMany({
      where: {
        tutorId: tutor.id,
        isBooked: false,
      },
    });

    const createdSlots = await tx.availabilitySlot.createMany({
      data: validSlots,
    });

    return createdSlots;
  });
};

export const tutorService = {
  getAllTutors,
  getTutorById,
  getMyTutorProfile,
  updateTutorProfile,
  updateAvailability,
};