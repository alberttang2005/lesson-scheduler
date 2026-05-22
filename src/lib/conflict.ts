import { prisma } from "@/lib/prisma";

interface OverlapCheckParams {
  userId: string;
  startTime: Date;
  durationMinutes: number;
  excludeLessonId?: string;
}

export async function hasConflict({
  userId,
  startTime,
  durationMinutes,
  excludeLessonId,
}: OverlapCheckParams): Promise<boolean> {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);

  // Fetch lessons that could overlap: startTime < endTime of new lesson
  // We can't filter by computed endTime in Prisma directly, so we fetch
  // candidates where startTime < newEndTime and then check the other side in JS.
  const candidates = await prisma.lesson.findMany({
    where: {
      userId,
      ...(excludeLessonId ? { id: { not: excludeLessonId } } : {}),
      startTime: { lt: endTime },
    },
    select: { id: true, startTime: true, durationMinutes: true },
  });

  return candidates.some((c) => {
    const cEnd = new Date(c.startTime.getTime() + c.durationMinutes * 60_000);
    return cEnd > startTime;
  });
}

export async function findConflictingSlots(
  userId: string,
  slots: Array<{ startTime: Date; durationMinutes: number }>
): Promise<Date[]> {
  const skipped: Date[] = [];
  for (const slot of slots) {
    const conflict = await hasConflict({ userId, ...slot });
    if (conflict) skipped.push(slot.startTime);
  }
  return skipped;
}
