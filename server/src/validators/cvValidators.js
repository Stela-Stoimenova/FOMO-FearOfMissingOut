import { z } from "zod";

export const createCvEntrySchema = z.object({
  type: z.enum(["TRAINING", "PROJECT", "WORKSHOP", "COMPETITION"]),
  title: z.string().min(1, "title is required"),
  description: z.string().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  choreographer: z.string().optional().nullable(),
  taggedStudioId: z.number().int().optional().nullable(),
  taggedAgencyId: z.number().int().optional().nullable(),
});

export const updateCvEntrySchema = createCvEntrySchema.partial();
