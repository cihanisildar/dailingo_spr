import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  className?: string;
  renderDay?: (date: Date) => React.ReactNode;
  hasWords?: (date: Date) => boolean;
}

export function CustomCalendar({
  selectedDate,
  onSelect,
  className,
  renderDay,
  hasWords,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "MMM-yyyy"));
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(firstDayCurrentMonth)),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  });

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  return (
    <div className={cn("w-full select-none", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-2 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          onClick={previousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {format(firstDayCurrentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="mt-1">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 text-sm border border-gray-200 dark:border-gray-700 rounded-b-lg overflow-hidden bg-white dark:bg-gray-800">
          {days.map((day, dayIdx) => {
            const isSelected = isEqual(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);
            const dayHasCustomContent = renderDay && renderDay(day);
            const isDayToday = isToday(day);
            const hasWordsOnDay = hasWords?.(day) || false;
            const isClickable = hasWordsOnDay || isDayToday;

            return (
              <div
                key={day.toString()}
                className={cn(
                  "relative border-b border-r border-gray-200 dark:border-gray-700 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                  !isCurrentMonth && "bg-gray-50 dark:bg-gray-800/50"
                )}
              >
                <button
                  onClick={() => isClickable && onSelect(day)}
                  disabled={!isClickable}
                  className={cn(
                    "w-full aspect-square p-1.5 flex flex-col items-start justify-start relative transition-all duration-200",
                    isSelected && "bg-blue-50 dark:bg-blue-900/30",
                    isDayToday && !isSelected && "bg-blue-50/50 dark:bg-blue-900/20",
                    !isSelected && !isDayToday && isClickable && "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                    !isClickable && "cursor-default",
                    !isCurrentMonth && "opacity-50"
                  )}
                >
                  <time
                    dateTime={format(day, "yyyy-MM-dd")}
                    className={cn(
                      "text-xs font-medium",
                      isSelected && "text-blue-600 dark:text-blue-400",
                      !isSelected && isDayToday && "text-blue-600 dark:text-blue-400",
                      !isSelected && !isDayToday && hasWordsOnDay && "text-gray-900 dark:text-gray-100",
                      !isSelected && !isDayToday && !hasWordsOnDay && "text-gray-500 dark:text-gray-400",
                      !isCurrentMonth && "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {format(day, "d")}
                  </time>
                  <div className="w-full h-full flex items-center justify-center relative">
                    {dayHasCustomContent}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 