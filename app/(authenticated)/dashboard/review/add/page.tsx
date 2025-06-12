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
import { Loader2 } from "lucide-react";

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
    console.log("handleAddToReview called with selected cards:", Array.from(selectedCards));
    addToReviewMutation.mutate(Array.from(selectedCards));
  };

  const toggleCardSelection = (cardId: string) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else {
      newSelection.add(cardId);
    }
    console.log("Card selection toggled. New selection:", Array.from(newSelection));
    setSelectedCards(newSelection);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Add Words to Review</h1>
        <Button
          onClick={handleAddToReview}
          disabled={selectedCards.size === 0 || addToReviewMutation.isPending}
        >
          {addToReviewMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Add Selected to Review
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead>Word</TableHead>
              <TableHead>Definition</TableHead>
              <TableHead>Last Reviewed</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards?.map((card) => (
              <TableRow key={card.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedCards.has(card.id)}
                    onChange={() => toggleCardSelection(card.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableCell>
                <TableCell className="font-medium">{card.word}</TableCell>
                <TableCell>{card.definition}</TableCell>
                <TableCell>
                  {card.lastReviewed
                    ? new Date(card.lastReviewed).toLocaleDateString()
                    : "Never"}
                </TableCell>
                <TableCell>{card.reviewStatus}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 