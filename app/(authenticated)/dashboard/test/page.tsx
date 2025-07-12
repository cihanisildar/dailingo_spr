"use client";

import { useRouter, usePathname } from "next/navigation";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useLayoutEffect, useState, useEffect, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import { useTest } from "@/hooks/useTest";
import {
  Shuffle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  GraduationCap,
  BookOpen,
  HelpCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Brain,
  Clock,
  ArrowLeft,
  Book,
  Sparkles
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Confetti from 'react-confetti';
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
  // Remove all state and logic related to in-page test session
  // Only keep configuration state and UI
  const [testMode, setTestMode] = useState<TestMode>("all");
  const [studyMode, setStudyMode] = useState<StudyMode>("multiple-choice");
  const [questionAmount, setQuestionAmount] = useState<number>(10); // Default to 10

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
      const newQuestionAmount = Math.min(10, validWords.length);
      setQuestionAmount(newQuestionAmount);
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

  // Only render the configuration and Start Test button
  return (
    <div className="min-h-screen dark:from-slate-900 dark:via-slate-900 dark:to-blue-900/30">
      <div className="space-y-8">
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
                  onClick={() => {
                    router.push(`/dashboard/test/session?mode=${testMode}&study=${studyMode}&count=${questionAmount}`);
                  }}
                  disabled={!hasWords}
                  className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <GraduationCap className="w-6 h-6 mr-2" />
                  Start Test ({questionAmount} questions)
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
