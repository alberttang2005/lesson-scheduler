export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateLessonSchema } from "@/schemas/lesson";
import { hasConflict } from "@/lib/conflict";

const SHARED_USER_ID = "shared";

async function getLesson(id: string) {
  return prisma.lesson.findUnique({ where: { id } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lesson = await getLesson(id);
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

    const conflict = await hasConflict({
      userId: SHARED_USER_ID,
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

    const whereClause =
      scope === "all"
        ? { recurrenceId: lesson.recurrenceId }
        : { recurrenceId: lesson.recurrenceId, startTime: { gte: lesson.startTime } };

    await prisma.lesson.updateMany({
      where: whereClause,
      data: { title: title ?? lesson.title, durationMinutes: newDuration },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lessons PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lesson = await getLesson(id);
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
        where: { recurrenceId: lesson.recurrenceId, startTime: { gte: lesson.startTime } },
      });
    } else {
      await prisma.lesson.deleteMany({ where: { recurrenceId: lesson.recurrenceId } });
      await prisma.recurrenceRule.delete({ where: { id: lesson.recurrenceId } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lessons DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
