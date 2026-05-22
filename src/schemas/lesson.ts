import { z } from "zod";

export const createLessonSchema = z.object({
  title: z.string().min(1).default("Private Lesson"),
  startTime: z.string().datetime(),
  durationMinutes: z.literal(20).or(z.literal(30)),
  frequency: z.enum(["NONE", "WEEKLY", "MONTHLY", "YEARLY"]).default("NONE"),
  interval: z.number().int().min(1).default(1),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  startTime: z.string().datetime().optional(),
  durationMinutes: z.literal(20).or(z.literal(30)).optional(),
  scope: z.enum(["single", "future", "all"]).default("single"),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
