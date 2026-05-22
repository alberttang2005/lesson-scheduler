"use client";

import { useState } from "react";
import { format } from "date-fns";
import RecurrenceSelector, { type FrequencyOption } from "./RecurrenceSelector";

interface LessonEvent {
  id: string;
  title: string;
  start: string;
  extendedProps: {
    durationMinutes: number;
    recurrenceId?: string | null;
  };
}

interface Props {
  lesson: LessonEvent;
  onClose: () => void;
  onChanged: () => void;
}

type Mode = "view" | "edit" | "deleteConfirm";
type DeleteScope = "single" | "future" | "all";
type EditScope = "single" | "future" | "all";

function toLocalDatetimeValue(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export default function LessonDetailModal({ lesson, onClose, onChanged }: Props) {
  const isRecurring = !!lesson.extendedProps.recurrenceId;
  const [mode, setMode] = useState<Mode>("view");
  const [editScope, setEditScope] = useState<EditScope>("single");

  // Edit fields
  const [title, setTitle] = useState(lesson.title);
  const [startTime, setStartTime] = useState(toLocalDatetimeValue(lesson.start));
  const [duration, setDuration] = useState<20 | 30>(
    lesson.extendedProps.durationMinutes as 20 | 30
  );
  const [frequency] = useState<FrequencyOption>("NONE");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/lessons/${lesson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        startTime: new Date(startTime).toISOString(),
        durationMinutes: duration,
        scope: editScope,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to update lesson");
      return;
    }
    onChanged();
    onClose();
  }

  async function handleDelete(scope: DeleteScope) {
    setLoading(true);
    const res = await fetch(`/api/lessons/${lesson.id}?scope=${scope}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (!res.ok) {
      setError("Failed to delete lesson");
      return;
    }
    onChanged();
    onClose();
  }

  if (mode === "deleteConfirm") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
          <h2 className="text-lg font-semibold mb-3">Delete lesson</h2>
          {isRecurring ? (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                This is a recurring lesson. What would you like to delete?
              </p>
              {(
                [
                  { scope: "single", label: "Only this event" },
                  { scope: "future", label: "This and all future events" },
                  { scope: "all", label: "All events in the series" },
                ] as { scope: DeleteScope; label: string }[]
              ).map(({ scope, label }) => (
                <button
                  key={scope}
                  onClick={() => handleDelete(scope)}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this lesson?
              </p>
              <button
                onClick={() => handleDelete("single")}
                disabled={loading}
                className="w-full bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Deleting…" : "Delete"}
              </button>
            </div>
          )}
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button
            onClick={() => setMode("view")}
            className="w-full border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold">Edit Lesson</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              ×
            </button>
          </div>

          {isRecurring && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-2">
                This is a recurring lesson. Edit:
              </p>
              <div className="flex gap-2">
                {(
                  [
                    { scope: "single", label: "Only this" },
                    { scope: "future", label: "This & future" },
                    { scope: "all", label: "All events" },
                  ] as { scope: EditScope; label: string }[]
                ).map(({ scope, label }) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setEditScope(scope)}
                    className={`flex-1 py-1.5 rounded border text-xs font-medium transition-colors ${
                      editScope === scope
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {editScope === "single" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <div className="flex gap-3">
                {([20, 30] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      duration === d
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setMode("view")}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // view mode
  const startDate = new Date(lesson.start);
  const endDate = new Date(
    startDate.getTime() + lesson.extendedProps.durationMinutes * 60_000
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{lesson.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-6">
          <p>
            <span className="font-medium text-gray-900">Date: </span>
            {format(startDate, "EEEE, MMMM d, yyyy")}
          </p>
          <p>
            <span className="font-medium text-gray-900">Time: </span>
            {format(startDate, "h:mm a")} – {format(endDate, "h:mm a")}
          </p>
          <p>
            <span className="font-medium text-gray-900">Duration: </span>
            {lesson.extendedProps.durationMinutes} minutes
          </p>
          {isRecurring && (
            <p className="text-blue-600 font-medium">Recurring event</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setMode("deleteConfirm")}
            className="flex-1 border border-red-300 text-red-600 rounded-lg py-2 text-sm hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => setMode("edit")}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
