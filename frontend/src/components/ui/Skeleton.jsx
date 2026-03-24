import { cn } from "@/utils/cn";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-slate-200", className)}
      {...props}
    />
  );
}
