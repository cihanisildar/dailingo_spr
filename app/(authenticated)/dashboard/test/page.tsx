"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpen, CheckCircle2, Clock, GraduationCap, HelpCircle, Shuffle, TrendingUp, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { toast } from "react-hot-toast";
import Confetti from 'react-confetti';
import { Label } from "@/components/ui/label";

interface Word {
  id: string;
  word: string;
  definition: string;
  wordList?: {
    id: string;
    name: string;
  };
}

interface TestResult {
  wordId: string;
  isCorrect: boolean;
  timeSpent: number;
}

type StudyMode = "multiple-choice" | "flashcards";
type TestMode = "all" | "today";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function TestPage() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [testMode, setTestMode] = useState<TestMode>("all");
  const [studyMode, setStudyMode] = useState<StudyMode>("multiple-choice");
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [questionAmount, setQuestionAmount] = useState<number>(10); // Default to 10
  const [options, setOptions] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ selected: string; correct: string; isCorrect: boolean } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Selected words for the test (move this up for hook order)
  const [words, setWords] = useState<Word[]>([]);

  // For scroll hint
  const wordRef = useRef<HTMLHeadingElement>(null);
  const defRef = useRef<HTMLParagraphElement>(null);
  const [wordOverflow, setWordOverflow] = useState(false);
  const [defOverflow, setDefOverflow] = useState(false);

  // Track user responses for flashcards
  const [flashcardResults, setFlashcardResults] = useState<{ id: string; knew: boolean }[]>([]);
  const [showFlashcardSummary, setShowFlashcardSummary] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const isMultipleChoice = studyMode === "multiple-choice";
  const isFlashcards = studyMode === "flashcards";

  useLayoutEffect(() => {
    if (wordRef.current) {
      setWordOverflow(wordRef.current.scrollHeight > wordRef.current.clientHeight + 2);
    }
    if (defRef.current) {
      setDefOverflow(defRef.current.scrollHeight > defRef.current.clientHeight + 2);
    }
  }, [currentWordIndex, words, isFlipped]);

  // Fetch today's words to check if any exist
  const { data: todayWords = [], isLoading: isTodayWordsLoading } = useQuery<Word[]>({
    queryKey: ["test-words", "today"],
    queryFn: async () => {
      const response = await api.get(`/words/today`);
      return response.data;
    },
  });

  // Fetch words based on test mode
  const { data: allWords = [], isLoading: isAllWordsLoading, refetch } = useQuery<Word[]>({
    queryKey: ["test-words", testMode],
    queryFn: async () => {
      const response = await api.get(`/words/${testMode}`);
      return response.data;
    },
  });

  const isLoading = isTodayWordsLoading || isAllWordsLoading;

  // Update question amount when allWords changes
  useEffect(() => {
    if (allWords.length > 0) {
      const validWords = allWords.filter(w => w.word && w.word.trim() !== '' && w.definition && w.definition.trim() !== '');
      setQuestionAmount(Math.min(10, validWords.length));
      setWords(validWords);
    }
  }, [allWords]);

  const handleQuestionAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) {
      setQuestionAmount(0);
      return;
    }
    // Ensure the value is between 1 and the total available words
    const boundedValue = Math.min(Math.max(1, value), allWords.length);
    setQuestionAmount(boundedValue);
  };

  // Check if we have enough words for multiple choice
  const hasEnoughWordsForMultipleChoice = testMode === "today" 
    ? todayWords.length >= 4 
    : allWords.length >= 4;

  // Check if we have any words available
  const hasWords = testMode === "today" ? todayWords.length > 0 : allWords.length > 0;

  // Mutation for submitting word result
  const submitResult = useMutation({
    mutationFn: async (result: TestResult) => {
      return await api.post("/word-result", result);
    },
  });

  const submitTestSession = useMutation({
    mutationFn: async (results: TestResult[]) => {
      return await api.post("/test-session", { results });
    },
    onSuccess: () => {
      // Invalidate test history cache
      queryClient.invalidateQueries({ queryKey: ["test-history"] });
      toast.success('Test completed successfully!');
      // Stay on the results page, do not navigate
      // router.push("/dashboard/test/history");
    },
    onError: (error) => {
      console.error('Error saving test session:', error);
      toast.error('Failed to save test results. Please try again.');
      setShowResults(false); // Allow retrying the submission
    }
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTestStarted && !showFeedback && !showResults) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTestStarted, startTime, showFeedback, showResults]);

  const generateOptions = (correctAnswer: string, allWords: Word[]) => {
    if (!allWords || allWords.length === 0) {
      console.log('No words available for options');
      return [];
    }

    // Get all definitions except the correct one
    const otherWords = allWords
      .filter(w => w.definition !== correctAnswer && w.definition && w.definition.trim() !== '')
      .map(w => w.definition);

    console.log('Available definitions:', otherWords.length);

    let wrongAnswers: string[] = [];
    if (otherWords.length >= 3) {
      // If we have enough definitions, randomly select 3
      wrongAnswers = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    } else {
      // If we don't have enough unique definitions, duplicate some
      wrongAnswers = [...otherWords];
      const availableDefinitions = [...otherWords];
      while (wrongAnswers.length < 3) {
        if (availableDefinitions.length === 0) {
          // If we've used all definitions, reset the available pool
          availableDefinitions.push(...otherWords);
        }
        const randomIndex = Math.floor(Math.random() * availableDefinitions.length);
        wrongAnswers.push(availableDefinitions[randomIndex]);
        availableDefinitions.splice(randomIndex, 1);
      }
    }

    // Combine with correct answer and shuffle
    const allOptions = [...wrongAnswers, correctAnswer];
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    
    console.log('Final options:', shuffledOptions);
    setOptions(shuffledOptions);
  };

  const startTest = async () => {
    try {
      await refetch();
      
      if (!hasWords) {
        toast.error('No words available for testing');
        return;
      }

      // For multiple choice, we need at least 4 words
      if (studyMode === "multiple-choice" && !hasEnoughWordsForMultipleChoice) {
        toast.error('You need at least 4 cards to start a multiple choice test');
        return;
      }

      let selectedWords;
      if (studyMode === "multiple-choice") {
        // Randomly select questionAmount number of words for multiple choice
        selectedWords = [...allWords]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(questionAmount, allWords.length));
      } else {
        // For flashcards, use all available words
        selectedWords = [...allWords];
      }
      
      if (selectedWords.length === 0) {
        toast.error('No words available for testing');
        return;
      }

      setWords(selectedWords);
      setIsTestStarted(true);
      setCurrentWordIndex(0);
      setTestResults([]);
      setStartTime(Date.now());
      setShowFeedback(false);
      setLastAnswer(null);
      setIsFlipped(false);
      
      if (studyMode === "multiple-choice" && selectedWords.length > 0) {
        generateOptions(selectedWords[0].definition, allWords);
      }
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error('Failed to start test. Please try again.');
    }
  };

  const handleResponse = async (selectedAnswer: string) => {
    if (showFeedback) return; // Prevent multiple submissions

    const timeSpent = Date.now() - startTime;
    const isCorrect = selectedAnswer === words[currentWordIndex].definition;
    const result = {
      wordId: words[currentWordIndex].id,
      isCorrect,
      timeSpent,
    };

    try {
      // Update all related states together before the API call
      setShowFeedback(true);
      setElapsedTime(timeSpent);
      setLastAnswer({
        selected: selectedAnswer,
        correct: words[currentWordIndex].definition,
        isCorrect
      });

      // Then submit the individual result
      await submitResult.mutateAsync(result);
      
      // Update test results
      setTestResults(prev => [...prev, result]);

      // Move to next question after 1.5 seconds
      setTimeout(() => {
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
          setShowFeedback(false); // Reset feedback state
          setStartTime(Date.now()); // Reset timer for next question
          setElapsedTime(0); // Reset displayed time
          generateOptions(words[currentWordIndex + 1].definition, allWords);
        } else {
          // Submit the complete test session
          submitTestSession.mutate([...testResults, result]);
          setShowConfetti(true);
          setShowResults(true);
          setIsTestStarted(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to save answer. Please try again.');
      setShowFeedback(false); // Reset feedback state on error
    }
  };

  const resetTest = () => {
    setShowResults(false);
    setTestResults([]);
    setCurrentWordIndex(0);
    setLastAnswer(null);
    setShowConfetti(false);
  };

  const formatTime = (ms: number) => {
    return `${Math.floor(ms / 1000)}.${(ms % 1000).toString().padStart(3, "0")}s`;
  };

  // Handle navigation attempts
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTestStarted && !showResults) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!isTestStarted || showResults) return;

      const link = (e.target as HTMLElement).closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href === pathname) return;

      e.preventDefault();
      setPendingNavigation(href);
      setShowExitDialog(true);
    };

    if (isTestStarted && !showResults) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('click', handleClick, true);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isTestStarted, showResults, pathname]);

  const handleExit = () => {
    if (isTestStarted && !showResults) {
      setShowExitDialog(true);
    } else {
      router.push('/dashboard/test');
    }
  };

  const confirmExit = () => {
    setShowExitDialog(false);
    setIsTestStarted(false);
    setTestResults([]);
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    } else {
      router.push('/dashboard/test');
    }
  };

  const isMobile = useIsMobile();

  // Add window resize handler for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (showResults) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.2}
          />
        )}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Test Results</h1>
                <p className="text-blue-100 mt-2">
                  Great job! Here's how you performed:
                </p>
              </div>
              <Button 
                onClick={resetTest}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full sm:w-auto"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Start New Test
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="overflow-hidden border-none shadow-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Questions</p>
                  <p className="text-2xl font-semibold">{testResults.length}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Correct Answers</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {testResults.filter(r => r.isCorrect).length}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Incorrect Answers</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {testResults.filter(r => !r.isCorrect).length}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg. Time</p>
                  <p className="text-2xl font-semibold">
                    {formatTime(testResults.reduce((acc, curr) => acc + curr.timeSpent, 0) / testResults.length)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden border-none shadow-sm">
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-medium text-gray-900">Detailed Results</h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">Incorrect</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {words.map((word, index) => {
                const result = testResults[index];
                return (
                  <div 
                    key={word.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      result.isCorrect 
                        ? "bg-green-50/50 border-green-100" 
                        : "bg-red-50/50 border-red-100"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-medium text-gray-900">{word.word}</p>
                          {word.wordList && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {word.wordList.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Correct definition: {word.definition}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-500">
                          {formatTime(result.timeSpent)}
                        </p>
                        {result.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!isTestStarted) {
    return (
      <div className="space-y-8">
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 mb-8 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white">Test Your Knowledge</h1>
                <p className="text-blue-100 dark:text-blue-200 mt-2">Challenge yourself with multiple choice questions or flashcards.</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Test Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your test preferences</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Mode</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Button
                        variant={testMode === "all" ? "default" : "outline"}
                        onClick={() => setTestMode("all")}
                        className={cn(
                          "w-full",
                          testMode === "all" 
                            ? "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        )}
                      >
                        All Words
                      </Button>
                      <Button
                        variant={testMode === "today" ? "default" : "outline"}
                        onClick={() => setTestMode("today")}
                        className={cn(
                          "w-full",
                          testMode === "today" 
                            ? "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        )}
                      >
                        Today's Words
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Study Mode</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Button
                        variant={isMultipleChoice ? "default" : "outline"}
                        onClick={() => setStudyMode("multiple-choice" as StudyMode)}
                        className={cn(
                          "w-full",
                          isMultipleChoice 
                            ? "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        )}
                      >
                        Multiple Choice
                      </Button>
                      <Button
                        variant={isFlashcards ? "default" : "outline"}
                        onClick={() => setStudyMode("flashcards" as StudyMode)}
                        className={cn(
                          "w-full",
                          isFlashcards 
                            ? "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        )}
                      >
                        Flashcards
                      </Button>
                    </div>
                  </div>

                  {isMultipleChoice && (
                    <div>
                      <Label htmlFor="questionAmount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Number of Questions
                      </Label>
                      <Input
                        id="questionAmount"
                        type="number"
                        min="1"
                        max={allWords.length}
                        value={questionAmount}
                        onChange={handleQuestionAmountChange}
                        className="mt-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Available words: {allWords.length}
                      </p>
                    </div>
                  )}
                </div>

                {!hasWords && (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No words available for testing. Add some words first.
                    </AlertDescription>
                  </Alert>
                )}

                {isMultipleChoice && !hasEnoughWordsForMultipleChoice && (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need at least 4 words for multiple choice questions.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={startTest}
                  disabled={!hasWords || (isMultipleChoice && !hasEnoughWordsForMultipleChoice)}
                  className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Start Test
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Test Information</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Available Words</p>
                    <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                      {testMode === "today" ? todayWords.length : allWords.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Test Mode</p>
                    <p className="text-blue-900 dark:text-blue-100">
                      {testMode === "today" ? "Today's Words" : "All Words"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Study Mode</p>
                    <p className="text-blue-900 dark:text-blue-100">
                      {studyMode === "multiple-choice" ? "Multiple Choice" : "Flashcards"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 text-white">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium">About Testing</h3>
                </div>
                <p className="text-blue-50 text-sm leading-relaxed">
                  Testing yourself is one of the most effective ways to learn. Choose between multiple
                  choice questions or flashcards to test your knowledge. Multiple choice questions help
                  you distinguish between similar words, while flashcards are great for quick recall.
                </p>
              </div>
            </Card>
          </div>
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
      <>
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Flashcards</h1>
                  <p className="text-blue-100 mt-2">
                    {testMode === "today" ? "Today's" : "All"} words
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-white" />
                      <span className="font-medium text-white">
                        {currentWordIndex + 1} of {words.length}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => {
                      setShowExitDialog(true);
                    }}
                  >
                    Exit
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Flashcard Test Section Redesign */}
          <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
            {/* Progress */}
            <div className="mb-4 text-gray-500 text-sm font-medium">
              Card {currentWordIndex + 1} of {words.length}
            </div>
            {/* Flashcard */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "flashcard transition-all duration-300",
                  isFlipped && "flipped"
                )}
                style={{
                  width: '400px',
                  height: '260px',
                  maxWidth: '95vw',
                  boxShadow: '0 4px 24px 0 rgba(31,38,135,0.10)',
                  borderRadius: '1.5rem',
                  border: '1px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
                  cursor: 'pointer',
                  perspective: '1200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                tabIndex={0}
                aria-label={isFlipped ? "Show word" : "Show definition"}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front of card */}
                <div className="flashcard-face" style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  borderRadius: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '2rem 1.5rem',
                  background: 'white',
                  boxShadow: '0 2px 8px 0 rgba(31,38,135,0.06)',
                }}>
                  <span className="mb-2 text-xs text-blue-500 font-semibold tracking-wide uppercase">
                    {words[currentWordIndex]?.wordList?.name}
                  </span>
                  <h2 className="font-bold text-3xl text-gray-900 mb-2 text-center w-full min-w-0 custom-scrollbar"
                    style={{
                      wordBreak: 'break-word',
                      hyphens: 'auto',
                      lineHeight: '2.2rem',
                      minHeight: '2.5rem',
                      maxHeight: '90px',
                      overflowY: 'auto',
                    }}
                    title={words[currentWordIndex]?.word}
                  >
                    {words[currentWordIndex]?.word?.trim() ? words[currentWordIndex].word : <span className="text-gray-400">No word</span>}
                  </h2>
                  <span className="text-sm text-gray-400 mt-2">Click or press Space/Enter to flip</span>
                </div>
                {/* Back of card */}
                <div className="flashcard-face flashcard-back" style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  borderRadius: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '2rem 1.5rem',
                  background: '#f1f5f9',
                  boxShadow: '0 2px 8px 0 rgba(31,38,135,0.06)',
                  transform: 'rotateY(180deg)'
                }}>
                  <p className="text-2xl text-gray-700 text-center w-full min-w-0 custom-scrollbar"
                    style={{
                      wordBreak: 'break-word',
                      hyphens: 'auto',
                      lineHeight: '2.2rem',
                      minHeight: '2.5rem',
                      maxHeight: '90px',
                      overflowY: 'auto',
                    }}
                    title={words[currentWordIndex]?.definition}
                  >
                    {words[currentWordIndex]?.definition?.trim() ? words[currentWordIndex].definition : <span className="text-gray-400">No definition</span>}
                  </p>
                  <span className="text-sm text-gray-400 mt-2">Click or press Space/Enter to flip back</span>
                </div>
              </div>
              {/* Flip button for accessibility */}
              <button
                className="mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => setIsFlipped(f => !f)}
                tabIndex={0}
                aria-label="Flip card"
                style={{ minWidth: 120 }}
              >
                {isFlipped ? "Show Word" : "Show Definition"}
              </button>

              {/* Knew / Didn't Know buttons (only show when flipped) */}
              {isFlipped && !showFlashcardSummary && (
                <div className="flex justify-center gap-6 mt-6">
                  <Button
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-2 rounded-lg shadow"
                    onClick={() => {
                      setFlashcardResults(prev => [...prev, { id: words[currentWordIndex].id, knew: true }]);
                      if (currentWordIndex < words.length - 1) {
                        setIsFlipped(false);
                        setTimeout(() => {
                          setCurrentWordIndex(prev => prev + 1);
                        }, 300);
                      } else {
                        setShowConfetti(true);
                        setShowFlashcardSummary(true);
                      }
                    }}
                  >
                    Knew
                  </Button>
                  <Button
                    size="lg"
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-2 rounded-lg shadow"
                    onClick={() => {
                      setFlashcardResults(prev => [...prev, { id: words[currentWordIndex].id, knew: false }]);
                      if (currentWordIndex < words.length - 1) {
                        setIsFlipped(false);
                        setTimeout(() => {
                          setCurrentWordIndex(prev => prev + 1);
                        }, 300);
                      } else {
                        setShowConfetti(true);
                        setShowFlashcardSummary(true);
                      }
                    }}
                  >
                    Didn't Know
                  </Button>
                </div>
              )}
            </div>
            {/* Navigation */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (currentWordIndex > 0) {
                    setCurrentWordIndex(prev => prev - 1);
                    setIsFlipped(false);
                  }
                }}
                disabled={currentWordIndex === 0}
                className="flex items-center gap-2 px-6 py-2 text-base"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  if (currentWordIndex < words.length - 1) {
                    setCurrentWordIndex(prev => prev + 1);
                    setIsFlipped(false);
                  }
                }}
                disabled={currentWordIndex === words.length - 1}
                className="flex items-center gap-2 px-6 py-2 text-base"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <Dialog 
          open={showExitDialog} 
          onOpenChange={(open) => {
            if (!open) {
              setShowExitDialog(false);
              setPendingNavigation(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Exit Study Session?</DialogTitle>
              <DialogDescription>
                Are you sure you want to exit? Your progress will not be saved.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExitDialog(false);
                  setPendingNavigation(null);
                }}
                className="w-full sm:w-auto"
              >
                Continue Studying
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsTestStarted(false);
                  setShowExitDialog(false);
                  router.push('/dashboard/test');
                }}
                className="w-full sm:w-auto"
              >
                Exit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Flashcard summary after last card */}
        {showFlashcardSummary && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            {showConfetti && (
              <Confetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={false}
                numberOfPieces={500}
                gravity={0.2}
              />
            )}
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4">
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900">Session Complete! 🎉</h2>
                  <p className="text-gray-600">Great job completing your flashcard session!</p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {flashcardResults.filter(r => r.knew).length}
                    </div>
                    <div className="text-sm text-gray-600">Words Known</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600">
                      {flashcardResults.filter(r => !r.knew).length}
                    </div>
                    <div className="text-sm text-gray-600">Words to Review</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => {
                        window.location.reload();
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Start New Session
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsTestStarted(false);
                        setShowFlashcardSummary(false);
                        setShowConfetti(false);
                        router.push('/dashboard/test');
                      }}
                    >
                      Return to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 mb-8 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">Test Your Knowledge</h1>
              <p className="text-blue-100 dark:text-blue-200 mt-2">Challenge yourself with multiple choice questions or flashcards.</p>
            </div>
          </div>
        </div>
      </Card>

      {!isTestStarted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Test Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your test preferences</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Mode</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Button
                        variant={testMode === "all" ? "default" : "outline"}
                        onClick={() => setTestMode("all")}
                        className={cn(
                          "w-full",
                          testMode === "all" 
                            ? "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        )}
                      >
                        All Words
                      </Button>
                      <Button
                        variant={testMode === "today" ? "default" : "outline"}
                        onClick={() => setTestMode("today")}
                        className={cn(
                          "w-full",
                          testMode === "today" 
                            ? "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        )}
                      >
                        Today's Words
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Study Mode</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Button
                        variant={isMultipleChoice ? "default" : "outline"}
                        onClick={() => setStudyMode("multiple-choice" as StudyMode)}
                        className={cn(
                          "w-full",
                          isMultipleChoice 
                            ? "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        )}
                      >
                        Multiple Choice
                      </Button>
                      <Button
                        variant={isFlashcards ? "default" : "outline"}
                        onClick={() => setStudyMode("flashcards" as StudyMode)}
                        className={cn(
                          "w-full",
                          isFlashcards 
                            ? "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        )}
                      >
                        Flashcards
                      </Button>
                    </div>
                  </div>

                  {isMultipleChoice && (
                    <div>
                      <Label htmlFor="questionAmount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Number of Questions
                      </Label>
                      <Input
                        id="questionAmount"
                        type="number"
                        min="1"
                        max={allWords.length}
                        value={questionAmount}
                        onChange={handleQuestionAmountChange}
                        className="mt-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Available words: {allWords.length}
                      </p>
                    </div>
                  )}
                </div>

                {!hasWords && (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No words available for testing. Add some words first.
                    </AlertDescription>
                  </Alert>
                )}

                {isMultipleChoice && !hasEnoughWordsForMultipleChoice && (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need at least 4 words for multiple choice questions.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={startTest}
                  disabled={!hasWords || (isMultipleChoice && !hasEnoughWordsForMultipleChoice)}
                  className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Start Test
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Test Information</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Available Words</p>
                    <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                      {testMode === "today" ? todayWords.length : allWords.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Test Mode</p>
                    <p className="text-blue-900 dark:text-blue-100">
                      {testMode === "today" ? "Today's Words" : "All Words"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Study Mode</p>
                    <p className="text-blue-900 dark:text-blue-100">
                      {studyMode === "multiple-choice" ? "Multiple Choice" : "Flashcards"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 text-white">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium">About Testing</h3>
                </div>
                <p className="text-blue-50 text-sm leading-relaxed">
                  Testing yourself is one of the most effective ways to learn. Choose between multiple
                  choice questions or flashcards to test your knowledge. Multiple choice questions help
                  you distinguish between similar words, while flashcards are great for quick recall.
                </p>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 mb-6 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Testing Words</h1>
                  <p className="text-blue-100 dark:text-blue-200 mt-2">
                    {testMode === "today" ? "Today's" : "All"} words test in progress
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-white" />
                      <span className="font-medium text-white">{formatTime(elapsedTime)}</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-white" />
                      <span className="font-medium text-white">
                        {currentWordIndex + 1} of {words.length}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={handleExit}
                  >
                    Exit Test
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="p-4 sm:p-8">
              <div className="text-center space-y-6 sm:space-y-8">
                <div className="py-6 sm:py-8">
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    {words[currentWordIndex]?.word}
                  </h2>
                  {words[currentWordIndex]?.wordList && (
                    <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm">
                      {words[currentWordIndex].wordList.name}
                    </span>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Choose the correct definition</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
                  {options.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="lg"
                      className={cn(
                        "py-6 sm:py-8 text-base sm:text-lg transition-all duration-200 relative text-left sm:text-center",
                        showFeedback
                          ? option === lastAnswer?.correct
                            ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
                            : option === lastAnswer?.selected && !lastAnswer?.isCorrect
                            ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                            : "opacity-50"
                          : "hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800"
                      )}
                      onClick={() => !showFeedback && handleResponse(option)}
                      disabled={showFeedback}
                    >
                      {option}
                      {showFeedback && option === lastAnswer?.correct && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 absolute right-3" />
                      )}
                      {showFeedback && option === lastAnswer?.selected && !lastAnswer?.isCorrect && (
                        <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 absolute right-3" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Exit Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Exit Test?</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Your progress will be lost if you exit now. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExitDialog(false)}
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmExit}
              className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800"
            >
              Exit Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/*
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}
::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
}
*/ 