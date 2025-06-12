"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card as UICard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Globe,
  Lock,
  Trash2,
  Save,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLists } from "@/hooks/useLists";
import { Card as CardType } from "@/types/models";

interface WordList {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  userId: string;
  cards: CardType[];
  createdAt: string;
  updatedAt: string;
}

export default function EditListPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
  });
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const { getList, updateList, getListCards, getAvailableCards, addCardsToList, removeCardsFromList } = useLists();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // Fetch list data
  const { data: list, isLoading } = useQuery({
    queryKey: ["wordList", id],
    queryFn: async () => {
      return await getList(id);
    },
  });

  // Sync form data with list data
  useEffect(() => {
    if (list) {
      setFormData({
        name: list.name || "",
        description: list.description || "",
        isPublic: list.isPublic || false,
      });
    }
  }, [list]);

  // Update list mutation
  const updateListMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.name.trim()) {
        throw new Error('List name cannot be empty');
      }
      return await updateList(id, data);
    },
    onMutate: async (newData) => {
      console.log('onMutate starting with new data:', newData);
      // Validate data before optimistic update
      if (!newData.name.trim()) {
        throw new Error('List name cannot be empty');
      }
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["wordList", id] });
      await queryClient.cancelQueries({ queryKey: ["wordLists"] });

      // Snapshot the previous values
      const previousList = queryClient.getQueryData<WordList>(["wordList", id]);
      console.log('Previous list state:', previousList);
      const previousLists = queryClient.getQueryData<WordList[]>(["wordLists"]);

      // Optimistically update the cache with all existing properties
      if (previousList) {
        const updatedList = {
          ...previousList,
          name: newData.name.trim(),
          description: newData.description,
          isPublic: newData.isPublic,
          updatedAt: new Date().toISOString()
        };
        console.log('Optimistically updated list:', updatedList);
        queryClient.setQueryData(["wordList", id], updatedList);
      }

      if (previousLists) {
        const updatedLists = previousLists.map(list =>
          list.id === id
            ? {
                ...list,
                name: newData.name.trim(),
                description: newData.description,
                isPublic: newData.isPublic,
                updatedAt: new Date().toISOString()
              }
            : list
        );
        queryClient.setQueryData(["wordLists"], updatedLists);
      }

      return { previousList, previousLists };
    },
    onError: (err, newData, context) => {
      console.error('Update error:', err);
      console.log('Failed update data:', newData);
      // If the mutation fails, use the context to roll back
      if (context?.previousList) {
        console.log('Rolling back to previous list:', context.previousList);
        queryClient.setQueryData(["wordList", id], context.previousList);
      }
      if (context?.previousLists) {
        queryClient.setQueryData(["wordLists"], context.previousLists);
      }
      toast.error("Failed to update list");
    },
    onSuccess: (updatedList) => {
      console.log('Update successful, received data:', updatedList);
      // Update all related queries with the new data
      queryClient.setQueryData(["wordList", id], updatedList);
      queryClient.invalidateQueries({ queryKey: ["wordLists"] });
      queryClient.invalidateQueries({ queryKey: ["publicLists"] });
      toast.success("List updated successfully");
    },
    onSettled: () => {
      console.log('Update settled, invalidating queries');
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ["wordList", id] });
      queryClient.invalidateQueries({ queryKey: ["wordLists"] });
      queryClient.invalidateQueries({ queryKey: ["publicLists"] });
    }
  });

  // Remove cards mutation
  const removeCardsMutation = useMutation({
    mutationFn: async (cardIds: string[]) => {
      await removeCardsFromList(id, cardIds);
    },
    onSuccess: () => {
      toast.success("Cards removed successfully");
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["wordList", id] });
      queryClient.invalidateQueries({ queryKey: ["wordLists"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      setSelectedCards([]);
    },
    onError: (error) => {
      console.error("Error removing cards:", error);
      toast.error("Failed to remove cards");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit handler called with form data:', formData);
    try {
      if (!formData.name.trim()) {
        toast.error('List name cannot be empty');
        return;
      }
      await updateListMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Error in submit handler:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to update list');
    }
  };

  const handleRemoveCards = async () => {
    if (selectedCards.length === 0) return;
    await removeCardsMutation.mutateAsync(selectedCards);
  };

  // Filtered and paginated cards
  const filteredCards = (list?.cards ?? []).filter(
    (card: CardType) =>
      card.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil((filteredCards?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentCards = filteredCards?.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl animate-pulse" />
        <div className="h-64 bg-white rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold">List not found</h2>
            <p className="text-blue-100 mt-2">This list may have been deleted or you don't have access to it.</p>
            <Link href="/dashboard/lists">
              <Button variant="outline" className="mt-4 bg-white/20 text-white hover:bg-white/30 border-0">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lists
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h1 className="text-3xl font-bold text-white truncate">
                      {list.name}
                    </h1>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[300px]">
                    <p className="text-sm">{list.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex-shrink-0">
              <Button 
                onClick={handleSubmit} 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                disabled={updateListMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateListMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
          <p className="text-blue-100">Update your list details and manage cards.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Details Form */}
        <UICard className="lg:col-span-1 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">List Details</h2>
            <form className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter list name"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter list description"
                  className="mt-1.5"
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  id="public"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => {
                    console.log('Switch toggled, new value:', checked);
                    console.log('Current form data before update:', formData);
                    setFormData(prev => {
                      const newData = { ...prev, isPublic: checked };
                      console.log('New form data after update:', newData);
                      return newData;
                    });
                  }}
                />
                <Label htmlFor="public" className="text-sm font-normal">
                  Make this list public
                </Label>
              </div>
              <div className="pt-2">
                <Alert variant={formData.isPublic ? "default" : "default"} className="bg-gray-50/50">
                  {formData.isPublic ? (
                    <>
                      <Globe className="h-4 w-4" />
                      <AlertDescription>
                        This list will be visible to all users. They can view and copy your list.
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        This list is private and only visible to you.
                      </AlertDescription>
                    </>
                  )}
                </Alert>
              </div>
            </form>
          </div>
        </UICard>

        {/* Cards Management */}
        <UICard className="lg:col-span-2 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Manage Cards</h2>
              {selectedCards.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Remove {selectedCards.length} {selectedCards.length === 1 ? 'Card' : 'Cards'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Cards from List</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {selectedCards.length} {selectedCards.length === 1 ? 'card' : 'cards'} from this list? 
                        The cards will remain in your collection but won't be part of this list anymore.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRemoveCards}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      >
                        Remove {selectedCards.length} {selectedCards.length === 1 ? 'Card' : 'Cards'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cards..."
                className="pl-9"
              />
            </div>

            {/* Pagination */}
            <div className="space-y-4">
              <div className="space-y-2">
                {filteredCards?.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No cards found</p>
                  </div>
                ) : (
                  <>
                    {currentCards?.map((card: CardType) => (
                      <div
                        key={card.id}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-lg transition-colors",
                          selectedCards.includes(card.id)
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-gray-50 border border-gray-100"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCards.includes(card.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCards([...selectedCards, card.id]);
                            } else {
                              setSelectedCards(selectedCards.filter(id => id !== card.id));
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-gray-900">{card.word}</p>
                              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{card.definition}</p>
                            </div>
                            <Badge 
                              variant={card.reviewStatus === 'COMPLETED' ? 'success' : 'default'}
                              className={cn(
                                "capitalize whitespace-nowrap",
                                card.reviewStatus === 'ACTIVE' && "bg-blue-100 text-blue-800",
                                card.reviewStatus === 'PAUSED' && "bg-gray-100 text-gray-800"
                              )}
                            >
                              {card.reviewStatus.toLowerCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <span>{card.successCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span>{card.failureCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Next: {new Date(card.nextReview).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                          className="border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={cn(
                                "min-w-[2.5rem]",
                                pageNum === currentPage 
                                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                  : "border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              )}
                            >
                              {pageNum}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                          className="border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </UICard>
      </div>
    </div>
  );
} 