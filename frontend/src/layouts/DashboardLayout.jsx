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
    <div className="flex bg-slate-50 min-h-screen font-sans">
      {/* Mobile sidebar placeholder */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
        <div className="fixed inset-y-0 left-0 z-50 flex w-64 pt-5 pb-4 bg-white">
           <Sidebar className="w-full h-full border-r-0" />
        </div>
      </div>

      {/* Desktop sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Main Content Box */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 focus:outline-none">
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
