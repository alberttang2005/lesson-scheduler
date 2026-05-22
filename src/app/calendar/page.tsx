import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import CalendarView from "@/components/CalendarView";

export default async function CalendarPage() {
  const session = await auth();

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <span className="text-blue-600 font-bold text-lg">LessonBook</span>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-sm text-gray-600">
                {session.user?.name ?? session.user?.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/calendar" });
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4">
        <CalendarView isLoggedIn={!!session} />
      </main>
    </div>
  );
}
