import { cn } from "@/utils/cn";

const variantStyles = {
  open: "nm-badge nm-badge-open",
  "in progress": "nm-badge nm-badge-progress",
  escalated: "nm-badge nm-badge-escalated",
  closed: "nm-badge nm-badge-closed",
  low: "nm-badge nm-badge-progress",
  medium: "nm-badge",
  high: "nm-badge nm-badge-escalated",
};

export function Badge({ children, variant = "open", className }) {
  const normalizedVariant = variant?.toLowerCase() ?? "open";

  return (
    <span
      className={cn(
        "inline-flex items-center",
        variantStyles[normalizedVariant] ?? variantStyles.open,
        className
      )}
    >
      {children}
    </span>
  );
}
