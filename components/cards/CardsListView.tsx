import Link from "next/link";
import { format } from "date-fns";
import { Book, CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, generateCardUrl } from "@/lib/utils";
import { Card } from "@/types/card";

export default function CardsListView({ cards }: { cards: Card[] }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="min-w-full divide-y divide-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
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
                Next Review
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cards.map((card) => (
              <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={generateCardUrl(card.word, card.id)} className="group">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {card.word}
                    </div>
                    {card.wordList && (
                      <div className="text-xs text-gray-500 mt-1">
                        <Book className="inline-block w-3 h-3 mr-1" />
                        {card.wordList.name}
                      </div>
                    )}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 line-clamp-2">
                    {card.definition}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    variant={card.reviewStatus === 'COMPLETED' ? 'success' : 'default'}
                    className={cn(
                      "capitalize",
                      card.reviewStatus === 'ACTIVE' && "bg-blue-100 text-blue-800",
                      card.reviewStatus === 'PAUSED' && "bg-gray-100 text-gray-800"
                    )}
                  >
                    {card.reviewStatus.toLowerCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    <Clock className="inline-block w-3 h-3 mr-1" />
                    {format(new Date(card.nextReview), 'MMM d, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-emerald-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{card.successCount}</span>
                    </div>
                    <div className="flex items-center text-blue-600">
                      <XCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{card.failureCount}</span>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 