"use client";

import { Card } from '@/components/ui/card';
import { CustomCalendar } from '@/components/ui/custom-calendar';
import api from '@/lib/axios';
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
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

  return useQuery({
    queryKey: ['calendar-data', startOfMonth, endOfMonth],
    queryFn: async () => {
      const { data } = await api.get<WordCard[]>('/cards', {
        params: {
          createdAfter: startOfMonth.toISOString(),
          createdBefore: endOfMonth.toISOString(),
        },
      });
      
      // Group cards by creation date
      const cardsByDate = data.reduce((acc: Record<string, WordCard[]>, card) => {
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
    <div className="space-y-6">
      <div className="bg-blue-600 rounded-3xl p-6 animate-pulse">
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
      
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="flex gap-2">
              <div className="h-7 w-7 bg-gray-200 rounded-full" />
              <div className="h-7 w-7 bg-gray-200 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="aspect-square p-2">
                <div className="h-full bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
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
        <div className="text-[10px] font-medium text-green-600">
          {count}
        </div>
      </div>
    );
  };

  const totalWords = Object.values(cardsPerDay).reduce((sum, cards) => sum + (cards as WordCard[]).length, 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-blue-600 rounded-3xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Learning Calendar</h1>
            <p className="text-blue-100">Track your daily word learning progress</p>
          </div>
          
          <div className="mt-6 md:mt-0 flex items-center gap-2 md:bg-white/10 md:backdrop-blur-sm md:rounded-xl md:px-6 md:py-3">
            <CalendarIcon className="h-5 w-5 text-white/80" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold">{totalWords}</span>
              <span className="text-sm text-white/80">Total Words</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <Card className="p-4 md:p-6 shadow-sm">
          <CustomCalendar
            selectedDate={date}
            onSelect={setDate}
            renderDay={renderDay}
            hasWords={hasWords}
            className="min-h-[400px] md:min-h-0"
          />
        </Card>

        {/* Details Panel - Hidden on Mobile */}
        <Card className="hidden md:block p-6 bg-gray-50/50">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {format(date, 'MMMM d, yyyy')}
              </h3>
              <p className="text-sm text-gray-500">
                {getWordCount(date) === 0 
                  ? "No words added on this day" 
                  : `${getWordCount(date)} words added`}
              </p>
            </div>

            {getWordCount(date) > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Words added:</h4>
                <div className="space-y-1">
                  {cardsPerDay[format(date, 'yyyy-MM-dd')]?.map((card: WordCard) => (
                    <div key={card.id} className="text-sm text-gray-600 bg-white p-2 rounded-lg shadow-sm">
                      {card.word}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 