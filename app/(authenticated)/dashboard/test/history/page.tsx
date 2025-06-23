"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle, Calendar, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface TestResult {
  id: string;
  sessionId: string;
  cardId: string;
  isCorrect: boolean;
  timeSpent: number;
  createdAt: string;
  card: {
    id: string;
    word: string;
    definition: string;
    viewCount: number;
    successCount: number;
    failureCount: number;
    lastReviewed: string;
    nextReview: string;
    reviewStatus: string;
    reviewStep: number;
    createdAt: string;
    updatedAt: string;
    userId: string;
    wordListId: string;
  };
}

interface TestSession {
  id: string;
  userId: string;
  createdAt: string;
  results: TestResult[];
}

interface TestHistoryResponse {
  sessions: TestSession[];
  statistics: {
    totalSessions: number;
    totalTests: number;
    correctAnswers: number;
    accuracy: number;
    averageTimeSpent: number;
  };
}

const ITEMS_PER_PAGE = 5;

export default function TestHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const api = useApi();

  // Fetch test history
  const { data: testHistoryData, isLoading } = useQuery<TestHistoryResponse>({
    queryKey: ["test-history"],
    queryFn: async () => {
      return api.get("/test-history");
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Extract sessions and statistics from the response
  const testSessions = testHistoryData?.sessions || [];
  const statistics = testHistoryData?.statistics || {
    totalSessions: 0,
    totalTests: 0,
    correctAnswers: 0,
    accuracy: 0,
    averageTimeSpent: 0
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  // Calculate statistics for a session
  const calculateSessionStats = (session: TestSession) => {
    const totalQuestions = session.results.length;
    const correctAnswers = session.results.filter(r => r.isCorrect).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const averageTime = totalQuestions > 0 
      ? session.results.reduce((acc, r) => acc + r.timeSpent, 0) / totalQuestions 
      : 0;

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      averageTime
    };
  };

  const totalPages = Math.ceil(testSessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = testSessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-6 sm:p-8 text-white shadow-lg dark:shadow-blue-900/20">
        <h1 className="text-2xl sm:text-3xl font-bold">Test History</h1>
        <p className="mt-2 text-blue-50 dark:text-blue-100">
          Review your past test performance and track your progress.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Skeleton for overall statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4 sm:p-6 animate-pulse bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-4 w-20 bg-gray-100 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-600 rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {/* Skeleton for test session cards */}
          <div className="space-y-4 mt-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4 sm:p-6 animate-pulse bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded mb-4" />
                <div className="flex gap-2 mb-2">
                  <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded" />
              </Card>
            ))}
          </div>
        </div>
      ) : testSessions.length === 0 ? (
        <Card className="p-6 bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No test history available yet.</p>
            <p className="text-sm mt-1">Complete some tests to see your history here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Tests</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{statistics.totalSessions}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/60 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-300">
                    {Math.round(statistics.accuracy)}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/60 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Incorrect</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-300">
                    {Math.round(100 - statistics.accuracy)}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Time/Question</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {formatTime(statistics.averageTimeSpent)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Test Sessions List */}
          <div className="space-y-4">
            {paginatedSessions.map((session) => {
              const stats = calculateSessionStats(session);
              return (
                <Collapsible
                  key={session.id}
                  open={expandedSessions.has(session.id)}
                  onOpenChange={() => toggleSession(session.id)}
                >
                  <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:shadow-md dark:hover:shadow-gray-900/20 transition-all">
                    <CollapsibleTrigger className="w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-2 -m-2 transition-colors">
                      <div className="space-y-4">
                        {/* Session Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                            </span>
                            {expandedSessions.has(session.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {stats.correctAnswers} correct
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {stats.incorrectAnswers} incorrect
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {formatTime(stats.averageTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      {/* Results Grid */}
                      <div className="grid gap-3 mt-4">
                        {session.results.map((result, index) => (
                          <div
                            key={result.id}
                            className={cn(
                              "p-4 rounded-lg border transition-colors",
                              result.isCorrect 
                                ? "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800/50" 
                                : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/50"
                            )}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {result.card.word}
                                  </span>
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    - {result.card.definition}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatTime(result.timeSpent)}
                                </span>
                                {result.isCorrect ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 