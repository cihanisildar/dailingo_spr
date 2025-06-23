"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLists } from "@/hooks/useLists";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Book,
  Plus,
  Search,
  Sparkles,
  Users,
  Lock,
  Filter,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function WordListsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all"); // all, public, private
  const [sortBy, setSortBy] = useState("name"); // name, cards, created
  const { getLists } = useLists();
  const { data: lists, isLoading } = useQuery({
    queryKey: ["wordLists"],
    queryFn: () => getLists(),
  });

  if (isLoading) return <WordListsSkeleton />;

  const filteredLists = lists
    ?.filter((list) => {
      const matchesSearch =
        list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterBy === "all" ||
        (filterBy === "public" && list.isPublic) ||
        (filterBy === "private" && !list.isPublic);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "cards":
          return (b._count?.cards || 0) - (a._count?.cards || 0);
        case "created":
          return (
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
          );
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-purple-900/30">
      <div className="space-y-6 sm:space-y-8">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-800 dark:via-purple-800 dark:to-pink-800 rounded-xl sm:rounded-2xl opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-white/10 dark:from-black/40 dark:to-black/10 rounded-xl sm:rounded-2xl" />
          <div className="relative px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
            <div className="space-y-4 sm:space-y-6">
              {/* Header with stats */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 dark:text-yellow-400 flex-shrink-0" />
                  <span className="text-yellow-300 dark:text-yellow-400 font-medium text-xs sm:text-sm tracking-wide uppercase">
                    Vocabulary Management
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-indigo-200 dark:text-indigo-300 text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm whitespace-nowrap">{lists?.length || 0} Lists</span>
                  </div>
                  <div className="w-1 h-1 bg-indigo-300 dark:bg-indigo-400 rounded-full flex-shrink-0" />
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm whitespace-nowrap">Collaborative</span>
                  </div>
                </div>
              </div>

              {/* Title and description */}
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  Your Word Lists
                </h1>
                <p className="text-sm sm:text-base text-indigo-100 dark:text-indigo-200 leading-relaxed max-w-full sm:max-w-2xl">
                  Organize, create, and master your vocabulary with intelligent
                  word lists designed for effective learning.
                </p>
              </div>

              {/* Search bar and controls */}
              <div className="pt-2 sm:pt-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                  {/* Search bar */}
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 sm:left-3.5 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4 sm:w-5 sm:h-5 z-10 transition-colors duration-200" />
                    <SearchInput
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Search your word lists..."
                      className="w-full h-11 sm:h-12 pl-10 sm:pl-12 pr-4 sm:pr-6 pt-1 bg-white/20 dark:bg-white/10 backdrop-blur-sm text-white placeholder:text-white/70 border border-white/20 dark:border-white/15 rounded-lg sm:rounded-xl focus:bg-white/25 dark:focus:bg-white/15 focus:border-white/40 dark:focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 text-sm sm:text-base"
                    />
                  </div>

                  {/* Filter and Sort Controls */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {/* Filter Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 sm:h-12 px-3 sm:px-4 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/15 rounded-lg sm:rounded-xl hover:bg-white/25 dark:hover:bg-white/15 hover:border-white/40 dark:hover:border-white/30 transition-all duration-200 gap-1.5 sm:gap-2 text-white font-medium text-xs sm:text-sm"
                        >
                          <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Filter</span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-32 sm:w-36 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg sm:rounded-xl shadow-2xl"
                      >
                        <DropdownMenuItem
                          onClick={() => setFilterBy("all")}
                          className={`text-gray-800 dark:text-gray-200 rounded-md mx-1 my-0.5 text-sm ${
                            filterBy === "all"
                              ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          All Lists
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setFilterBy("public")}
                          className={`text-gray-800 dark:text-gray-200 rounded-md mx-1 my-0.5 text-sm ${
                            filterBy === "public"
                              ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          Public
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setFilterBy("private")}
                          className={`text-gray-800 dark:text-gray-200 rounded-md mx-1 my-0.5 text-sm ${
                            filterBy === "private"
                              ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          Private
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sort Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 sm:h-12 px-3 sm:px-4 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/15 rounded-lg sm:rounded-xl hover:bg-white/25 dark:hover:bg-white/15 hover:border-white/40 dark:hover:border-white/30 transition-all duration-200 gap-1.5 sm:gap-2 text-white font-medium text-xs sm:text-sm"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Sort</span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-36 sm:w-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg sm:rounded-xl shadow-2xl"
                      >
                        <DropdownMenuItem
                          onClick={() => setSortBy("name")}
                          className={`text-gray-800 dark:text-gray-200 rounded-md mx-1 my-0.5 text-sm ${
                            sortBy === "name"
                              ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          Name A-Z
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("cards")}
                          className={`text-gray-800 dark:text-gray-200 rounded-md mx-1 my-0.5 text-sm ${
                            sortBy === "cards"
                              ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          Most Cards
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("created")}
                          className={`text-gray-800 dark:text-gray-200 rounded-md mx-1 my-0.5 text-sm ${
                            sortBy === "created"
                              ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          Newest
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lists Content */}
        <div className="space-y-4 sm:space-y-5">
          {/* No results - with search */}
          {filteredLists && filteredLists.length === 0 && searchTerm && (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 sm:mb-6">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No lists found
              </h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-sm mx-auto px-4">
                We couldn't find any lists matching "{searchTerm}". Try a
                different search term.
              </p>
            </div>
          )}

          {/* No lists - empty state */}
          {filteredLists && filteredLists.length === 0 && !searchTerm && (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 mb-4 sm:mb-6">
                <Book className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No word lists yet
              </h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-sm mx-auto px-4">
                Create your first word list to start organizing your vocabulary
                learning journey.
              </p>
              <CreateListDialog>
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 hover:from-purple-700 hover:to-indigo-700 dark:hover:from-purple-800 dark:hover:to-indigo-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm sm:text-base">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Create Your First List
                </Button>
              </CreateListDialog>
            </div>
          )}

          {/* Lists with content */}
          {filteredLists && filteredLists.length > 0 && (
            <>
              {/* Header with count and create button */}
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 px-1">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {filteredLists.length}{" "}
                  {filteredLists.length === 1 ? "list" : "lists"} found
                </div>
                <CreateListDialog>
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 hover:from-purple-700 hover:to-indigo-700 dark:hover:from-purple-800 dark:hover:to-indigo-800 text-white px-3 sm:px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 gap-1.5 sm:gap-2 text-sm sm:text-base self-start xs:self-auto">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    New List
                  </Button>
                </CreateListDialog>
              </div>

              {/* Lists Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredLists.map((list) => (
                  <TooltipProvider key={list.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/dashboard/lists/${list.id}`} className="block h-full">
                          <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 p-4 sm:p-6 h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 rounded-lg sm:rounded-xl">
                            <div className="flex flex-col h-full">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">
                                    {list.name}
                                  </h3>
                                  {list.description && (
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                      {list.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge
                                    variant={
                                      list.isPublic ? "default" : "secondary"
                                    }
                                    className={`text-xs px-2 py-1 ${
                                      list.isPublic
                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                                    }`}
                                  >
                                    {list.isPublic ? (
                                      <>
                                        <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                        <span className="hidden xs:inline">Public</span>
                                        <span className="xs:hidden">Pub</span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                        <span className="hidden xs:inline">Private</span>
                                        <span className="xs:hidden">Prv</span>
                                      </>
                                    )}
                                  </Badge>
                                </div>
                              </div>

                              {/* Stats and Progress */}
                              <div className="flex-1 flex items-end">
                                <div className="w-full">
                                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    <span className="flex items-center gap-1 flex-shrink-0">
                                      <Book className="w-3 h-3 sm:w-4 sm:h-4" />
                                      <span className="font-medium">{list._count?.cards || 0}</span>
                                      <span className="hidden xs:inline">words</span>
                                    </span>
                                    {list.createdAt && (
                                      <span className="text-xs text-right ml-2 truncate">
                                        {new Date(list.createdAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: new Date(list.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                        })}
                                      </span>
                                    )}
                                  </div>

                                  {/* Progress bar */}
                                  {(list._count?.cards || 0) > 0 && (
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                      <div
                                        className="bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600 h-1.5 rounded-full transition-all duration-500"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            ((list._count?.cards || 0) / 10) * 100
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-xs p-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm hidden sm:block"
                      >
                        <div>
                          <p className="font-medium">{list.name}</p>
                          {list.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {list.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Click to view and manage this list
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateListDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { createList } = useLists();

  const createListMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      isPublic: boolean;
    }) => {
      return createList(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordLists"] });
      setOpen(false);
      setName("");
      setDescription("");
      setIsPublic(false);
      toast.success("List created successfully");
    },

    onError: (error) => {
      console.error("Error creating list:", error);
      toast.error("Failed to create list");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createListMutation.mutate({ name, description, isPublic });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[95vw] mx-auto rounded-lg sm:rounded-xl">
        <DialogHeader className="space-y-2 sm:space-y-3 text-left">
          <DialogTitle className="text-lg sm:text-xl font-bold">
            Create New Word List
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create a new list to organize your vocabulary cards and start
            learning effectively.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              List Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spanish Vocabulary, TOEFL Words..."
              className="h-10 sm:h-11 text-sm sm:text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Description
              <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(Optional)</span>
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this list is for..."
              className="resize-none text-sm sm:text-base"
              rows={3}
            />
          </div>

          {/* <div className="flex items-start space-x-3 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2 mt-0.5 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <label
                htmlFor="isPublic"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer block"
              >
                Make this list public
              </label>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Public lists can be discovered and used by other learners
              </p>
            </div>
            <div className="flex-shrink-0">
              {isPublic ? (
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              )}
            </div>
          </div> */}

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium text-sm sm:text-base"
              disabled={createListMutation.isPending}
            >
              {createListMutation.isPending ? "Creating..." : "Create List"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WordListsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-purple-900/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-800 dark:via-purple-800 dark:to-pink-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-10">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="h-4 w-32 sm:w-48 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-24 sm:w-32 bg-white/20 rounded animate-pulse" />
            </div>
            <div className="h-8 sm:h-10 w-48 sm:w-64 bg-white/20 rounded animate-pulse" />
            <div className="h-4 sm:h-5 w-full sm:w-96 bg-white/20 rounded animate-pulse" />
            <div className="h-10 sm:h-11 w-full bg-white/20 rounded-lg sm:rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <Card
              key={i}
              className="p-4 sm:p-6 animate-pulse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl"
            >
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  </div>
                  <div className="h-6 w-12 sm:w-16 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16" />
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
