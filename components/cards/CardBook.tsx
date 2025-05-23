"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/types/card";
import gsap from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCardDialog } from "./CreateCardDialog";
import Link from "next/link";

interface CardBookProps {
  cards: Card[];
}

export function CardBook({ cards }: CardBookProps) {
  const [currentSpread, setCurrentSpread] = useState(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bookRef = useRef<HTMLDivElement>(null);
  const animating = useRef(false);

  // Calculate total number of spreads (2 pages per spread, 4 cards per page)
  const cardsPerPage = 4;
  const cardsPerSpread = cardsPerPage * 2;
  const totalSpreads = Math.ceil(cards.length / cardsPerSpread);

  useEffect(() => {
    pageRefs.current = pageRefs.current.slice(0, Math.ceil(cards.length / cardsPerPage));
  }, [cards.length]);

  const resetPageStyles = () => {
    pageRefs.current.forEach(page => {
      if (page) {
        gsap.set(page, {
          clearProps: "all",
          visibility: "hidden",
          zIndex: 1
        });
      }
    });
  };

  const animatePageTurn = (fromSpread: number, toSpread: number) => {
    if (animating.current) return;
    animating.current = true;

    const currentLeftPage = pageRefs.current[fromSpread * 2];
    const currentRightPage = pageRefs.current[fromSpread * 2 + 1];
    const nextLeftPage = pageRefs.current[toSpread * 2];
    const nextRightPage = pageRefs.current[toSpread * 2 + 1];
    
    if (!currentLeftPage || !nextLeftPage) return;

    const direction = toSpread > fromSpread ? 1 : -1;

    // Reset all pages first
    resetPageStyles();

    const timeline = gsap.timeline({
      defaults: { duration: 0.8, ease: "power2.inOut" },
      onComplete: () => {
        animating.current = false;
      }
    });

    if (direction > 0) {
      // Forward animation
      timeline
        .set([currentLeftPage, currentRightPage, nextLeftPage, nextRightPage].filter(Boolean), {
          visibility: "visible"
        })
        .set(currentRightPage, { 
          zIndex: 3,
          transformOrigin: "left center",
          rotationY: 0
        })
        .set([currentLeftPage, nextLeftPage, nextRightPage].filter(Boolean), { 
          zIndex: 1
        })
        .set(".page-shadow", { opacity: 0 })
        .to(".page-shadow", { opacity: 0.2, duration: 0.4 })
        .to(currentRightPage, {
          rotationY: -170,
          duration: 0.8,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.to(".page-shadow", { opacity: 0, duration: 0.4 });
            if (currentRightPage) {
              currentRightPage.style.visibility = "hidden";
            }
            if (currentLeftPage) {
              currentLeftPage.style.visibility = "hidden";
            }
          }
        }, "-=0.4");
    } else {
      // Backward animation
      timeline
        .set([nextLeftPage, nextRightPage].filter(Boolean), {
          visibility: "visible"
        })
        .set(nextRightPage, { 
          zIndex: 3,
          transformOrigin: "left center",
          rotationY: -170
        })
        .set([currentLeftPage, currentRightPage].filter(Boolean), {
          visibility: "hidden"
        })
        .set(".page-shadow", { opacity: 0.2 })
        .to(nextRightPage, {
          rotationY: 0,
          duration: 0.8,
          ease: "power2.inOut",
          onStart: () => {
            gsap.to(".page-shadow", { opacity: 0.2, duration: 0.4 });
          },
          onComplete: () => {
            gsap.to(".page-shadow", { opacity: 0, duration: 0.4 });
            // Ensure clean state after animation
            resetPageStyles();
            if (nextLeftPage) nextLeftPage.style.visibility = "visible";
            if (nextRightPage) nextRightPage.style.visibility = "visible";
          }
        });
    }
  };

  const handlePageTurn = (direction: number) => {
    if (animating.current) return;
    const newSpread = currentSpread + direction;
    if (newSpread >= 0 && newSpread < totalSpreads) {
      animatePageTurn(currentSpread, newSpread);
      setCurrentSpread(newSpread);
    }
  };

  const renderCardContent = (card: Card) => (
    <Link 
      href={`/cards/${card.id}`}
      className="h-full flex flex-col group cursor-pointer"
    >
      <h3 className="text-lg font-semibold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
        {card.word}
      </h3>
      <p className="text-sm text-gray-600 flex-grow">
        {card.definition}
      </p>
      {card.wordDetails && (
        <div className="mt-2 text-xs text-gray-500">
          {card.wordDetails.synonyms && card.wordDetails.synonyms.length > 0 && (
            <p><span className="font-medium">Synonyms:</span> {card.wordDetails.synonyms.slice(0, 2).join(", ")}</p>
          )}
        </div>
      )}
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="relative w-full max-w-5xl mx-auto h-[600px] flex items-center justify-center perspective-1000">
        <div
          ref={bookRef}
          className="relative w-full h-full flex bg-white shadow-2xl rounded-lg overflow-hidden book-container"
          style={{
            perspective: "2000px",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Book spine */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[4px] -translate-x-1/2 spine-gradient" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-800/10 -translate-x-1/2" />

          {/* Shadow overlay for page turning effect */}
          <div className="page-shadow absolute inset-0 bg-black opacity-0 pointer-events-none" />

          {/* Pages */}
          {Array.from({ length: Math.ceil(cards.length / cardsPerPage) }).map((_, pageIndex) => {
            const isLeftPage = pageIndex % 2 === 0;
            const isCurrentSpread = Math.floor(pageIndex / 2) === currentSpread;
            const startCardIndex = pageIndex * cardsPerPage;
            const pageCards = cards.slice(startCardIndex, startCardIndex + cardsPerPage);
            
            return (
              <div
                key={pageIndex}
                ref={(el) => {
                  pageRefs.current[pageIndex] = el;
                }}
                className={cn(
                  "absolute w-1/2 h-full p-6",
                  "transform-style-preserve-3d backface-hidden",
                  isLeftPage ? "left-0" : "right-0",
                  !isCurrentSpread && "invisible"
                )}
                style={{
                  transformOrigin: isLeftPage ? "right center" : "left center",
                }}
              >
                <div className={cn(
                  "h-full bg-gray-50 rounded-lg shadow-sm border border-gray-100",
                  "grid grid-cols-2 gap-4",
                  "p-4",
                  isLeftPage ? "mr-[2px]" : "ml-[2px]",
                  "relative"
                )}>
                  <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
                    {pageCards.map((card, idx) => (
                      <div
                        key={card.id}
                        className="bg-white rounded-md shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-blue-200"
                      >
                        <div className="p-4 h-full">
                          {renderCardContent(card)}
                        </div>
                      </div>
                    ))}
                    {/* Fill empty slots with placeholder divs to maintain grid structure */}
                    {Array.from({ length: cardsPerPage - pageCards.length }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="bg-gray-50 rounded-md border border-dashed border-gray-200" />
                    ))}
                  </div>
                </div>
                {/* Page number */}
                <div className="absolute bottom-2 inset-x-0 text-center text-sm text-gray-500">
                  Page {pageIndex + 1}
                </div>
              </div>
            );
          })}

          {/* Navigation buttons */}
          <button
            onClick={() => handlePageTurn(-1)}
            disabled={currentSpread === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 z-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => handlePageTurn(1)}
            disabled={currentSpread === totalSpreads - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 z-50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        
        {/* Add Card button positioned at bottom right */}
        <div className="absolute -bottom-16 right-0">
          <CreateCardDialog />
        </div>
      </div>
    </div>
  );
} 