"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { useApi } from "@/hooks/useApi";
import { Loader2, Plus, X, Edit2, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewSettingsSkeleton } from "@/components/review/ReviewSkeletons";
import { useReviewScheduleQuery } from "@/hooks/useReview";

interface ReviewSchedule {
  id: string;
  name: string;
  description: string | null;
  intervals: number[];
  isDefault: boolean;
}

export default function ReviewSettingsPage() {
  // 1. All state hooks first
  const [isEditing, setIsEditing] = useState(false);
  const [newInterval, setNewInterval] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  
  // 2. All other hooks
  const queryClient = useQueryClient();
  const api = useApi();
  const { data: schedule, isLoading, error } = useReviewScheduleQuery();

  // 3. Update review schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async (data: {
      intervals: number[];
      name: string;
      description: string;
    }) => {
      console.log('Mutation data:', data);
      const response = await api.post<ReviewSchedule>("/review-schedule", data);
      console.log('Mutation response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('Mutation success:', data);
      toast.success("Review schedule updated successfully");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["review-schedule"] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error("Failed to update review schedule");
    },
  });

  // 4. Effects
  useEffect(() => {
    if (schedule) {
      setName(schedule.name);
      setDescription(schedule.description || "");
    }
  }, [schedule]);

  // 5. Event handlers
  const handleAddInterval = () => {
    const interval = parseInt(newInterval);
    if (isNaN(interval) || interval <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }
    
    const newIntervals = [...(schedule?.intervals || [])];
    if (!newIntervals.includes(interval)) {
      newIntervals.push(interval);
      newIntervals.sort((a, b) => a - b);
      updateScheduleMutation.mutate({
        intervals: newIntervals,
        name,
        description,
      });
      setNewInterval("");
    } else {
      toast.error("This interval already exists");
    }
  };

  const handleRemoveInterval = (interval: number) => {
    if (!schedule) return;
    
    const newIntervals = schedule.intervals.filter((i) => i !== interval);
    if (newIntervals.length === 0) {
      toast.error("You must have at least one review interval");
      return;
    }

    console.log('Removing interval:', interval);
    console.log('New intervals:', newIntervals);
    console.log('Current schedule:', schedule);

    updateScheduleMutation.mutate({
      intervals: newIntervals,
      name: schedule.name,
      description: schedule.description || "",
    });
  };

  const handleUpdateSchedule = () => {
    if (!name.trim()) {
      toast.error("Schedule name is required");
      return;
    }
    updateScheduleMutation.mutate({
      intervals: schedule?.intervals || [],
      name,
      description,
    });
  };

  // 6. Loading and error states
  if (isLoading) {
    return <ReviewSettingsSkeleton />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // 7. Main render
  return (
    <div className="space-y-8">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 mb-8 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">Review Schedule Settings</h1>
              <p className="text-blue-100 dark:text-blue-200 mt-2">Track your learning progress over time.</p>
            </div>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur-sm w-full sm:w-auto"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Schedule</span>
              </Button>
            ) : (
              <Button
                onClick={handleUpdateSchedule}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur-sm w-full sm:w-auto"
                disabled={updateScheduleMutation.isPending}
              >
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="p-4 sm:p-6 space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Schedule Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., My Custom Schedule"
                    className="mt-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <p className="mt-2 text-gray-900 dark:text-gray-100 font-medium">{name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for your review schedule..."
                    className="mt-2 min-h-[100px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <p className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">{description || "No description provided"}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Review Intervals</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {schedule?.intervals.map((interval) => (
                    <div
                      key={interval}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                        isEditing 
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800" 
                          : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700"
                      )}
                    >
                      <span className="font-medium">{interval} days</span>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveInterval(interval)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors hover:bg-blue-100/50 dark:hover:bg-blue-900/50 rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Input
                      type="number"
                      min="1"
                      value={newInterval}
                      onChange={(e) => setNewInterval(e.target.value)}
                      placeholder="Add new interval (in days)"
                      className="w-full sm:max-w-[200px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                    <Button
                      onClick={handleAddInterval}
                      disabled={updateScheduleMutation.isPending}
                      className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4" />
                      Add Interval
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Current Schedule</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total Intervals</p>
                  <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">{schedule?.intervals.length}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Longest Interval</p>
                  <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                    {Math.max(...(schedule?.intervals || [0]))} days
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-medium">About Review Intervals</h3>
              </div>
              <p className="text-blue-50 text-sm leading-relaxed">
                Review intervals determine when you'll review your cards again. For example, if you set
                intervals of 1, 7, and 30 days, you'll review cards one day after learning them, then
                a week later, and finally a month later. Choose intervals that work best for your
                learning style and schedule.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 