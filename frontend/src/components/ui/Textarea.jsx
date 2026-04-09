import { forwardRef } from "react";
import { cn } from "@/utils/cn";

export const Textarea = forwardRef(({ className, label, error, id, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold nm-subheading">
          {label}
        </label>
      )}
      <textarea
        id={id}
        ref={ref}
        className={cn(
          "nm-input px-4 py-3 text-sm resize-y min-h-[100px]",
          error && "error",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium" style={{ color: "#e17055" }}>{error}</p>}
    </div>
  );
});

Textarea.displayName = "Textarea";
