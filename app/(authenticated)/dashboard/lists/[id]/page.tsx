"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import api from "@/lib/axios";
import { cn, generateCardUrl } from "@/lib/utils";
import { Card as CardType } from "@/types/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Book,
  Bookmark,
  CheckCircle,
  Clock,
  Edit,
  Globe,
  Loader2,
  Lock,
  Plus,
  Search,
  Trash,
  XCircle
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

export default function WordListPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteCards, setDeleteCards] = useState(false);

  const { data: list, isLoading } = useQuery({
    queryKey: ["wordList", params.id],
    queryFn: async () => {
      const { data } = await api.get(`/lists/${params.id}`);
      return data;
    },
  });

  const { data: hasUserCopied } = useQuery({
    queryKey: ["hasUserCopied", params.id],
    queryFn: async () => {
      if (!list) return false;
      const { data } = await api.get(`/lists?includePublic=false`);
      return data.some((userList: any) => 
        userList.name.startsWith(`${list.name} (Copy`)
      );
    },
    enabled: !!list && list.userId !== session?.user?.id,
  });

  const copyListMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/lists/copy', { sourceListId: params.id });
      return data;
    },
    onSuccess: (newList) => {
      toast.success('List copied successfully!');
      router.push(`/dashboard/lists/${newList.id}`);
      queryClient.invalidateQueries({ queryKey: ["wordLists"] });
    },
    onError: (error: any) => {
      console.error('Error copying list:', error);
      if (error.response?.data?.error === 'You have already copied this list') {
        toast.error('You already have a copy of this list in your collection');
      } else {
        toast.error('Failed to copy list');
      }
    }
  });

  const handleDelete = async () => {
    try {
      await api.delete(`/lists/${params.id}`, {
        data: { deleteCards }
      });
      toast.success(deleteCards 
        ? 'List and cards deleted successfully' 
        : 'List deleted successfully. Cards have been preserved.'
      );
      router.push("/dashboard/lists");
      queryClient.invalidateQueries({ queryKey: ["wordLists"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    } catch (error) {
      console.error("Error deleting list:", error);
      toast.error('Failed to delete list');
    }
  };

  if (isLoading) {
    return <WordListSkeleton />;
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-4 sm:p-8">
        <div className="flex items-center justify-between gap-2">
          {/* Left: List name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
            {list.name}
          </h1>
          {/* Right: Badge and Buttons */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-white border-white/20 px-2 py-0.5 text-xs font-normal h-5",
                list.isPublic ? "bg-white/10" : "bg-white/5"
              )}
            >
              {list.isPublic ? (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Public
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Private
                </span>
              )}
            </Badge>
            {list.userId === session?.user?.id && (
              <>
                <AddCardsDialog listId={list.id}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 min-w-0 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </AddCardsDialog>
                <Link href={`/dashboard/lists/${list.id}/edit`}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 min-w-0 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 min-w-0 bg-red-500/80 hover:bg-red-600/80"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete List</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this list? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex items-center gap-2 mb-4">
                      <Checkbox
                        id="deleteCards"
                        checked={deleteCards}
                        onCheckedChange={(checked) => setDeleteCards(checked as boolean)}
                      />
                      <label htmlFor="deleteCards" className="text-sm text-gray-600">
                        Also delete all cards in this list
                      </label>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      >
                        Delete List
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
        {list.description && (
          <p className="text-blue-100 mt-1 text-xs sm:text-base">{list.description}</p>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {list.cards.map((card: CardType) => {
          const CardContent = (
            <Card className="h-full hover:shadow-lg transition-all group border-transparent hover:border-blue-200">
              <div className="p-3 sm:p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center justify-between w-full gap-2 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                      {card.word}
                    </h3>
                    {list.userId === session?.user?.id && (
                      <Badge
                        variant={card.reviewStatus === 'COMPLETED' ? 'success' : 'default'}
                        className={cn(
                          "capitalize text-xs px-2 py-0.5 h-5",
                          card.reviewStatus === 'ACTIVE' && "bg-blue-100 text-blue-800",
                          card.reviewStatus === 'PAUSED' && "bg-gray-100 text-gray-800"
                        )}
                      >
                        {card.reviewStatus.toLowerCase()}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-600 flex-grow line-clamp-3 mb-2 sm:mb-4">
                  {card.definition}
                </p>
                {list.userId === session?.user?.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-emerald-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span>{card.successCount}</span>
                      </div>
                      <div className="flex items-center text-blue-600">
                        <XCircle className="w-4 h-4 mr-1" />
                        <span>{card.failureCount}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {format(new Date(card.nextReview), 'MMM d, yyyy')}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                    {card.wordDetails && (
                      <>
                        {card.wordDetails.examples?.length > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {card.wordDetails.examples.length} Examples
                          </Badge>
                        )}
                        {card.wordDetails.synonyms?.length > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {card.wordDetails.synonyms.length} Synonyms
                          </Badge>
                        )}
                        {card.wordDetails.antonyms?.length > 0 && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            {card.wordDetails.antonyms.length} Antonyms
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );

          return (
            <Link key={card.id} href={generateCardUrl(card.word, card.id)}>
              {CardContent}
            </Link>
          );
        })}
      </div>

      {list.cards.length === 0 && (
        <Card className="p-4 sm:p-8">
          <div className="text-center">
            <Bookmark className="w-10 h-10 sm:w-12 sm:h-12 text-blue-200 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900">No cards yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mt-1 mb-3 sm:mb-4">
              Start adding cards to build your vocabulary list.
            </p>
            <AddCardsDialog listId={list.id}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Cards
              </Button>
            </AddCardsDialog>
          </div>
        </Card>
      )}
    </div>
  );
}

function AddCardsDialog({ listId, children }: { listId: string, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const queryClient = useQueryClient();

  const { data: availableCards = [], isLoading } = useQuery({
    queryKey: ["availableCards", listId],
    queryFn: async () => {
      const { data } = await api.get(`/lists/${listId}/available-cards`);
      return data;
    },
  });

  const addCardsMutation = useMutation({
    mutationFn: async (cardIds: string[]) => {
      await api.post(`/lists/${listId}/cards`, { cardIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordList", listId] });
      setOpen(false);
      toast.success("Cards added successfully");
    },
    onError: (error) => {
      console.error("Error adding cards:", error);
      toast.error("Failed to add cards");
    },
  });

  const filteredCards = useMemo(() => {
    return availableCards.filter((card: any) =>
      card.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCards, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentCards = filteredCards.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addCardsMutation.mutate(selectedCards);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Cards to List</DialogTitle>
          <DialogDescription>
            Select cards to add to your list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 bg-gray-50/50 rounded-lg p-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cards..."
              className="border-0 bg-transparent focus-visible:ring-0 text-sm placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-gray-200 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-gray-500">Loading cards...</p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No cards found</p>
              </div>
            ) : (
              <>
                {currentCards.map((card: any) => (
                  <div
                    key={card.id}
                    className="flex items-start gap-3 p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Checkbox
                      checked={selectedCards.includes(card.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCards([...selectedCards, card.id]);
                        } else {
                          setSelectedCards(selectedCards.filter((id) => id !== card.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm sm:text-base font-medium text-gray-900">{card.word}</p>
                      <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{card.definition}</p>
                      {card.wordList && (
                        <p className="text-xs text-gray-400 mt-1">From list: {card.wordList.name}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 border-t">
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

          <DialogFooter className="sm:gap-2">
            <Button
              type="submit"
              disabled={selectedCards.length === 0 || addCardsMutation.isPending}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {addCardsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>Add {selectedCards.length} {selectedCards.length === 1 ? 'Card' : 'Cards'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WordListSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-lg">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-32 bg-white/20 rounded animate-pulse" />
            <div className="h-8 w-24 bg-white/20 rounded animate-pulse" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-48 bg-white/20 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-white/20 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-32 bg-white/20 rounded animate-pulse" />
              <div className="h-10 w-10 bg-white/20 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="h-full">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 