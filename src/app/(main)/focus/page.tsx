import { PomodoroTimer } from "@/components/focus/PomodoroTimer";
import { Target } from "lucide-react";

export default function FocusPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 min-h-full">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <Target className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          Focus Mode
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Use the Pomodoro technique to stay productive.</p>
      </header>

      <div className="pt-4 md:pt-10">
        <PomodoroTimer />
      </div>
    </div>
  );
}
