import { XCircle, CheckCircle } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
}

export function ErrorState({ error }: { error: Error | null }) {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="h-12 w-12 text-red-500" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        Error loading cards
      </h3>
      <p className="text-gray-500">
        {error?.message || 'Something went wrong. Please try again.'}
      </p>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        All caught up!
      </h3>
      <p className="text-gray-500">
        You have no cards to review today. Come back tomorrow for new reviews!
      </p>
    </div>
  );
} 