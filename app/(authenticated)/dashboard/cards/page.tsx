"use client";

import { CreateCardDialog } from "@/components/cards/CreateCardDialog";
import { ImportCardsDialog } from "@/components/cards/ImportCardsDialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCards } from "@/hooks/useCards";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, Search, XCircle, ChevronLeft, ChevronRight, Trash2, Book } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
import { useBulkDeleteCards } from "@/hooks/useCards";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 12;

export default function CardsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const { getCards } = useCards();
  const bulkDeleteMutation = useBulkDeleteCards();

  const { data: cards, isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: () => getCards(),
  });

  // Clear selections when filters change
  useEffect(() => {
    setSelectedCards([]);
  }, [searchTerm, statusFilter, currentPage]);

  if (isLoading) {
    return <CardsLoadingSkeleton />;
  }

  const filteredCards = cards?.filter((card) => {
    const matchesSearch =
      card.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || card.reviewStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil((filteredCards?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCards = filteredCards?.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to first page when filters change
  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Selection handlers
  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCards.length === paginatedCards?.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(paginatedCards?.map(card => card.id) || []);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    try {
      await bulkDeleteMutation.mutateAsync(selectedCards);
      const successCount = selectedCards.length;
      setSelectedCards([]);
      toast.success(`Successfully deleted ${successCount} card${successCount === 1 ? '' : 's'}`);
    } catch (error) {
      toast.error("Failed to delete cards");
      console.error("Error deleting cards:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-900/30">
      <div className="space-y-6">
      {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800 rounded-xl sm:rounded-2xl opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-white/10 dark:from-black/40 dark:to-black/10 rounded-xl sm:rounded-2xl" />
          <div className="relative px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
            <div className="space-y-4 sm:space-y-6">
              {/* Header with stats */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Book className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 dark:text-yellow-400 flex-shrink-0" />
                  <span className="text-yellow-300 dark:text-yellow-400 font-medium text-xs sm:text-sm tracking-wide uppercase">
                    Vocabulary Cards
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-indigo-200 dark:text-indigo-300 text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm whitespace-nowrap">{cards?.length || 0} Cards</span>
                  </div>
                </div>
              </div>

              {/* Title and description */}
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  Your Cards
                </h1>
                <p className="text-sm sm:text-base text-indigo-100 dark:text-indigo-200 leading-relaxed max-w-full sm:max-w-2xl">
                  Manage and organize your vocabulary cards. Track progress and master new words effectively.
              </p>
            </div>

              {/* Search bar and controls */}
              <div className="pt-2 sm:pt-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                  {/* Search bar */}
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 sm:left-3.5 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4 sm:w-5 sm:h-5 z-10 transition-colors duration-200" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search cards..."
                      className="w-full h-11 sm:h-12 pl-10 sm:pl-12 pr-4 sm:pr-6 pt-1 bg-white/20 dark:bg-white/10 backdrop-blur-sm text-white placeholder:text-white/70 border border-white/20 dark:border-white/15 rounded-lg sm:rounded-xl focus:bg-white/25 dark:focus:bg-white/15 focus:border-white/40 dark:focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 text-sm sm:text-base"
                    />
                  </div>

                  {/* Filter dropdown */}
                  <select
                    value={statusFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="h-11 sm:h-12 px-3 sm:px-4 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg sm:rounded-xl w-full sm:w-auto transition-all duration-200"
                  >
                    <option className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" value="all">All Status</option>
                    <option className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" value="ACTIVE">Active</option>
                    <option className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" value="COMPLETED">Completed</option>
                    <option className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" value="PAUSED">Paused</option>
                  </select>

                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {selectedCards.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                            className="h-11 sm:h-12 bg-red-500/80 hover:bg-red-600 text-white border-red-400/50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete {selectedCards.length} Card{selectedCards.length === 1 ? '' : 's'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-gray-900 dark:text-gray-100">Delete Cards</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete {selectedCards.length} card{selectedCards.length === 1 ? '' : 's'}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleBulkDelete}
                        className="bg-red-500 hover:bg-red-600 text-white"
                        disabled={bulkDeleteMutation.isPending}
                      >
                        {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <ImportCardsDialog />
              <CreateCardDialog />
            </div>
          </div>
              </div>
          </div>
        </div>
      </div>

      {/* Select All Checkbox */}
      {paginatedCards && paginatedCards.length > 0 && (
          <div className="flex items-center gap-2 px-1">
          <Checkbox
            id="select-all"
            checked={selectedCards.length === paginatedCards.length && paginatedCards.length > 0}
            onCheckedChange={toggleSelectAll}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
          <label htmlFor="select-all" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            Select all cards on this page ({paginatedCards.length})
          </label>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedCards?.map((card) => (
            <div key={card.id} className="relative group">
            <div 
              className="absolute top-2 left-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={selectedCards.includes(card.id)}
                onCheckedChange={() => toggleCardSelection(card.id)}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm"
              />
            </div>
            <Link href={`/dashboard/cards/${card.id}`}>
              <Card className={cn(
                  "p-4 sm:p-6 hover:shadow-lg dark:hover:shadow-xl transition-all cursor-pointer min-h-[160px] flex flex-col justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 rounded-lg sm:rounded-xl",
                selectedCards.includes(card.id) && "ring-2 ring-blue-500 dark:ring-blue-400"
              )}>
                  <div className="space-y-4 ml-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{card.word}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1 break-words">
                        {card.definition}
                      </p>
                    </div>
                    <Badge
                      variant={card.reviewStatus === "COMPLETED" ? "success" : "default"}
                      className={cn(
                        "capitalize whitespace-nowrap",
                          card.reviewStatus === "ACTIVE" && "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
                        card.reviewStatus === "PAUSED" && "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      )}
                    >
                      {card.reviewStatus.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <span>{card.successCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                      <span>{card.failureCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="truncate">Next: {new Date(card.nextReview).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {filteredCards?.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Search className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No cards found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Create your first card to get started"}
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

function CardsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 rounded-3xl p-8">
        <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
        <div className="h-4 w-64 bg-white/20 rounded animate-pulse mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
