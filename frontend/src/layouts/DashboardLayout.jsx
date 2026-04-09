import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { UnauthorizedPage } from "@/pages/UnauthorizedPage";

export function DashboardLayout({ allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <UnauthorizedPage />;
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "#e0e5ec" }}>
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div
          className="fixed inset-0 backdrop-blur-sm transition-opacity"
          style={{ background: "rgba(163,177,198,0.6)" }}
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 z-50 w-64" style={{ background: "#e0e5ec" }}>
          <Sidebar className="w-full h-full" />
        </div>
      </div>

      {/* Desktop sidebar — fixed to viewport, never scrolls */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30 w-64">
        <Sidebar className="w-full h-full" />
      </div>

      {/* Main Content — offset by sidebar width on desktop */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main
          className="flex-1 px-4 py-8 sm:px-6 lg:px-8 focus:outline-none"
          style={{ background: "#e0e5ec" }}
        >
          <div
            key={location.pathname}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
