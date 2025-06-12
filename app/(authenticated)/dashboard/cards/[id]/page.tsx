"use client";

import { useParams, useRouter } from "next/navigation";
import { useCard, useDeleteCard } from "@/hooks/useCards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Trash, Calendar } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { WordDetails } from "@/types/models/wordDetails";

function CardDetailsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-36" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <Card className="p-8">
        <div className="space-y-8">
          <div>
            <Skeleton className="h-12 w-72 mb-3" />
            <Skeleton className="h-6 w-48" />
          </div>

          <div>
            <Skeleton className="h-8 w-40 mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>

          <div>
            <Skeleton className="h-8 w-40 mb-4" />
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-full" />
              ))}
            </div>
          </div>

          <div className="border-t pt-8">
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function CardDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id.toString().split("-").pop() || "";
  const { data: card, isLoading } = useCard(id);
  const deleteCardMutation = useDeleteCard();
  const { data: session } = useSession();

  const handleDelete = async () => {
    try {
      await deleteCardMutation.mutateAsync(id, {
        onSuccess: () => {
          toast.success("Card deleted successfully");
          router.push("/dashboard/cards");
        },
      });
    } catch (error) {
      toast.error("Failed to delete card");
      console.error("Error deleting card:", error);
    }
  };

  if (isLoading) {
    return <CardDetailsSkeleton />;
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Card not found
        </h2>
        <Link href="/dashboard/cards">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Cards
          </Button>
        </Link>
      </div>
    );
  }

  const isOwner = card.wordList
    ? session?.user?.email === (card.wordList as any).userEmail
    : session?.user?.id === card.userId;
  const isPublic = card.wordList ? !!card.wordList.isPublic : false;

  // If user is not the owner and list is not public, show access denied
  if (!isOwner && !isPublic) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Access Denied
        </h2>
        <p className="text-gray-600 mb-4">
          You don't have permission to view this card.
        </p>
        <Link href="/dashboard/cards">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Cards
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="">
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white truncate">
                          {card.word}
                        </h1>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[300px]">
                        <p className="text-sm">{card.word}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2 mr-2">
                    {isOwner && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span
                            className={cn(
                              "px-2.5 py-2 rounded-[8px] text-xs font-medium cursor-help",
                              card.reviewStatus === "ACTIVE"
                                ? "bg-yellow-50 text-yellow-700"
                                : card.reviewStatus === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-700"
                            )}
                          >
                            {card.reviewStatus}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          {card.reviewStatus === "ACTIVE" && (
                            <p>This card is currently in your active review schedule. You'll be prompted to review it at increasing intervals to strengthen your memory.</p>
                          )}
                          {card.reviewStatus === "COMPLETED" && (
                            <p>You've completed all review steps for this card. It will remain in your collection but won't appear in regular reviews.</p>
                          )}
                          {card.reviewStatus === "PAUSED" && (
                            <p>Reviews for this card are temporarily paused. You can resume reviewing it at any time.</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {isOwner && (
                    <>
                      <Link href={`/dashboard/cards/${id}/edit`}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-white/20 bg-white/10 text-white hover:bg-white/20"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Card</span>
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 bg-red-500/80 hover:bg-red-600/80"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete Card</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently
                              delete the card "{card?.word}" and remove it from your
                              review schedule.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                              Delete Card
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>

              {card.wordList && (
                <div className="flex-1 min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-blue-100 truncate">From list: {card.wordList.name}</p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[300px]">
                        <p className="text-sm">From list: {card.wordList.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Definition and Examples Section */}
          <Card className="overflow-hidden border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-200">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                Definition
              </h2>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                {card.definition}
              </p>
            </div>
          </Card>

          {/* Examples Card */}
          <Card className="overflow-hidden border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-200">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                Examples
              </h2>
              {card.wordDetails?.examples?.length ? (
                <ul className="space-y-2 sm:space-y-3">
                  {card.wordDetails.examples.map((example: WordDetails['examples'][0], index: number) => (
                    <li
                      key={index}
                      className="pl-3 sm:pl-4 border-l-2 border-blue-200 text-gray-600 text-sm leading-relaxed"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  No example sentences added yet
                </p>
              )}
            </div>
          </Card>

          {/* Synonyms Card */}
          <Card className="overflow-hidden border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-200">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                Synonyms
              </h2>
              <div className="flex flex-wrap gap-2">
                {card.wordDetails?.synonyms?.length ? (
                  card.wordDetails.synonyms.map((synonym: WordDetails['synonyms'][0], index: number) => (
                    <span
                      key={index}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100"
                    >
                      {synonym}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No synonyms added yet</p>
                )}
              </div>
            </div>
          </Card>

          {/* Antonyms Card */}
          <Card className="overflow-hidden border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-200">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                Antonyms
              </h2>
              <div className="flex flex-wrap gap-2">
                {card.wordDetails?.antonyms?.length ? (
                  card.wordDetails.antonyms.map((antonym: WordDetails['antonyms'][0], index: number) => (
                    <span
                      key={index}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100"
                    >
                      {antonym}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No antonyms added yet</p>
                )}
              </div>
            </div>
          </Card>

          {/* Review Stats Card */}
          {isOwner && (
            <div className="lg:col-span-2">
              <Card className="overflow-hidden border border-gray-200 shadow-md bg-white hover:shadow-lg transition-all duration-200">
                <div className="p-4 sm:p-6 space-y-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                    Review Statistics
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-gray-500 mb-1">Success Rate</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {((card.successCount / (card.successCount + card.failureCount)) * 100 || 0).toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-sm text-gray-500 mb-1">Reviews</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {card.successCount + card.failureCount}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-sm text-gray-500 mb-1">Views</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {card.viewCount}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <p className="text-sm text-gray-500 mb-1">Current Interval</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {card.interval} days
                      </p>
                    </div>
                  </div>

                  {/* Review Schedule Section */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <h3 className="text-sm font-medium text-gray-900">
                        Review Schedule
                      </h3>
                      <span className="text-xs text-gray-500 ml-auto">
                        Step {((card.reviewStep ?? -1) + 1)} of 5
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 7, 30, 365].map((interval, index) => {
                        // Only calculate dates if lastReviewed exists and is valid
                        const lastReviewed = card.lastReviewed ? new Date(card.lastReviewed) : new Date();
                        const isValidDate = !isNaN(lastReviewed.getTime());
                        const reviewDate = isValidDate ? addDays(lastReviewed, interval) : new Date();
                        const isPast = isValidDate && reviewDate < new Date();
                        const currentStep = card.reviewStep == null || card.reviewStep < 0 ? 0 : card.reviewStep;
                        const isNext = index === currentStep;

                        return (
                          <div
                            key={interval}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border transition-all",
                              isPast
                                ? "bg-gray-50 border-gray-100"
                                : isNext
                                ? "bg-blue-100 border-blue-400 shadow-lg scale-[1.03]"
                                : "bg-white border-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                                  isPast
                                    ? "bg-gray-100 text-gray-500"
                                    : isNext
                                    ? "bg-blue-500 text-white border-2 border-blue-400 shadow"
                                    : "bg-gray-100 text-gray-500"
                                )}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <p
                                  className={cn(
                                    "text-sm font-medium",
                                    isPast
                                      ? "text-gray-400"
                                      : isNext
                                      ? "text-blue-900 font-bold"
                                      : "text-gray-600"
                                  )}
                                >
                                  {interval} {interval === 1 ? "day" : "days"}
                                </p>
                                <p
                                  className={cn(
                                    "text-xs",
                                    isPast
                                      ? "text-gray-400"
                                      : isNext
                                      ? "text-blue-700 font-semibold"
                                      : "text-gray-400"
                                  )}
                                >
                                  {isValidDate ? format(reviewDate, "MMM d, yyyy") : "Not scheduled"}
                                </p>
                              </div>
                            </div>
                            {isNext && (
                              <span className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-200 px-3 py-1 rounded-full shadow border border-blue-300 animate-pulse">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                                Next Review
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
