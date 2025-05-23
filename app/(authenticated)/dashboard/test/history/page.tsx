"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle, Calendar, TrendingUp } from "lucide-react";
import api from "@/lib/axios";
import { formatDistanceToNow } from "date-fns";

interface TestSession {
  id: string;
  createdAt: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageTime: number;
  results: {
    word: string;
    definition: string;
    isCorrect: boolean;
    timeSpent: number;
  }[];
}

export default function TestHistoryPage() {
  // Fetch test history
  const { data: testSessions = [] } = useQuery<TestSession[]>({
    queryKey: ["test-history"],
    queryFn: async () => {
      const response = await api.get("/test-history");
      return response.data;
    },
    staleTime: 0, // Consider data immediately stale
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true // Refetch when window regains focus
  });

  const formatTime = (ms: number) => {
    return `${Math.floor(ms / 1000)}.${(ms % 1000).toString().padStart(3, "0")}s`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold">Test History</h1>
        <p className="mt-2 text-blue-50">
          Review your past test performance and track your progress.
        </p>
      </div>

      {testSessions.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-8 text-gray-500">
            <p>No test history available yet.</p>
            <p className="text-sm mt-1">Complete some tests to see your history here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Tests</p>
                  <p className="text-2xl font-semibold">{testSessions.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg. Correct</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {Math.round(
                      (testSessions.reduce((acc, session) => acc + session.correctAnswers, 0) /
                        testSessions.reduce((acc, session) => acc + session.totalQuestions, 0)) *
                        100
                    )}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg. Incorrect</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {Math.round(
                      (testSessions.reduce((acc, session) => acc + session.incorrectAnswers, 0) /
                        testSessions.reduce((acc, session) => acc + session.totalQuestions, 0)) *
                        100
                    )}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg. Time/Question</p>
                  <p className="text-2xl font-semibold">
                    {formatTime(
                      testSessions.reduce((acc, session) => acc + session.averageTime, 0) /
                        testSessions.length
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Test Sessions List */}
          <div className="space-y-4">
            {testSessions.map((session) => (
              <Card key={session.id} className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Session Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">
                          {session.correctAnswers} correct
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-sm font-medium">
                          {session.incorrectAnswers} incorrect
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {formatTime(session.averageTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Results Grid */}
                  <div className="grid gap-3">
                    {session.results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          result.isCorrect ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{result.word}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-gray-600">{result.definition}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                              {formatTime(result.timeSpent)}
                            </span>
                            {result.isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 