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
    <aside
      className={cn("flex w-64 flex-col h-screen", className)}
      style={{ background: "#e0e5ec", boxShadow: "6px 0 20px #a3b1c6" }}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6" style={{ borderBottom: "1px solid #cdd5e0" }}>
        <div className="flex items-center gap-3">
          <div
            className="nm-logo flex h-10 w-10 items-center justify-center text-sm"
          >
            SQ
          </div>
          <div>
            <div className="text-sm font-bold nm-heading tracking-tight">SQRRS</div>
            <div className="text-[10px] nm-muted font-medium tracking-wider uppercase">Query System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-x-3 p-3 text-sm font-semibold transition-all duration-200",
                  isActive ? "nm-nav-active nm-primary" : "nm-nav-item nm-text"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "nm-primary" : "nm-muted")}
                  style={{ color: isActive ? "#6c63ff" : undefined }}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User footer */}
      <div className="p-4" style={{ borderTop: "1px solid #cdd5e0" }}>
        <div
          className="rounded-[12px] px-4 py-3"
          style={{ background: "#d8dde8", boxShadow: "inset 3px 3px 7px #a3b1c6, inset -3px -3px 7px #ffffff" }}
        >
          <div className="text-[10px] nm-muted font-bold uppercase tracking-widest mb-1">Logged in as</div>
          <div className="text-sm font-bold nm-heading truncate">{user?.name || "Unknown User"}</div>
          <div
            className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] capitalize mt-1 inline-block"
            style={{
              background: "#6c63ff22",
              color: "#6c63ff",
              letterSpacing: "0.06em"
            }}
          >
            {user?.role}
          </div>
        </div>
      </div>
    </aside>
  );
}
