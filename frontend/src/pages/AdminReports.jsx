import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function AdminReports() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Generate and view detailed system analytics.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden p-12">
        <EmptyState 
          icon={BarChart3}
          title="Reports Module Coming Soon"
          description="The advanced reporting and full analytics dashboard is currently under construction and will be available in the next release."
        />
      </div>
    </div>
  );
}
