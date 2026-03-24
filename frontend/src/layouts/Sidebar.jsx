import { cn } from "@/utils/cn";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  MessageSquarePlus, 
  Ticket, 
  Settings, 
  Users,
  BarChart3
} from "lucide-react";

export function Sidebar({ className }) {
  const { user } = useAuth();
  const location = useLocation();

  const getNavItems = () => {
    switch (user?.role) {
      case "student":
        return [
          { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
          { name: "New Query", href: "/student/new-query", icon: MessageSquarePlus },
          { name: "My Tickets", href: "/student/tickets", icon: Ticket },
        ];
      case "staff":
        return [
          { name: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
          { name: "Assigned Tickets", href: "/staff/tickets", icon: Ticket },
        ];
      case "admin":
        return [
          { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
          { name: "All Tickets", href: "/admin/tickets", icon: Ticket },
          { name: "Manage Categories", href: "/admin/categories", icon: Settings },
          { name: "Reports", href: "/admin/reports", icon: BarChart3 },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className={cn("flex w-64 flex-col border-r border-slate-200 bg-white h-screen", className)}>
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary-600 text-white font-bold">
            SQ
          </div>
          <span className="text-sm font-semibold text-slate-900 tracking-tight">Query System</span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-x-3 rounded-sm p-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-600"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-200 mt-auto">
        <div className="text-xs text-slate-500 font-medium px-2 uppercase tracking-wider mb-2">Logged in as</div>
        <div className="px-2 text-sm text-slate-900 truncate">
          {user?.name || "Unknown User"}
        </div>
        <div className="px-2 text-xs text-slate-500 capitalize">
          {user?.role} Role
        </div>
      </div>
    </aside>
  );
}
