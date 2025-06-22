"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import { 
  Loader2, 
  Inbox, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Filter,
  ArrowUpDown
} from "lucide-react";

// Remove Prisma import and define Card interface
interface Card {
  id: string;
  word: string;
  definition: string;
  lastReviewed?: string | null;
  reviewStatus: string;
}

export default function AddToReview() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const api = useApi();
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"word" | "lastReviewed" | "status">("word");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch all user's cards
  const { data: cards, isLoading } = useQuery<Card[]>({
    queryKey: ["cards"],
    queryFn: async () => {
      return api.get("/cards");
    },
  });

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    if (!cards) return [];

    let filtered = cards.filter((card) => {
      const matchesSearch = 
        card.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.definition.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || card.reviewStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort cards
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "word":
          aValue = a.word.toLowerCase();
          bValue = b.word.toLowerCase();
          break;
        case "lastReviewed":
          aValue = a.lastReviewed ? new Date(a.lastReviewed).getTime() : 0;
          bValue = b.lastReviewed ? new Date(b.lastReviewed).getTime() : 0;
          break;
        case "status":
          aValue = a.reviewStatus;
          bValue = b.reviewStatus;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [cards, searchQuery, statusFilter, sortBy, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCards = filteredAndSortedCards.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    if (!cards) return [];
    return [...new Set(cards.map(card => card.reviewStatus))];
  }, [cards]);

  // Mutation for adding cards to review
  const addToReviewMutation = useMutation({
    mutationFn: async (cardIds: string[]) => {
      return api.post("/cards/add-to-review", { cardIds });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["cards", "today"] });
      queryClient.invalidateQueries({ queryKey: ["cards", "upcoming"] });
      queryClient.refetchQueries({ queryKey: ["cards", "today"] });
      
      toast.success(`Added ${selectedCards.size} ${selectedCards.size === 1 ? 'card' : 'cards'} to review`);
      
      setSelectedCards(new Set());
      router.push("/dashboard/review");
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error("Failed to add cards to review");
    }
  });

  const handleAddToReview = () => {
    addToReviewMutation.mutate(Array.from(selectedCards));
  };

  const toggleCardSelection = (cardId: string) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else {
      newSelection.add(cardId);
    }
    setSelectedCards(newSelection);
  };

  const toggleAllCards = () => {
    if (selectedCards.size === currentCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(currentCards.map(card => card.id)));
    }
  };

  const handleSort = (column: "word" | "lastReviewed" | "status") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "learning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "review":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "mastered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Add to Review
            </h1>
            <p className="text-muted-foreground text-lg">
              Build your review session by selecting words from your collection
            </p>
          </div>
          <Button
            onClick={handleAddToReview}
            disabled={selectedCards.size === 0 || addToReviewMutation.isPending}
            className="h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
            size="lg"
          >
            {addToReviewMutation.isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            Add {selectedCards.size > 0 && `${selectedCards.size} `}to Review
          </Button>
        </div>

        {/* Search and Filter Section */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search words or definitions..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-11 text-base"
                />
              </div>
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900">
                      <SelectItem value="all">All Status</SelectItem>
                      {uniqueStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      {filteredAndSortedCards.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedCards.length)} of {filteredAndSortedCards.length} cards
          </span>
          <span>
            {selectedCards.size} selected
          </span>
        </div>
      )}

      {/* Cards Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        {filteredAndSortedCards.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/40">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={currentCards.length > 0 && selectedCards.size === currentCards.length}
                      onChange={toggleAllCards}
                      className="h-4 w-4 rounded border-gray-300 accent-primary focus:ring-2 focus:ring-primary"
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("word")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Word
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Definition</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("lastReviewed")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Last Reviewed
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("status")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCards.map((card) => (
                  <TableRow
                    key={card.id}
                    className={`transition-all duration-200 hover:bg-muted/50 ${
                      selectedCards.has(card.id) ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.id)}
                        onChange={() => toggleCardSelection(card.id)}
                        className="h-4 w-4 rounded border-gray-300 accent-primary focus:ring-2 focus:ring-primary"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-base py-4">{card.word}</TableCell>
                    <TableCell className="text-muted-foreground py-4 max-w-md">
                      <div className="truncate" title={card.definition}>
                        {card.definition}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {card.lastReviewed ? (
                        <span className="text-sm">
                          {new Date(card.lastReviewed).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground text-sm">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="secondary"
                        className={`${getStatusBadgeColor(card.reviewStatus)} border-0 font-medium`}
                      >
                        {card.reviewStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Inbox className="w-20 h-20 text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-2">No cards found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || statusFilter !== "all" 
                ? "No cards match your current filters. Try adjusting your search or filter criteria."
                : "You don't have any cards yet. Add some words to your collection first!"
              }
            </p>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className="w-10 h-10"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 