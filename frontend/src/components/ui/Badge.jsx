import { cn } from "@/utils/cn";

const variantStyles = {
  open: "bg-slate-100 text-slate-700 border border-slate-200",
  "in progress": "bg-blue-50 text-blue-700 border border-blue-200",
  escalated: "bg-red-50 text-red-700 border border-red-200",
  closed: "bg-green-50 text-green-700 border border-green-200",
};

export function Badge({ children, variant = "open", className }) {
  const normalizedVariant = variant.toLowerCase();
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        variantStyles[normalizedVariant] || variantStyles.open,
        className
      )}
    >
      {children}
    </span>
  );
}
