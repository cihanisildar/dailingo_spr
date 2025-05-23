import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { ReviewStatus } from "@/types/card";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CardItemProps {
  id: string;
  word: string;
  definition: string;
  nextReview: string;
  reviewStatus: ReviewStatus;
  viewMode: "grid" | "list";
}

export function CardItem({ id, word, definition, nextReview, reviewStatus, viewMode }: CardItemProps) {
  if (viewMode === "list") {
    return (
      <Link href={`/dashboard/cards/${id}`}>
        <Card className="group hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {word}
                        </h3>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[300px]">
                        <p className="text-sm">{word}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 flex-shrink-0 ml-2"
                >
                  {reviewStatus}
                </Badge>
              </div>
              <p className="text-gray-600 mt-2 line-clamp-2">{definition}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Next review: {format(new Date(nextReview), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/dashboard/cards/${id}`}>
      <Card className="group hover:shadow-md transition-all duration-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {word}
                        </h3>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[300px]">
                        <p className="text-sm">{word}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 flex-shrink-0 ml-2"
                >
                  {reviewStatus}
                </Badge>
              </div>
              <p className="text-gray-600 mb-3 line-clamp-2">{definition}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Next review: {format(new Date(nextReview), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
} 