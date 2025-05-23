import Link from "next/link";
import { format } from "date-fns";
import { Card } from "@/types/card";
import { Card as CardUI } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Book } from "lucide-react";
import { cn, generateCardUrl } from "@/lib/utils";

export default function CardsGridView({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Link key={card.id} href={generateCardUrl(card.word, card.id)}>
          <CardUI className="h-full hover:shadow-lg transition-all group border-transparent hover:border-blue-200">
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {card.word}
                </h3>
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
              </div>
              <p className="text-gray-600 flex-grow line-clamp-3 mb-4">
                {card.definition}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {format(new Date(card.nextReview), 'MMM d, yyyy')}
                </div>
                {card.wordList && (
                  <div className="flex items-center">
                    <Book className="w-4 h-4 mr-1" />
                    {card.wordList.name}
                  </div>
                )}
              </div>
            </div>
          </CardUI>
        </Link>
      ))}
    </div>
  );
} 