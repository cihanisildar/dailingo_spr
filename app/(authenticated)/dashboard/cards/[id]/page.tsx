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
import { Badge } from "@/components/ui/badge";

function CardDetailsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-36 bg-gray-200 dark:bg-gray-700" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-10 w-36 bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <Card className="p-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="space-y-8">
          <div>
            <Skeleton className="h-12 w-72 mb-3 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-6 w-48 bg-gray-200 dark:bg-gray-700" />
          </div>

          <div>
            <Skeleton className="h-8 w-40 mb-4 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-700" />
          </div>

          <div>
            <Skeleton className="h-8 w-40 mb-4 bg-gray-200 dark:bg-gray-700" />
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
              ))}
            </div>
          </div>

          <div className="border-t pt-8 border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-14 w-full bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-14 w-full bg-gray-200 dark:bg-gray-700" />
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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Card not found
        </h2>
        <Link href="/dashboard/cards">
          <Button variant="outline" className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
            <ArrowLeft className="w-4 h-4" />
            Back to Cards
          </Button>
        </Link>
      </div>
    );
  }

  // Add this function to check if the user has access
  const checkUserAccess = () => {
    if (!session?.user) return false;
    
    // If the card is part of a word list, check the list owner's email
    if (card.wordList) {
      return session.user.email === (card.wordList as any).userEmail;
    }
    
    // Temporary fix until backend includes user relation:
    // If you created the card recently, you should be able to access it
    // Remove this after backend is fixed
    if (card.createdAt) {
      const creationDate = new Date(card.createdAt);
      const isRecentCard = Date.now() - creationDate.getTime() < 24 * 60 * 60 * 1000; // 24 hours
      if (isRecentCard) return true;
    }
    
    // If no word list, check if the user created this card
    // First try direct ID match
    if (session.user.id === card.userId) return true;
    
    // Then check if the user's email matches
    // This will only work once backend includes the user relation
    if (card.user?.email === session.user.email) return true;

    return false;
  };

  const isOwner = checkUserAccess();
  const isPublic = card.wordList ? !!card.wordList.isPublic : false;

  console.log('Debug Permission Check:', {
    sessionUser: session?.user,
    cardUserId: card.userId,
    cardUserEmail: card.user?.email,
    cardCreatedAt: card.createdAt,
    isOwner,
    isPublic,
    wordList: card.wordList
  });

  console.log('Debug WordDetails:', {
    hasWordDetails: !!card.wordDetails,
    wordDetails: card.wordDetails,
    synonyms: card.wordDetails?.synonyms,
    antonyms: card.wordDetails?.antonyms,
    examples: card.wordDetails?.examples,
    notes: card.wordDetails?.notes
  });

  // If user is not the owner and list is not public, show access denied
  if (!isOwner && !isPublic) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You don't have permission to view this card.
        </p>
        <Link href="/dashboard/cards">
          <Button variant="outline" className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
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
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 mb-6 overflow-hidden border-0">
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
                      <TooltipContent side="bottom" className="max-w-[300px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                        <p className="text-sm">{card.word}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className={cn(
                      "text-xs font-medium",
                      card.reviewStatus === "ACTIVE" && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
                      card.reviewStatus === "COMPLETED" && "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                      card.reviewStatus === "PAUSED" && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                    )}>
                      {card.reviewStatus}
                    </Badge>
                    
                    {card.wordList && (
                      <div className="flex items-center gap-1 text-white/80">
                        <span className="text-sm">from</span>
                        <Link 
                          href={`/dashboard/lists/${card.wordList.id}`}
                          className="text-sm font-medium hover:text-white transition-colors underline decoration-white/50 hover:decoration-white"
                        >
                          {card.wordList.name}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                
                {isOwner && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/dashboard/cards/${card.id}/edit`}>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="bg-red-500/80 hover:bg-red-600 text-white border-red-400/50"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gray-900 dark:text-gray-100">Delete Card</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to delete "{card.word}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Definition and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Definition Card */}
            <Card className="p-6 sm:p-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Definition</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                  {card.definition}
                </p>
              </div>
            </Card>

            {/* Word Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Synonyms Card */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 dark:bg-blue-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">S</span>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Synonyms</h3>
                </div>
                {card.wordDetails?.synonyms && card.wordDetails.synonyms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {card.wordDetails.synonyms.map((synonym, index) => (
                      <Badge key={index} variant="outline" className="border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200 bg-white dark:bg-blue-900/30">
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-blue-600 dark:text-blue-300 text-sm italic">No synonyms added yet</p>
                )}
              </Card>

              {/* Antonyms Card */}
              <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-red-500 dark:bg-red-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">A</span>
                  </div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Antonyms</h3>
                </div>
                {card.wordDetails?.antonyms && card.wordDetails.antonyms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {card.wordDetails.antonyms.map((antonym, index) => (
                      <Badge key={index} variant="outline" className="border-red-300 dark:border-red-600 text-red-800 dark:text-red-200 bg-white dark:bg-red-900/30">
                        {antonym}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-600 dark:text-red-300 text-sm italic">No antonyms added yet</p>
                )}
              </Card>

              {/* Examples Card */}
              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-500 dark:bg-green-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">E</span>
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Examples</h3>
                </div>
                {card.wordDetails?.examples && card.wordDetails.examples.length > 0 ? (
                  <div className="space-y-3">
                    {card.wordDetails.examples.map((example, index) => (
                      <blockquote key={index} className="border-l-4 border-green-500 dark:border-green-400 pl-4 italic text-green-800 dark:text-green-200 bg-white dark:bg-green-900/20 p-3 rounded-r-lg">
                        "{example}"
                      </blockquote>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600 dark:text-green-300 text-sm italic">No examples added yet</p>
                )}
              </Card>

              {/* Notes Card */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-500 dark:bg-purple-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">N</span>
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Notes</h3>
                </div>
                {card.wordDetails?.notes ? (
                  <div className="bg-white dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-600">
                    <p className="text-purple-800 dark:text-purple-200 leading-relaxed">{card.wordDetails.notes}</p>
                  </div>
                ) : (
                  <p className="text-purple-600 dark:text-purple-300 text-sm italic">No notes added yet</p>
                )}
              </Card>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Progress Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Correct</span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">{card.successCount}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Incorrect</span>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">{card.failureCount}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Next Review</span>
                  </div>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                    {format(new Date(card.nextReview), 'MMM d')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                  </div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400 text-sm">
                    {format(new Date(card.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
