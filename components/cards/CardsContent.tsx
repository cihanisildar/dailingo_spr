"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/types/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CardsGridView from "./CardsGridView";
import CardsListView from "./CardsListView";
import CardsLoadingSkeleton from "./CardsLoadingSkeleton";
import { useCards } from "@/hooks/useCards";

// Query keys
export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (filters: string) => [...cardKeys.lists(), { filters }] as const,
  details: () => [...cardKeys.all, 'detail'] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
  today: () => [...cardKeys.all, 'today'] as const,
};

const ITEMS_PER_PAGE = 12;

export default function CardsContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "grid";
  const page = Number(searchParams.get("page")) || 1;
  
  const { data: cardsData, isLoading, error } = useCards();

  if (isLoading) return <CardsLoadingSkeleton />;
  if (error) return <div>Error loading cards</div>;
  if (!cardsData) return null;

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const cards = cardsData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(cardsData.length / ITEMS_PER_PAGE);

  const createPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    Array.from(searchParams.entries()).forEach(([key, value]) => {
      params.set(key, value);
    });
    params.set("page", pageNum.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      {view === "list" ? (
        <CardsListView cards={cards} />
      ) : (
        <CardsGridView cards={cards} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            className="border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            asChild
          >
            <Link href={createPageUrl(page - 1)}>Previous</Link>
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                className={cn(
                  pageNum === page 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                )}
                asChild
              >
                <Link href={createPageUrl(pageNum)}>{pageNum}</Link>
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            className="border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            asChild
          >
            <Link href={createPageUrl(page + 1)}>Next</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

