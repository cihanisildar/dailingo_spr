"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { Loader2, Plus, X, Edit2, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewSettingsSkeleton } from "@/components/review/ReviewSkeletons";

interface ReviewSchedule {
  id: string;
  name: string;
  description: string | null;
  intervals: number[];
  isDefault: boolean;
}

export default function ReviewSettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [newInterval, setNewInterval] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch current review schedule
  const { data: schedule, isLoading } = useQuery<ReviewSchedule>({
    queryKey: ["review-schedule"],
    queryFn: async () => {
      const { data } = await api.get("/review-schedule");
      setName(data.name);
      setDescription(data.description || "");
      return data;
    },
  });

  // Update review schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async (data: {
      intervals: number[];
      name: string;
      description: string;
    }) => {
      const response = await api.post("/review-schedule", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Review schedule updated successfully");
      setIsEditing(false); // Exit edit mode on success
      queryClient.invalidateQueries({ queryKey: ["review-schedule"] });
    },
    onError: () => {
      toast.error("Failed to update review schedule");
    },
  });

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
    const newIntervals = schedule?.intervals.filter((i) => i !== interval) || [];
    if (newIntervals.length === 0) {
      toast.error("You must have at least one review interval");
      return;
    }
    updateScheduleMutation.mutate({
      intervals: newIntervals,
      name,
      description,
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

  if (isLoading) {
    return <ReviewSettingsSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 mb-8 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">Review Schedule Settings</h1>
              <p className="text-blue-100 mt-2">Track your learning progress over time.</p>
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
          <Card className="overflow-hidden">
            <div className="p-4 sm:p-6 space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Schedule Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., My Custom Schedule"
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-gray-900 font-medium">{name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for your review schedule..."
                    className="mt-2 min-h-[100px]"
                  />
                ) : (
                  <p className="mt-2 text-gray-700 leading-relaxed">{description || "No description provided"}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Review Intervals</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {schedule?.intervals.map((interval) => (
                    <div
                      key={interval}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                        isEditing 
                          ? "bg-blue-50 text-blue-700 border border-blue-100" 
                          : "bg-gray-50 text-gray-700 border border-gray-100"
                      )}
                    >
                      <span className="font-medium">{interval} days</span>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveInterval(interval)}
                          className="text-blue-600 hover:text-blue-800 transition-colors hover:bg-blue-100/50 rounded-full p-1"
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
                      className="w-full sm:max-w-[200px]"
                    />
                    <Button
                      onClick={handleAddInterval}
                      disabled={updateScheduleMutation.isPending}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
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
          <Card className="bg-blue-50 border-blue-100">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-medium text-blue-900">Current Schedule</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Intervals</p>
                  <p className="text-2xl font-semibold text-blue-900">{schedule?.intervals.length}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">Longest Interval</p>
                  <p className="text-2xl font-semibold text-blue-900">
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