"use client";

import { Card } from "@/components/ui/card";
import { useUpcomingReviews } from "@/hooks/useCards";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addDays } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Loader2, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card as CardType } from "@/types/card";
import { UpcomingReviewsSkeleton } from "@/components/review/ReviewSkeletons";

type ExtendedCard = CardType & {
  isFromFailure: boolean;
  reviewStep: number;
  isFutureReview?: boolean;
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

  console.log('Upcoming Reviews Data:', upcomingReviews);
  console.log('Review Intervals:', upcomingReviews?.intervals);

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

  return (
    <div className="">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 mb-8 overflow-hidden">
        <div className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">Upcoming Reviews</h1>
              <p className="text-blue-100 mt-2">Plan ahead with your review schedule</p>
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
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-lg mx-auto">
                  <DialogHeader>
                    <DialogTitle>How Reviews Work</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Spaced Repetition System</h3>
                      <p className="text-sm text-gray-600 mt-1">
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
                          <div key={interval} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                Review #{index + 1}: {getLabel(interval)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {getDescription(interval, index)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t pt-3">
                      <h3 className="font-medium text-gray-900 text-sm mb-2">Calendar Colors Explained</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <p className="text-xs text-gray-700">
                            <span className="font-medium">Scheduled Review:</span> Your next immediate review
                          </p>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <p className="text-xs text-gray-700">
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
      <Card className="overflow-hidden">
        <div className="p-3 sm:p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={previousMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden text-sm sm:text-base">
            {/* Week day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="bg-gray-50 p-1.5 sm:p-2 text-center"
              >
                <span className="text-xs sm:text-sm font-medium text-gray-500">{day}</span>
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, dayIdx) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayData = upcomingReviews?.cards[dateStr];
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              console.log('Checking date:', dateStr, 'Has data:', !!dayData);
              
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[80px] sm:min-h-[100px] bg-white p-2 sm:p-3",
                    !isCurrentMonth && "bg-gray-50",
                    isToday(day) && "bg-blue-50",
                    dayData && "bg-blue-50/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-medium",
                        !isCurrentMonth && "text-gray-400",
                        isToday(day) && "text-blue-600",
                        dayData && "text-blue-600"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayData?.total > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 sm:h-6 px-1.5 sm:px-2 bg-blue-100 hover:bg-blue-200 text-blue-700">
                            <span className="text-xs font-medium">{dayData.total}</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full max-w-lg mx-auto">
                          <DialogHeader>
                            <DialogTitle>Reviews for {format(day, "MMMM d, yyyy")}</DialogTitle>
                          </DialogHeader>
                          <TooltipProvider delayDuration={0}>
                            <div className="mt-4 space-y-4">
                              {dayData.cards.map((card: ExtendedCard) => {
                                // Get the actual interval value from the intervals array
                                const intervals = upcomingReviews?.intervals || [1, 7, 30, 365];
                                // Handle negative reviewStep by defaulting to first interval
                                const intervalDays = card.reviewStep >= 0 ? intervals[card.reviewStep] : intervals[0];
                                
                                return (
                                  <div 
                                    key={card.id} 
                                    className={cn(
                                      "p-3 rounded-lg",
                                      card.isFutureReview 
                                        ? "bg-gray-50 border border-gray-200" 
                                        : "bg-blue-50 border border-blue-200"
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-gray-900">{card.word}</p>
                                          {card.isFutureReview && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                              Future Review
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                          <Tooltip>
                                            <TooltipTrigger className="cursor-help">
                                              {card.wordList?.name || "Uncategorized"}
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-[200px] z-[60]">
                                              {card.wordList?.name 
                                                ? `This card belongs to the "${card.wordList.name}" word list`
                                                : "This card is not part of any word list. You can organize it into a list by editing the card."}
                                            </TooltipContent>
                                          </Tooltip>
                                        </p>
                                      </div>
                                      
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className={cn(
                                            "text-sm px-2 py-1 rounded-full cursor-help",
                                            card.isFutureReview 
                                              ? "bg-gray-100 text-gray-700" 
                                              : "bg-blue-100 text-blue-700"
                                          )}>
                                            {intervalDays === 30 ? '1 month' : intervalDays === 365 ? '1 year' : `${intervalDays} ${intervalDays === 1 ? 'day' : 'days'}`}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" sideOffset={5} className="z-[60]">
                                          <p>Review interval: {intervalDays === 30 ? '1 month' : intervalDays === 365 ? '1 year' : `${intervalDays} ${intervalDays === 1 ? 'day' : 'days'}`}</p>
                                          <p className="text-xs text-gray-400 mt-1">
                                            {card.isFutureReview 
                                              ? `This will be review #${card.reviewStep + 1} (${intervalDays} days) after you complete earlier reviews` 
                                              : `This is your next review (#${card.reviewStep + 1}) - ${intervalDays} ${intervalDays === 1 ? 'day' : 'days'} after last review`}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </TooltipProvider>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  {dayData?.total > 0 && (
                    <div className="mt-1 sm:mt-2">
                      <div className="flex flex-col gap-1">
                        {dayData.cards.some((card: ExtendedCard) => !card.isFutureReview) && (
                          <div className="inline-flex items-center bg-blue-100/80 rounded-full px-1.5 py-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" />
                            <span className="text-[10px] font-medium text-blue-700 truncate">
                              {dayData.cards.filter((card: ExtendedCard) => !card.isFutureReview).length}
                            </span>
                          </div>
                        )}
                        {dayData.cards.some((card: ExtendedCard) => card.isFutureReview) && (
                          <div className="inline-flex items-center bg-gray-100/80 rounded-full px-1.5 py-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1" />
                            <span className="text-[10px] font-medium text-gray-600 truncate">
                              {dayData.cards.filter((card: ExtendedCard) => card.isFutureReview).length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
} 