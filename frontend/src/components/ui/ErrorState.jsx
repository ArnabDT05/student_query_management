import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({ 
  title = "Failed to load data", 
  description = "A network or validation error occurred while communicating with the server.", 
  onRetry 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-4 border border-red-100">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-6">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}
