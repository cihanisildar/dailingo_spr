import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingReviewsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Card Skeleton */}
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden">
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
      <Card className="overflow-hidden">
        <div className="p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <Skeleton className="h-6 w-36" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {/* Week day headers */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-gray-50 p-1.5 sm:p-2 text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </div>
            ))}

            {/* Calendar days */}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[80px] sm:min-h-[100px] bg-white p-2 sm:p-3">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-5 w-8" />
                </div>
                <div className="mt-2">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-12 rounded-full" />
                    <Skeleton className="h-4 w-14 rounded-full" />
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
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden">
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
          <Card key={i} className="overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* History List Skeleton */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
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
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden">
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
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-8">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="py-6 sm:py-8">
              <Skeleton className="h-12 w-48 mx-auto mb-3" />
              <Skeleton className="h-6 w-32 mx-auto" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
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
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden">
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
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="space-y-6">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>

            {/* Interval Settings */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-10 w-24 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Settings */}
            <div className="space-y-4 pt-6 border-t">
              <Skeleton className="h-6 w-40" />
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-6 w-6 rounded mt-1" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-full max-w-2xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </Card>

      {/* Info Card Skeleton */}
      <Card className="overflow-hidden bg-blue-50/50">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-full max-w-xl" />
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
              <Skeleton className="h-8 w-32" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </div>

            {/* Study Mode */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </div>

            {/* Question Amount */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Start Button */}
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </Card>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Test Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/30">
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* About Card */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600">
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
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
              <Skeleton className="h-10 w-64 mx-auto mb-3" />
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto mt-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 