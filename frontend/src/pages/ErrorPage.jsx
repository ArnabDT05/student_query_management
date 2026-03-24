import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export function ErrorPage({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white border border-slate-200 shadow-sm rounded-sm p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-slate-600 text-sm">
            An unexpected error occurred in the application. Our team has been notified.
          </p>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-sm text-left overflow-x-auto">
            <p className="text-xs text-slate-700 font-mono break-all">{error.toString()}</p>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <Button onClick={resetErrorBoundary} className="w-full sm:w-auto">
            Try Again
          </Button>
          <Button variant="secondary" asChild className="w-full sm:w-auto">
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
