"use client";

import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Mail, User, Star, Calendar, Trophy, Flame } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";

interface UserData {
  createdAt: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

interface StatsData {
  totalCards: number;
  completedCards: number;
  reviewStreak: number;
  successRate: number;
  totalReviews: number;
  wordLists: number;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const api = useApi();

  const { data: userData } = useQuery<UserData>({
    queryKey: ["user-data"],
    queryFn: async () => {
      return api.get("/user");
    },
  });

  const { data: streak } = useQuery<StreakData>({
    queryKey: ["streak"],
    queryFn: async () => {
      return api.get("/streak");
    },
  });

  const { data: stats } = useQuery<StatsData>({
    queryKey: ["user-stats"],
    queryFn: async () => {
      return api.get("/cards/stats");
    },
  });

  if (!session?.user) return null;

  return (
    <div className="">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 text-transparent bg-clip-text">
          Profile
        </h1>
        <Link href="/dashboard/profile/edit">
          <Button
            variant="outline"
            className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border-blue-200 dark:border-blue-700 text-gray-900 dark:text-gray-100"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Basic Info Card */}
        <Card className="p-8 shadow-lg border-t-4 border-t-blue-500 dark:border-t-blue-400 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full border border-blue-300 dark:border-blue-600 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {session.user.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {session.user.name}
              </h2>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>{session.user.email}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Streak Card */}
          <Card className="p-6 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/20 rounded-full">
                <Flame className="w-6 h-6 text-orange-500 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {streak?.currentStreak || 0} days
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Best: {streak?.longestStreak || 0} days
                </p>
              </div>
            </div>
          </Card>

          {/* Total Cards Card */}
          <Card className="p-6 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/20 rounded-full">
                <Star className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Cards</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.totalCards || 0}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {stats?.completedCards || 0} completed
                </p>
              </div>
            </div>
          </Card>

          {/* Member Since Card */}
          <Card className="p-6 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/20 rounded-full">
                <Calendar className="w-6 h-6 text-green-500 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {new Date(
                    userData?.createdAt || Date.now()
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Achievement Stats */}
        <Card className="p-8 shadow-lg border-t-4 border-t-indigo-500 dark:border-t-indigo-400 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-transparent bg-clip-text">
            <Trophy className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            Achievements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.reviewStreak || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats?.successRate || 0}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats?.totalReviews || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats?.wordLists || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Word Lists</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
