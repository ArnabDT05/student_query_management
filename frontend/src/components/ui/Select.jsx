import { forwardRef } from "react";
import { cn } from "@/utils/cn";

export const Select = forwardRef(({ className, label, error, id, children, ...props }, ref) => {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm transition-all duration-200 hover:border-slate-400 appearance-none",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

Select.displayName = "Select";
