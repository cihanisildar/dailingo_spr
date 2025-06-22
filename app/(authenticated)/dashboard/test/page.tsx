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
import { useApi } from "@/hooks/useApi";
import { useTest } from "@/hooks/useTest";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpen, CheckCircle2, Clock, GraduationCap, HelpCircle, Shuffle, TrendingUp, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { toast } from "react-hot-toast";
import Confetti from 'react-confetti';
import { Label } from "@/components/ui/label";
import { TestSkeleton, TestInProgressSkeleton } from "@/components/review/ReviewSkeletons";

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
  cardId: string;
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
  const api = useApi();
  const { startTest: startTestSession, submitTestResults } = useTest();
  const [testMode, setTestMode] = useState<TestMode>("all");
  const [studyMode, setStudyMode] = useState<StudyMode>("multiple-choice");
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [cardStartTime, setCardStartTime] = useState<number>(0);
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
  
  // Test session management
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

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

  // Fetch today's words
  const { data: todayWords = [], isLoading: isTodayWordsLoading } = useQuery<Word[]>({
    queryKey: ["words", "today"],
    queryFn: async () => {
      return api.get("/cards/today");
    },
  });

  // Fetch all words
  const { data: allWords = [], isLoading: isAllWordsLoading } = useQuery<Word[]>({
    queryKey: ["words"],
    queryFn: async () => {
      return api.get("/cards");
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

  // Auto-switch to "All Words" mode if "Today's Words" is selected but no words are available
  useEffect(() => {
    if (testMode === "today" && (todayWords?.length || 0) === 0 && (allWords?.length || 0) > 0) {
      setTestMode("all");
      toast("Switched to 'All Words' mode as no words are scheduled for today", {
        icon: "ℹ️",
      });
    }
  }, [testMode, todayWords, allWords]);

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
    ? (todayWords?.length || 0) >= 4 
    : (allWords?.length || 0) >= 4;

  // Check if we have any words available
  const hasWords = testMode === "today" ? (todayWords?.length || 0) > 0 : (allWords?.length || 0) > 0;

  // Mutation for starting test session
  const createTestSession = useMutation({
    mutationFn: async (data: { cardIds: string[], mode: 'word' | 'definition' }) => {
      const response = await startTestSession(data);
      if (!response?.sessionId) {
        throw new Error('Invalid response from server: missing session ID');
      }
      return response;
    },
    onError: (error) => {
      console.error('Error creating test session:', error);
      toast.error('Failed to create test session. Please try again.');
    }
  });

  // Mutation for submitting test session results
  const submitTestSessionResults = useMutation({
    mutationFn: async ({ sessionId, result }: { sessionId: string, result: TestResult }) => {
      if (!sessionId) {
        throw new Error('No session ID available');
      }
      return await submitTestResults(sessionId, result);
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

  const handleResponse = async (selectedAnswer: string) => {
    if (showFeedback) return; // Prevent multiple submissions

    const timeSpent = Date.now() - startTime;
    const isCorrect = selectedAnswer === words[currentWordIndex].definition;
    const result = {
      cardId: words[currentWordIndex].id,
      isCorrect,
      timeSpent,
    };

    try {
      // Update all related states together
      setShowFeedback(true);
      setElapsedTime(timeSpent);
      setLastAnswer({
        selected: selectedAnswer,
        correct: words[currentWordIndex].definition,
        isCorrect
      });
      
      // Submit the individual result immediately
      if (currentSessionId) {
        await submitTestSessionResults.mutateAsync({
          sessionId: currentSessionId,
          result
        });
      }
      
      // Update test results locally
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
          // Test is complete, show results
          setShowResults(true);
        }
      }, 1500);

    } catch (error) {
      console.error('Error handling response:', error);
      toast.error('Failed to submit answer. Please try again.');
    }
  };

  const resetTest = () => {
    setShowResults(false);
    setTestResults([]);
    setCurrentWordIndex(0);
    setLastAnswer(null);
    setShowConfetti(false);
    setCurrentSessionId(null);
    setFlashcardResults([]);
    setShowFlashcardSummary(false);
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
    setCurrentSessionId(null);
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

      // Create test session first
      const cardIds = selectedWords.map(word => word.id);
      const mode = studyMode === "multiple-choice" ? "definition" : "word";
      
      console.log('Creating test session with:', { cardIds, mode });
      const sessionResponse = await createTestSession.mutateAsync({
        cardIds,
        mode
      });
      console.log('Session response:', sessionResponse);

      if (!sessionResponse) {
        throw new Error('No response received from server');
      }

      console.log('Session ID from response:', sessionResponse.sessionId);
      
      if (!sessionResponse.sessionId) {
        throw new Error('No session ID received from server');
      }

      // Store the session ID - response is already unwrapped
      setCurrentSessionId(sessionResponse.sessionId);

      setWords(selectedWords);
      setIsTestStarted(true);
      setCurrentWordIndex(0);
      setTestResults([]);
      setStartTime(Date.now());
      setCardStartTime(Date.now());
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

  // Add useEffect to update cardStartTime
  useEffect(() => {
    setCardStartTime(Date.now());
  }, [currentWordIndex]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-900/30 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-gray-800/80 dark:to-blue-900/30 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 dark:from-blue-600/20 dark:via-indigo-600/10 dark:to-purple-600/20" />
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Left side - Title and description */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-2xl shadow-lg">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                        Test Your Knowledge
                      </h1>
                      <p className="text-slate-600 dark:text-slate-400 text-lg mt-1">
                        Challenge yourself with interactive vocabulary tests
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side - Quick stats */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:gap-3">
                  <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-gray-700/20">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Available Words</p>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">{allWords?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Configuration Card */}
          <Card className="p-6 sm:p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-0 shadow-xl rounded-3xl">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Test Configuration</h2>
                <p className="text-slate-600 dark:text-slate-400">Customize your test experience</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Test Mode Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Test Mode
                  </Label>
                  <Select value={testMode} onValueChange={(value: TestMode) => setTestMode(value)}>
                    <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                      <SelectItem value="all" className="text-slate-900 dark:text-slate-100">All Words ({allWords?.length || 0})</SelectItem>
                      <SelectItem value="today" className="text-slate-900 dark:text-slate-100">Today's Words ({todayWords?.length || 0})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Study Mode Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Study Mode
                  </Label>
                  <Select value={studyMode} onValueChange={(value: StudyMode) => setStudyMode(value)}>
                    <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                      <SelectItem 
                        value="multiple-choice" 
                        disabled={!hasEnoughWordsForMultipleChoice}
                        className="text-slate-900 dark:text-slate-100"
                      >
                        Multiple Choice {!hasEnoughWordsForMultipleChoice && "(Need 4+ words)"}
                      </SelectItem>
                      <SelectItem value="flashcards" className="text-slate-900 dark:text-slate-100">Flashcards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Question Amount */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Shuffle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Questions ({questionAmount})
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max={allWords?.length || 1}
                    value={questionAmount}
                    onChange={handleQuestionAmountChange}
                    className="h-12 bg-white/80 dark:bg-gray-800/80 border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Warning Messages */}
              {!hasWords && (
                <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-300">
                    No words available for testing. Please add some vocabulary cards first.
                  </AlertDescription>
                </Alert>
              )}

              {!hasEnoughWordsForMultipleChoice && studyMode === "multiple-choice" && (
                <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    Multiple choice mode requires at least 4 words. Switching to flashcards mode or add more words.
                  </AlertDescription>
                </Alert>
              )}

              {/* Start Test Button */}
              {hasWords && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={startTest}
                    disabled={createTestSession.isPending || !hasWords}
                    className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    {createTestSession.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Starting Test...
                      </div>
                    ) : (
                      <>
                        <GraduationCap className="w-6 h-6 mr-2" />
                        Start Test ({questionAmount} questions)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
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
                  <p className="text-blue-100 text-lg">
                    {testMode === "today" ? "Today's" : "All"} words study session
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
          </div>

                      {/* Flashcard Test Section Redesign */}
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
              {/* Progress */}
              <div className="mb-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                    Card {currentWordIndex + 1} of {words.length}
                  </span>
                  <div className="ml-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-24">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentWordIndex + 1) / words.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
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
                    onClick={async () => {
                      const timeSpent = Date.now() - cardStartTime;
                      const result = {
                        cardId: words[currentWordIndex].id,
                        isCorrect: true,
                        timeSpent
                      };

                      try {
                        // Submit the individual result immediately
                        if (currentSessionId) {
                          await submitTestSessionResults.mutateAsync({
                            sessionId: currentSessionId,
                            result
                          });
                        } else {
                          throw new Error('No session ID available');
                        }
                        
                        // Update local state
                        setFlashcardResults(prev => [...prev, { id: words[currentWordIndex].id, knew: true }]);
                        
                        if (currentWordIndex < words.length - 1) {
                          setIsFlipped(false);
                          setTimeout(() => {
                            setCurrentWordIndex(prev => prev + 1);
                          }, 300);
                        } else {
                          // Test is complete, show summary
                          setShowConfetti(true);
                          setShowFlashcardSummary(true);
                        }
                      } catch (error) {
                        console.error('Error submitting flashcard result:', error);
                        toast.error('Failed to save result. Please try again.');
                      }
                    }}
                  >
                    Knew it
                  </Button>
                  <Button
                    size="lg"
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-2 rounded-lg shadow"
                    onClick={async () => {
                      const timeSpent = Date.now() - cardStartTime;
                      const result = {
                        cardId: words[currentWordIndex].id,
                        isCorrect: false,
                        timeSpent
                      };

                      try {
                        // Submit the individual result immediately
                        if (currentSessionId) {
                          await submitTestSessionResults.mutateAsync({
                            sessionId: currentSessionId,
                            result
                          });
                        } else {
                          throw new Error('No session ID available');
                        }
                        
                        // Update local state
                        setFlashcardResults(prev => [...prev, { id: words[currentWordIndex].id, knew: false }]);
                        
                        if (currentWordIndex < words.length - 1) {
                          setIsFlipped(false);
                          setTimeout(() => {
                            setCurrentWordIndex(prev => prev + 1);
                          }, 300);
                        } else {
                          // Test is complete, show summary
                          setShowConfetti(true);
                          setShowFlashcardSummary(true);
                        }
                      } catch (error) {
                        console.error('Error submitting flashcard result:', error);
                        toast.error('Failed to save result. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-900/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-gray-800/80 dark:to-blue-900/30 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 dark:from-blue-600/20 dark:via-indigo-600/10 dark:to-purple-600/20" />
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left side - Title and description */}
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-2xl shadow-lg">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                      Test Your Knowledge
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg mt-1">
                      Challenge yourself with interactive vocabulary tests
                    </p>
                  </div>
                </div>
              </div>

              {/* Right side - Quick stats */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:gap-3">
                <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-gray-700/20">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Available Words</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">{allWords?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Configuration Card */}
        <Card className="p-6 sm:p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-0 shadow-xl rounded-3xl">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Test Configuration</h2>
              <p className="text-slate-600 dark:text-slate-400">Customize your test experience</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Test Mode Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Test Mode
                </Label>
                <Select value={testMode} onValueChange={(value: TestMode) => setTestMode(value)}>
                  <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                    <SelectItem value="all" className="text-slate-900 dark:text-slate-100">All Words ({allWords?.length || 0})</SelectItem>
                    <SelectItem value="today" className="text-slate-900 dark:text-slate-100">Today's Words ({todayWords?.length || 0})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Study Mode Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Study Mode
                </Label>
                <Select value={studyMode} onValueChange={(value: StudyMode) => setStudyMode(value)}>
                  <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                    <SelectItem 
                      value="multiple-choice" 
                      disabled={!hasEnoughWordsForMultipleChoice}
                      className="text-slate-900 dark:text-slate-100"
                    >
                      Multiple Choice {!hasEnoughWordsForMultipleChoice && "(Need 4+ words)"}
                    </SelectItem>
                    <SelectItem value="flashcards" className="text-slate-900 dark:text-slate-100">Flashcards</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Amount */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Questions ({questionAmount})
                </Label>
                <Input
                  type="number"
                  min="1"
                  max={allWords?.length || 1}
                  value={questionAmount}
                  onChange={handleQuestionAmountChange}
                  className="h-12 bg-white/80 dark:bg-gray-800/80 border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Warning Messages */}
            {!hasWords && (
              <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-300">
                  No words available for testing. Please add some vocabulary cards first.
                </AlertDescription>
              </Alert>
            )}

            {!hasEnoughWordsForMultipleChoice && studyMode === "multiple-choice" && (
              <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-300">
                  Multiple choice mode requires at least 4 words. Switching to flashcards mode or add more words.
                </AlertDescription>
              </Alert>
            )}

            {/* Start Test Button */}
            {hasWords && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={startTest}
                  disabled={createTestSession.isPending || !hasWords}
                  className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  {createTestSession.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Starting Test...
                    </div>
                  ) : (
                    <>
                      <GraduationCap className="w-6 h-6 mr-2" />
                      Start Test ({questionAmount} questions)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
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