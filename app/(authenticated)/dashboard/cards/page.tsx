"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Grid2x2, List } from "lucide-react";
import { CardItem } from "@/components/cards/CardItem";
import { useCards, useCreateCard } from "@/hooks/useCards";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import CardsLoadingSkeleton from "@/components/cards/CardsLoadingSkeleton";
import { toast } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { WordList } from "@/types/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectedList, setSelectedList] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (searchParams.get("view") as "grid" | "list") || "grid"
  );
  const [newWord, setNewWord] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: cards = [], isLoading } = useCards();
  const { mutate: createCard, isPending } = useCreateCard();
  const { data: wordLists = [] } = useQuery({
    queryKey: ["wordLists"],
    queryFn: async () => {
      const { data } = await api.get("/lists");
      return data;
    },
  });

  // Pagination
  const ITEMS_PER_PAGE = viewMode === "grid" ? 12 : 10;
  const currentPage = Number(searchParams.get("page")) || 1;

  // Update URL with page and view mode
  const updateUrl = (newPage?: number, newViewMode?: "grid" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage) params.set("page", newPage.toString());
    if (newViewMode) params.set("view", newViewMode);
    router.replace(`?${params.toString()}`);
  };

  // Update view mode with pagination reset
  const updateViewMode = (newMode: "grid" | "list") => {
    setViewMode(newMode);
    updateUrl(1, newMode);
  };

  // Handle view mode from URL on mount
  useEffect(() => {
    const viewFromUrl = searchParams.get("view") as "grid" | "list";
    if (viewFromUrl && (viewFromUrl === "grid" || viewFromUrl === "list")) {
      setViewMode(viewFromUrl);
    }
  }, [searchParams]);

  const handleCreateCard = async () => {
    try {
      await createCard(
        { word: newWord, definition: newDefinition },
        {
          onSuccess: () => {
            setNewWord("");
            setNewDefinition("");
            setIsDialogOpen(false);
            toast.success("Card created successfully");
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.error || "Failed to create card");
          }
        }
      );
    } catch (error) {
      console.error("Failed to create card:", error);
      toast.error("Failed to create card");
    }
  };

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    if (!cards) return [];

    // Define status priority order
    const statusOrder = {
      'ACTIVE': 1,
      'PAUSED': 2,
      'COMPLETED': 3
    };

    let filtered = cards.filter(card => {
      const matchesSearch = card.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.definition.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesList = selectedList === "all" ? true :
        selectedList === "uncategorized" ? !card.wordList :
        card.wordList?.id === selectedList;

      return matchesSearch && matchesList;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "word-asc":
          return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
        case "word-desc":
          return b.word.toLowerCase().localeCompare(a.word.toLowerCase());
        case "status":
          const statusDiff = statusOrder[a.reviewStatus] - statusOrder[b.reviewStatus];
          return statusDiff !== 0 ? statusDiff : a.word.toLowerCase().localeCompare(b.word.toLowerCase());
        default:
          return 0;
      }
    });
  }, [cards, searchQuery, sortBy, selectedList]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedCards.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCards = filteredAndSortedCards.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    if (currentPage > 1) {
      updateUrl(1);
    }
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">My Cards</h1>
              <p className="text-purple-100 mt-1">Manage and organize your vocabulary cards.</p>
            </div>
            <div className="w-32 h-10 bg-white/10 rounded-md animate-pulse" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
            <div className="flex-1 relative">
              <div className="w-full h-10 bg-white/10 rounded-md animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[180px] h-10 bg-white/10 rounded-md animate-pulse" />
              <div className="w-20 h-10 bg-white/10 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
        <CardsLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Cards</h1>
            <p className="text-purple-100 mt-1 text-sm sm:text-base">Manage and organize your vocabulary cards.</p>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Card</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Word</label>
                    <Input 
                      placeholder="Enter word" 
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Definition</label>
                    <Input 
                      placeholder="Enter definition"
                      value={newDefinition}
                      onChange={(e) => setNewDefinition(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCard}
                    disabled={!newWord.trim() || !newDefinition.trim() || isPending}
                  >
                    {isPending ? "Creating..." : "Create Card"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Search bar always visible */}
        <div className="mb-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 w-full"
            />
          </div>
        </div>
        {/* Show Filters button for mobile */}
        <div className="sm:hidden mb-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-white flex items-center gap-1 px-2 py-1"
            onClick={() => setShowFilters((v) => !v)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
            <svg className={showFilters ? "rotate-180 transition-transform" : "transition-transform"} width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Button>
        </div>
        {/* Filters and view toggles: always visible on sm+, collapsible on mobile */}
        <div className={showFilters ? "block" : "hidden sm:block"}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
            <Select value={selectedList} onValueChange={setSelectedList}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Filter by list" className="truncate" />
                    </SelectTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[300px]">
                    <p className="text-sm">
                      {selectedList === "all" ? "All Lists" :
                       selectedList === "uncategorized" ? "Uncategorized" :
                       wordLists.find((list: { id: string; name: string }) => list.id === selectedList)?.name || "Filter by list"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <SelectContent className="w-full sm:w-[180px] bg-white border-none">
                <SelectItem value="all" className="hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <span>All Lists</span>
                  </div>
                </SelectItem>
                <SelectItem value="uncategorized" className="hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <span>Uncategorized</span>
                  </div>
                </SelectItem>
                {wordLists.map((list: WordList) => (
                  <TooltipProvider key={list.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem value={list.id} className="hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{list.name}</span>
                          </div>
                        </SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[300px]">
                        <p className="text-sm">{list.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="w-full sm:w-[180px] bg-white border-none">
                <SelectItem value="date-desc" className="hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <span>Newest First</span>
                  </div>
                </SelectItem>
                <SelectItem value="date-asc" className="hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <span>Oldest First</span>
                  </div>
                </SelectItem>
                <SelectItem value="word-asc" className="hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <span>Word (A-Z)</span>
                  </div>
                </SelectItem>
                <SelectItem value="word-desc" className="hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <span>Word (Z-A)</span>
                  </div>
                </SelectItem>
                <SelectItem value="status" className="hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <span>Status</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex bg-white/10 rounded-md p-1 w-full sm:w-auto justify-center sm:justify-start">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateViewMode("grid")}
                className={viewMode === "grid" 
                  ? "bg-white/20 text-white" 
                  : "text-white hover:bg-white/20 hover:text-white"}
              >
                <Grid2x2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateViewMode("list")}
                className={viewMode === "list" 
                  ? "bg-white/20 text-white" 
                  : "text-white hover:bg-white/20 hover:text-white"}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid/List */}
      {filteredAndSortedCards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-500">No cards found. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div 
            className={
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                : "flex flex-col gap-3"
            }
          >
            {currentCards.map((card) => (
              <CardItem
                key={card.id}
                id={card.id}
                word={card.word}
                definition={card.definition}
                nextReview={typeof card.nextReview === 'object' ? card.nextReview.toISOString() : card.nextReview}
                reviewStatus={card.reviewStatus}
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => updateUrl(currentPage - 1)}
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
                    onClick={() => updateUrl(pageNum)}
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
                onClick={() => updateUrl(currentPage + 1)}
                className="border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
