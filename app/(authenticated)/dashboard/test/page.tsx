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

interface TestHistoryResult {
  word: string;
  definition: string;
  isCorrect: boolean;
  timeSpent: number;
}

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
  const [testMode, setTestMode] = useState<"all" | "today">("all");
  const [studyMode, setStudyMode] = useState<"multiple-choice" | "flashcards">("multiple-choice");
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
      // Navigate to test history page
      router.push("/dashboard/test/history");
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

  if (showResults) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
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
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Word Test</h1>
                <p className="text-blue-100 mt-2">
                  Test your knowledge and track your progress
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 w-full sm:w-auto">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-white" />
                    <div>
                      <p className="text-sm text-blue-100">Available Words</p>
                      {isLoading ? (
                        <div className="h-8 flex items-center">
                          <p className="text-sm text-white/70">Loading...</p>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-white">{allWords.length}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-none shadow-sm">
              <div className="p-4 sm:p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Study Mode</label>
                    <Select 
                      value={studyMode} 
                      onValueChange={(value: "multiple-choice" | "flashcards") => setStudyMode(value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full bg-white border border-gray-200 h-11 px-3 rounded-lg text-sm">
                        <SelectValue placeholder="Select study mode" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-lg shadow-lg">
                        <SelectItem 
                          value="multiple-choice"
                          className="text-sm py-2.5 px-3 focus:bg-blue-50 focus:text-blue-600 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>Multiple Choice Test</span>
                          </div>
                        </SelectItem>
                        <SelectItem 
                          value="flashcards"
                          className="text-sm py-2.5 px-3 focus:bg-blue-50 focus:text-blue-600 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>Flashcards</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Test Mode</label>
                    <Select 
                      value={testMode} 
                      onValueChange={(value: "all" | "today") => setTestMode(value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full bg-white border border-gray-200 h-11 px-3 rounded-lg text-sm">
                        <SelectValue placeholder="Select test mode" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-lg shadow-lg">
                        <SelectItem 
                          value="today" 
                          disabled={isLoading || (studyMode === "multiple-choice" && !isTodayWordsLoading && todayWords.length < 4)}
                          className="text-sm py-2.5 px-3 focus:bg-blue-50 focus:text-blue-600 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              Today's Words 
                              {!isLoading && todayWords.length === 0 && " (No words added today)"}
                              {!isLoading && studyMode === "multiple-choice" && todayWords.length > 0 && todayWords.length < 4 && " (Need at least 4 cards)"}
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem 
                          value="all"
                          disabled={isLoading || (studyMode === "multiple-choice" && !isAllWordsLoading && allWords.length < 4)}
                          className="text-sm py-2.5 px-3 focus:bg-blue-50 focus:text-blue-600 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>
                              All Words
                              {!isLoading && studyMode === "multiple-choice" && allWords.length < 4 && " (Need at least 4 cards)"}
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {studyMode === "multiple-choice" && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Number of Questions {!isLoading && <span className="text-gray-500">({allWords.length} available)</span>}
                      </label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <Input
                          type="number"
                          min={1}
                          max={allWords.length}
                          value={questionAmount}
                          onChange={handleQuestionAmountChange}
                          onBlur={() => {
                            if (questionAmount < 1) {
                              setQuestionAmount(1);
                            }
                          }}
                          className="w-full sm:max-w-[200px]"
                          disabled={isLoading}
                        />
                        {isLoading ? (
                          <div className="h-8 flex items-center">
                            <p className="text-sm text-gray-500">Loading available words...</p>
                          </div>
                        ) : allWords.length > 0 ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                            <p>Questions will be randomly selected from your word collection</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                {!isLoading && testMode === "today" && todayWords.length === 0 && (
                  <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No words have been added today. Please add some words or select "All Words" mode.
                    </AlertDescription>
                  </Alert>
                )}

                {!isLoading && studyMode === "multiple-choice" && !hasEnoughWordsForMultipleChoice && (
                  <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need at least 4 cards to start a multiple choice test. Please add more cards to your collection.
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={startTest} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  disabled={
                    isLoading ||
                    !hasWords ||
                    (studyMode === "multiple-choice" && !hasEnoughWordsForMultipleChoice)
                  }
                >
                  <div className="flex items-center gap-2 justify-center">
                    {isLoading ? (
                      <span>Loading...</span>
                    ) : (
                      <>
                        {studyMode === "multiple-choice" ? (
                          <GraduationCap className="h-5 w-5" />
                        ) : (
                          <BookOpen className="h-5 w-5" />
                        )}
                        <span>Start {studyMode === "multiple-choice" ? "Test" : "Studying"}</span>
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="overflow-hidden border-none shadow-sm bg-blue-50/50">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-blue-900">About {studyMode === "multiple-choice" ? "Testing" : "Flashcards"}</h3>
                </div>
                <p className="text-sm text-blue-700 leading-relaxed">
                  {studyMode === "multiple-choice" ? (
                    "Test your knowledge of words through multiple-choice questions. Choose between testing today's words or your entire collection. Track your progress and see detailed results after completion."
                  ) : (
                    "Study your words using interactive flashcards. Click on a card to reveal its definition. This is a great way to quickly review your vocabulary without the pressure of being tested."
                  )}
                </p>
              </div>
            </Card>

            {testResults.length > 0 && studyMode === "multiple-choice" && (
              <Card className="overflow-hidden border-none shadow-sm">
                <div className="p-4 sm:p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Previous Results</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Correct Answers</span>
                      <span className="text-sm font-medium text-green-600">
                        {testResults.filter(r => r.isCorrect).length} / {testResults.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Average Time</span>
                      <span className="text-sm font-medium">
                        {formatTime(testResults.reduce((acc, curr) => acc + curr.timeSpent, 0) / testResults.length)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
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
                        setCurrentWordIndex(prev => prev + 1);
                        setIsFlipped(false);
                      } else {
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
                        setCurrentWordIndex(prev => prev + 1);
                        setIsFlipped(false);
                      } else {
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
          <div className="flex flex-col items-center justify-center mt-8">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 text-center shadow">
              <h2 className="text-2xl font-bold text-blue-700 mb-2">Session Complete!</h2>
              <p className="text-lg text-gray-700 mb-4">
                You knew <span className="font-bold text-green-600">{flashcardResults.filter(r => r.knew).length}</span> out of <span className="font-bold">{words.length}</span> words.
              </p>
              <div className="flex flex-col gap-2 mb-4">
                {words.map((word, idx) => (
                  <div key={word.id} className="flex items-center gap-2 justify-center">
                    <span className="font-medium text-gray-900">{word.word}</span>
                    {flashcardResults[idx]?.knew ? (
                      <span className="text-green-600">Knew</span>
                    ) : (
                      <span className="text-red-600">Didn't Know</span>
                    )}
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  setCurrentWordIndex(0);
                  setIsFlipped(false);
                  setFlashcardResults([]);
                  setShowFlashcardSummary(false);
                }}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded-lg shadow"
              >
                Restart Session
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Testing Words</h1>
                <p className="text-blue-100 mt-2">
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

        <Card className="overflow-hidden border-none shadow-sm">
          <div className="p-4 sm:p-8">
            <div className="text-center space-y-6 sm:space-y-8">
              <div className="py-6 sm:py-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{words[currentWordIndex]?.word}</h2>
                {words[currentWordIndex]?.wordList && (
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
                    {words[currentWordIndex].wordList.name}
                  </span>
                )}
                <p className="text-sm text-gray-500 mt-4">Choose the correct definition</p>
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
                          ? "bg-green-50 border-green-200 text-green-600"
                          : option === lastAnswer?.selected && !lastAnswer?.isCorrect
                          ? "bg-red-50 border-red-200 text-red-600"
                          : "opacity-50"
                        : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    )}
                    onClick={() => !showFeedback && handleResponse(option)}
                    disabled={showFeedback}
                  >
                    {option}
                    {showFeedback && option === lastAnswer?.correct && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 absolute right-3" />
                    )}
                    {showFeedback && option === lastAnswer?.selected && !lastAnswer?.isCorrect && (
                      <XCircle className="h-5 w-5 text-red-500 absolute right-3" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>
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
    </>
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