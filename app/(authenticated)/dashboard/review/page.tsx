"use client";

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card as CardUI } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useTodayCards, useCards } from "@/hooks/useCards";
import { CheckCircle2, BookOpen, Brain, Target, Zap, Settings } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: todayCards, isLoading } = useTodayCards();
  const [selectedMode, setSelectedMode] = useState<'multiple-choice' | 'flashcard' | null>(null);
  const [startingNewSession, setStartingNewSession] = useState(false);
  const [repeatSessionProgress, setRepeatSessionProgress] = useState(0);
  const [_, forceUpdate] = useState(0);
  const [selectedCardCount, setSelectedCardCount] = useState<number>(0);

  // Fetch card stats to get reviewedToday count
  const { getCardStats } = useCards();
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => getCardStats()
  });

  // Refetch stats when returning to this page (e.g., after completing a review session)
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  }, [queryClient]);

  // Calculate completed cards from the database reviews
  let cardsArray: any[] = [];
  if (Array.isArray(todayCards)) {
    cardsArray = todayCards;
  } else if (typeof todayCards === 'object' && todayCards !== null && Array.isArray((todayCards as any).cards)) {
    cardsArray = (todayCards as any).cards;
  }
  const hasCards = cardsArray.length > 0;
  const remainingCards = hasCards ? cardsArray.length : 0;
  const completedCount = stats?.reviewedToday || 0;
  
  // Use original daily total (completed + remaining) for progress calculation
  const originalDailyTotal = completedCount + remainingCards;
  const total = originalDailyTotal; // Use original total for progress bar
  
  const remainingCount = remainingCards;
  const isCompleted = completedCount >= originalDailyTotal && originalDailyTotal > 0;
  const hasEnoughCardsForMultipleChoice = remainingCards >= 4; // Use remaining for multiple choice check

  // Initialize selectedCardCount when cards are loaded
  if (selectedCardCount === 0 && remainingCards > 0) {
    const defaultCount = Math.min(remainingCards, 10);
    // If we have enough cards for multiple choice, ensure we start with at least 4
    setSelectedCardCount(hasEnoughCardsForMultipleChoice ? Math.max(defaultCount, 4) : defaultCount);
  }

  // Debug logging
  console.log('todayCards:', todayCards);
  console.log('cardsArray:', cardsArray);
  console.log('hasCards:', hasCards);
  console.log('total:', total);
  console.log('completedCount:', completedCount);
  console.log('stats:', stats);

  function getRepeatMode() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('repeatSessionActive') === 'true';
    }
    return false;
  }
  const repeatMode = getRepeatMode();

  const handleStartSession = (mode: 'multiple-choice' | 'flashcard') => {
    const cardCount = selectedCardCount;
    if ((completedCount === total && total > 0) || repeatMode) {
      setRepeatSessionProgress(0);
      router.push(`/dashboard/review/session?mode=${mode}&repeat=true&count=${cardCount}`);
    } else {
      router.push(`/dashboard/review/session?mode=${mode}&count=${cardCount}`);
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

  // Update loading to include stats loading
  const isLoadingData = isLoading || isLoadingStats;

  return (
    <div className="min-h-screen  dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 rounded-3xl p-8 shadow-2xl">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Review Session</h1>
                <p className="text-blue-100 dark:text-blue-200 text-lg">
                  Strengthen your vocabulary with interactive learning modes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        {isLoadingData ? (
          <CardUI className="p-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl rounded-3xl">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <div className="space-y-4">
                <Skeleton className="h-3 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
          </CardUI>
        ) : total > 0 ? (
          <CardUI className="p-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl rounded-3xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Today's Progress</h2>
                </div>
                {completedCount === total && total > 0 && !repeatMode && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Completed!</span>
                  </div>
                )}
                {repeatMode && (
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800">
                    <Zap className="w-5 h-5" />
                    <span className="font-semibold">Repeat Mode</span>
                  </div>
                )}
              </div>
              
              {!repeatMode && (
                <div className="space-y-4">
                  <div className="relative h-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full transition-all duration-700 ease-out rounded-full shadow-lg ${
                        (completedCount === total && total > 0 && !repeatMode)
                          ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500'
                          : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
                      }`}
                      style={{ width: `${total > 0 ? (completedCount / total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {completedCount} of {total} cards
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">completed</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {total > 0 ? ((completedCount / total) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {completedCount === total && total > 0 && !repeatMode && (
                <div className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-lg">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                      Fantastic Work! 🎉
                    </h3>
                    <p className="text-emerald-700 dark:text-emerald-400 mb-4 text-lg">
                      You've completed all your reviews for today. Ready for another round?
                    </p>
                    <Button
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={handleStartNewSession}
                      disabled={startingNewSession}
                    >
                      {startingNewSession ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Starting...
                        </div>
                      ) : (
                        'Start New Session'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {repeatMode && (
                <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-4">
                      <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-2">
                      Repeat Session Active ⚡
                    </h3>
                    <p className="text-blue-700 dark:text-blue-400 mb-2 text-lg">
                      You've already completed today's review.
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 text-sm mb-4">
                      This session won't affect your daily progress.
                    </p>
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={handleEndRepeatSession}
                    >
                      End Repeat Session
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardUI>
        ) : null}

        {/* Card Selection Section */}
        {hasCards && !isLoadingData && (
          <CardUI className="p-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl rounded-3xl">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Session Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    Cards to Review
                  </label>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedCardCount}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">of {remainingCards}</span>
                  </div>
                </div>
                
                <div className="px-3">
                  <Slider
                    value={[selectedCardCount]}
                    onValueChange={(value) => setSelectedCardCount(value[0])}
                    max={remainingCards}
                    min={hasEnoughCardsForMultipleChoice ? 4 : 1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{hasEnoughCardsForMultipleChoice ? '4 cards' : '1 card'}</span>
                    <span>{remainingCards} cards</span>
                  </div>
                  {hasEnoughCardsForMultipleChoice && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      Multiple choice requires at least 4 cards
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {[5, 10, 15, 20]
                    .filter(num => num <= remainingCards)
                    .filter(num => !hasEnoughCardsForMultipleChoice || num >= 4)
                    .map((num) => (
                    <Button
                      key={num}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCardCount(num)}
                      className={`${
                        selectedCardCount === num
                          ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300'
                          : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCardCount(remainingCards)}
                    className={`${
                      selectedCardCount === remainingCards
                        ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300'
                        : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    All ({remainingCards})
                  </Button>
                </div>
              </div>
            </div>
          </CardUI>
        )}

        {/* No cards info message */}
        {(!hasCards && !isLoadingData) && (
          <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl border border-blue-200 dark:border-blue-800 shadow-xl">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-4">
              <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-2">No Cards Available</h3>
            <p className="text-blue-600 dark:text-blue-400 text-center max-w-md">
              Add new words to your lists to start your learning journey and build your vocabulary!
            </p>
          </div>
        )}

        {/* Mode Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Multiple Choice Card */}
          <CardUI 
            className={`group relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl rounded-3xl transition-all duration-500 ${
              !hasCards || ((completedCount === total && total > 0) && !repeatMode) || isLoadingData || startingNewSession || !hasEnoughCardsForMultipleChoice || selectedCardCount < 4
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:shadow-2xl hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-slate-800/80'
            }`}
            onClick={() => hasCards && (!((completedCount === total && total > 0) && !repeatMode)) && !isLoadingData && !startingNewSession && hasEnoughCardsForMultipleChoice && selectedCardCount >= 4 && handleStartSession('multiple-choice')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Multiple Choice</h3>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <span className="text-sm font-medium">Quick Test Mode</span>
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    <span className="text-sm">4+ cards required</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                Challenge yourself with interactive multiple choice questions. Perfect for quick knowledge assessment and focused learning.
              </p>
              
              <div className="pt-4">
                <Button 
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                    !hasCards || ((completedCount === total && total > 0) && !repeatMode) || isLoadingData || startingNewSession || !hasEnoughCardsForMultipleChoice || selectedCardCount < 4
                      ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                  disabled={!hasCards || ((completedCount === total && total > 0) && !repeatMode) || isLoadingData || startingNewSession || !hasEnoughCardsForMultipleChoice || selectedCardCount < 4}
                >
                  {!hasCards ? 'No Cards Available' : 
                   !hasEnoughCardsForMultipleChoice ? 'Need 4+ Cards' : 
                   selectedCardCount < 4 ? 'Select 4+ Cards' :
                   ((completedCount === total && total > 0) && !repeatMode) ? 'Session Completed' : 
                   `Start Quiz (${selectedCardCount} cards)`}
                </Button>
              </div>
            </div>
          </CardUI>

          {/* Flashcards Card */}
          <CardUI 
            className={`group relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl rounded-3xl transition-all duration-500 ${
              !hasCards || ((completedCount === total && total > 0) && !repeatMode) || isLoadingData || startingNewSession 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:shadow-2xl hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-slate-800/80'
            }`}
            onClick={() => hasCards && (!((completedCount === total && total > 0) && !repeatMode)) && !isLoadingData && !startingNewSession && handleStartSession('flashcard')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Flashcards</h3>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <span className="text-sm font-medium">Interactive Review</span>
                    <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm">Self-paced</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                Review vocabulary with classic flashcard experience. Flip cards to reveal definitions and track your knowledge retention.
              </p>
              
              <div className="pt-4">
                <Button 
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                    !hasCards || ((completedCount === total && total > 0) && !repeatMode) || isLoadingData || startingNewSession
                      ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                  disabled={!hasCards || ((completedCount === total && total > 0) && !repeatMode) || isLoadingData || startingNewSession}
                >
                  {!hasCards ? 'No Cards Available' : 
                   ((completedCount === total && total > 0) && !repeatMode) ? 'Session Completed' : 
                   `Start Flashcards (${selectedCardCount} cards)`}
                </Button>
              </div>
            </div>
          </CardUI>
        </div>
      </div>
    </div>
  );
}
