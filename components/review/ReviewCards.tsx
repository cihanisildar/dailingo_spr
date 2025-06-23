"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCards, useTodayCards, useUpdateReview } from "@/hooks/useCards";
import { useReview } from '@/hooks/useReview';
import { useUpdateStreak } from "@/hooks/useStreak";
import { useWindowSize } from "@/hooks/useWindowSize";
import { cn } from "@/lib/utils";
import { Card } from "@/types/models/card";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Target, CheckCircle2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Confetti from "react-confetti";
import { FlashcardReview } from "./FlashcardReview";

interface Word {
  id: string;
  word: string;
  definition: string;
}

interface Review {
  id: string;
  isSuccess: boolean;
  createdAt: string;
}

interface CardWithReviews extends Card {
  options?: string[];
}

interface ReviewCardsProps {
  initialMode?: "multiple-choice" | "flashcards";
  initialCount?: number;
  initialRepeat?: boolean;
}

interface SessionState {
  cards: CardWithReviews[];
  currentIndex: number;
  showAnswer: boolean;
  options: string[];
  selectedAnswer: string | null;
  isComplete: boolean;
  showConfetti: boolean;
  correctAnswers: number;
}

interface ReviewResult {
  cardId: string;
  isCorrect: boolean;
  timeSpent: number;
}

export default function ReviewCards({ initialMode = "multiple-choice", initialCount, initialRepeat = false }: ReviewCardsProps) {
  const router = useRouter();
  const { width, height } = useWindowSize();
  const [repeat, setRepeat] = useState(initialRepeat);
  const { getCards } = useCards();
  const { startReview, submitReviewResults } = useReview();

  const { data: allWords = [] } = useQuery({
    queryKey: ["words", "all"],
    queryFn: () => getCards()
  });

  const { data: cardsData, refetch, isFetching, isLoading: isCardsLoading } = useTodayCards({ repeat });
  const { mutate: updateReview } = useUpdateReview();
  const { mutate: updateStreak } = useUpdateStreak();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Combine all cards from different intervals into a single array
  let allCards: CardWithReviews[] = [];
  if (Array.isArray(cardsData)) {
    allCards = cardsData as CardWithReviews[];
  } else if (cardsData && Array.isArray((cardsData as any).cards)) {
    allCards = (cardsData as any).cards;
  }
  const total = allCards.length;

  const [sessionCards, setSessionCards] = useState<CardWithReviews[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [reviewMode, setReviewMode] = useState<"multiple-choice" | "flashcards">(initialMode);
  const [isRepeat, setIsRepeat] = useState(initialRepeat);
  
  // Add transition states
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextCardReady, setNextCardReady] = useState(true);

  // Add showWordModal state
  const [showWordModal, setShowWordModal] = useState(false);

  // Add sessionId state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionStarted = useRef(false);

  // Initialize session cards
  useEffect(() => {
    console.log('All cards for today:', allCards);
    if (allCards.length > 0 && sessionCards.length === 0) {
      const count = initialCount || total;
      // Use allCards directly, since backend already filters out reviewed cards
      const shuffledCards = allCards
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(count, allCards.length));
      setSessionCards(shuffledCards);
    }
  }, [allCards, initialCount, total]); // Removed sessionCards.length - using internal check instead

  // Generate options when currentCard changes
  useEffect(() => {
    const currentCard = sessionCards[currentIndex];
    if (!currentCard || !allWords.length || currentCard.options) return;

    const correctAnswer = currentCard.definition;
    if (!correctAnswer) {
      return;
    }

    // Generate wrong answers
    const wrongAnswers = allWords
      .filter((word: Word) => word.definition !== correctAnswer)
      .map((word: Word) => word.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allOptions = [...wrongAnswers, correctAnswer];
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    setSessionCards(prev => prev.map((card, index) =>
      index === currentIndex ? { ...card, options: shuffledOptions } : card
    ));
  }, [currentIndex, allWords]); // Removed sessionCards from dependencies

  const handleAnswerSelect = useCallback((option: string) => {
    if (selectedAnswer || isTransitioning) return;
    
    const currentCard = sessionCards[currentIndex];
    if (!currentCard) return;
    
    const isSuccess = option === currentCard.definition;
    setSelectedAnswer(option);
    setIsSubmitting(true);
    
    updateReview(
      { cardId: currentCard.id, isSuccess },
      {
        onSuccess: () => {
          if (isSuccess) {
            setCorrectAnswers(prev => prev + 1);
          }
          
          // Add smooth transition delay
          setTimeout(() => {
            if (currentIndex === sessionCards.length - 1) {
              updateStreak();
              setIsComplete(true);
            } else {
              // Start transition
              setIsTransitioning(true);
              setNextCardReady(false);
              
              setTimeout(() => {
                setCurrentIndex(prev => prev + 1); // Use functional update
                setSelectedAnswer(null);
                setNextCardReady(true);
                
                setTimeout(() => {
                  setIsTransitioning(false);
                }, 200);
              }, 300);
            }
            setIsSubmitting(false);
          }, 1500); // Show result for 1.5 seconds
        },
        onError: () => {
          setIsSubmitting(false);
          setSelectedAnswer(null);
        }
      }
    );
  }, [selectedAnswer, isTransitioning, sessionCards, currentIndex, updateReview, updateStreak]);

  const handleResponse = useCallback((knewIt: boolean) => {
    if (!sessionCards[currentIndex]) return;
    // Optimistically update UI
    if (currentIndex === sessionCards.length - 1) {
      setIsComplete(true);
      setCorrectAnswers(prev => prev + 1);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
    setIsFlipping(false);
    setIsSubmitting(false);
    // Fire mutation in background
    updateReview({ cardId: sessionCards[currentIndex].id, isSuccess: knewIt });
  }, [sessionCards, currentIndex, updateReview]);

  const handleResponseWithFlip = useCallback((knewIt: boolean) => {
    if (isFlipping || isSubmitting) return;
    setIsFlipping(true);
    setIsSubmitting(true);
    updateReview(
      { cardId: sessionCards[currentIndex].id, isSuccess: knewIt },
      {
        onSuccess: () => {
          if (currentIndex === sessionCards.length - 1) {
            updateStreak();
            setIsComplete(true);
            setCorrectAnswers(prev => prev + 1);
          } else {
            setCurrentIndex(prev => prev + 1);
          }
        },
        onSettled: () => {
          setTimeout(() => {
            setIsFlipping(false);
            setIsSubmitting(false);
          }, 350);
        }
      }
    );
  }, [isFlipping, isSubmitting, sessionCards, currentIndex, updateReview, updateStreak]);

  // When repeat changes, refetch
  useEffect(() => {
    refetch();
  }, [repeat, refetch]);

  // Create review session when cards are loaded and session not started
  useEffect(() => {
    if (allCards.length > 0 && !sessionStarted.current) {
      sessionStarted.current = true;
      startReview({
        cardIds: allCards.map((card: Card) => card.id),
      }).then(data => {
        if (data.sessionId) setSessionId(data.sessionId);
      }).catch(() => {});
    }
  }, [allCards, startReview]);

  // Complete review session when finished
  useEffect(() => {
    if (isComplete && sessionId) {
      const results: ReviewResult[] = sessionCards.map((card, index) => ({
        cardId: card.id,
        isCorrect: card.options ? card.options[index] === card.definition : false,
        timeSpent: 0, // TODO: Implement time tracking
      }));
      submitReviewResults(sessionId, results);
    }
  }, [isComplete, sessionId, sessionCards, submitReviewResults]);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await getCards();
        setLoading(false);
      } catch (err) {
        setError('Failed to load cards');
        setLoading(false);
      }
    };
    loadCards();
  }, [getCards]);

  // Show loading spinner if cards are loading
  if (isCardsLoading || !cardsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
        <p className="text-blue-500 text-lg">Loading cards...</p>
      </div>
    );
  }

  const accuracy = Math.round((correctAnswers / sessionCards.length) * 100);

  const handleRepeatSession = () => {
    setIsComplete(false);
    setCurrentIndex(0);
    setCorrectAnswers(0);
    setSelectedAnswer(null);
  };

  const handleReturnToReview = () => {
    router.push('/dashboard/review');
  };

  if (sessionCards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 sm:p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">No cards available for review.</p>
          <Button onClick={() => router.push('/dashboard/review')} className="w-full sm:w-auto">
            Return to Start
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confetti for celebration - full screen using portal */}
      {isComplete && sessionCards.length > 0 && typeof window !== 'undefined' && createPortal(
        <Confetti
          width={width}
          height={height}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 999999,
          }}
          recycle={false}
          numberOfPieces={200}
          gravity={0.15}
          initialVelocityY={15}
        />,
        document.body
      )}

      {/* Congratulations Dialog */}
      <Dialog open={isComplete} onOpenChange={setIsComplete}>
        <DialogContent className="sm:max-w-2xl overflow-hidden border-0 p-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 shadow-2xl">
          
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 p-8 text-center text-white overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Trophy className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              
              <DialogHeader className="space-y-2 text-center">
                <DialogTitle className="text-3xl font-bold text-white drop-shadow-lg text-center">
                  Congratulations! 🎉
                </DialogTitle>
                <DialogDescription className="text-blue-100/90 text-lg font-medium text-center">
                  Outstanding work on your review session!
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-8 space-y-8">
            {/* Achievement message */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-full border border-emerald-200 dark:border-emerald-800 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Session Complete
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                You've made great progress! Keep up the momentum.
              </p>
            </div>

            {/* Enhanced Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                    {sessionCards.length}
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Cards Studied
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">
                    {correctAnswers}
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Correct Answers
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                    {accuracy}%
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Accuracy Rate  
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational message based on performance */}
            <div className="text-center p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl border border-blue-200/30 dark:border-blue-800/30">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {accuracy >= 90 ? "🌟 Exceptional performance! You're mastering this material!" :
                 accuracy >= 75 ? "🎯 Great job! You're making solid progress!" :
                 accuracy >= 50 ? "👍 Good effort! Keep practicing to improve further!" :
                 "📚 Learning takes time - every attempt makes you stronger!"}
              </p>
            </div>

            {/* Enhanced Action buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleRepeatSession}
                variant="outline"
                className="flex-1 h-12 gap-2 border-2 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300"
                disabled={isFetching}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="font-semibold">Repeat Session</span>
              </Button>
              <Button
                onClick={handleReturnToReview}
                className="flex-1 h-12 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Return to Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 sm:space-y-8">
        {/* Progress bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              Progress
            </span>
            <span className="text-gray-800 dark:text-gray-200 font-semibold">
              {currentIndex + 1} of {sessionCards.length}
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out rounded-full shadow-sm"
              style={{ width: `${((currentIndex + 1) / sessionCards.length) * 100}%` }}
            />
          </div>
        </div>

      {/* Card content */}
      <div className="relative">
        {/* Card background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-indigo-500/10 rounded-3xl blur-xl" />
        
        {/* Transition overlay */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin">
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Next question...</p>
            </div>
          </div>
        )}
        
        <div className={cn(
          "relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8 lg:p-12 transition-all duration-300",
          isTransitioning && "scale-95 opacity-75"
        )}>
          {reviewMode === "flashcards" ? (
            <FlashcardReview
              card={sessionCards[currentIndex]}
              onResponse={handleResponse}
              onResponseWithFlip={handleResponseWithFlip}
              isFlipping={isFlipping}
              setIsFlipping={setIsFlipping}
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
            />
          ) : (
            <div className={cn(
              "space-y-8 transition-all duration-500",
              nextCardReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              {/* Word display */}
              <div className="text-center">
                <div className={cn(
                  "inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl mb-6 transition-all duration-500",
                  nextCardReady ? "scale-100" : "scale-90"
                )}>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {sessionCards[currentIndex]?.word?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-2 transition-all duration-700">
                  {sessionCards[currentIndex]?.word}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Choose the correct definition
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-4">
                {sessionCards[currentIndex]?.options?.map((option: string, index: number) => (
                  <button
                    key={`${currentIndex}-${index}`}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isSubmitting || selectedAnswer !== null || isTransitioning}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                    className={cn(
                      "group relative p-6 text-left rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg",
                      "animate-in slide-in-from-bottom-4 fade-in-0",
                      nextCardReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                      selectedAnswer === option
                        ? option === sessionCards[currentIndex]?.definition
                          ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg shadow-green-500/20"
                          : "border-red-400 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 shadow-lg shadow-red-500/20"
                        : "border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20",
                      (isSubmitting || selectedAnswer !== null) && selectedAnswer !== option && "opacity-60",
                      (isSubmitting || isTransitioning) && "cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors",
                        selectedAnswer === option
                          ? option === sessionCards[currentIndex]?.definition
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-800"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className={cn(
                        "text-base sm:text-lg font-medium transition-colors",
                        selectedAnswer === option
                          ? option === sessionCards[currentIndex]?.definition
                            ? "text-green-700 dark:text-green-300"
                            : "text-red-700 dark:text-red-300"
                          : "text-gray-900 dark:text-gray-100"
                      )}>
                        {option}
                      </span>
                    </div>
                    
                    {/* Correct/Incorrect indicators */}
                    {selectedAnswer === option && (
                      <div className="absolute top-4 right-4 animate-in zoom-in-50 duration-300">
                        {option === sessionCards[currentIndex]?.definition ? (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-4 h-4 text-white animate-in zoom-in-0 duration-200" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-4 h-4 text-white animate-in zoom-in-0 duration-200" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Loading spinner when submitting */}
                    {isSubmitting && selectedAnswer === option && (
                      <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 rounded-2xl flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons - only show if answer not selected */}
      {selectedAnswer === null && (
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0 || isSubmitting}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ← Previous
          </Button>
          <Button
            variant="ghost"
            onClick={() => setCurrentIndex(prev => Math.min(sessionCards.length - 1, prev + 1))}
            disabled={currentIndex === sessionCards.length - 1 || isSubmitting}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Next →
          </Button>
        </div>
      )}
      </div>
    </>
  );
}
