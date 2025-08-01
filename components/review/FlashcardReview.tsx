"use client";

import { useState, useEffect } from "react";
import { Card } from "@/types/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardReviewProps {
  card: Card;
  onResponse: (knewIt: boolean) => void;
  onResponseWithFlip: (knewIt: boolean) => void;
  isFlipping: boolean;
  setIsFlipping: (value: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  isLastCard?: boolean;
}

export function FlashcardReview({ 
  card, 
  onResponse, 
  onResponseWithFlip,
  isFlipping,
  setIsFlipping,
  isSubmitting,
  setIsSubmitting,
  isLastCard 
}: FlashcardReviewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);

  // Reset states when card changes
  useEffect(() => {
    setIsFlipped(false); // Always reset to front side
    setIsTransitioning(false);
    setHasResponded(false);
  }, [card.id]);

  const handleFlip = () => {
    if (!isTransitioning && !hasResponded) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleResponse = (knewIt: boolean) => {
    if (hasResponded) return;
    setHasResponded(true);
    setIsTransitioning(true);
    setIsFlipping(true);
    onResponseWithFlip(knewIt);
    setTimeout(() => {
      setIsTransitioning(false);
      setIsFlipping(false);
    }, 300);
  };

  // Minimal, modern card UI
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative mb-4 flex items-center justify-between px-2">
        {card.wordList && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium absolute left-0">
            {card.wordList.name}
          </span>
        )}
        <span className="text-xs text-gray-400 absolute right-0">
          {/* Progress indicator will be set by parent if needed */}
        </span>
      </div>
      <div 
        className={cn(
          "relative w-full aspect-[3/2] transition-transform duration-300 transform-style-3d cursor-pointer select-none",
          isFlipped && "rotate-y-180"
        )}
        onClick={() => {
          if (!isFlipped && !hasResponded) handleFlip();
        }}
      >
        {/* Front of card */}
        <div className={cn(
          "absolute w-full h-full backface-hidden rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm",
          "transform-style-3d",
          !isFlipped ? "z-10" : "z-0"
        )}>
          <h2
            className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center px-2 w-full min-w-0"
            style={{
              fontSize: card.word.length > 24 ? '1.25rem' : card.word.length > 16 ? '1.5rem' : '2rem',
              maxHeight: '4.5rem',
              minHeight: '2.5rem',
              width: '100%',
              minWidth: 0,
              overflowY: 'auto',
              wordBreak: 'break-all',
              hyphens: 'auto',
              lineHeight: '1.5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={card.word}
          >
            {card.word}
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-4 sm:mt-6">Click to reveal definition</p>
        </div>
        {/* Back of card */}
        <div 
          className={cn(
            "absolute w-full h-full backface-hidden rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm",
            "transform-style-3d rotate-y-180",
            isFlipped ? "z-10" : "z-0"
          )}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-800 dark:text-gray-200 text-center mb-6 sm:mb-10 min-h-[2.5rem]">
            {isFlipped ? card.definition : ''}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-2" onClick={e => e.stopPropagation()}>
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "flex items-center gap-2 border-gray-300 dark:border-gray-700 text-red-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/30 px-4 sm:px-6 py-2 text-sm sm:text-base font-medium rounded-lg w-full sm:w-auto",
                (hasResponded || isSubmitting) && "opacity-50 cursor-not-allowed"
              )}
              onClick={e => {
                e.stopPropagation();
                handleResponse(false);
              }}
              disabled={hasResponded || isSubmitting}
            >
              {isSubmitting ? (
                <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              ) : (
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              Didn't Know
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "flex items-center gap-2 border-gray-300 dark:border-gray-700 text-green-600 hover:text-green-700 hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-900/30 px-4 sm:px-6 py-2 text-sm sm:text-base font-medium rounded-lg w-full sm:w-auto",
                (hasResponded || isSubmitting) && "opacity-50 cursor-not-allowed"
              )}
              onClick={e => {
                e.stopPropagation();
                handleResponse(true);
              }}
              disabled={hasResponded || isSubmitting}
            >
              {isSubmitting ? (
                <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              ) : (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              Knew It
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 