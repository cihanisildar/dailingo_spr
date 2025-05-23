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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpen, CheckCircle2, Clock, HelpCircle, Shuffle, TrendingUp, XCircle, GraduationCap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";

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

export default function TestPage() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [testMode, setTestMode] = useState<"all" | "today">("all");
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [questionAmount, setQuestionAmount] = useState<number>(0);
  const [options, setOptions] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ selected: string; correct: string; isCorrect: boolean } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Fetch today's words to check if any exist
  const { data: todayWords = [] } = useQuery<Word[]>({
    queryKey: ["test-words", "today"],
    queryFn: async () => {
      const response = await api.get(`/words/today`);
      return response.data;
    },
  });

  // Fetch words based on test mode
  const { data: allWords = [], refetch } = useQuery<Word[]>({
    queryKey: ["test-words", testMode],
    queryFn: async () => {
      const response = await api.get(`/words/${testMode}`);
      return response.data;
    },
  });

  // Update question amount when allWords changes
  useEffect(() => {
    if (allWords.length > 0) {
      setQuestionAmount(Math.min(10, allWords.length)); // Default to 10 or max available
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

  // Selected words for the test
  const [words, setWords] = useState<Word[]>([]);

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
      
      if (!allWords || allWords.length === 0) {
        toast.error('No words available for testing');
        return;
      }

      if (testMode === "all" && allWords.length < 4) {
        toast.error('You need at least 4 cards to start a test');
        return;
      }

      // Randomly select questionAmount number of words
      const selectedWords = [...allWords]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(questionAmount, allWords.length));
      
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
      
      if (selectedWords.length > 0) {
        generateOptions(selectedWords[0].definition, allWords);
      }
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error('Failed to start test. Please try again.');
    }
  };

  const handleResponse = async (selectedAnswer: string) => {
    if (showFeedback) return; // Prevent multiple submissions

    // Stop the timer immediately
    setShowFeedback(true); // This will stop the timer due to our useEffect dependency
    const timeSpent = Date.now() - startTime;
    setElapsedTime(timeSpent); // Set final time for this question
    
    const isCorrect = selectedAnswer === words[currentWordIndex].definition;
    const result = {
      wordId: words[currentWordIndex].id,
      isCorrect,
      timeSpent,
    };

    try {
      // First submit the individual result
      await submitResult.mutateAsync(result);
      
      // Then update the local state
      setTestResults(prev => [...prev, result]);
      
      // Show feedback
      setLastAnswer({
        selected: selectedAnswer,
        correct: words[currentWordIndex].definition,
        isCorrect
      });

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
                      <p className="text-2xl font-bold text-white">{allWords.length}</p>
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
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Test Mode</label>
                    <Select 
                      value={testMode} 
                      onValueChange={(value: "all" | "today") => setTestMode(value)}
                    >
                      <SelectTrigger className="w-full bg-white border border-gray-200 h-11 px-3 rounded-lg text-sm">
                        <SelectValue placeholder="Select test mode" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-lg shadow-lg">
                        <SelectItem 
                          value="today" 
                          disabled={todayWords.length === 0}
                          className="text-sm py-2.5 px-3 focus:bg-blue-50 focus:text-blue-600 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Today's Words {todayWords.length === 0 && "(No words added today)"}</span>
                          </div>
                        </SelectItem>
                        <SelectItem 
                          value="all"
                          disabled={allWords.length < 4}
                          className="text-sm py-2.5 px-3 focus:bg-blue-50 focus:text-blue-600 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>All Words {allWords.length < 4 && "(Need at least 4 cards)"}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Number of Questions <span className="text-gray-500">({allWords.length} available)</span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Input
                        type="number"
                        min={1}
                        max={allWords.length}
                        value={questionAmount}
                        onChange={handleQuestionAmountChange}
                        onBlur={() => {
                          // Ensure there's at least 1 question selected
                          if (questionAmount < 1) {
                            setQuestionAmount(1);
                          }
                        }}
                        className="w-full sm:max-w-[200px]"
                      />
                      {allWords.length > 0 ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                          <p>Questions will be randomly selected from your word collection</p>
                        </div>
                      ) : (
                        <div className="h-8 flex items-center">
                          <p className="text-sm text-gray-500">Loading available words...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {todayWords.length === 0 && testMode === "today" && (
                  <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No words have been added today. Please add some words or select "All Words" mode.
                    </AlertDescription>
                  </Alert>
                )}

                {allWords.length < 4 && (
                  <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need at least 4 cards to start a test. Please add more cards to your collection.
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={startTest} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  disabled={
                    (testMode === "today" && todayWords.length === 0) ||
                    (testMode === "all" && allWords.length < 4)
                  }
                >
                  <div className="flex items-center gap-2 justify-center">
                    <GraduationCap className="h-5 w-5" />
                    <span>Start Test</span>
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
                  <h3 className="font-medium text-blue-900">About Testing</h3>
                </div>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Test your knowledge of words through multiple-choice questions. 
                  Choose between testing today's words or your entire collection. 
                  Track your progress and see detailed results after completion.
                </p>
              </div>
            </Card>

            {testResults.length > 0 && (
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
            <DialogTitle>Exit Test?</DialogTitle>
            <DialogDescription>
              Are you sure you want to exit the test? Your progress will not be saved, and this test session will not be counted in your history.
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
              Continue Test
            </Button>
            <Button
              variant="destructive"
              onClick={confirmExit}
              className="w-full sm:w-auto"
            >
              Exit Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 