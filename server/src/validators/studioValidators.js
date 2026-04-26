import { z } from "zod";

export const createWeeklyClassSchema = z.object({
  title: z.string().min(1, "title is required"),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().min(1, "startTime is required"),
  endTime: z.string().min(1, "endTime is required"),
  style: z.string().min(1, "style is required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL", "ALL_LEVELS"]),
  teacherName: z.string().optional().nullable(),
  teacherId: z.number().int().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
});

export const updateWeeklyClassSchema = createWeeklyClassSchema.partial();

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
