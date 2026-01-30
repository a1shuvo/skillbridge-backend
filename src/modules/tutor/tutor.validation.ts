import * as z from 'zod';

export const tutorFilterSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    // z.coerce turns strings like "50" into actual numbers
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sortBy: z.enum(['price_low', 'price_high', 'rating']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
  }),
});

// This replaces the need for a manual 'interface'
export type ITutorQuery = z.infer<typeof tutorFilterSchema>['query'];