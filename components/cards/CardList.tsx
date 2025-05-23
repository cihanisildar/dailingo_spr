"use client"

import { useState } from 'react';
import { Card } from '@/types/card';
import { Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useCards } from '@/hooks/useCards';

export default function CardList() {
  const { data: cards, isLoading, error } = useCards();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'word' | 'lastReviewed' | 'nextReview'>('word');

  if (isLoading) return <CardListSkeleton />;
  if (error) return <div>Error loading cards</div>;
  if (!cards) return null;

  const filteredCards = cards
    .filter(card => {
      const matchesSearch = card.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          card.definition.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || card.reviewStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'word') {
        return a.word.localeCompare(b.word);
      } else if (sortBy === 'lastReviewed') {
        return new Date(b.lastReviewed).getTime() - new Date(a.lastReviewed).getTime();
      } else {
        return new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime();
      }
    });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAUSED">Paused</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'word' | 'lastReviewed' | 'nextReview')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="word">Sort by Word</option>
              <option value="lastReviewed">Sort by Last Reviewed</option>
              <option value="nextReview">Sort by Next Review</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Word
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Definition
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Reviewed
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Review
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {card.word}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {card.definition.length > 100 
                      ? `${card.definition.substring(0, 100)}...` 
                      : card.definition}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      card.reviewStatus === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800'
                        : card.reviewStatus === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {card.reviewStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(card.lastReviewed), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(card.nextReview), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a
                      href={`/cards/${card.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cards found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CardListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4">
              <div className="h-4 bg-gray-200 rounded col-span-1" />
              <div className="h-4 bg-gray-200 rounded col-span-2" />
              <div className="h-4 bg-gray-200 rounded col-span-1" />
              <div className="h-4 bg-gray-200 rounded col-span-1" />
              <div className="h-4 bg-gray-200 rounded col-span-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 