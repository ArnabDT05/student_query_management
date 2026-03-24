import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

export function Loader({ className, size = "md" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 
        className={cn("animate-spin text-primary-600", sizeClasses[size], className)} 
      />
    </div>
  );
}
