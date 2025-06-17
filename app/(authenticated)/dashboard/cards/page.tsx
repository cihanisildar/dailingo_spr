"use client";

import { CreateCardDialog } from "@/components/cards/CreateCardDialog";
import { ImportCardsDialog } from "@/components/cards/ImportCardsDialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCards } from "@/hooks/useCards";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, Search, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ITEMS_PER_PAGE = 9;

export default function CardsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { getCards } = useCards();

  const { data: cards, isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: () => getCards(),
  });

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

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Cards</h1>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">Manage and organize your vocabulary cards.</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ImportCardsDialog />
              <CreateCardDialog />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search cards..."
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-blue-100 w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/20 w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCards?.map((card) => (
          <Link key={card.id} href={`/dashboard/cards/${card.id}`}>
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer min-h-[160px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{card.word}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1 break-words">
                      {card.definition}
                    </p>
                  </div>
                  <Badge
                    variant={card.reviewStatus === "COMPLETED" ? "success" : "default"}
                    className={cn(
                      "capitalize whitespace-nowrap",
                      card.reviewStatus === "ACTIVE" && "bg-blue-100 text-blue-800",
                      card.reviewStatus === "PAUSED" && "bg-gray-100 text-gray-800"
                    )}
                  >
                    {card.reviewStatus.toLowerCase()}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
                    <span className="truncate">Next: {new Date(card.nextReview).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {filteredCards?.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No cards found</h3>
          <p className="text-gray-500">
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
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function CardsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8">
        <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
        <div className="h-4 w-64 bg-white/20 rounded animate-pulse mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
