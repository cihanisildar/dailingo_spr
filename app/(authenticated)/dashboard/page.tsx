"use client";

export const dynamic = 'force-dynamic';

import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Flame, Clock, BookOpen, List, ArrowRight, CheckCircle, FileText, Bookmark, Settings, BarChart2, PlayCircle, Layers, Trophy } from "lucide-react";
import Link from "next/link";
import { useCards, useTodayCards } from "@/hooks/useCards";
import { Button } from "@/components/ui/button";
import {
  ListChecks,
  TrendingUp,
  Calendar,
  BarChart,
  Award,
  AlertTriangle,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { usePathname } from "next/navigation";

// Add this interface near the top of the file
interface Review {
  id: string;
  nextReview: string;
}

export default function DashboardPage() {
  const pathname = usePathname();
  // Fetch streak data
  const { data: streak, isLoading: isLoadingStreak } = useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const { data } = await api.get('/streak');
      return data;
    }
  });

  // Fetch today's cards using the hook
  const { data: todayCards, isLoading: isLoadingTodayCards } = useTodayCards();

  // Fetch all cards using the hook
  const { data: allCards, isLoading: isLoadingAllCards } = useCards();

  // Fetch word lists
  const { data: wordLists, isLoading: isLoadingWordLists } = useQuery({
    queryKey: ['wordLists'],
    queryFn: async () => {
      const { data } = await api.get('/lists');
      return data;
    }
  });

  // Fetch upcoming reviews for the next 7 days
  const { data: upcomingReviews = { cards: {} } } = useQuery({
    queryKey: ["upcomingReviews"],
    queryFn: async () => {
      const { data } = await api.get("/cards/upcoming?days=7");
      return data;
    },
  });

  // Fetch performance stats
  const { data: stats = {} } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data } = await api.get("/cards/stats");
      return data;
    },
  });

  // Update the isLoading check to include the new loading state
  const isLoading = isLoadingStreak || isLoadingTodayCards || isLoadingAllCards || isLoadingWordLists;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Welcome Section Skeleton */}
        <div className="bg-gradient-to-r from-blue-600/50 to-blue-700/50 rounded-xl md:rounded-2xl p-6 md:p-8 animate-pulse">
          <div className="h-8 w-48 bg-white/20 rounded mb-2" />
          <div className="h-4 w-64 bg-white/20 rounded" />
        </div>

        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 md:p-6 animate-pulse">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-gray-200 rounded-lg h-10 w-10 md:h-12 md:w-12" />
                <div className="space-y-2">
                  <div className="h-3 md:h-4 w-16 md:w-24 bg-gray-200 rounded" />
                  <div className="h-5 md:h-6 w-12 md:w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-4 md:p-6 bg-gray-200 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 md:h-6 w-24 md:w-32 bg-gray-300 rounded" />
                  <div className="h-3 md:h-4 w-32 md:w-48 bg-gray-300 rounded" />
                </div>
                <div className="h-5 md:h-6 w-5 md:w-6 bg-gray-300 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="grid grid-cols-4 gap-3 px-1">
          <Link href="/dashboard/review">
            <Card className={`p-4 text-center transition-all ${pathname === '/dashboard/review' ? 'bg-emerald-900/20 border-emerald-800 dark:bg-emerald-900/30' : 'hover:bg-emerald-900/10 dark:hover:bg-emerald-900/20'}`}>
              <div className="flex flex-col items-center gap-2">
                <PlayCircle className={`w-6 h-6 ${pathname === '/dashboard/review' ? 'text-emerald-400' : 'text-emerald-500'}`} />
                <span className={`text-sm font-medium ${pathname === '/dashboard/review' ? 'text-emerald-400' : 'text-emerald-500'}`}>Review</span>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/cards">
            <Card className={`p-4 text-center transition-all ${pathname === '/dashboard/cards' ? 'bg-blue-900/20 border-blue-800 dark:bg-blue-900/30' : 'hover:bg-blue-900/10 dark:hover:bg-blue-900/20'}`}>
              <div className="flex flex-col items-center gap-2">
                <Layers className={`w-6 h-6 ${pathname === '/dashboard/cards' ? 'text-blue-400' : 'text-blue-500'}`} />
                <span className={`text-sm font-medium ${pathname === '/dashboard/cards' ? 'text-blue-400' : 'text-blue-500'}`}>Cards</span>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/lists">
            <Card className={`p-4 text-center transition-all ${pathname === '/dashboard/lists' ? 'bg-purple-900/20 border-purple-800 dark:bg-purple-900/30' : 'hover:bg-purple-900/10 dark:hover:bg-purple-900/20'}`}>
              <div className="flex flex-col items-center gap-2">
                <Bookmark className={`w-6 h-6 ${pathname === '/dashboard/lists' ? 'text-purple-400' : 'text-purple-500'}`} />
                <span className={`text-sm font-medium ${pathname === '/dashboard/lists' ? 'text-purple-400' : 'text-purple-500'}`}>Lists</span>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/test">
            <Card className={`p-4 text-center transition-all ${pathname === '/dashboard/test' ? 'bg-amber-900/20 border-amber-800 dark:bg-amber-900/30' : 'hover:bg-amber-900/10 dark:hover:bg-amber-900/20'}`}>
              <div className="flex flex-col items-center gap-2">
                <FileText className={`w-6 h-6 ${pathname === '/dashboard/test' ? 'text-amber-400' : 'text-amber-500'}`} />
                <span className={`text-sm font-medium ${pathname === '/dashboard/test' ? 'text-amber-400' : 'text-amber-500'}`}>Test</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 rounded-3xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-blue-100 dark:text-blue-200">Track your progress and keep learning.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-orange-900/10 dark:bg-orange-900/20">
          <div className="flex items-center gap-4">
            <div className="bg-orange-900/20 dark:bg-orange-900/30 p-3 rounded-lg">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Current Streak</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.currentStreak || 0} Days</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-blue-900/10 dark:bg-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="bg-blue-900/20 dark:bg-blue-900/30 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Today's Review</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{todayCards?.length || 0} Cards</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-emerald-900/10 dark:bg-emerald-900/20">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-900/20 dark:bg-emerald-900/30 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Cards</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{allCards?.length || 0}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-purple-900/10 dark:bg-purple-900/20">
          <div className="flex items-center gap-4">
            <div className="bg-purple-900/20 dark:bg-purple-900/30 p-3 rounded-lg">
              <ListChecks className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Word Lists</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{wordLists?.length || 0}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Learning Progress</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your vocabulary journey</p>
            </div>
            <BookOpen className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-900/20 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-300">Mastered Words</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.completedCards || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/20 dark:bg-blue-900/30 rounded-lg">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-300">In Progress</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.activeCards || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-900/20 dark:bg-amber-900/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-300">Needs Review</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.needsReview || 0}</span>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Overall Progress</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.completedCards && stats.totalCards 
                    ? Math.round((stats.completedCards / stats.totalCards) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
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

        {/* Upcoming Reviews */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Reviews</h2>
              <p className="text-sm text-gray-500">Next 7 days</p>
            </div>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {[...Array(7)].map((_, index) => {
              const date = addDays(new Date(), index);
              const dateStr = format(date, 'yyyy-MM-dd');
              const reviewsForDay = upcomingReviews.cards[dateStr] || { total: 0 };

              return (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-gray-600">{format(date, 'EEE, MMM d')}</span>
                  <span className="font-semibold">{reviewsForDay.total || 0} cards</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/review">
          <Card className="p-6 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  Start Today's Review
                </h3>
                <p className="text-sm text-gray-500">
                  Review your cards and maintain your streak
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/cards">
          <Card className="p-6 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  Manage Your Cards
                </h3>
                <p className="text-sm text-gray-500">
                  Add, edit, or organize your flashcards
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
} 