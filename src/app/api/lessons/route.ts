export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLessonSchema } from "@/schemas/lesson";
import { generateInstances, type Frequency } from "@/lib/recurrence";
import { hasConflict } from "@/lib/conflict";
import type { Lesson } from "@prisma/client";

export async function GET() {
  try {
    const lessons = await prisma.lesson.findMany({
      orderBy: { startTime: "asc" },
    });

    const events = lessons.map((l: Lesson) => ({
      id: l.id,
      title: l.title,
      start: l.startTime.toISOString(),
      end: new Date(l.startTime.getTime() + l.durationMinutes * 60_000).toISOString(),
      extendedProps: {
        durationMinutes: l.durationMinutes,
        recurrenceId: l.recurrenceId,
        isException: l.isException,
      },
    }));

    return NextResponse.json(events);
  } catch (err) {
    console.error("[lessons GET]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }

    const { title, startTime: startTimeStr, durationMinutes, frequency, interval } = parsed.data;
    const userId = session.user.id;
    const startTime = new Date(startTimeStr);

    if (frequency === "NONE") {
      const conflict = await hasConflict({ userId, startTime, durationMinutes });
      if (conflict) {
        return NextResponse.json({ error: "You already have a lesson at this time" }, { status: 409 });
      }
      const lesson = await prisma.lesson.create({
        data: { userId, title, startTime, durationMinutes },
      });
      return NextResponse.json(lesson, { status: 201 });
    }

    const instances = generateInstances(startTime, frequency as Frequency, interval);
    const skipped: string[] = [];
    const toInsert: Date[] = [];

    for (const dt of instances) {
      const conflict = await hasConflict({ userId, startTime: dt, durationMinutes });
      if (conflict) {
        skipped.push(dt.toISOString());
      } else {
        toInsert.push(dt);
      }
    }

    if (toInsert.length === 0) {
      return NextResponse.json(
        { error: "All proposed time slots conflict with existing lessons" },
        { status: 409 }
      );
    }

    const rule = await prisma.recurrenceRule.create({
      data: { userId, frequency, interval, startDate: startTime },
    });

    await prisma.lesson.createMany({
      data: toInsert.map((dt) => ({
        userId,
        title,
        startTime: dt,
        durationMinutes,
        recurrenceId: rule.id,
      })),
    });

    return NextResponse.json(
      { ok: true, ruleId: rule.id, created: toInsert.length, skipped },
      { status: 201 }
    );
  } catch (err) {
    console.error("[lessons POST]", err);
    return NextResponse.json({ error: "Server error — check database connection" }, { status: 500 });
  }
}
