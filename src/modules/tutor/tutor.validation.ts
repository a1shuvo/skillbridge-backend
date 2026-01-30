import * as z from "zod";

export const tutorFilterSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sortBy: z.enum(["price_low", "price_high", "rating"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
  }),
});

export const tutorIdParamSchema = z.object({
  params: z.object({
    id: z.string().pipe(z.cuid()),
  }),
});

export const updateTutorProfileSchema = z.object({
  body: z.object({
    bio: z.string().min(20, "Bio is too short").optional(),
    headline: z.string().max(100).optional(),
    location: z.string().optional(),
    languages: z.array(z.string()).optional(),
    hourlyRate: z.number().min(0).optional(),
    experience: z.number().min(0).optional(),
    categories: z.array(z.string()).optional(),
  }),
});

export type ITutorQuery = z.infer<typeof tutorFilterSchema>["query"];
