"use client";

import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Mail, User, Star, Calendar, Trophy, Flame } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: userData } = useQuery({
    queryKey: ["user-data"],
    queryFn: async () => {
      const { data } = await api.get("/user");
      return data;
    },
  });

  const { data: streak } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      const { data } = await api.get("/streak");
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const { data } = await api.get("/cards/stats");
      return data;
    },
  });

  if (!session?.user) return null;

  return (
    <div className="">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          Profile
        </h1>
        <Link href="/dashboard/profile/edit">
          <Button
            variant="outline"
            className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors border-blue-200"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Basic Info Card */}
        <Card className="p-8 shadow-lg border-t-4 border-t-blue-500">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full border border-blue-300 bg-blue-100 flex items-center justify-center">
              <span className="text-2xl font-semibold text-blue-600">
                {session.user.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900">
                {session.user.name}
              </h2>
              <div className="flex items-center gap-2 text-gray-500 mt-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>{session.user.email}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Streak Card */}
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Streak</p>
                <p className="text-2xl font-bold text-orange-600">
                  {streak?.currentStreak || 0} days
                </p>
                <p className="text-xs text-gray-400">
                  Best: {streak?.longestStreak || 0} days
                </p>
              </div>
            </div>
          </Card>

          {/* Total Cards Card */}
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full">
                <Star className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cards</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.totalCards || 0}
                </p>
                <p className="text-xs text-gray-400">
                  {stats?.completedCards || 0} completed
                </p>
              </div>
            </div>
          </Card>

          {/* Member Since Card */}
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-50 rounded-full">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-2xl font-bold text-green-600">
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
        <Card className="p-8 shadow-lg border-t-4 border-t-indigo-500">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <p className="text-2xl font-bold text-blue-600">
                {stats?.reviewStreak || 0}
              </p>
              <p className="text-sm text-gray-600">Day Streak</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <p className="text-2xl font-bold text-green-600">
                {stats?.successRate || 0}%
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50">
              <p className="text-2xl font-bold text-purple-600">
                {stats?.totalReviews || 0}
              </p>
              <p className="text-sm text-gray-600">Total Reviews</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
              <p className="text-2xl font-bold text-orange-600">
                {stats?.wordLists || 0}
              </p>
              <p className="text-sm text-gray-600">Word Lists</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
