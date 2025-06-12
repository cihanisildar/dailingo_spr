"use client";

import { Button } from "@/components/ui/button";
import { useCards, useTodayCards, useUpdateReview } from "@/hooks/useCards";
import { useReview } from '@/hooks/useReview';
import { useUpdateStreak } from "@/hooks/useStreak";
import { useWindowSize } from "@/hooks/useWindowSize";
import { cn } from "@/lib/utils";
import { Card } from "@/types/models/card";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  }, [allCards, initialCount, total, sessionCards.length]);

  // Generate options when currentCard changes
  useEffect(() => {
    const currentCard = sessionCards[currentIndex];
    if (!currentCard || !allWords.length || !selectedAnswer) return;

    setIsSubmitting(true);
    const correctAnswer = currentCard.definition;
    if (!correctAnswer) {
      setIsSubmitting(false);
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
    setIsSubmitting(false);
  }, [currentIndex, sessionCards, allWords, selectedAnswer]);

  const handleAnswerSelect = (option: string) => {
    if (selectedAnswer) return;
    
    const currentCard = sessionCards[currentIndex];
    if (!currentCard) return;
    
    const isSuccess = option === currentCard.definition;
    setSelectedAnswer(option);
    
    updateReview(
      { cardId: currentCard.id, isSuccess },
      {
        onSuccess: () => {
          if (currentIndex === sessionCards.length - 1) {
            updateStreak();
            setIsComplete(true);
            setCorrectAnswers(correctAnswers + 1);
          } else {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
          }
        }
      }
    );
  };

  const handleResponse = (knewIt: boolean) => {
    if (!sessionCards[currentIndex]) return;
    // Optimistically update UI
    if (currentIndex === sessionCards.length - 1) {
      setIsComplete(true);
      setCorrectAnswers(correctAnswers + 1);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
    setIsFlipping(false);
    setIsSubmitting(false);
    // Fire mutation in background
    updateReview({ cardId: sessionCards[currentIndex].id, isSuccess: knewIt });
  };

  const handleResponseWithFlip = (knewIt: boolean) => {
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
            setCorrectAnswers(correctAnswers + 1);
          } else {
            setCurrentIndex(currentIndex + 1);
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
  };

  // When repeat changes, refetch
  useEffect(() => {
    refetch();
  }, [repeat]);

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

  if (isComplete) {
    const accuracy = Math.round((correctAnswers / sessionCards.length) * 100);
    return (
      <div className=" dark:bg-gray-950 flex items-center justify-center">
        {sessionCards.length > 0 && (
          <Confetti
            width={width}
            height={height}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              zIndex: 50,
            }}
          />
        )}
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[24px] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 sm:p-8 text-center">
            <div className="inline-block p-3 sm:p-4 bg-white/10 rounded-full mb-4">
              <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">Congratulations!</h2>
            <p className="text-blue-100">You've completed today's review session</p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{sessionCards.length}</div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Cards Reviewed</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">{correctAnswers}</div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Correct Answers</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{accuracy}%</div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Accuracy</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Button
                onClick={() => {
                  setIsComplete(false);
                  setCurrentIndex(0);
                  setCorrectAnswers(0);
                  setSelectedAnswer(null);
                }}
                className="w-full sm:w-auto"
                disabled={isFetching}
              >
                Repeat Session
              </Button>
              <Button
                onClick={() => router.push('/dashboard/review')}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Return to Review
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    <div className=" dark:bg-gray-950">
      <div className="">
        {/* Progress bar */}
        <div className="mb-6 sm:mb-8">
          <div className="h-2 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 dark:bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / sessionCards.length) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} of {sessionCards.length} cards
          </div>
        </div>

        {/* Card content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
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
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">
                {sessionCards[currentIndex]?.word}
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {sessionCards[currentIndex]?.options?.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isSubmitting}
                    className={cn(
                      "p-3 sm:p-4 text-left rounded-lg border transition-all duration-200",
                      selectedAnswer === option
                        ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                      isSubmitting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 sm:mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0 || isSubmitting}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(prev => Math.min(sessionCards.length - 1, prev + 1))}
            disabled={currentIndex === sessionCards.length - 1 || isSubmitting}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
