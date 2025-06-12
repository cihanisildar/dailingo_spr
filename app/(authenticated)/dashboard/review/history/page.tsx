"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { CheckCircle, XCircle, Calendar, TrendingUp } from "lucide-react";
import { ReviewHistorySkeleton } from "@/components/review/ReviewSkeletons";

interface Review {
  id: string;
  word: string;
  nextReview: string;
  successCount: number;
  failureCount: number;
}

interface ReviewHistory {
  statistics: {
    totalReviews: number;
    totalSuccess: number;
    totalFailures: number;
    averageSuccessRate: number;
  };
  reviewsByDate: Record<string, Review[]>;
}

export default function ReviewHistoryPage() {
  const api = useApi();
  const { data, isLoading } = useQuery<ReviewHistory>({
    queryKey: ['review-history'],
    queryFn: async () => {
      return api.get('/cards/history');
    }
  });

  if (isLoading) {
    return <ReviewHistorySkeleton />;
  }

  const { statistics, reviewsByDate } = data || {};

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Review History</h1>
        <p className="text-blue-100 dark:text-blue-200">Track your learning progress over time.</p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviews</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics?.totalReviews || 0}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics?.totalSuccess || 0}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Need Practice</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics?.totalFailures || 0}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(statistics?.averageSuccessRate || 0)}%
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Review Timeline */}
      <Card className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Review Timeline</h2>
        <div className="space-y-6">
          {Object.entries(reviewsByDate || {}).map(([date, reviews]) => (
            <div key={date} className="border-l-2 border-indigo-200 dark:border-indigo-800 pl-4 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {format(new Date(date), 'MMMM d, yyyy')}
                </h3>
              </div>
              <div className="grid gap-4">
                {reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{review.word}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Next review: {format(new Date(review.nextReview), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        <span>{review.successCount}</span>
                      </div>
                      <div className="flex items-center text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5 mr-1" />
                        <span>{review.failureCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 