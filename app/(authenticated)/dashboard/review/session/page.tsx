"use client";

import { useSearchParams, useRouter } from "next/navigation";
import ReviewCards from "@/components/review/ReviewCards";
import { ArrowLeft, Settings, Clock, Trophy, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTodayCards } from "@/hooks/useCards";
import { useStreak } from "@/hooks/useStreak";
import { useQuery } from "@tanstack/react-query";

export default function ReviewSessionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") === "flashcard" ? "flashcards" : "multiple-choice";
  const repeat = searchParams.get("repeat") === "true";
  const count = parseInt(searchParams.get("count") || "0", 10);
  
  // Get session data for enhanced UI
  const { data: todayCards } = useTodayCards({ repeat });
  const { data: streak } = useStreak();
  
  const totalCards = Array.isArray(todayCards) ? todayCards.length : 0;
  const modeLabel = mode === "flashcards" ? "Flashcard" : "Multiple Choice";
  
  return (
    // Full screen container that bypasses the sidebar layout
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/30 overflow-y-auto">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 dark:from-blue-800/10 dark:to-indigo-800/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-200/20 to-pink-200/20 dark:from-purple-800/10 dark:to-pink-800/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
        
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Review</span>
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Session Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 mb-4">
                <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {modeLabel} Mode
                </span>
                {repeat && (
                  <>
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Repeat Session</span>
                  </>
                )}
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-3">
                Review Session
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {totalCards > 0 
                  ? `${totalCards} card${totalCards === 1 ? '' : 's'} ready for review` 
                  : "Loading your review session..."
                }
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Today's Goal</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalCards}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                    <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Streak</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{streak?.currentStreak || 0}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Est. Time</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{Math.ceil(totalCards * 0.5)}m</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Review Cards Section */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Review Cards Container with enhanced styling */}
          <div className="relative">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-xl" />
            
            {/* Main review container */}
            <div className="relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-6 sm:p-8 lg:p-12">
              <ReviewCards initialMode={mode} initialRepeat={repeat} initialCount={count > 0 ? count : undefined} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 