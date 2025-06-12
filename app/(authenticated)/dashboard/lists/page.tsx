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
import { Book, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function WordListsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { getLists } = useLists();
  const { data: lists, isLoading } = useQuery({
    queryKey: ["wordLists"],
    queryFn: () => getLists()
  });

  if (isLoading) return <WordListsSkeleton />;

  const filteredLists = lists?.filter(list => 
    list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-rose-500 rounded-3xl p-8 text-white">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Word Lists</h1>
            <p className="text-purple-100">Create and manage your vocabulary lists.</p>
          </div>
          <div className="w-full">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search lists..."
              className="w-full bg-white/80 text-gray-800 placeholder:text-gray-500 border-none rounded-full [&>svg]:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create New List Card */}
        <CreateListDialog />

        {/* Lists */}
        {filteredLists?.map((list) => (
          <Link key={list.id} href={`/dashboard/lists/${list.id}`}>
            <Card className="h-full hover:shadow-lg transition-all group border-transparent hover:border-purple-200">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 truncate">
                            {list.name}
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[300px]">
                          <p className="text-sm">{list.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Badge variant={list.isPublic ? "default" : "secondary"} className={list.isPublic ? "bg-purple-100 text-purple-800 flex-shrink-0" : "flex-shrink-0"}>
                    {list.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                {list.description && (
                  <p className="text-gray-600 flex-grow line-clamp-2 mb-4">
                    {list.description}
                  </p>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <Book className="w-4 h-4 mr-2" />
                  {list._count?.cards || 0} cards
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CreateListDialog() {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { createList } = useLists();

  const createListMutation = useMutation({
    mutationFn: (data: { name: string; description: string; isPublic: boolean }) => {
      return createList(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordLists"] });
      setOpen(false);
      toast.success("List created successfully");
    },
    onError: (error) => {
      console.error("Error creating list:", error);
      toast.error("Failed to create list");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createListMutation.mutate({ name, description, isPublic });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="h-full hover:shadow-lg transition-all border-dashed border-2 border-gray-200 hover:border-purple-200 cursor-pointer">
          <div className="p-6 flex flex-col items-center justify-center h-full text-gray-500 hover:text-purple-600">
            <Plus className="h-8 w-8 mb-2" />
            <span className="font-medium">Create New List</span>
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Word List</DialogTitle>
          <DialogDescription>
            Create a new list to organize your vocabulary cards.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
              Make this list public
            </label>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700"
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
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-600 to-rose-500 rounded-3xl p-8">
        <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
        <div className="h-4 w-64 bg-white/20 rounded animate-pulse mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
            <div className="mt-4 flex items-center">
              <div className="h-4 w-4 bg-gray-200 rounded-full mr-2" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 