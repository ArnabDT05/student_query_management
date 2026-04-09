import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

export const Button = forwardRef(({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  children,
  asChild,
  ...props
}, ref) => {

  const base = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none";

  const variants = {
    primary:   "nm-btn-primary text-white",
    secondary: "nm-btn text-[#4a4a6a]",
    danger:    "nm-btn-danger text-white",
    ghost:     "nm-nav-item text-[#7c8db5] hover:text-[#4a4a6a] px-3",
  };

  const sizes = {
    sm:   "h-8 px-3 text-xs rounded-[8px]",
    md:   "h-10 px-5 text-sm rounded-[10px]",
    lg:   "h-12 px-7 text-base rounded-[12px]",
    icon: "h-10 w-10 rounded-[10px]",
  };

  // When asChild is true, we render the child el directly with our styles
  if (asChild) {
    const child = children;
    return (
      <span
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {child}
      </span>
    );
  }

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

Button.displayName = "Button";
