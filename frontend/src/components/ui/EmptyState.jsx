import { cn } from "@/utils/cn";

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-sm bg-slate-50", className)}>
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-white shadow-sm border border-slate-100">
          <Icon className="h-6 w-6 text-slate-400" />
        </div>
      )}
      <h3 className="mb-1 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mb-4 text-sm text-slate-500 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
