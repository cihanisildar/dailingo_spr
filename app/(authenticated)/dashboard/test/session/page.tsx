"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTest } from "@/hooks/useTest";
import { useCards } from "@/hooks/useCards";
import { Card as UICard, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import toast from "react-hot-toast";
import Confetti from "react-confetti";

interface Card {
  id: string;
  word: string;
  definition: string;
  wordList?: {
    id: string;
    name: string;
  };
}

type StudyMode = "multiple-choice" | "flashcards";

type TestResult = {
  cardId: string;
  isCorrect: boolean;
  timeSpent: number;
};

export default function TestSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startTest, submitTestResults } = useTest();
  const { getCards, getTodayCards } = useCards();

  // Parse query params
  const mode = searchParams.get("mode") || "all"; // 'all' or 'today'
  const studyMode = (searchParams.get("study") as StudyMode) || "multiple-choice";
  const questionAmount = parseInt(searchParams.get("count") || "10", 10);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [words, setWords] = useState<Card[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ selected: string; correct: string; isCorrect: boolean } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcardResults, setFlashcardResults] = useState<{ id: string; knew: boolean }[]>([]);
  const [showFlashcardSummary, setShowFlashcardSummary] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // For scroll hint
  const wordRef = useRef<HTMLHeadingElement>(null);
  const defRef = useRef<HTMLParagraphElement>(null);
  const [wordOverflow, setWordOverflow] = useState(false);
  const [defOverflow, setDefOverflow] = useState(false);

  // Fetch and setup test session
  useEffect(() => {
    async function setup() {
      setLoading(true);
      setError(null);
      try {
        // Fetch cards
        let cards: Card[] = [];
        if (mode === "today") {
          cards = await getTodayCards();
        } else {
          cards = await getCards();
        }
        cards = cards.filter(w => w.word && w.definition);
        if (cards.length < 4) throw new Error("Not enough cards to start a test.");
        // Shuffle and pick count
        const selected = [...cards].sort(() => Math.random() - 0.5).slice(0, Math.min(questionAmount, cards.length));
        // Create test session
        const cardIds = selected.map(w => w.id);
        const session = await startTest({ cardIds, mode: studyMode === "multiple-choice" ? "definition" : "word" });
        setSessionId(session.sessionId);
        setWords(selected);
        setCurrentWordIndex(0);
        setTestResults([]);
        setStartTime(Date.now());
        setCardStartTime(Date.now());
        setShowFeedback(false);
        setLastAnswer(null);
        setIsFlipped(false);
        setFlashcardResults([]);
        setShowFlashcardSummary(false);
        setShowConfetti(false);
        if (studyMode === "multiple-choice" && selected.length > 0) {
          generateOptions(selected[0].definition, cards);
        }
      } catch (e: any) {
        setError(e.message || "Failed to start test session.");
      } finally {
        setLoading(false);
      }
    }
    setup();
    // eslint-disable-next-line
  }, []);

  // Generate options for a question
  const generateOptions = useCallback((correct: string, allCards: Card[]) => {
    const otherDefs = allCards.filter(w => w.definition !== correct).map(w => w.definition);
    let wrong = otherDefs.sort(() => Math.random() - 0.5).slice(0, 3);
    while (wrong.length < 3) {
      wrong.push(otherDefs[Math.floor(Math.random() * otherDefs.length)] || "");
    }
    const opts = [...wrong, correct].sort(() => Math.random() - 0.5);
    setOptions(opts);
  }, []);

  // Multiple Choice: handle answer selection
  const handleResponse = async (selectedAnswer: string) => {
    if (showFeedback) return;
    const isCorrect = selectedAnswer === words[currentWordIndex].definition;
    const currentWord = words[currentWordIndex];
    const timeSpent = Date.now() - startTime;
    setShowFeedback(true);
    setElapsedTime(timeSpent);
    setLastAnswer({ selected: selectedAnswer, correct: words[currentWordIndex].definition, isCorrect });
    if (sessionId) {
      try {
        await submitTestResults(sessionId, { cardId: currentWord.id, isCorrect, timeSpent });
      } catch {
        toast.error("Failed to submit answer.");
      }
    }
    setTestResults(prev => [...prev, { cardId: currentWord.id, isCorrect, timeSpent }]);
    setTimeout(() => {
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setShowFeedback(false);
        setStartTime(Date.now());
        setElapsedTime(0);
        generateOptions(words[currentWordIndex + 1].definition, words);
      } else {
        setShowResults(true);
        setShowConfetti(true);
        toast.success('🎉 Test completed successfully!');
      }
    }, 1500);
  };

  // Flashcards: handle knew/didn't know
  const handleFlashcardResult = async (knew: boolean) => {
    const timeSpent = Date.now() - cardStartTime;
    const currentWord = words[currentWordIndex];
    if (sessionId) {
      try {
        await submitTestResults(sessionId, { cardId: currentWord.id, isCorrect: knew, timeSpent });
      } catch {
        toast.error("Failed to save result. Please try again.");
      }
    }
    setFlashcardResults(prev => [...prev, { id: currentWord.id, knew }]);
    if (currentWordIndex < words.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentWordIndex(prev => prev + 1);
      }, 300);
    } else {
      setShowConfetti(true);
      setShowFlashcardSummary(true);
    }
  };

  // Add window resize handler for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add useEffect to update cardStartTime
  useEffect(() => {
    setCardStartTime(Date.now());
  }, [currentWordIndex]);

  // Timer for multiple choice
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!showFeedback && !showResults && studyMode === "multiple-choice") {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showFeedback, showResults, startTime, studyMode]);

  const formatTime = (ms: number) => {
    return `${Math.floor(ms / 1000)}.${(ms % 1000).toString().padStart(3, "0")}` + "s";
  };

  // UI
  if (loading) return <div className="flex justify-center items-center min-h-[200px]">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  // Flashcard summary
  if (showFlashcardSummary) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {showConfetti && (
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} gravity={0.2} />
        )}
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Session Complete! 🎉</h2>
              <p className="text-gray-600">Great job completing your flashcard session!</p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 rounded-xl">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{flashcardResults.filter(r => r.knew).length}</div>
                <div className="text-sm text-gray-600">Words Known</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600">{flashcardResults.filter(r => !r.knew).length}</div>
                <div className="text-sm text-gray-600">Words to Review</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white">Start New Session</Button>
                <Button variant="outline" onClick={() => router.push('/dashboard/test')}>Return to Dashboard</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple Choice Results
  if (showResults) {
    const correct = testResults.filter(r => r.isCorrect).length;
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-white dark:bg-gray-900 rounded-xl shadow">
        {showConfetti && (
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} gravity={0.2} />
        )}
        <h2 className="text-2xl font-bold mb-4 text-center">Test Complete!</h2>
        <p className="text-center mb-6">You got <span className="font-bold">{correct}</span> out of <span className="font-bold">{words.length}</span> correct.</p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => router.push('/dashboard/test')}>Return to Test Home</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>Retake Test</Button>
        </div>
      </div>
    );
  }

  // Flashcard mode UI
  if (studyMode === "flashcards") {
    if (!words.length || !words[currentWordIndex]) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[220px]">
          <p className="text-gray-500 text-lg">No words available for flashcards.</p>
        </div>
      );
    }
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="relative bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5"></div>
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                    <Shuffle className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Flashcards</h1>
                </div>
                <p className="text-blue-100 text-lg">{mode === "today" ? "Today's" : "All"} words study session</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-white" />
                    <span className="font-medium text-white">{currentWordIndex + 1} of {words.length}</span>
                  </div>
                </div>
                <Button variant="ghost" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => router.push('/dashboard/test')}>Exit</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[220px]">
          <div className="w-full max-w-md">
            <UICard className="mb-8">
              <CardHeader>
                <CardTitle>Flashcard {currentWordIndex + 1} of {words.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 text-lg font-semibold text-center">
                  <span className="text-blue-600">{isFlipped ? words[currentWordIndex].definition : words[currentWordIndex].word}</span>
                </div>
                <div className="flex justify-center">
                  <Button onClick={() => setIsFlipped(f => !f)} className="mb-4">
                    {isFlipped ? "Show Word" : "Show Definition"}
                  </Button>
                </div>
                {isFlipped && (
                  <div className="flex justify-center gap-6 mt-6">
                    <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-2 rounded-lg shadow" onClick={() => handleFlashcardResult(true)}>Knew it</Button>
                    <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-2 rounded-lg shadow" onClick={() => handleFlashcardResult(false)}>Didn't Know</Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{currentWordIndex + 1} / {words.length}</span>
              </CardFooter>
            </UICard>
          </div>
        </div>
      </div>
    );
  }

  // Multiple Choice Test UI
  if (!words.length || !words[currentWordIndex]) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[220px]">
        <p className="text-gray-500 text-lg">No words available for testing.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-12">
      <UICard className="mb-8">
        <CardHeader>
          <CardTitle>Question {currentWordIndex + 1} of {words.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 text-lg font-semibold text-center">
            What does <span className="text-blue-600">"{words[currentWordIndex].word}"</span> mean?
          </div>
          <div className="grid gap-4">
            {options.map(option => (
              <Button
                key={option}
                className={`w-full text-left ${lastAnswer && lastAnswer.selected === option ? (option === words[currentWordIndex].definition ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : ''}`}
                disabled={showFeedback}
                onClick={() => handleResponse(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{currentWordIndex + 1} / {words.length}</span>
          {showFeedback && lastAnswer && (
            <span className={lastAnswer.isCorrect ? "text-green-600" : "text-red-600"}>
              {lastAnswer.isCorrect ? "Correct!" : `Wrong! Correct: ${words[currentWordIndex].definition}`}
            </span>
          )}
        </CardFooter>
      </UICard>
    </div>
  );
}
