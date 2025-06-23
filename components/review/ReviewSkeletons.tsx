import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingReviewsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Card Skeleton */}
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 overflow-hidden">
        <div className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 bg-white/20" />
              <Skeleton className="h-5 w-64 mt-2 bg-white/10" />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-full py-2.5 px-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 bg-white/20" />
                    <Skeleton className="h-4 w-24 bg-white/20" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-10 w-32 bg-white/20 rounded-full" />
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar Skeleton */}
      <Card className="overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900">
        <div className="p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <Skeleton className="h-6 w-36 bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>

          <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
            {/* Week day headers */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 p-1.5 sm:p-2 text-center border-b border-gray-200 dark:border-gray-700">
                <Skeleton className="h-4 w-8 mx-auto bg-gray-300 dark:bg-gray-600" />
              </div>
            ))}

            {/* Calendar days */}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[80px] sm:min-h-[100px] bg-white dark:bg-gray-900 p-2 sm:p-3 border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-4 w-4 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-5 w-8 bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="mt-2">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function ReviewHistorySkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Card Skeleton */}
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 overflow-hidden">
        <div className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 bg-white/20" />
              <Skeleton className="h-5 w-64 mt-2 bg-white/10" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-32 bg-white/20 rounded-lg" />
              <Skeleton className="h-10 w-32 bg-white/20 rounded-lg" />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-6 w-16 bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* History List Skeleton */}
      <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="p-4 sm:p-6">
          <Skeleton className="h-6 w-32 mb-6 bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-5 w-32 bg-gray-200 dark:bg-gray-600" />
                  <Skeleton className="h-5 w-24 bg-gray-200 dark:bg-gray-600" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1 bg-gray-200 dark:bg-gray-600" />
                          <Skeleton className="h-3 w-16 bg-gray-200 dark:bg-gray-600" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16 bg-gray-200 dark:bg-gray-600" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function ActiveReviewSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Card Skeleton */}
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 overflow-hidden">
        <div className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 bg-white/20" />
              <Skeleton className="h-5 w-64 mt-2 bg-white/10" />
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-white/20" />
                  <Skeleton className="h-4 w-16 bg-white/20" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-white/20" />
                  <Skeleton className="h-4 w-20 bg-white/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Review Card Skeleton */}
      <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="p-4 sm:p-8">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="py-6 sm:py-8">
              <Skeleton className="h-12 w-48 mx-auto mb-3 bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-6 w-32 mx-auto bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function ReviewSettingsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Card Skeleton */}
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 overflow-hidden">
        <div className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 bg-white/20" />
              <Skeleton className="h-5 w-64 mt-2 bg-white/10" />
            </div>
            <Skeleton className="h-10 w-32 bg-white/20 rounded-lg" />
          </div>
        </div>
      </Card>

      {/* Settings Card Skeleton */}
      <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="p-4 sm:p-6">
          <div className="space-y-6">
            <div>
              <Skeleton className="h-6 w-48 mb-2 bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-4 w-full max-w-2xl bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Interval Settings */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-3 w-48 bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <Skeleton className="h-10 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Settings */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Skeleton className="h-6 w-40 bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-6 w-6 rounded mt-1 bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-1 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-4 w-full max-w-2xl bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <Skeleton className="h-10 w-32 bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </Card>

      {/* Info Card Skeleton */}
      <Card className="overflow-hidden bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-8 w-8 rounded-lg bg-blue-200 dark:bg-blue-700" />
            <Skeleton className="h-6 w-32 bg-blue-200 dark:bg-blue-700" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full max-w-2xl bg-blue-200 dark:bg-blue-700" />
            <Skeleton className="h-4 w-full max-w-xl bg-blue-200 dark:bg-blue-700" />
          </div>
        </div>
      </Card>
    </div>
  );
}

export function TestSkeleton() {
  return (
    <div className="space-y-6">
      {/* Main Card */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="p-4 sm:p-6">
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-32 bg-gray-200 dark:bg-gray-700" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 bg-gray-200 dark:bg-gray-700" />
                <Skeleton className="h-10 bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            {/* Study Mode */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-32 bg-gray-200 dark:bg-gray-700" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 bg-gray-200 dark:bg-gray-700" />
                <Skeleton className="h-10 bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            {/* Question Amount */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-32 bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Start Button */}
            <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </Card>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Test Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 bg-blue-200 dark:bg-blue-700" />
                <Skeleton className="h-6 w-32 bg-blue-200 dark:bg-blue-700" />
              </div>
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-2 bg-blue-200 dark:bg-blue-700" />
                  <Skeleton className="h-8 w-16 bg-blue-200 dark:bg-blue-700" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2 bg-blue-200 dark:bg-blue-700" />
                  <Skeleton className="h-6 w-32 bg-blue-200 dark:bg-blue-700" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2 bg-blue-200 dark:bg-blue-700" />
                  <Skeleton className="h-6 w-32 bg-blue-200 dark:bg-blue-700" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* About Card */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-900 dark:to-indigo-900">
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 bg-white/20" />
                <Skeleton className="h-6 w-24 bg-white/20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-3/4 bg-white/10" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function TestInProgressSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 mb-6 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 bg-white/20" />
              <Skeleton className="h-6 w-32 mt-2 bg-white/20" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-10 w-24 bg-white/20" />
              <Skeleton className="h-10 w-24 bg-white/20" />
              <Skeleton className="h-10 w-20 bg-white/20" />
            </div>
          </div>
        </div>
      </Card>

      {/* Question Card */}
      <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="p-4 sm:p-8">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="py-6 sm:py-8">
              <Skeleton className="h-10 w-64 mx-auto mb-3 bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-6 w-32 mx-auto bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-4 w-48 mx-auto mt-4 bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
              <Skeleton className="h-24 bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-24 bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-24 bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-24 bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 