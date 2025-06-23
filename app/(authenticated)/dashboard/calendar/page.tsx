"use client";

import { Card } from '@/components/ui/card';
import { CustomCalendar } from '@/components/ui/custom-calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApi } from '@/hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';

interface WordCard {
  id: string;
  word: string;
  definition: string;
  createdAt: string;
}

// Custom hook to fetch calendar data
const useCalendarData = (selectedDate: Date) => {
  const api = useApi();
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

  return useQuery({
    queryKey: ['calendar-data', startOfMonth, endOfMonth],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        createdAfter: startOfMonth.toISOString(),
        createdBefore: endOfMonth.toISOString(),
      });
      
      const data = await api.get<WordCard[]>(`/cards?${queryParams.toString()}`);
      
      // Group cards by creation date
      const cardsByDate = data.reduce((acc: Record<string, WordCard[]>, card: WordCard) => {
        const date = format(new Date(card.createdAt), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(card);
        return acc;
      }, {});

      return { cardsByDate };
    },
  });
};

// Loading skeleton component
function CalendarSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-900/30">
      <div className="space-y-6">
        <div className="bg-blue-600 dark:bg-blue-800 rounded-3xl p-6 animate-pulse">
          <div className="h-8 w-64 bg-white/20 rounded-lg mb-2" />
          <div className="h-6 w-48 bg-white/20 rounded-lg mb-4" />
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 w-fit">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 bg-white/20 rounded" />
              <div>
                <div className="h-4 w-20 bg-white/20 rounded mb-1" />
                <div className="h-8 w-16 bg-white/20 rounded" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-[1fr_300px] gap-6">
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="flex gap-2">
                  <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-px">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="aspect-square p-2">
                    <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="hidden md:block p-6 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const { data, isLoading } = useCalendarData(date);

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  // Process the data to get words per day
  const cardsPerDay = data?.cardsByDate || {};

  // Function to get the number of words for a specific day
  const getWordCount = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return cardsPerDay[dateKey]?.length || 0;
  };

  // Function to check if a day has words
  const hasWords = (day: Date) => {
    return getWordCount(day) > 0;
  };

  // Function to render day content
  const renderDay = (day: Date) => {
    const count = getWordCount(day);
    if (count === 0) return null;

    return (
      <div className="absolute bottom-1 right-1">
        <div className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1 rounded">
          {count}
        </div>
      </div>
    );
  };

  const totalWords = Object.values(cardsPerDay).reduce((sum: number, cards) => sum + (cards as WordCard[]).length, 0);

  // Handle day selection to open dialog
  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate);
    setSelectedDayDate(selectedDate);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-900/30">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold">Learning Calendar</h1>
              <p className="text-blue-100 dark:text-blue-200">Track your daily word learning progress</p>
            </div>
            
            <div className="mt-6 md:mt-0 flex items-center gap-2 md:bg-white/10 dark:md:bg-white/5 md:backdrop-blur-sm md:rounded-xl md:px-6 md:py-3">
              <CalendarIcon className="h-5 w-5 text-white/80" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold">{totalWords}</span>
                <span className="text-sm text-white/80">Total Words</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="w-full">
          <Card className="p-6 shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CustomCalendar
              selectedDate={date}
              onSelect={handleDateSelect}
              renderDay={renderDay}
              hasWords={hasWords}
              className="min-h-[400px] md:min-h-0"
            />
          </Card>
        </div>
      </div>

      {/* Words Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDayDate ? format(selectedDayDate, 'MMMM d, yyyy') : 'Words'}
            </DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedDayDate && getWordCount(selectedDayDate) === 0 
                ? "No words added on this day" 
                : `${selectedDayDate ? getWordCount(selectedDayDate) : 0} words added`}
            </p>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {selectedDayDate && getWordCount(selectedDayDate) > 0 ? (
              cardsPerDay[format(selectedDayDate, 'yyyy-MM-dd')]?.map((card: WordCard) => (
                <div key={card.id} className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{card.word}</div>
                  <div className="text-gray-600 dark:text-gray-300">{card.definition}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No vocabulary added on this day
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 