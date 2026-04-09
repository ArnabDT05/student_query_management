import { forwardRef } from "react";
import { cn } from "@/utils/cn";

export const Select = forwardRef(({ className, label, error, id, children, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold nm-subheading">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={cn(
          "nm-input h-11 px-4 py-2 text-sm appearance-none cursor-pointer",
          error && "error",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs font-medium" style={{ color: "#e17055" }}>{error}</p>}
    </div>
  );
});

Select.displayName = "Select";
