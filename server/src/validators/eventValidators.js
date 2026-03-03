
export const createEventSchema = z.object({
    title: z.string().min(1, "title is required"),
    description: z.string().optional(),
    location: z.string().min(1, "location is required"),
    startAt: z.string().min(1, "startAt is required"),
    endAt: z.string().optional(),
    priceCents: z.number({ required_error: "priceCents is required" }).int().nonnegative(),
    capacity: z.number().int().positive().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

export const updateEventSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    location: z.string().min(1).optional(),
    startAt: z.string().optional(),
    endAt: z.string().nullable().optional(),
    priceCents: z.number().int().nonnegative().optional(),
    capacity: z.number().int().positive().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

export const nearbyQuerySchema = z.object({
    lat: z.string().min(1, "lat is required"),
    lng: z.string().min(1, "lng is required"),
    radius: z.string().optional(),
});
