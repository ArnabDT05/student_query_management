import { cn } from "@/utils/cn";

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {Icon && (
        <div
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-[14px]"
          style={{ background: "#e0e5ec", boxShadow: "5px 5px 12px #a3b1c6, -5px -5px 12px #ffffff" }}
        >
          <Icon className="h-6 w-6" style={{ color: "#7c8db5" }} />
        </div>
      )}
      <h3 className="mb-1 text-sm font-bold nm-heading">{title}</h3>
      <p className="mb-4 text-sm nm-muted max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
