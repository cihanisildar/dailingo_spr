"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toast from "react-hot-toast";
import { Loader2, Inbox } from "lucide-react";

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

  // Fetch all user's cards
  const { data: cards, isLoading } = useQuery<Card[]>({
    queryKey: ["cards"],
    queryFn: async () => {
      return api.get("/cards");
    },
  });

  // Mutation for adding cards to review
  const addToReviewMutation = useMutation({
    mutationFn: async (cardIds: string[]) => {
      return api.post("/cards/add-to-review", { cardIds });
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["cards", "today"] });
      queryClient.invalidateQueries({ queryKey: ["cards", "upcoming"] });
      
      // Force refetch the today's cards query
      queryClient.refetchQueries({ queryKey: ["cards", "today"] });
      
      // Show success toast
      toast.success(`Added ${selectedCards.size} ${selectedCards.size === 1 ? 'card' : 'cards'} to review`);
      
      // Clear selection and redirect to review page
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] w-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[80vh] px-0">
      <div className="w-full bg-white dark:bg-zinc-900 rounded-none shadow-none p-4 md:p-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">Add Words to Review</h1>
            <p className="text-muted-foreground text-base md:text-lg">Select words from your collection to add to your review session.</p>
          </div>
          <Button
            onClick={handleAddToReview}
            disabled={selectedCards.size === 0 || addToReviewMutation.isPending}
            className="h-12 px-8 text-lg font-semibold shadow-md transition-transform hover:scale-[1.03]"
          >
            {addToReviewMutation.isPending && (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            )}
            Add Selected to Review
          </Button>
        </div>

        <div className="border rounded-xl overflow-x-auto bg-background">
          {cards && cards.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Word</TableHead>
                  <TableHead>Definition</TableHead>
                  <TableHead>Last Reviewed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card, idx) => (
                  <TableRow
                    key={card.id}
                    className={
                      `transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-muted/40 dark:bg-zinc-800'} hover:bg-primary/10 dark:hover:bg-primary/20`}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.id)}
                        onChange={() => toggleCardSelection(card.id)}
                        className="h-4 w-4 rounded border-gray-300 accent-primary focus:ring-2 focus:ring-primary"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-base">{card.word}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{card.definition}</TableCell>
                    <TableCell className="text-sm">
                      {card.lastReviewed
                        ? new Date(card.lastReviewed).toLocaleDateString()
                        : <span className="italic text-zinc-400">Never</span>}
                    </TableCell>
                    <TableCell>
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {card.reviewStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Inbox className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground font-medium">No cards found. Add some words to your collection first!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 