"use client";

import { useSearchParams, useRouter } from "next/navigation";
import ReviewCards from "@/components/review/ReviewCards";

export default function ReviewSessionPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "flashcard" ? "flashcard" : "multiple-choice";
  const repeat = searchParams.get("repeat") === "true";
  // You can also get count or other params if needed

  return (
    <div className="bg-white dark:bg-gray-950 flex flex-col items-center px-2 sm:px-0 py-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="my-4 sm:my-8">
          <ReviewCards initialMode={mode} initialRepeat={repeat} />
        </div>
      </div>
    </div>
  );
} 