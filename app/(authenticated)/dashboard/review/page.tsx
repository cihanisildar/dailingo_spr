"use client";

import ReviewCards from "@/components/review/ReviewCards";
import { Card as CardUI } from "@/components/ui/card";
import { useUpcomingReviews } from "@/hooks/useCards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  HelpCircle,
  Brain,
  Clock,
  TrendingUp,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { ActiveReviewSkeleton } from "@/components/review/ReviewSkeletons";

interface Card {
  id: string;
  word: string;
  definition: string;
  nextReview: string;
  wordList?: {
    id: string;
    name: string;
  };
}

interface GroupedCards {
  total: number;
  reviewed: number;
  notReviewed: number;
  cards: Card[];
}

interface UpcomingReviews {
  cards: Record<string, GroupedCards>;
  total: number;
}

export default function ReviewPage() {
  const { data: upcomingReviews, isLoading } =
    useUpcomingReviews<UpcomingReviews>();

  if (isLoading) {
    return <ActiveReviewSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white">Today's Review</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20"
                >
                  <HelpCircle className="h-5 w-5 text-white" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About Reviews</DialogTitle>
                  <DialogDescription>
                    Review your cards using spaced repetition to strengthen your
                    memory. Cards are reviewed at increasing intervals: 1 day, 7
                    days, 30 days, and 365 days.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Spaced Repetition</h4>
                      <p className="text-sm text-gray-500">
                        Review cards at optimal intervals for better retention
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Review Schedule</h4>
                      <p className="text-sm text-gray-500">
                        Cards are reviewed after 1 day, 7 days, 30 days, and 365
                        days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Progress Tracking</h4>
                      <p className="text-sm text-gray-500">
                        Track your success rate and learning progress
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <p className="text-blue-100">
          Review your cards and strengthen your memory.
        </p>
      </div>

      {/* Review Cards Section */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <ReviewCards />
      </div>
    </div>
  );
}

function UpcomingReviewsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <CardUI key={i} className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gray-200" />
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-8 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-3 w-full bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          </div>
        </CardUI>
      ))}
    </div>
  );
}
