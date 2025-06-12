"use client";

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card as CardUI } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayCards } from "@/hooks/useCards";
import { CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: todayCards, isLoading } = useTodayCards();
  const [selectedMode, setSelectedMode] = useState<'multiple-choice' | 'flashcard' | null>(null);
  const [startingNewSession, setStartingNewSession] = useState(false);
  const [repeatSessionProgress, setRepeatSessionProgress] = useState(0);
  const [_, forceUpdate] = useState(0);

  // Calculate completed cards from the database reviews
  let cardsArray: any[] = [];
  if (Array.isArray(todayCards)) {
    cardsArray = todayCards;
  } else if (typeof todayCards === 'object' && todayCards !== null && Array.isArray((todayCards as any).cards)) {
    cardsArray = (todayCards as any).cards;
  }
  const hasCards = cardsArray.length > 0;
  const total = hasCards ? cardsArray.length : 0;
  const completedCount = 0; // No reviewedTodayTotal, so default to 0
  const remainingCount = total - completedCount;
  const isCompleted = false; // Always false to allow multiple reviews
  const hasEnoughCardsForMultipleChoice = total >= 4;

  // Debug logging
  console.log('todayCards:', todayCards);
  console.log('cardsArray:', cardsArray);
  console.log('hasCards:', hasCards);
  console.log('total:', total);

  function getRepeatMode() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('repeatSessionActive') === 'true';
    }
    return false;
  }
  const repeatMode = getRepeatMode();

  const handleStartSession = (mode: 'multiple-choice' | 'flashcard') => {
    if ((completedCount === total && total > 0) || repeatMode) {
      setRepeatSessionProgress(0);
      router.push(`/dashboard/review/session?mode=${mode}&repeat=true`);
    } else {
      router.push(`/dashboard/review/session?mode=${mode}`);
    }
  };

  const handleStartNewSession = async () => {
    setStartingNewSession(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStartingNewSession(false);
    setRepeatSessionProgress(0);
    localStorage.setItem('repeatSessionActive', 'true');
    forceUpdate(n => n + 1);
  };

  // Add a function to end repeat session (e.g., after completion)
  const handleEndRepeatSession = () => {
    localStorage.removeItem('repeatSessionActive');
    setRepeatSessionProgress(0);
    forceUpdate(n => n + 1);
  };

  if (selectedMode) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Review Cards</h1>
        <p className="text-blue-100 dark:text-blue-200">
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Today's Progress</h2>
              {completedCount === total && total > 0 && !repeatMode && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
              {repeatMode && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Repeat Session</span>
                </div>
              )}
            </div>
            {!repeatMode && (
              <div className="space-y-2">
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (completedCount === total && total > 0 && !repeatMode)
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
                    }`}
                    style={{ width: `${(completedCount / total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{completedCount} of {total} cards completed</span>
                  <span>{((completedCount / total) * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
            {completedCount === total && total > 0 && !repeatMode && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 flex flex-col items-center">
                <p className="text-green-700 dark:text-green-400 text-center mb-2">
                  Great job! You've completed all your reviews for today. You can start a new session to review again.
                </p>
                <Button
                  className="mt-2"
                  onClick={handleStartNewSession}
                  disabled={startingNewSession}
                >
                  {startingNewSession ? 'Starting...' : 'Start New Session'}
                </Button>
              </div>
            )}
            {repeatMode && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex flex-col items-center shadow-sm">
                <div className="flex items-center mb-2">
                  <svg className="w-6 h-6 text-blue-500 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5 9a7 7 0 0114 0v6a7 7 0 01-14 0V9z" />
                  </svg>
                  <span className="text-base font-semibold text-blue-700 dark:text-blue-400">Repeat Session</span>
                </div>
                <p className="text-blue-800 dark:text-blue-300 text-center text-lg font-medium mb-2">
                  You have already completed today's review.
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-center text-sm mb-4">
                  You are in a repeat session. This does not affect your daily progress.
                </p>
                <button
                  className="w-full bg-blue-500 dark:bg-blue-600 text-white rounded-lg py-3 font-bold text-base shadow hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                  onClick={handleEndRepeatSession}
                >
                  End Repeat Session
                </button>
              </div>
            )}
          </div>
        </CardUI>
      ) : null}

      {/* No cards info message */}
      {(!hasCards && !isLoading) && (
        <div className="flex flex-col items-center justify-center p-6 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <span className="text-4xl mb-2">📚</span>
          <p className="text-blue-700 dark:text-blue-400 font-medium">No cards available for review.</p>
          <p className="text-blue-500 dark:text-blue-400 text-sm mt-1">Add new words to your lists to start practicing!</p>
        </div>
      )}

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardUI 
          className={`p-6 ${!hasCards || ((completedCount === total && total > 0) && !repeatMode) || isLoading || startingNewSession || !hasEnoughCardsForMultipleChoice ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg transition-shadow'}`}
          onClick={() => hasCards && (!((completedCount === total && total > 0) && !repeatMode)) && !isLoading && !startingNewSession && hasEnoughCardsForMultipleChoice && handleStartSession('multiple-choice')}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Multiple Choice Test</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Test your knowledge with multiple choice questions. Choose the correct definition for each word.
            </p>
            <Button className="w-full" disabled={!hasCards || ((completedCount === total && total > 0) && !repeatMode) || isLoading || startingNewSession || !hasEnoughCardsForMultipleChoice}>
              {!hasCards ? 'No Cards' : !hasEnoughCardsForMultipleChoice ? 'Need 4+ Cards' : ((completedCount === total && total > 0) && !repeatMode) ? 'Completed' : 'Start Test'}
            </Button>
          </div>
        </CardUI>

        <CardUI 
          className={`p-6 ${!hasCards || ((completedCount === total && total > 0) && !repeatMode) || isLoading || startingNewSession ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg transition-shadow'}`}
          onClick={() => hasCards && (!((completedCount === total && total > 0) && !repeatMode)) && !isLoading && !startingNewSession && handleStartSession('flashcard')}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Flashcards</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Review words with interactive flashcards. Flip to see definitions and mark if you knew them.
            </p>
            <Button className="w-full" disabled={!hasCards || ((completedCount === total && total > 0) && !repeatMode) || isLoading || startingNewSession}>
              {!hasCards ? 'No Cards' : ((completedCount === total && total > 0) && !repeatMode) ? 'Completed' : 'Start Flashcards'}
            </Button>
          </div>
        </CardUI>
      </div>
    </div>
  );
}
