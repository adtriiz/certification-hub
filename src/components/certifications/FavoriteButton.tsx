import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: "sm" | "default";
}

export const FavoriteButton = ({ isFavorite, onToggle, size = "sm" }: FavoriteButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8",
        isFavorite && "text-destructive hover:text-destructive"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
    </Button>
  );
};
