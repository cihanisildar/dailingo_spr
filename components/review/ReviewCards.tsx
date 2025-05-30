"use client";

import { Button } from "@/components/ui/button";
import { useTodayCards } from "@/hooks/useCards";
import { useUpdateReview } from "@/hooks/useCards";
import { useUpdateStreak } from "@/hooks/useStreak";
import { Card } from "@/types/card";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/useWindowSize";
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

type CardWithReviews = Card & { reviews?: Review[] };

interface ReviewCardsProps {
  initialMode?: 'multiple-choice' | 'flashcard';
  initialCount?: number;
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

export default function ReviewCards({ initialMode = 'multiple-choice', initialCount }: ReviewCardsProps) {
  const router = useRouter();
  const { width, height } = useWindowSize();
  const { data: allWords = [] } = useQuery({
    queryKey: ["words", "all"],
    queryFn: async () => {
      const response = await fetch("/api/words/all");
      return response.json();
    }
  });

  const { data: cardsData } = useTodayCards();
  const { mutate: updateReview } = useUpdateReview();
  const { mutate: updateStreak } = useUpdateStreak();

  // Combine all cards from different intervals into a single array
  const allCards = Object.values(cardsData?.cards || {}).flat() as CardWithReviews[];
  const total = cardsData?.total || 0;

  const [session, setSession] = useState<SessionState>({
    cards: [],
    currentIndex: 0,
    showAnswer: false,
    options: [],
    selectedAnswer: null,
    isComplete: false,
    showConfetti: false,
    correctAnswers: 0
  });

  // Add isFlipping state at the top level
  const [isFlipping, setIsFlipping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add loading state for options
  const [optionsLoading, setOptionsLoading] = useState(false);

  // Add showWordModal state
  const [showWordModal, setShowWordModal] = useState(false);

  // Initialize session cards
  useEffect(() => {
    console.log('All cards for today:', allCards);
    if (allCards.length > 0 && session.cards.length === 0) {
      const count = initialCount || total;
      // Use allCards directly, since backend already filters out reviewed cards
      const shuffledCards = allCards
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(count, allCards.length));
      setSession(prev => {
        const newSession = { ...prev, cards: shuffledCards };
        console.log('Session cards after init:', newSession.cards);
        return newSession;
      });
    }
  }, [allCards, initialCount, total, session.cards.length]);

  // Generate options when currentCard changes
  useEffect(() => {
    const currentCard = session.cards[session.currentIndex];
    if (!currentCard || !allWords.length || session.showAnswer || session.options.length > 0) return;

    setOptionsLoading(true);
    const correctAnswer = currentCard.definition;
    if (!correctAnswer) {
      setOptionsLoading(false);
      return;
    }

    // Get all definitions except the correct one
    const otherDefinitions = allWords
      .filter((w: Word) => w.definition !== correctAnswer)
      .map((w: Word) => w.definition)
      .filter((def: string) => def && def.trim() !== '');

    let wrongAnswers: string[] = [];
    if (otherDefinitions.length >= 3) {
      wrongAnswers = otherDefinitions
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    } else {
      wrongAnswers = [...otherDefinitions];
      while (wrongAnswers.length < 3) {
        wrongAnswers.push(...otherDefinitions);
      }
      wrongAnswers = wrongAnswers.slice(0, 3);
    }

    const allOptions = [...wrongAnswers, correctAnswer];
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    setSession(prev => ({ ...prev, options: shuffledOptions }));
    setOptionsLoading(false);
  }, [session.currentIndex, session.cards, allWords, session.showAnswer, session.options.length]);

  const handleOptionSelect = (option: string) => {
    if (session.showAnswer || session.selectedAnswer) return;
    
    const currentCard = session.cards[session.currentIndex];
    if (!currentCard) return;
    
    const isSuccess = option === currentCard.definition;
    setSession(prev => ({ 
      ...prev, 
      selectedAnswer: option, 
      showAnswer: true,
      correctAnswers: isSuccess ? prev.correctAnswers + 1 : prev.correctAnswers
    }));
    
    updateReview(
      { cardId: currentCard.id, isSuccess },
      {
        onSuccess: () => {
          if (session.currentIndex === session.cards.length - 1) {
            updateStreak();
            setSession(prev => ({ ...prev, isComplete: true, showConfetti: true }));
          }
        }
      }
    );
  };

  const handleFlashcardResponse = (knewIt: boolean) => {
    if (!currentCard) return;
    
    updateReview(
      { cardId: currentCard.id, isSuccess: knewIt },
      {
        onSuccess: () => {
          if (session.currentIndex === session.cards.length - 1) {
            updateStreak();
            setSession(prev => ({ 
              ...prev, 
              isComplete: true, 
              showConfetti: true,
              correctAnswers: knewIt ? prev.correctAnswers + 1 : prev.correctAnswers
            }));
          } else {
            setSession(prev => ({ 
              ...prev, 
              currentIndex: prev.currentIndex + 1,
              correctAnswers: knewIt ? prev.correctAnswers + 1 : prev.correctAnswers
            }));
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

  const handleNext = () => {
    if (!session.showAnswer) return;
    
    if (session.currentIndex < session.cards.length - 1) {
      setSession(prev => ({ 
        ...prev,
        currentIndex: prev.currentIndex + 1,
        showAnswer: false,
        selectedAnswer: null,
        options: []
      }));
    }
  };

  const handlePrevious = () => {
    if (session.currentIndex > 0) {
      setSession(prev => ({ 
        ...prev,
        currentIndex: prev.currentIndex - 1,
        showAnswer: false,
        selectedAnswer: null,
        options: []
      }));
    }
  };

  const currentCard = session.cards[session.currentIndex];

  if (session.isComplete) {
    const accuracy = Math.round((session.correctAnswers / session.cards.length) * 100);
  return (
      <div className="max-w-4xl mx-auto">
        {session.showConfetti && (
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
        <div className="bg-white rounded-[24px] shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-center">
            <div className="inline-block p-4 bg-white/10 rounded-full mb-4">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Congratulations!</h2>
            <p className="text-blue-100">You've completed today's review session</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{session.cards.length}</div>
                <div className="text-gray-600">Cards Reviewed</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{session.correctAnswers}</div>
                <div className="text-gray-600">Correct Answers</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{accuracy}%</div>
                <div className="text-gray-600">Accuracy</div>
          </div>
        </div>

            <div className="flex justify-center gap-4">
          <Button
                onClick={() => router.push('/dashboard/review')}
                className="flex items-center gap-2"
          >
                Return to Review
          </Button>
          </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-gray-500">No cards available for review.</p>
        <Button onClick={() => router.push('/dashboard/review')} className="mt-4">
          Return to Start
          </Button>
      </div>
    );
  }

  if (initialMode !== 'flashcard' && (optionsLoading || session.options.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-full max-w-md mx-auto">
            <div className="h-8 w-2/3 bg-gray-100 rounded mb-4 animate-pulse mx-auto" />
            <div className="h-6 w-1/2 bg-gray-100 rounded mb-2 animate-pulse mx-auto" />
            <div className="h-12 w-full bg-gray-100 rounded mb-2 animate-pulse" />
            <div className="h-12 w-full bg-gray-100 rounded mb-2 animate-pulse" />
            <div className="h-12 w-full bg-gray-100 rounded mb-2 animate-pulse" />
            <div className="h-12 w-full bg-gray-100 rounded mb-2 animate-pulse" />
          </div>
          <p className="text-gray-400 text-sm mt-4">Loading question...</p>
        </div>
      </div>
    );
  }

  // FLASHCARD MODE
  if (initialMode === 'flashcard') {
    // Wrap the original handler to block navigation only during flip and show loading
    const handleFlashcardResponseWithFlip = (knewIt: boolean) => {
      if (isFlipping || isSubmitting) return;
      setIsFlipping(true);
      setIsSubmitting(true);
    updateReview(
      { cardId: currentCard.id, isSuccess: knewIt },
      {
        onSuccess: () => {
          if (session.currentIndex === session.cards.length - 1) {
            updateStreak();
              setSession(prev => ({ 
                ...prev, 
                isComplete: true, 
                showConfetti: true,
                correctAnswers: knewIt ? prev.correctAnswers + 1 : prev.correctAnswers
              }));
          } else {
              setSession(prev => ({ 
                ...prev, 
                currentIndex: prev.currentIndex + 1,
                correctAnswers: knewIt ? prev.correctAnswers + 1 : prev.correctAnswers
              }));
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
  return (
      <div className="max-w-4xl mx-auto">
        <FlashcardReview
          card={currentCard}
          onResponse={handleFlashcardResponseWithFlip}
          isLastCard={session.currentIndex === session.cards.length - 1}
          isSubmitting={isSubmitting}
        />
        <div className="flex justify-center mt-8">
          <div className="flex gap-4 bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-3 w-full max-w-md items-center justify-between">
            <Button
              onClick={handlePrevious}
              variant="outline"
              className="flex items-center gap-2"
              disabled={session.currentIndex === 0 || isFlipping || isSubmitting}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex-1" />
          </div>
        </div>
          </div>
    );
  }

  return (
    <div className="w-full sm:max-w-lg mx-auto px-0 sm:px-0">
      {/* Word modal for mobile */}
      {showWordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full mx-4 flex flex-col items-center">
            <span className="text-2xl font-bold text-gray-900 break-words text-center mb-4">{currentCard.word}</span>
            <button onClick={() => setShowWordModal(false)} className="mt-2 px-4 py-2 rounded bg-blue-500 text-white font-medium">Close</button>
          </div>
        </div>
      )}
      <div className="bg-white sm:rounded-2xl sm:shadow-xl sm:overflow-hidden sm:border sm:border-gray-100 rounded-none shadow-none border-none">
        {/* Header/word area */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-3 py-4 sm:p-4 sm:rounded-t-2xl rounded-[12px] w-full flex flex-col items-center justify-center">
          {/* Progress pill */}
          <span className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h.01M12 4a8 8 0 100 16 8 8 0 000-16zm0 8v2m0 4h.01" /></svg>
                      Card {session.currentIndex + 1} of {session.cards.length}
                    </span>
          {/* Word with tap-to-expand on mobile if truncated */}
          <h2
            className="text-2xl sm:text-4xl font-bold text-white text-center mb-1 truncate overflow-hidden text-ellipsis w-full cursor-pointer sm:cursor-default"
            title={currentCard.word}
                      onClick={() => {
              if (window.innerWidth < 640 && currentCard.word.length > 18) setShowWordModal(true);
                      }}
                    >
                    {currentCard.word}
                  </h2>
                  {currentCard.wordList && (
            <p className="text-blue-100 text-center text-xs mt-1">
                      From: {currentCard.wordList.name}
                    </p>
                  )}
          {/* Divider */}
          <div className="mt-3 border-t border-white/20 w-full mx-auto" />
                </div>

        {/* Options area, edge-to-edge on mobile, soft bg, more spacing */}
        <div className="bg-white px-1 sm:px-6 pt-2 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 gap-3 mt-2 mb-2">
                    {session.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(option)}
                        disabled={session.showAnswer || session.selectedAnswer !== null}
                className={`w-full p-4 sm:p-5 rounded-xl text-left transition-all duration-150 border text-base font-medium shadow-sm
                  ${session.selectedAnswer === option && !session.showAnswer ? 'border-blue-500 bg-blue-50' : ''}
                  ${session.showAnswer && option === currentCard.definition ? 'border-green-500 bg-green-50' : ''}
                  ${session.showAnswer && session.selectedAnswer === option && option !== currentCard.definition ? 'border-red-500 bg-red-50' : ''}
                  ${!session.selectedAnswer && !session.showAnswer ? 'hover:border-blue-300 hover:bg-blue-100/60 border-gray-200 active:scale-95' : ''}
                  ${(session.showAnswer || session.selectedAnswer) && option !== session.selectedAnswer && option !== currentCard.definition ? 'opacity-50' : ''}
                `}
                style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)' }}
              >
                <p className="text-base sm:text-lg">{option}</p>
                      </button>
                    ))}
                  </div>
                </div>

        {/* Sticky navigation bar on mobile */}
        <div className="border-t border-gray-100 p-3 sm:p-4 bg-white flex items-center justify-between sm:rounded-b-2xl rounded-none sticky bottom-0 z-10">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
            className="flex items-center gap-2 px-4 py-2 text-base"
                    disabled={session.currentIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  {session.showAnswer && (
                    <Button
                      onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 text-base"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
      </div>
    </div>
  );
}
