import { cn } from "@/utils/cn";

export function Table({ className, children }) {
  return (
    <div className="w-full overflow-auto rounded-[14px]" style={{ boxShadow: "inset 3px 3px 8px #a3b1c6, inset -3px -3px 8px #ffffff" }}>
      <table className={cn("w-full text-sm text-left", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children }) {
  return (
    <thead className={cn("nm-table-header", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children }) {
  return (
    <tbody className={cn("", className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "nm-table-row",
        onClick && "nm-table-row-clickable",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children }) {
  return (
    <th className={cn("px-6 py-3 font-bold tracking-wider", className)}>
      {children}
    </th>
  );
}

export function TableCell({ className, children }) {
  return (
    <td className={cn("px-6 py-4 whitespace-nowrap nm-text", className)}>
      {children}
    </td>
  );
}
