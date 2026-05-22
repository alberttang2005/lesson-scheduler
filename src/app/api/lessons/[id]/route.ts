import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLessonSchema } from "@/schemas/lesson";
import { hasConflict } from "@/lib/conflict";

async function getLesson(id: string, userId: string) {
  return prisma.lesson.findFirst({ where: { id, userId } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const lesson = await getLesson(id, userId);
  if (!lesson) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { title, startTime: startTimeStr, durationMinutes, scope } = parsed.data;
  const newStart = startTimeStr ? new Date(startTimeStr) : lesson.startTime;
  const newDuration = durationMinutes ?? lesson.durationMinutes;

  // Conflict check for the target slot(s)
  const conflict = await hasConflict({
    userId,
    startTime: newStart,
    durationMinutes: newDuration,
    excludeLessonId: scope === "single" ? id : undefined,
  });
  if (conflict) {
    return NextResponse.json(
      { error: "That time slot conflicts with an existing lesson" },
      { status: 409 }
    );
  }

  if (!lesson.recurrenceId || scope === "single") {
    const updated = await prisma.lesson.update({
      where: { id },
      data: {
        title: title ?? lesson.title,
        startTime: newStart,
        durationMinutes: newDuration,
        isException: !!lesson.recurrenceId,
        exceptionFor: lesson.recurrenceId ? lesson.startTime : undefined,
      },
    });
    return NextResponse.json(updated);
  }

  // scope === "future" or "all"
  const whereClause =
    scope === "all"
      ? { recurrenceId: lesson.recurrenceId, userId }
      : { recurrenceId: lesson.recurrenceId, userId, startTime: { gte: lesson.startTime } };

  await prisma.lesson.updateMany({
    where: whereClause,
    data: {
      title: title ?? lesson.title,
      durationMinutes: newDuration,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const lesson = await getLesson(id, userId);
  if (!lesson) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "single";

  if (!lesson.recurrenceId || scope === "single") {
    await prisma.lesson.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  if (scope === "future") {
    await prisma.lesson.deleteMany({
      where: {
        recurrenceId: lesson.recurrenceId,
        userId,
        startTime: { gte: lesson.startTime },
      },
    });
  } else {
    // all
    await prisma.lesson.deleteMany({
      where: { recurrenceId: lesson.recurrenceId, userId },
    });
    await prisma.recurrenceRule.delete({ where: { id: lesson.recurrenceId } });
  }

  return NextResponse.json({ ok: true });
}
