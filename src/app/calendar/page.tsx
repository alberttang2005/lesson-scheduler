import CalendarView from "@/components/CalendarView";

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <span className="text-blue-600 font-bold text-lg">LessonBook</span>
      </header>
      <main className="flex-1 overflow-hidden p-4">
        <CalendarView />
      </main>
    </div>
  );
}
