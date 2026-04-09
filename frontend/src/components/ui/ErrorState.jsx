import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({
  title = "Failed to load data",
  description = "A network or validation error occurred while communicating with the server.",
  onRetry
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div
        className="h-14 w-14 rounded-[14px] flex items-center justify-center mb-5"
        style={{ background: "#fdeae8", boxShadow: "4px 4px 10px #d0b0ac, -4px -4px 10px #ffffff" }}
      >
        <AlertCircle className="h-6 w-6" style={{ color: "#c0533a" }} />
      </div>
      <h3 className="text-base font-bold nm-heading">{title}</h3>
      <p className="mt-2 text-sm nm-muted max-w-sm">{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-6">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}
