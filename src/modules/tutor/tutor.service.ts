import { Prisma, TutorProfile } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ITutorQuery } from "./tutor.validation";

const getAllTutors = async (query: ITutorQuery) => {
  // 1. Destructure with Zod-guaranteed types
  // page and limit are already numbers because of z.coerce.number()
  const { search, category, minPrice, maxPrice, sortBy, page, limit } = query;

  const skip = (page - 1) * limit;

  // 2. Build the filter object
  const whereConditions: Prisma.TutorProfileWhereInput = {
    isVerified: true,
    user: {
      status: "ACTIVE",
    },
  };

  // Search by Name or Bio (Cleaned up assertions)
  if (search) {
    whereConditions.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { bio: { contains: search, mode: "insensitive" } },
      { headline: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter by Hourly Rate (No more Number() casting needed!)
  if (minPrice !== undefined || maxPrice !== undefined) {
    whereConditions.hourlyRate = {
      gte: minPrice ?? 0,
      lte: maxPrice ?? 999999,
    };
  }

  // Filter by Category Name
  if (category) {
    whereConditions.categories = {
      some: {
        category: {
          name: { equals: category, mode: "insensitive" },
        },
      },
    };
  }

  // 3. Sorting Logic
  const orderBy: Prisma.TutorProfileOrderByWithRelationInput =
    sortBy === "price_low"
      ? { hourlyRate: "asc" }
      : sortBy === "price_high"
        ? { hourlyRate: "desc" }
        : { avgRating: "desc" };

  // 4. Parallel Query execution
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

  // 5. Return structured response
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
      isVerified: true, // Ensuring only verified tutors are public
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
            // In your schema, Review.student points to User
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
      availability: {
        where: {
          isBooked: false,
          startTime: { gte: new Date() }, // Only show future available slots
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
  });

  return result;
};

const updateTutorProfile = async (
  userId: string,
  payload: { categories?: string[] } & Partial<TutorProfile>,
) => {
  const { categories, ...profileData } = payload;

  // Use a transaction to ensure database integrity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Upsert the profile (Update if exists, Create if not)
    const profile = await tx.tutorProfile.upsert({
      where: { userId },
      update: profileData,
      create: { ...profileData, userId },
    });

    // 2. Handle Categories if provided in the payload
    if (categories) {
      // First, remove existing categories for this tutor
      await tx.tutorCategory.deleteMany({
        where: { tutorId: profile.id },
      });

      // Then, create the new associations
      if (categories.length > 0) {
        await tx.tutorCategory.createMany({
          data: categories.map((categoryId) => ({
            tutorId: profile.id,
            categoryId,
          })),
        });
      }
    }

    // 3. Return the full profile with the newly linked categories
    return await tx.tutorProfile.findUnique({
      where: { id: profile.id },
      include: {
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
    // 1. Find the tutor profile
    const tutor = await tx.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutor) throw new Error("Tutor profile not found");

    // 2. Delete existing slots that ARE NOT booked yet
    // This allows tutors to refresh their schedule without breaking existing bookings
    await tx.availabilitySlot.deleteMany({
      where: {
        tutorId: tutor.id,
        isBooked: false,
      },
    });

    // 3. Create new slots
    const newSlots = await tx.availabilitySlot.createMany({
      data: slots.map((slot) => ({
        tutorId: tutor.id,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
      })),
    });

    return newSlots;
  });
};

export const tutorService = {
  getAllTutors,
  getTutorById,
  updateTutorProfile,
  updateAvailability,
};
