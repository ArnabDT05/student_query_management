import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ShieldAlert } from "lucide-react";

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Unauthorized Access</h1>
          <p className="mt-2 text-slate-600 text-sm">
            You do not have the required permissions to view this page. Please log in with an appropriate account or return to your dashboard.
          </p>
        </div>
        <div className="pt-4 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button asChild>
            <Link to="/">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
