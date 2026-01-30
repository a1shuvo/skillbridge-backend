import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";


const getAllTutors = async (query: Record<string, any>) => {
  const { search, category, minPrice, maxPrice, sortBy } = query;

  // Build the filter object
  const whereConditions: Prisma.TutorProfileWhereInput = {
    // Only show verified tutors and active users
    isVerified: true,
    user: {
      status: "ACTIVE",
    },
  };

  // Search by Name or Bio
  if (search) {
    whereConditions.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { bio: { contains: search, mode: "insensitive" } },
      { headline: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter by Hourly Rate
  if (minPrice || maxPrice) {
    whereConditions.hourlyRate = {
      gte: minPrice ? Number(minPrice) : 0,
      lte: maxPrice ? Number(maxPrice) : 999999,
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

  const result = await prisma.tutorProfile.findMany({
    where: whereConditions,
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
    orderBy: 
      sortBy === "price_low" ? { hourlyRate: "asc" } : 
      sortBy === "price_high" ? { hourlyRate: "desc" } : 
      { avgRating: "desc" }, // Default sort
  });

  return result;
};

export const tutorService = {
  getAllTutors,
};