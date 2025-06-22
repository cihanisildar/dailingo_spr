"use client";

export const dynamic = 'force-dynamic';

import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Flame, Clock, BookOpen, List, ArrowRight, CheckCircle, FileText, Bookmark, Settings, BarChart2, PlayCircle, Layers, Trophy } from "lucide-react";
import Link from "next/link";
import { useCards, useTodayCards, useUpcomingReviews } from "@/hooks/useCards";
import { useLists } from "@/hooks/useLists";
import { useStreak } from "@/hooks/useStreak";
import { Button } from "@/components/ui/button";
import {
  ListChecks,
  TrendingUp,
  Calendar,
  BarChart,
  Award,
  AlertTriangle,
  ChevronRight,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { GroupedCards } from "@/hooks/useCards";

// Add this interface near the top of the file
interface Review {
  id: string;
  nextReview: string;
}

export default function DashboardPage() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Fetch streak data only when authenticated
  const { data: streak } = useStreak({ enabled: status === "authenticated" });

  // Fetch today's cards using the hook
  const { data: todayCards, isLoading: isLoadingTodayCards } = useTodayCards();

  // Fetch all cards using the hook
  const { getCards } = useCards();
  const { data: allCards, isLoading: isLoadingAllCards } = useQuery({
    queryKey: ['cards'],
    queryFn: () => getCards()
  });

  // Fetch word lists using the hook
  const { getLists } = useLists();
  const { data: wordLists, isLoading: isLoadingWordLists } = useQuery({
    queryKey: ['wordLists'],
    queryFn: () => getLists()
  });

  // Fetch upcoming reviews for the next 7 days
  const { data: upcomingReviews = { cards: {} } } = useUpcomingReviews();

  // Fetch performance stats
  const { getCardStats } = useCards();
  const { data: stats = {
    currentStreak: 0,
    completedCards: 0,
    activeCards: 0,
    needsReview: 0,
    totalCards: 0
  } } = useQuery({
    queryKey: ["stats"],
    queryFn: () => getCardStats()
  });

  // Update the isLoading check to include the new loading state
  const isLoading = isLoadingTodayCards || isLoadingAllCards || isLoadingWordLists;

  if (isLoading) {
    return (
      <div className="min-h-screen space-y-8 animate-in fade-in-50 duration-500">
        {/* Welcome Section Skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/90 via-purple-600/80 to-pink-500/70 rounded-3xl p-8 md:p-12">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="h-10 w-64 bg-white/20 rounded-2xl mb-4 animate-pulse" />
            <div className="h-6 w-80 bg-white/15 rounded-xl animate-pulse" />
          </div>
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/5 rounded-full animate-pulse" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full animate-pulse" />
        </div>

        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-0 shadow-xl animate-pulse">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-2xl h-16 w-16" />
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-0 shadow-xl animate-pulse">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                    <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                  </div>
                  <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    const todayCount = todayCards?.length || 0;
    const streakCount = stats.currentStreak || 0;

    if (todayCount === 0 && streakCount > 0) {
      return "Great streak! Ready for today's session?";
    } else if (todayCount > 0) {
      return `${todayCount} cards waiting for you!`;
    } else if (hour < 12) {
      return "Good morning! Let's start learning.";
    } else if (hour < 18) {
      return "Good afternoon! Time to practice.";
    }
    return "Good evening! End your day with learning.";
  };

  return (
    <div className="min-h-screen animate-in fade-in-50 duration-700">
      {/* Enhanced Mobile Navigation */}
      <div className="lg:hidden mb-6">
        <div className="grid grid-cols-4 gap-2 p-1 bg-gray-50 dark:bg-gray-900/50 rounded-2xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-800">
          <Link href="/dashboard/review">
            <Card className={`p-4 text-center transition-all duration-300 border-0 ${
              pathname === '/dashboard/review' 
                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25 scale-105' 
                : 'bg-white/60 dark:bg-gray-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:scale-102'
            }`}>
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-xl ${
                  pathname === '/dashboard/review' 
                    ? 'bg-white/20' 
                    : 'bg-emerald-100 dark:bg-emerald-900/30'
                }`}>
                  <PlayCircle className={`w-5 h-5 ${
                    pathname === '/dashboard/review' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                  }`} />
                </div>
                <span className={`text-xs font-medium ${
                  pathname === '/dashboard/review' ? 'text-white' : 'text-emerald-700 dark:text-emerald-300'
                }`}>Review</span>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/cards">
            <Card className={`p-4 text-center transition-all duration-300 border-0 ${
              pathname === '/dashboard/cards' 
                ? 'bg-blue-500 shadow-lg shadow-blue-500/25 scale-105' 
                : 'bg-white/60 dark:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-102'
            }`}>
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-xl ${
                  pathname === '/dashboard/cards' 
                    ? 'bg-white/20' 
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  <Layers className={`w-5 h-5 ${
                    pathname === '/dashboard/cards' ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                  }`} />
                </div>
                <span className={`text-xs font-medium ${
                  pathname === '/dashboard/cards' ? 'text-white' : 'text-blue-700 dark:text-blue-300'
                }`}>Cards</span>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/lists">
            <Card className={`p-4 text-center transition-all duration-300 border-0 ${
              pathname === '/dashboard/lists' 
                ? 'bg-purple-500 shadow-lg shadow-purple-500/25 scale-105' 
                : 'bg-white/60 dark:bg-gray-800/60 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:scale-102'
            }`}>
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-xl ${
                  pathname === '/dashboard/lists' 
                    ? 'bg-white/20' 
                    : 'bg-purple-100 dark:bg-purple-900/30'
                }`}>
                  <Bookmark className={`w-5 h-5 ${
                    pathname === '/dashboard/lists' ? 'text-white' : 'text-purple-600 dark:text-purple-400'
                  }`} />
                </div>
                <span className={`text-xs font-medium ${
                  pathname === '/dashboard/lists' ? 'text-white' : 'text-purple-700 dark:text-purple-300'
                }`}>Lists</span>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/test">
            <Card className={`p-4 text-center transition-all duration-300 border-0 ${
              pathname === '/dashboard/test' 
                ? 'bg-amber-500 shadow-lg shadow-amber-500/25 scale-105' 
                : 'bg-white/60 dark:bg-gray-800/60 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:scale-102'
            }`}>
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-xl ${
                  pathname === '/dashboard/test' 
                    ? 'bg-white/20' 
                    : 'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  <FileText className={`w-5 h-5 ${
                    pathname === '/dashboard/test' ? 'text-white' : 'text-amber-600 dark:text-amber-400'
                  }`} />
                </div>
                <span className={`text-xs font-medium ${
                  pathname === '/dashboard/test' ? 'text-white' : 'text-amber-700 dark:text-amber-300'
                }`}>Test</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Modern Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 shadow-xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
                Welcome Back{session?.user?.name ? `, ${session.user.name}!` : '!'}
              </h1>
              <p className="text-base text-white/80 mb-1 font-medium">
                {getMotivationalMessage()}
              </p>
              <p className="text-sm text-white/60">
                Continue your learning journey and achieve your goals.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Trophy className="w-4 h-4 text-yellow-300" />
              </div>
              <div className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm">
                <span className="text-xs font-medium text-white/90">
                  Day {stats.currentStreak || 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6">
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-md group-hover:shadow-orange-500/25 transition-all duration-300">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">Current Streak</p>
              <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {stats.currentStreak || 0}
              </h3>
              <p className="text-xs text-orange-600 dark:text-orange-400">Days</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md group-hover:shadow-blue-500/25 transition-all duration-300">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Today's Review</p>
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {todayCards?.length || 0}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400">Cards</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-md group-hover:shadow-emerald-500/25 transition-all duration-300">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Total Cards</p>
              <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {allCards?.length || 0}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Created</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md group-hover:shadow-purple-500/25 transition-all duration-300">
              <ListChecks className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Word Lists</p>
              <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {wordLists?.length || 0}
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-400">Active</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
        {/* Enhanced Learning Progress */}
        <Card className="p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Learning Progress</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your vocabulary mastery journey</p>
            </div>
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-md">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl transition-all duration-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg shadow-sm">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Mastered Words</span>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Fully learned</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-emerald-600">{stats.completedCards || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl transition-all duration-300 hover:bg-blue-100 dark:hover:bg-blue-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">In Progress</span>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Actively learning</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-blue-600">{stats.activeCards || 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl transition-all duration-300 hover:bg-amber-100 dark:hover:bg-amber-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Needs Review</span>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Due for practice</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-amber-600">{stats.needsReview || 0}</span>
              </div>
            </div>

            <div className="mt-5 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Overall Progress</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {stats.completedCards && stats.totalCards 
                    ? Math.round((stats.completedCards / stats.totalCards) * 100)
                    : 0}%
                </span>
              </div>
              <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                <div 
                  className="relative h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ 
                    width: `${stats.completedCards && stats.totalCards 
                      ? Math.round((stats.completedCards / stats.totalCards) * 100)
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Upcoming Reviews */}
        <Card className="p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Upcoming Reviews</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Next 7 days schedule</p>
            </div>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md">
              <Calendar className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            {[...Array(7)].map((_, index) => {
              const date = addDays(new Date(), index);
              const dateStr = format(date, 'yyyy-MM-dd');
              const reviewsForDay = (upcomingReviews.cards as Record<string, GroupedCards>)[dateStr] || { total: 0 };
              const isToday = index === 0;
              const cardCount = reviewsForDay.total || 0;

              return (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                    isToday 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800' 
                      : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isToday && (
                      <div className="p-1.5 bg-blue-500 rounded-lg">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div>
                      <span className={`font-semibold text-sm ${
                        isToday 
                          ? 'text-blue-900 dark:text-blue-100' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {format(date, 'EEE, MMM d')}
                      </span>
                      {isToday && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">Today</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-bold ${
                      cardCount > 0 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {cardCount}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">cards</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
} 