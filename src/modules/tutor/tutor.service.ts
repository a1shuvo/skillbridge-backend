import { Prisma } from "@prisma/client";
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
    sortBy === "price_low" ? { hourlyRate: "asc" } : 
    sortBy === "price_high" ? { hourlyRate: "desc" } : 
    { avgRating: "desc" };

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

export const tutorService = {
  getAllTutors,
};