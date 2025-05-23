export default function CardsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-6 bg-gray-200 rounded-full w-16" />
          </div>
        </div>
      ))}
    </div>
  );
} 