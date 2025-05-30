"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle, Calendar, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/axios";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

  // Fetch test history
  const { data: testSessions = [], isLoading } = useQuery<TestSession[]>({
    queryKey: ["test-history"],
    queryFn: async () => {
      const response = await api.get("/test-history");
      return response.data;
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
      <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold">Test History</h1>
        <p className="mt-2 text-blue-50">
          Review your past test performance and track your progress.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Skeleton for overall statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4 sm:p-6 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 w-20 bg-gray-100 rounded mb-2" />
                    <div className="h-6 w-12 bg-gray-200 rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {/* Skeleton for test session cards */}
          <div className="space-y-4 mt-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4 sm:p-6 animate-pulse">
                <div className="h-4 w-32 bg-gray-100 rounded mb-4" />
                <div className="flex gap-2 mb-2">
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </Card>
            ))}
          </div>
        </div>
      ) : testSessions.length === 0 ? (
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
            {paginatedSessions.map((session) => (
              <Collapsible
                key={session.id}
                open={expandedSessions.has(session.id)}
                onOpenChange={() => toggleSession(session.id)}
              >
                <Card className="p-4 sm:p-6">
                  <CollapsibleTrigger className="w-full">
                    <div className="space-y-4">
                      {/* Session Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                          </span>
                          {expandedSessions.has(session.id) ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
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
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    {/* Results Grid */}
                    <div className="grid gap-3 mt-4">
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
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
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