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
import { useLists } from "@/hooks/useLists";
import { useCreateCard } from "@/hooks/useCards";
import { cn, generateCardUrl } from "@/lib/utils";
import { Card as CardType } from "@/types/models/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

export default function WordListPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteCards, setDeleteCards] = useState(false);
  const {
    getList,
    getLists,
    getAvailableCards,
    addCardsToList,
    removeCardsFromList,
    copyList,
    deleteListWithCards,
  } = useLists();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: list, isLoading } = useQuery({
    queryKey: ["wordList", id],
    queryFn: async () => {
      return await getList(id);
    },
  });

  const { data: hasUserCopied } = useQuery({
    queryKey: ["hasUserCopied", id],
    queryFn: async () => {
      if (!list) return false;
      const lists = await getLists(false);
      return lists.some((userList: any) =>
        userList.name.startsWith(`${list.name} (Copy`)
      );
    },
    enabled: !!list && list.userId !== session?.user?.id,
  });

  const copyListMutation = useMutation({
    mutationFn: async () => {
      return await copyList(id);
    },
    onSuccess: (newList) => {
      toast.success("List copied successfully!");
      router.push(`/dashboard/lists/${(newList as any).id}`);
      queryClient.invalidateQueries({ queryKey: ["wordLists"] });
    },
    onError: (error: any) => {
      console.error("Error copying list:", error);
      if (error.response?.data?.error === "You have already copied this list") {
        toast.error("You already have a copy of this list in your collection");
      } else {
        toast.error("Failed to copy list");
      }
    },
  });

  const handleDelete = async () => {
    try {
      await deleteListWithCards(id, deleteCards);
      toast.success(
        deleteCards
          ? "List and cards deleted successfully"
          : "List deleted successfully. Cards have been preserved."
      );
      router.push("/dashboard/lists");
      queryClient.invalidateQueries({ queryKey: ["wordLists"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    } catch (error) {
      console.error("Error deleting list:", error);
      toast.error("Failed to delete list");
    }
  };

  if (isLoading) {
    return <WordListSkeleton />;
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-900/30 p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
            <div className="relative text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-2">List not found</h2>
              <p className="text-slate-600 dark:text-gray-400 leading-relaxed mb-6 max-w-sm mx-auto">
                This list may have been deleted or you don't have access to it.
              </p>
              <Link href="/dashboard/lists">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Lists
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-900/30">
      <div className="max-w-6xl space-y-6">
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
          <div className="relative p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Left: List Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    {list.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-6 px-2 border-0 font-medium text-xs",
                      list.isPublic 
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
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
                </div>
                {list.description && (
                  <p className="text-slate-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed max-w-xl">
                    {list.description}
                  </p>
                )}
              </div>

              {/* Right: Stats and Action Buttons */}
              <div className="flex flex-col items-start sm:items-end gap-3">
                {/* Stats moved to top right */}
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full" />
                    <span>{((list as any).cards ?? []).length} cards</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full" />
                    <span>Updated {format(new Date(list.updatedAt), "MMM d, yyyy")}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {list.userId === session?.user?.id ? (
                    <>
                      <AddCardsDialog listId={list.id}>
                        <Button
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Cards
                        </Button>
                      </AddCardsDialog>
                      <Link href={`/dashboard/lists/${list.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/80 dark:bg-gray-700/80 border-slate-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 hover:border-slate-300 dark:hover:border-gray-500 text-slate-700 dark:text-gray-300 shadow-sm hover:shadow-md transition-all duration-300 px-3 py-1.5 rounded-lg text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-300 dark:hover:border-red-700 text-red-600 dark:text-red-400 shadow-sm hover:shadow-md transition-all duration-300 px-3 py-1.5 rounded-lg text-xs"
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-xl border-0 shadow-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete List</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600 dark:text-gray-400">
                              Are you sure you want to delete this list? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                            <Checkbox
                              id="deleteCards"
                              checked={deleteCards}
                              onCheckedChange={(checked) =>
                                setDeleteCards(checked as boolean)
                              }
                            />
                            <label
                              htmlFor="deleteCards"
                              className="text-sm text-slate-700 dark:text-gray-300 font-medium"
                            >
                              Also delete all cards in this list
                            </label>
                          </div>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-red-600 hover:bg-red-700 rounded-lg"
                            >
                              Delete List
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    /* Copy List Button for public lists not owned by the user */
                    list.isPublic && !hasUserCopied && (
                      <Button
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 px-4 py-1.5 rounded-lg text-xs"
                        onClick={() => copyListMutation.mutate()}
                        disabled={copyListMutation.isPending || hasUserCopied}
                      >
                        {copyListMutation.isPending ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3 mr-1" />
                        )}
                        Copy List
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {((list as any).cards ?? []).map((card: CardType) => {
            const CardContent = (
              <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-white/90 dark:hover:bg-gray-800/90">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 dark:from-blue-900/20 dark:via-transparent dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-3 sm:p-4 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
                      {card.word}
                    </h3>
                    {list.userId === session?.user?.id && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs px-2 py-0.5 font-medium border-0 shrink-0",
                          card.reviewStatus === "COMPLETED" && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
                          card.reviewStatus === "ACTIVE" && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                          card.reviewStatus === "PAUSED" && "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400"
                        )}
                      >
                        {card.reviewStatus.toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-slate-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed flex-grow mb-3 line-clamp-3">
                    {card.definition}
                  </p>
                  
                  {list.userId === session?.user?.id ? (
                                          <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full" />
                            <span className="font-medium">{card.successCount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-red-500 dark:text-red-400">
                            <div className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full" />
                            <span className="font-medium">{card.failureCount}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-gray-700">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>Next: {format(new Date(card.nextReview), "MMM d")}</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-400 dark:from-blue-500 dark:to-indigo-500 rounded-full group-hover:scale-125 transition-transform duration-300" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {card.wordDetails && (
                        <>
                          {card.wordDetails.examples?.length > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs px-1.5 py-0.5"
                            >
                              {card.wordDetails.examples.length} Examples
                            </Badge>
                          )}
                          {card.wordDetails.synonyms?.length > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs px-1.5 py-0.5"
                            >
                              {card.wordDetails.synonyms.length} Synonyms
                            </Badge>
                          )}
                          {card.wordDetails.antonyms?.length > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-xs px-1.5 py-0.5"
                            >
                              {card.wordDetails.antonyms.length} Antonyms
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );

            return (
              <Link key={card.id} href={generateCardUrl(card.word, card.id)}>
                {CardContent}
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {((list as any).cards ?? []).length === 0 && (
          <div className="relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 dark:from-slate-800/50 dark:via-blue-900/20 dark:to-indigo-900/10" />
            <div className="relative p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-2">
                No cards yet
              </h3>
              <p className="text-slate-600 dark:text-gray-400 leading-relaxed mb-6 max-w-sm mx-auto">
                Start building your vocabulary by adding your first cards to this list.
              </p>
              <AddCardsDialog listId={list.id}>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-base font-medium">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Cards
                </Button>
              </AddCardsDialog>
            </div>
          </div>
        )}

        {/* Floating Add Button - Always visible when user owns the list */}
        {list.userId === session?.user?.id && (
          <div className="fixed bottom-6 right-6 z-50">
            <AddCardsDialog listId={list.id}>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 group">
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </Button>
            </AddCardsDialog>
          </div>
        )}
      </div>
    </div>
  );
}

function AddCardsDialog({
  listId,
  children,
}: {
  listId: string;
  children: React.ReactNode;
}) {
  const { getAvailableCards, addCardsToList } = useLists();
  const createCardMutation = useCreateCard();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("select");
  const ITEMS_PER_PAGE = 10;
  const queryClient = useQueryClient();

  // Form for creating new cards
  const createCardSchema = z.object({
    word: z.string().min(1, "Word is required"),
    definition: z.string().min(1, "Definition is required"),
  });

  const createCardForm = useForm<z.infer<typeof createCardSchema>>({
    resolver: zodResolver(createCardSchema),
    defaultValues: {
      word: "",
      definition: "",
    },
  });

  const { data: availableCards = [], isLoading, error } = useQuery<CardType[]>({
    queryKey: ["availableCards", listId],
    queryFn: async () => {
      return await getAvailableCards(listId);
    },
    retry: 1,
    enabled: !!listId && open, // Only fetch when dialog is open and listId exists
  });

  // Handle errors from the available cards query
  useEffect(() => {
    if (error) {
      console.error("Error fetching available cards:", error);
      toast.error("Failed to load available cards");
    }
  }, [error]);

  const addCardsMutation = useMutation({
    mutationFn: async (cardIds: string[]) => {
      await addCardsToList(listId, cardIds);
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

  const createAndAddCardMutation = useMutation({
    mutationFn: async (cardData: { word: string; definition: string }) => {
      // Create the card with the wordListId directly included
      const cardDataWithList = {
        ...cardData,
        wordListId: listId
      };
      
      const newCard = await createCardMutation.mutateAsync(cardDataWithList);
      return newCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordList", listId] });
      queryClient.invalidateQueries({ queryKey: ["availableCards", listId] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      setOpen(false);
      createCardForm.reset();
      toast.success("Card created and added to list successfully!");
    },
    onError: (error: any) => {
      console.error("Error creating and adding card:", error);
      toast.error(`Failed to create and add card: ${error?.message || 'Unknown error'}`);
    },
  });

  const filteredCards = useMemo(() => {
    return availableCards.filter(
      (card: any) =>
        card.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCards, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentCards = filteredCards.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addCardsMutation.mutate(selectedCards);
  };

  const handleCreateCard = (values: z.infer<typeof createCardSchema>) => {
    createAndAddCardMutation.mutate(values);
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      createCardForm.reset();
      setSelectedCards([]);
      setSearchTerm("");
      setCurrentPage(1);
      setActiveTab("select");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-2xl border-0 shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200 dark:border-gray-700">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Add Cards to List
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-gray-400">
            Select existing cards or create new ones to add to your list.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-gray-700 rounded-xl p-1">
            <TabsTrigger value="select" className="rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">Select Cards</TabsTrigger>
            <TabsTrigger value="create" className="rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">Create New Card</TabsTrigger>
          </TabsList>
          
          <TabsContent value="select" className="space-y-4 mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search cards..."
                  className="pl-12 bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-3 animate-spin" />
                    <p className="text-slate-600 dark:text-gray-400 font-medium">Loading cards...</p>
                  </div>
                ) : filteredCards.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-slate-400 dark:text-gray-500" />
                    </div>
                    <p className="text-slate-600 dark:text-gray-400 font-medium mb-1">No cards found</p>
                    <p className="text-slate-500 dark:text-gray-500 text-sm">Try creating a new card instead</p>
                  </div>
                ) : (
                  <>
                    {currentCards.map((card: any) => (
                      <div
                        key={card.id}
                        className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors border border-slate-100 dark:border-gray-700"
                      >
                        <Checkbox
                          checked={selectedCards.includes(card.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCards([...selectedCards, card.id]);
                            } else {
                              setSelectedCards(
                                selectedCards.filter((id) => id !== card.id)
                              );
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-gray-100 mb-1">
                            {card.word}
                          </p>
                          <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 mb-2">
                            {card.definition}
                          </p>
                          {card.wordList && (
                            <p className="text-slate-400 dark:text-gray-500 text-xs">
                              From list: {card.wordList.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-100 dark:border-gray-700">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                          className="rounded-lg bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                            (pageNum) => (
                              <Button
                                key={pageNum}
                                variant={
                                  pageNum === currentPage ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={cn(
                                  "min-w-[2.5rem] rounded-lg",
                                  pageNum === currentPage
                                    ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                                )}
                              >
                                {pageNum}
                              </Button>
                            )
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                          className="rounded-lg bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={
                    selectedCards.length === 0 || addCardsMutation.isPending
                  }
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {addCardsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Cards...
                    </>
                  ) : (
                    <>
                      Add {selectedCards.length}{" "}
                      {selectedCards.length === 1 ? "Card" : "Cards"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4 mt-6">
            <Form {...createCardForm}>
              <form onSubmit={createCardForm.handleSubmit(handleCreateCard)} className="space-y-6">
                <FormField
                  control={createCardForm.control}
                  name="word"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">Word</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter a word..." 
                          className="bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createCardForm.control}
                  name="definition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-gray-300 font-medium">Definition</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the definition..."
                          className="min-h-[120px] bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 transition-colors resize-none text-gray-900 dark:text-gray-100"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createAndAddCardMutation.isPending}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {createAndAddCardMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Card...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create & Add Card
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function WordListSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-900/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
          <div className="relative p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-32 bg-slate-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="h-5 w-16 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-4 w-48 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-4">
                  <div className="h-3 w-12 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-20 bg-slate-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="h-7 w-12 bg-slate-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="h-7 w-16 bg-slate-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-xl shadow-md p-3 sm:p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="h-5 w-20 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-12 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="space-y-1.5 mb-3">
                <div className="h-3 w-full bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-6 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 w-6 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-gray-700">
                  <div className="h-3 w-16 bg-slate-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
