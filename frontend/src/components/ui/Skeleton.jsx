import { cn } from "@/utils/cn";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("nm-skeleton", className)}
      {...props}
    />
  );
}
