"use client";

import { useQuery } from "@tanstack/react-query";
import { useLists } from "@/hooks/useLists";
import { WordList } from "@/types/models/wordList";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, Globe } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SearchInput } from "@/components/ui/search-input";

export default function PublicListsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { getLists } = useLists();
  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["publicLists"],
    queryFn: async () => {
      const lists = await getLists(true);
      return lists.filter((list: WordList) => list.isPublic);
    },
  });

  if (isLoading) return <PublicListsSkeleton />;

  const filteredLists = lists?.filter((list: WordList) => 
    list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Public Lists</h1>
            <p className="text-blue-100">Discover vocabulary lists shared by the community.</p>
          </div>
          <div className="w-full">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search public lists..."
              className="w-full bg-white/80 text-gray-800 placeholder:text-gray-500 border-none rounded-full [&>svg]:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredLists?.map((list: WordList) => (
          <Link key={list.id} href={`/dashboard/lists/${list.id}`}>
            <Card className="h-full hover:shadow-lg transition-all group border-transparent hover:border-blue-200">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {list.name}
                  </h3>
                  <Badge className="bg-blue-100 text-blue-800 gap-1">
                    <Globe className="w-4 h-4" />
                    Public
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

      {(!filteredLists || filteredLists.length === 0) && (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <Globe className="w-12 h-12 text-blue-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No public lists available</h3>
            <p className="text-gray-500">
              There are no public lists to display at the moment. Check back later for shared vocabulary lists.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

function PublicListsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8">
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