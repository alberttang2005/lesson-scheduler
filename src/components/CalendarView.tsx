"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import LessonModal from "./LessonModal";
import LessonDetailModal from "./LessonDetailModal";

interface LessonEvent {
  id: string;
  title: string;
  start: string;
  extendedProps: {
    durationMinutes: number;
    recurrenceId?: string | null;
  };
}

export default function CalendarView({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedLesson, setSelectedLesson] = useState<LessonEvent | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/lessons");
    if (res.ok) {
      const data = await res.json();
      setEvents(data);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function handleDateSelect(arg: DateSelectArg) {
    if (!isLoggedIn) return;
    setSelectedDate(arg.start);
    setShowCreateModal(true);
    calendarRef.current?.getApi().unselect();
  }

  function handleEventClick(arg: EventClickArg) {
    if (!isLoggedIn) return;
    const ev = arg.event;
    setSelectedLesson({
      id: ev.id,
      title: ev.title,
      start: ev.startStr,
      extendedProps: ev.extendedProps as LessonEvent["extendedProps"],
    });
  }

  return (
    <div className="h-full flex flex-col gap-2">
      {!isLoggedIn && (
        <p className="text-sm text-gray-500 text-center">
          Viewing all scheduled lessons.{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in
          </a>{" "}
          to book or manage your own lessons.
        </p>
      )}
      <div className="flex-1">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          events={events}
          selectable={isLoggedIn}
          selectMirror={isLoggedIn}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="100%"
          nowIndicator
          eventColor="#2563eb"
          buttonText={{ today: "Today", month: "Month", week: "Week" }}
        />
      </div>

      {showCreateModal && (
        <LessonModal
          initialDate={selectedDate}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchEvents}
        />
      )}

      {selectedLesson && (
        <LessonDetailModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onChanged={fetchEvents}
        />
      )}
    </div>
  );
}
