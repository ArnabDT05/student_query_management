import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bell, LogOut, Menu, UserCircle, ChevronDown, CheckCircle2 } from "lucide-react";

export function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Profile dropdown state
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Notification dropdown state
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!error && data) {
        setNotifications(data);
      }
    };
    
    // Fetch initially
    fetchNotifications();
    
    // Optionally we could poll, but the user requested simple logic with no real-time constraint.
  }, [user, notifOpen]); // Re-fetch whenever they open the dropdown

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (notifId) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    // Database update
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  };

  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-x-4 lg:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          className="-m-2.5 p-2.5 text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-600 rounded-sm"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-end gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button 
              type="button" 
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 relative"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
              {hasUnread && (
                <span className="absolute top-2 right-2 flex h-2 w-2 items-center justify-center rounded-full bg-primary-600 ring-2 ring-white"></span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 z-50 mt-2.5 w-80 origin-top-right rounded-sm bg-white shadow-lg ring-1 ring-slate-900/5 focus:outline-none overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  {hasUnread && (
                    <button onClick={markAllAsRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Mark all as read</button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <ul className="divide-y divide-slate-100">
                      {notifications.map((notif) => (
                        <li key={notif.id} className={`hover:bg-slate-50 transition-colors ${!notif.is_read ? "bg-primary-50/30" : ""}`}>
                          <button 
                            onClick={() => {
                              markAsRead(notif.id);
                              setNotifOpen(false);
                            }}
                            className="w-full text-left block px-4 py-3 focus:outline-none"
                          >
                            <p className={`text-sm text-slate-800 line-clamp-2 ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>
                              {notif.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6">
                       <EmptyState 
                         icon={CheckCircle2} 
                         title="All caught up!" 
                         description="You have no new notifications right now."
                       />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" aria-hidden="true" />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              type="button"
              className="flex items-center gap-x-3 p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-600 hover:bg-slate-50 transition-colors"
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
            >
              <UserCircle className="h-8 w-8 text-slate-400" />
              <span className="hidden lg:flex lg:items-center">
                <span className="text-sm font-medium leading-6 text-slate-900" aria-hidden="true">
                  {user?.name || "Student"}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 text-slate-400" aria-hidden="true" />
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-2.5 w-56 origin-top-right rounded-sm bg-white py-2 shadow-lg ring-1 ring-slate-900/5 focus:outline-none">
                <div className="px-4 py-3 border-b border-slate-100 mb-1 bg-slate-50/50 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 truncate pr-2">{user?.name}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider bg-slate-200 text-slate-700">
                      {user?.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                     setProfileOpen(false);
                     navigate(`/${user?.role}/profile`);
                  }}
                  className="block px-4 py-2 text-sm leading-6 text-slate-700 hover:bg-slate-50 w-full text-left transition-colors font-medium"
                >
                  Your profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                     setProfileOpen(false);
                     logout();
                  }}
                  className="block px-4 py-2 text-sm leading-6 text-red-600 hover:bg-slate-50 w-full text-left flex items-center transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </button>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </header>
  );
}
