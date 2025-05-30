"use client";

import ReviewCards from "@/components/review/ReviewCards";
import { Button } from "@/components/ui/button";
import { Card as CardUI } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayCards } from "@/hooks/useCards";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/types/card";
import { CheckCircle2 } from "lucide-react";

interface Review {
  id: string;
  isSuccess: boolean;
  createdAt: string;
}

type CardWithReviews = Card & { reviews?: Review[] };

export default function ReviewPage() {
  const router = useRouter();
  const { data: todayCards, isLoading } = useTodayCards();
  const [selectedMode, setSelectedMode] = useState<'multiple-choice' | 'flashcard' | null>(null);

  // Calculate completed cards from the database reviews
  const completedCount = todayCards?.reviewedTodayTotal || 0;
  const total = completedCount + (todayCards?.total || 0);
  const remainingCount = total - completedCount;
  const isCompleted = total > 0 && completedCount === total;

  const handleStartSession = (mode: 'multiple-choice' | 'flashcard') => {
    router.push(`/dashboard/review/session?mode=${mode}`);
  };

  if (selectedMode) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Review Cards</h1>
        <p className="text-blue-100">
          Choose your preferred review mode to strengthen your memory.
        </p>
      </div>

      {/* Progress Section */}
      {isLoading ? (
        <CardUI className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-2">
              <Skeleton className="h-2 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        </CardUI>
      ) : total > 0 ? (
        <CardUI className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Today's Progress</h2>
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                  }`}
                  style={{ width: `${(completedCount / total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{completedCount} of {total} cards completed</span>
                <span>{((completedCount / total) * 100).toFixed(0)}%</span>
              </div>
            </div>
            {isCompleted && (
              <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-green-700 text-center">
                  Great job! You've completed all your reviews for today. Come back tomorrow for more practice!
                </p>
              </div>
            )}
          </div>
        </CardUI>
      ) : null}

      {/* No cards info message */}
      {total === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center p-6 mb-4 bg-blue-50 rounded-xl border border-blue-100">
          <span className="text-4xl mb-2">📚</span>
          <p className="text-blue-700 font-medium">No cards available for review.</p>
          <p className="text-blue-500 text-sm mt-1">Add new words to your lists to start practicing!</p>
        </div>
      )}

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardUI 
          className={`p-6 ${total === 0 || isCompleted || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg transition-shadow'}`}
          onClick={() => total > 0 && !isCompleted && !isLoading && handleStartSession('multiple-choice')}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Multiple Choice Test</h3>
            </div>
            <p className="text-gray-600">
              Test your knowledge with multiple choice questions. Choose the correct definition for each word.
            </p>
            <Button className="w-full" disabled={total === 0 || isCompleted || isLoading}>
              {total === 0 ? 'No Cards' : isCompleted ? 'Completed' : 'Start Test'}
            </Button>
          </div>
        </CardUI>

        <CardUI 
          className={`p-6 ${total === 0 || isCompleted || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg transition-shadow'}`}
          onClick={() => total > 0 && !isCompleted && !isLoading && handleStartSession('flashcard')}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Flashcards</h3>
            </div>
            <p className="text-gray-600">
              Review words with interactive flashcards. Flip to see definitions and mark if you knew them.
            </p>
            <Button className="w-full" disabled={total === 0 || isCompleted || isLoading}>
              {total === 0 ? 'No Cards' : isCompleted ? 'Completed' : 'Start Flashcards'}
            </Button>
          </div>
        </CardUI>
      </div>
    </div>
  );
}
