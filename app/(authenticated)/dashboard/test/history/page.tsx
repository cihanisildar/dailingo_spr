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

const ITEMS_PER_PAGE = 5;

export default function TestHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const api = useApi();

  // Fetch test history
  const { data: testSessions = [], isLoading } = useQuery<TestSession[]>({
    queryKey: ["test-history"],
    queryFn: async () => {
      return api.get("/test-history");
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const formatTime = (ms: number) => {
    return `${Math.floor(ms / 1000)}.${(ms % 1000).toString().padStart(3, "0")}s`;
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
      <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-900 dark:to-blue-800 p-6 sm:p-8 text-white">
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
              <Card key={i} className="p-4 sm:p-6 animate-pulse bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800" />
                  <div className="flex-1">
                    <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {/* Skeleton for test session cards */}
          <div className="space-y-4 mt-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4 sm:p-6 animate-pulse bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded mb-4" />
                <div className="flex gap-2 mb-2">
                  <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
                <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
              </Card>
            ))}
          </div>
        </div>
      ) : testSessions.length === 0 ? (
        <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No test history available yet.</p>
            <p className="text-sm mt-1">Complete some tests to see your history here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Tests</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{testSessions.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Correct</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    {Math.round(
                      (testSessions.reduce((acc, session) => acc + session.correctAnswers, 0) /
                        testSessions.reduce((acc, session) => acc + session.totalQuestions, 0)) *
                        100
                    )}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Incorrect</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                    {Math.round(
                      (testSessions.reduce((acc, session) => acc + session.incorrectAnswers, 0) /
                        testSessions.reduce((acc, session) => acc + session.totalQuestions, 0)) *
                        100
                    )}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Time/Question</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
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
            {paginatedSessions.map((session) => (
              <Collapsible
                key={session.id}
                open={expandedSessions.has(session.id)}
                onOpenChange={() => toggleSession(session.id)}
              >
                <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CollapsibleTrigger className="w-full">
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
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {session.correctAnswers} correct
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {session.incorrectAnswers} incorrect
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatTime(session.averageTime)}
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
                          key={index}
                          className={cn(
                            "p-4 rounded-lg",
                            result.isCorrect 
                              ? "bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800" 
                              : "bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{result.word}</span>
                                <span className="text-gray-400 dark:text-gray-500">→</span>
                                <span className="text-gray-600 dark:text-gray-300">{result.definition}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatTime(result.timeSpent)}
                              </span>
                              {result.isCorrect ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
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