import { cn } from "@/utils/cn";

export function Table({ className, children }) {
  return (
    <div className="w-full overflow-auto rounded-sm border border-slate-200 bg-white">
      <table className={cn("w-full text-sm text-left text-slate-700", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children }) {
  return (
    <thead className={cn("bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children }) {
  return <tbody className={cn("divide-y divide-slate-200", className)}>{children}</tbody>;
}

export function TableRow({ className, children, onClick }) {
  return (
    <tr 
      onClick={onClick}
      className={cn(
        "bg-white transition-all duration-200", 
        !onClick ? "hover:bg-slate-50/50" : "hover:bg-slate-50 cursor-pointer active:bg-slate-100/80",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children }) {
  return (
    <th className={cn("px-6 py-3 font-medium tracking-wider", className)}>
      {children}
    </th>
  );
}

export function TableCell({ className, children }) {
  return (
    <td className={cn("px-6 py-4 whitespace-nowrap", className)}>
      {children}
    </td>
  );
}
