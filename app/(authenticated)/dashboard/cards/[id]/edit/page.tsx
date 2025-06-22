"use client";

import { useParams, useRouter } from "next/navigation";
import { useCard, useUpdateCard } from "@/hooks/useCards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";

const EditCardPage = () => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: card, isLoading } = useCard(params.id as string);
  const updateCardMutation = useUpdateCard();

  const [formData, setFormData] = useState({
    word: "",
    definition: "",
    synonyms: [""],
    antonyms: [""],
    examples: [""],
    notes: "",
  });

  useEffect(() => {
    if (card) {
      setFormData({
        word: card.word,
        definition: card.definition,
        synonyms: card.wordDetails?.synonyms?.length ? card.wordDetails.synonyms : [""],
        antonyms: card.wordDetails?.antonyms?.length ? card.wordDetails.antonyms : [""],
        examples: card.wordDetails?.examples?.length ? card.wordDetails.examples : [""],
        notes: card.wordDetails?.notes || "",
      });
    }
  }, [card]);

  if (isLoading) {
    return <div className="text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Card not found</h2>
        <Link href="/dashboard/cards">
          <Button variant="outline" className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
            <ArrowLeft className="w-4 h-4" />
            Back to Cards
          </Button>
        </Link>
      </div>
    );
  }

  const handleArrayChange = (
    field: "synonyms" | "antonyms" | "examples",
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleAddItem = (field: "synonyms" | "antonyms" | "examples") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const handleRemoveItem = (field: "synonyms" | "antonyms" | "examples", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty strings from arrays
    const cleanedData = {
      ...formData,
      synonyms: formData.synonyms.filter(Boolean),
      antonyms: formData.antonyms.filter(Boolean),
      examples: formData.examples.filter(Boolean),
    };

    try {
      await updateCardMutation.mutateAsync(
        { id: card.id, data: cleanedData },
        {
          onSuccess: () => {
            toast.success("Card updated successfully");
            // Invalidate all relevant queries before navigating
            queryClient.invalidateQueries({ queryKey: ["cards"] });
            queryClient.invalidateQueries({ queryKey: ["wordLists"] });
            router.push('/dashboard/cards');
          }
        }
      );
    } catch (error) {
      toast.error("Failed to update card");
      console.error("Error updating card:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 mb-6 overflow-hidden border-0">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white truncate">
                          {card.word}
                        </h1>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[300px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                        <p className="text-sm">{card.word}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button 
                    onClick={handleSubmit} 
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    disabled={updateCardMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateCardMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>

              {card.wordList && (
                <div className="flex-1 min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-blue-100 truncate">From list: {card.wordList.name}</p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[300px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                        <p className="text-sm">From list: {card.wordList.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Word Card */}
          <Card className="overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Word</span>
                <Input
                  value={formData.word}
                  onChange={(e) => setFormData((prev) => ({ ...prev, word: e.target.value }))}
                  className="mt-1 text-2xl font-medium bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  placeholder="Enter word"
                  required
                />
              </label>
            </div>
          </Card>

          {/* Definition Card */}
          <Card className="overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Definition</span>
                <Textarea
                  value={formData.definition}
                  onChange={(e) => setFormData((prev) => ({ ...prev, definition: e.target.value }))}
                  className="mt-1 min-h-[100px] text-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  placeholder="Enter definition"
                  required
                />
              </label>
            </div>
          </Card>

          {/* Left Column */}
          <div className="space-y-6">
            {/* Synonyms Card */}
            <Card className="overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Synonyms</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddItem("synonyms")}
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4" /> Add Synonym
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.synonyms.map((synonym, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={synonym}
                        onChange={(e) => handleArrayChange("synonyms", index, e.target.value)}
                        placeholder="Enter synonym"
                        className="flex-1 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem("synonyms", index)}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Examples Card */}
            <Card className="overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Examples</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddItem("examples")}
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4" /> Add Example
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.examples.map((example, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        value={example}
                        onChange={(e) => handleArrayChange("examples", index, e.target.value)}
                        placeholder="Enter example sentence"
                        className="flex-1 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem("examples", index)}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 h-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Antonyms Card */}
            <Card className="overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Antonyms</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddItem("antonyms")}
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4" /> Add Antonym
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.antonyms.map((antonym, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={antonym}
                        onChange={(e) => handleArrayChange("antonyms", index, e.target.value)}
                        placeholder="Enter antonym"
                        className="flex-1 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem("antonyms", index)}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Notes Card */}
            <Card className="overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6">
                <label className="block">
                  <span className="text-lg font-medium text-gray-900 dark:text-gray-100 block mb-4">Notes</span>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any additional notes about the word"
                    className="min-h-[150px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </label>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditCardPage; 