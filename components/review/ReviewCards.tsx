"use client";

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useTodayCards,
  useUpcomingReviews,
  useUpdateReview,
} from "@/hooks/useCards";
import { useStreak, useUpdateStreak } from "@/hooks/useStreak";
import api from "@/lib/axios";
import { Card } from "@/types/card";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  HelpCircle,
  Clock,
  Calendar,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

interface UpcomingReviews {
  cards: {
    [date: string]: Card[];
  };
  total: number;
}

interface ReviewCardsListProps {
  cards: Record<number, Card[]>;
  total: number;
  schedule: any;
  streak: any;
  upcomingReviews: UpcomingReviews | undefined;
}

// Add type for Word
interface Word {
  id: string;
  word: string;
  definition: string;
}

export default function ReviewCards() {
  const { data, isLoading, error } = useTodayCards();
  const { data: streak } = useStreak();
  const { data: upcomingReviews } = useUpcomingReviews<UpcomingReviews>();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data || data.total === 0) return <EmptyState />;

  return (
    <ReviewCardsList
      cards={data.cards}
      total={data.total}
      schedule={data.schedule}
      streak={streak}
      upcomingReviews={upcomingReviews}
    />
  );
}

function ReviewCardsList({
  cards,
  total,
  schedule,
  streak,
  upcomingReviews,
}: ReviewCardsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [attemptedPath, setAttemptedPath] = useState<string | null>(null);
  const [isTabClosing, setIsTabClosing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Combine all cards from different intervals into a single array
  const allCards = Object.values(cards).flat();
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());
  const [hasStarted, setHasStarted] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [selectedWordCount, setSelectedWordCount] = useState(total); // Default to all due words
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [isLeavingSession, setIsLeavingSession] = useState(false);
  const [tempCompletedCards, setTempCompletedCards] = useState<Set<string>>(new Set());

  // Handle visibility change (tab switching/closing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasStarted && !isSessionComplete && !isLeavingSession) {
        setIsTabClosing(true);
        setShowExitDialog(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasStarted, isSessionComplete, isLeavingSession]);

  // Set unsaved changes flag when session starts
  useEffect(() => {
    if (hasStarted && !isSessionComplete) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [hasStarted, isSessionComplete]);

  // Handle beforeunload only to show browser warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Fetch all words for options
  const { data: allWords = [] } = useQuery<Word[]>({
    queryKey: ["words", "all"],
    queryFn: async () => {
      const response = await api.get("/words/all");
      return response.data;
    }
  });

  const { mutate: updateReview, isPending } = useUpdateReview();
  const { mutate: updateStreak } = useUpdateStreak();

  const currentCard = sessionCards[currentCardIndex];
  const isCompleted = currentCard && completedCards.has(currentCard.id);

  const generateOptions = (correctAnswer: string) => {
    if (!allWords || allWords.length === 0) {
      console.log('No words available for options');
      return;
    }

    // Get all definitions except the correct one
    const otherDefinitions = allWords
      .filter(w => w.definition !== correctAnswer)
      .map(w => w.definition)
      .filter(def => def && def.trim() !== '');

    let wrongAnswers: string[] = [];
    if (otherDefinitions.length >= 3) {
      wrongAnswers = otherDefinitions
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    } else {
      wrongAnswers = [...otherDefinitions];
      const availableDefinitions = [...otherDefinitions];
      while (wrongAnswers.length < 3) {
        if (availableDefinitions.length === 0) {
          availableDefinitions.push(...otherDefinitions);
        }
        const randomIndex = Math.floor(Math.random() * availableDefinitions.length);
        wrongAnswers.push(availableDefinitions[randomIndex]);
        availableDefinitions.splice(randomIndex, 1);
      }
    }

    const allOptions = [...wrongAnswers, correctAnswer];
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    setOptions(shuffledOptions);
  };

  useEffect(() => {
    if (currentCard && allWords.length > 0) {
      generateOptions(currentCard.definition);
      setSelectedAnswer(null);
      setShowAnswer(false);
    }
  }, [currentCard, allWords]);

  const handleOptionSelect = (option: string) => {
    if (showAnswer || selectedAnswer) return;
    
    setSelectedAnswer(option);
    const isSuccess = option === currentCard.definition;
    setShowAnswer(true);
    
    // Store the result temporarily
    setTempCompletedCards(prev => new Set([...prev, currentCard.id]));
    
    // Only update the review in the database when the session is complete
    if (tempCompletedCards.size + 1 === sessionCards.length) {
      // Update all cards at once when session is complete
      sessionCards.forEach(card => {
        updateReview(
          { cardId: card.id, isSuccess: tempCompletedCards.has(card.id) },
          {
            onSuccess: () => {
              if (card.id === sessionCards[sessionCards.length - 1].id) {
                updateStreak();
                setIsSessionComplete(true);
                setCompletedCards(new Set(tempCompletedCards));
              }
            }
          }
        );
      });
    }
  };

  const handleNext = () => {
    if (!showAnswer) return;
    
    if (currentCardIndex < sessionCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
    } else {
      setIsSessionComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
    }
  };

  const startSession = () => {
    // Randomly select the specified number of cards from today's due cards
    const shuffledCards = [...allCards]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(selectedWordCount, total));
    
    setSessionCards(shuffledCards);
    setHasStarted(true);
    setCurrentCardIndex(0);
    setCompletedCards(new Set());
    setTempCompletedCards(new Set());
    setIsSessionComplete(false);
    setShowAnswer(false);
    setSelectedAnswer(null);
  };

  const exitSession = () => {
    setIsLeavingSession(true);
    setHasStarted(false);
    setSessionCards([]);
    setCompletedCards(new Set());
    setTempCompletedCards(new Set());
    setCurrentCardIndex(0);
    setIsSessionComplete(false);
    setHasUnsavedChanges(false);
    
    // Remove event listeners from sidebar links
    const sidebarLinks = document.querySelectorAll('nav a');
    sidebarLinks.forEach(link => {
      link.removeEventListener('click', handleSidebarLinkClick);
    });
  };

  // Add this function to handle sidebar link clicks
  const handleSidebarLinkClick = (e: Event) => {
    e.preventDefault();
    setAttemptedPath((e.currentTarget as HTMLAnchorElement).href);
    setShowExitDialog(true);
  };

  // Update the sidebar links effect
  useEffect(() => {
    const sidebarLinks = document.querySelectorAll('nav a');
    
    if (hasStarted && !isSessionComplete && !isLeavingSession) {
      // Add event listeners
      sidebarLinks.forEach(link => {
        link.addEventListener('click', handleSidebarLinkClick);
      });
    }

    return () => {
      // Cleanup event listeners
      sidebarLinks.forEach(link => {
        link.removeEventListener('click', handleSidebarLinkClick);
      });
    };
  }, [hasStarted, isSessionComplete, isLeavingSession]);

  // Update navigation protection effect
  useEffect(() => {
    if (hasStarted && !isSessionComplete && !isLeavingSession) {
      const handleNavigation = (e: PopStateEvent) => {
        e.preventDefault();
        setAttemptedPath(window.location.pathname);
        setShowExitDialog(true);
        window.history.pushState(null, '', pathname);
      };

      window.addEventListener('popstate', handleNavigation);
      
      return () => {
        window.removeEventListener('popstate', handleNavigation);
      };
    }
  }, [hasStarted, isSessionComplete, isLeavingSession, pathname]);

  // Function to handle navigation confirmation
  const handleNavigationConfirm = () => {
    setIsLeavingSession(true);
    setShowExitDialog(false);
    setHasUnsavedChanges(false);
    
    if (isTabClosing) {
      window.close();
    } else if (attemptedPath) {
      router.push(attemptedPath);
    }
  };

  // Function to handle navigation cancellation
  const handleNavigationCancel = () => {
    setShowExitDialog(false);
    setAttemptedPath(null);
    setIsTabClosing(false);
  };

  // Add this JSX right before the main return statement
  const exitDialog = (
    <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {isTabClosing ? 'Leave Review Session?' : 'Exit Review Session?'}
          </DialogTitle>
          <DialogDescription>
            {isTabClosing 
              ? "You're about to leave this page. Your progress will be saved but you'll need to start a new session to continue reviewing. Are you sure you want to leave?"
              : "If you leave now, your progress will be saved but you'll need to start a new session to continue reviewing. Are you sure you want to exit?"
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={handleNavigationCancel}
          >
            Continue Review
          </Button>
          <Button
            variant="destructive"
            onClick={handleNavigationConfirm}
          >
            {isTabClosing ? 'Leave Page' : 'Exit Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!hasStarted) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Due Today</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{total} words</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Current Streak</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{streak?.currentStreak || 0} days</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Upcoming</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{upcomingReviews?.total || 0} words</p>
          </div>
        </div>

        {/* Session Setup Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Configure Session</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <HelpCircle className="h-5 w-5 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose how many words you want to review in this session</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of words to review
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[5, 10, 15, 20].map((count) => (
                    total >= count && (
                      <button
                        key={count}
                        onClick={() => setSelectedWordCount(count)}
                        className={cn(
                          "py-3 px-4 rounded-xl border text-center transition-all",
                          selectedWordCount === count
                            ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                            : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                        )}
                      >
                        {count} words
                      </button>
                    )
                  ))}
                  <button
                    onClick={() => setSelectedWordCount(total)}
                    className={cn(
                      "py-3 px-4 rounded-xl border text-center transition-all",
                      selectedWordCount === total
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                    )}
                  >
                    All ({total})
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">Selected: {selectedWordCount} words</p>
                  <p className="text-sm text-gray-500">
                    Estimated time: {Math.ceil(selectedWordCount * 0.5)} minutes
                  </p>
                </div>
                <Button 
                  onClick={startSession} 
                  size="lg"
                  className="px-8"
                >
                  Start Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSessionComplete) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm border text-center">
          <h2 className="text-2xl font-bold mb-4">Session Complete!</h2>
          <p className="text-gray-600 mb-6">
            You've completed reviewing {completedCards.size} words.
          </p>
          <Button onClick={exitSession}>Return to Start</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {exitDialog}
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-600">
              {completedCards.size} of {sessionCards.length} cards
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${(completedCards.size / sessionCards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Word Section */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8">
            <div className="flex items-center justify-between text-white mb-4">
              <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                Card {currentCardIndex + 1} of {sessionCards.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  if (window.confirm("Are you sure you want to exit the review session? Your progress will be saved.")) {
                    exitSession();
                  }
                }}
              >
                Exit Session
              </Button>
            </div>
            <h2 className="text-4xl font-bold text-white text-center mb-2">
              {currentCard.word}
            </h2>
            {currentCard.wordList && (
              <p className="text-blue-100 text-center">
                From: {currentCard.wordList.name}
              </p>
            )}
          </div>

          {/* Options Section */}
          <div className="p-8">
            <div className="grid grid-cols-1 gap-4">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  disabled={showAnswer || selectedAnswer !== null}
                  className={cn(
                    "p-6 rounded-xl text-left transition-all duration-200 border",
                    selectedAnswer === option && !showAnswer && "border-blue-500 bg-blue-50",
                    showAnswer && option === currentCard.definition && "border-green-500 bg-green-50",
                    showAnswer && selectedAnswer === option && option !== currentCard.definition && "border-red-500 bg-red-50",
                    !selectedAnswer && !showAnswer && "hover:border-blue-200 hover:bg-blue-50/50 border-gray-200",
                    (showAnswer || selectedAnswer) && option !== selectedAnswer && option !== currentCard.definition && "opacity-50"
                  )}
                >
                  <p className="text-lg">{option}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="border-t border-gray-100 p-6 bg-gray-50 flex items-center justify-between">
            <Button
              onClick={handlePrevious}
              variant="outline"
              className="flex items-center gap-2"
              disabled={currentCardIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            {showAnswer && (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
                disabled={currentCardIndex === sessionCards.length - 1 && isCompleted}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
