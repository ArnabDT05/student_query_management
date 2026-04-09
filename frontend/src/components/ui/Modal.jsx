import { useEffect } from "react";
import { cn } from "@/utils/cn";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export function Modal({ isOpen, onClose, title, children, className }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 backdrop-blur-sm transition-opacity"
        style={{ background: "rgba(163,177,198,0.55)" }}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg flex flex-col max-h-[90vh]",
          "nm-card animate-in fade-in zoom-in-95 duration-200",
          className
        )}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #cdd5e0" }}
        >
          <h2 className="text-lg font-bold nm-heading">{title}</h2>
          <button
            onClick={onClose}
            className="nm-btn h-8 w-8 flex items-center justify-center rounded-[8px] nm-muted hover:nm-text transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
