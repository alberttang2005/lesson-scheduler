"use client";

import { useState } from "react";
import RecurrenceSelector, { type FrequencyOption } from "./RecurrenceSelector";
import { format } from "date-fns";

interface Props {
  initialDate?: Date;
  onClose: () => void;
  onCreated: () => void;
}

function toLocalDatetimeValue(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export default function LessonModal({ initialDate, onClose, onCreated }: Props) {
  const defaultStart = initialDate ?? new Date();
  const [title, setTitle] = useState("Private Lesson");
  const [startTime, setStartTime] = useState(toLocalDatetimeValue(defaultStart));
  const [duration, setDuration] = useState<20 | 30>(30);
  const [frequency, setFrequency] = useState<FrequencyOption>("NONE");
  const [error, setError] = useState("");
  const [skippedWarning, setSkippedWarning] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSkippedWarning("");

    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        startTime: new Date(startTime).toISOString(),
        durationMinutes: duration,
        frequency,
        interval: 1,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create lesson");
      return;
    }

    const data = await res.json();
    if (data.skipped?.length > 0) {
      setSkippedWarning(
        `${data.skipped.length} time slot(s) were skipped due to conflicts.`
      );
      setTimeout(() => {
        onCreated();
        onClose();
      }, 2000);
    } else {
      onCreated();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">New Lesson</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start time
            </label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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

          <RecurrenceSelector value={frequency} onChange={setFrequency} />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {skippedWarning && (
            <p className="text-sm text-yellow-600">{skippedWarning}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
