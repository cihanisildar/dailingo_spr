"use client";

import { UpcomingReviewsSkeleton } from "@/components/review/ReviewSkeletons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUpcomingReviews } from "@/hooks/useCards";
import { cn } from "@/lib/utils";
import { Card as CardType } from "@/types/models/card";
import { eachDayOfInterval, endOfMonth, format, isSameMonth, isToday, startOfDay, startOfMonth } from "date-fns";
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, XCircle } from "lucide-react";
import { useState } from "react";

type ExtendedCard = CardType & {
  isFromFailure: boolean;
  reviewStep: number;
  isFutureReview?: boolean;
  reviews?: { createdAt: string; isSuccess: boolean }[];
};

interface GroupedCards {
  total: number;
  reviewed: number;
  notReviewed: number;
  fromFailure: number;
  cards: ExtendedCard[];
}

interface UpcomingReviews {
  cards: Record<string, GroupedCards>;
  total: number;
  intervals: number[];
}

export default function UpcomingReviewsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: upcomingReviews, isLoading } = useUpcomingReviews();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const today = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  if (isLoading) {
    return <UpcomingReviewsSkeleton />;
  }

  // Debug: Log review days and calendar days
  console.log("Review days (API keys):", Object.keys(upcomingReviews?.cards || {}));
  days.forEach(day => {
    const dateStr = format(day, "yyyy-MM-dd");
    if (upcomingReviews?.cards[dateStr]) {
      console.log("Review scheduled for:", dateStr);
    }
  });

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 mb-8 overflow-hidden">
        <div className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">Upcoming Reviews</h1>
              <p className="text-blue-100 dark:text-blue-200 mt-2">Plan ahead with your review schedule</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-full py-2.5 px-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-white/60" />
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold text-white">{upcomingReviews?.total || 0}</span>
                    <span className="text-sm text-white/60 uppercase">Total Upcoming</span>
                  </div>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-full h-10 w-full sm:w-auto">
                    <Clock className="h-4 w-4 mr-2" />
                    Review Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-lg mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-medium">How Reviews Work</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Spaced Repetition System</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        When you learn a new word, you'll review it multiple times with increasing intervals:
                      </p>
                    </div>

                    <div className="space-y-2">
                      {upcomingReviews?.intervals?.map((interval: number, index: number) => {
                        const getLabel = (days: number) => {
                          if (days === 1) return 'Next day';
                          if (days === 7) return 'After a week';
                          if (days === 30) return 'After a month';
                          if (days === 365) return 'After a year';
                          return `After ${days} days`;
                        };

                        const getDescription = (days: number, index: number) => {
                          if (days === 1) return 'First review the next day';
                          if (days === 7) return 'Second review after 7 days';
                          if (days === 30) return 'Third review after 30 days';
                          if (days === 365) return 'Final review after 365 days';
                          return `Review #${index + 1} after ${days} days`;
                        };

                        return (
                          <div key={interval} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Review #{index + 1}: {getLabel(interval)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {getDescription(interval, index)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t dark:border-gray-800 pt-3">
                      <h3 className="font-medium text-sm mb-2">Calendar Colors Explained</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                          <p className="text-xs">
                            <span className="font-medium">Scheduled Review:</span> Your next immediate review
                          </p>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                          <p className="text-xs">
                            <span className="font-medium">Potential Review:</span> Future reviews after completing earlier ones
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar Section */}
      <Card className="overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900">
        <div className="p-2 sm:p-6">
          {/* Calendar Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-8 gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 px-2 sm:px-0">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto px-2 sm:px-0">
              <Button
                variant="outline"
                size="icon"
                onClick={previousMonth}
                className="h-10 w-10 sm:h-8 sm:w-8 rounded-full border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="h-10 w-10 sm:h-8 sm:w-8 rounded-full border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs sm:text-base bg-white dark:bg-gray-900 shadow-inner">
            {/* Week day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
              <div
                key={day}
                className={cn(
                  "bg-gray-50 dark:bg-gray-800 py-2 sm:p-2 text-center border-b border-gray-200 dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs md:text-sm",
                  i !== 6 && "border-r border-gray-200 dark:border-gray-700"
                )}
              >
                <span>{day}</span>
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, idx) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayData = upcomingReviews?.cards[dateStr];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isPast = day < startOfDay(today);
              const isTodayDay = isToday(day);
              const isCompleted = dayData && dayData.total > 0 && dayData.reviewed === dayData.total;

              // Calculate border classes for grid lines
              const isLastCol = (idx + 1) % 7 === 0;
              const isLastRow = idx >= days.length - 7;

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[56px] sm:min-h-[80px] md:min-h-[100px] p-1.5 sm:p-3 transition-all duration-200 relative flex flex-col items-center justify-center group cursor-pointer",
                    !isCurrentMonth && "bg-gray-50 dark:bg-gray-800/50 cursor-default",
                    isCompleted && "bg-green-500 dark:bg-green-600",
                    !isCompleted && dayData && dayData.total > 0 && "bg-blue-50 dark:bg-blue-900/30",
                    // Grid frame lines
                    !isLastCol && "border-r border-gray-200 dark:border-gray-700",
                    !isLastRow && "border-b border-gray-200 dark:border-gray-700"
                  )}
                  onClick={() => dayData && dayData.total > 0 ? setSelectedDay(dateStr) : undefined}
                  style={{ zIndex: isTodayDay ? 2 : 1 }}
                >
                  {/* Date number, always visible */}
                  <span
                    className={cn(
                      "text-xs sm:text-base md:text-lg font-semibold transition-all mb-0.5 sm:mb-0",
                      !isCurrentMonth && "text-gray-400 dark:text-gray-500",
                      isTodayDay && !isCompleted && "text-blue-600 dark:text-blue-400",
                      isCompleted && "text-white"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Blue dot indicator for days with reviews */}
                  {dayData && dayData.total > 0 && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500"></div>
                  )}

                  {/* Review indicators */}
                  {dayData && dayData.total > 0 && (
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {dayData.reviewed}/{dayData.total}
                        </span>
                      </div>
                      {dayData.fromFailure > 0 && (
                        <div className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
                          <span className="text-xs text-red-500 dark:text-red-400">
                            {dayData.fromFailure}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Review History Dialog for Completed Days */}
      {selectedDay && (() => {
        const dayData = upcomingReviews?.cards[selectedDay];
        if (!dayData) return null;
        return (
          <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
            <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-lg mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-medium">Review History for {format(new Date(selectedDay), "MMMM d, yyyy")}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-3">
                {dayData.cards.map((card, idx) => {
                  const review = Array.isArray(card.reviews)
                    ? card.reviews.find(r => format(new Date(r.createdAt), 'yyyy-MM-dd') === selectedDay)
                    : null;
                  return (
                    <div key={card.id + idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{card.word}</span>
                        {review ? (
                          review.isSuccess ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{card.definition}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {review ? (
                          <>Reviewed at: {format(new Date(review.createdAt), 'p')}</>
                        ) : (
                          <>Not reviewed yet</>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
} 