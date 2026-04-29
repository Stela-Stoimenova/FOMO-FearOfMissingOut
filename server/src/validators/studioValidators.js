import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createWeeklyClassSchema = z.object({
  title: z.string().min(1, "title is required"),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().regex(timeRegex, "startTime must be in HH:MM format (e.g. 18:00)"),
  endTime: z.string().regex(timeRegex, "endTime must be in HH:MM format (e.g. 19:30)"),
  style: z.string().min(1, "style is required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL", "ALL_LEVELS"]),
  teacherName: z.string().optional().nullable(),
  teacherId: z.number().int().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: "endTime must be after startTime", path: ["endTime"] }
);

export const updateWeeklyClassSchema = z.object({
  title: z.string().min(1).optional(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]).optional(),
  startTime: z.string().regex(timeRegex, "startTime must be in HH:MM format").optional(),
  endTime: z.string().regex(timeRegex, "endTime must be in HH:MM format").optional(),
  style: z.string().min(1).optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL", "ALL_LEVELS"]).optional(),
  teacherName: z.string().optional().nullable(),
  teacherId: z.number().int().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) return data.startTime < data.endTime;
    return true;
  },
  { message: "endTime must be after startTime", path: ["endTime"] }
);

export const createMembershipTierSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().nonnegative(),
  classLimit: z.number().int().positive().optional().nullable(),
  durationDays: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

export const updateMembershipTierSchema = createMembershipTierSchema.partial();

export const createStudioTeamMemberSchema = z.object({
  userId: z.number().int(),
  role: z.enum(["DANCER", "INSTRUCTOR", "CHOREOGRAPHER"]),
});

export const createCollaborationSchema = z.object({
  agencyId: z.number().int(),
  description: z.string().optional().nullable(),
});
