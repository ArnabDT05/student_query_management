import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bell, LogOut, Menu, UserCircle, ChevronDown, CheckCircle2 } from "lucide-react";

export function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!error && data) setNotifications(data);
    };
    fetchNotifications();
  }, [user, notifOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    await supabase.from("notifications").update({ is_read: true }).eq("id", notifId);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  };

  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <header
      className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8"
      style={{ background: "#e0e5ec", boxShadow: "0 4px 15px #a3b1c6, 0 -2px 8px #ffffff88" }}
    >
      {/* Mobile menu button */}
      <div className="flex items-center gap-x-4 lg:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          className="nm-btn h-10 w-10 flex items-center justify-center rounded-[10px]"
          style={{ color: "#7c8db5" }}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-end gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-3 lg:gap-x-4">

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              className="nm-btn h-10 w-10 flex items-center justify-center rounded-[10px] relative"
              style={{ color: "#7c8db5" }}
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
              {hasUnread && (
                <span
                  className="absolute top-2 right-2 flex h-2.5 w-2.5 items-center justify-center rounded-full"
                  style={{ background: "#6c63ff", boxShadow: "0 0 0 2px #e0e5ec" }}
                />
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 z-50 mt-3 w-80 nm-dropdown"
                style={{ minWidth: "320px" }}
              >
                <div
                  className="px-4 py-3 flex justify-between items-center"
                  style={{ borderBottom: "1px solid #cdd5e0" }}
                >
                  <h3 className="text-sm font-bold nm-heading">Notifications</h3>
                  {hasUnread && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold nm-primary hover:opacity-80 transition-opacity"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <ul>
                      {notifications.map((notif) => (
                        <li
                          key={notif.id}
                          style={{
                            borderBottom: "1px solid #cdd5e0",
                            background: !notif.is_read ? "#e8ecf3" : "transparent"
                          }}
                        >
                          <button
                            onClick={() => { markAsRead(notif.id); setNotifOpen(false); }}
                            className="w-full text-left block px-4 py-3 transition-colors hover:bg-[#dde3ec] focus:outline-none"
                          >
                            <p className={`text-sm nm-text line-clamp-2 ${!notif.is_read ? "font-semibold" : "font-medium"}`}>
                              {notif.message}
                            </p>
                            <p className="text-xs nm-muted mt-1">
                              {new Date(notif.created_at).toLocaleDateString()} at{" "}
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-4 px-4">
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

          {/* Divider */}
          <div className="hidden lg:block h-6 w-px" style={{ background: "#cdd5e0" }} aria-hidden="true" />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              className="flex items-center gap-x-3 px-3 py-2 rounded-[10px] nm-btn transition-all"
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: "linear-gradient(135deg, #6c63ff, #5a52d5)",
                  color: "#ffffff",
                  boxShadow: "2px 2px 6px #8a84d9"
                }}
              >
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="hidden lg:flex lg:items-center gap-1">
                <span className="text-sm font-semibold nm-heading" aria-hidden="true">
                  {user?.name || "User"}
                </span>
                <ChevronDown className="h-4 w-4 nm-muted" aria-hidden="true" />
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-3 w-56 nm-dropdown">
                <div
                  className="px-4 py-3 flex flex-col gap-1"
                  style={{ borderBottom: "1px solid #cdd5e0" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold nm-heading truncate pr-2">{user?.name}</p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] uppercase tracking-wider"
                      style={{ background: "#6c63ff22", color: "#6c63ff" }}
                    >
                      {user?.role}
                    </span>
                  </div>
                  <p className="text-xs nm-muted truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); navigate(`/${user?.role}/profile`); }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm nm-text font-medium w-full text-left hover:bg-[#dde3ec] transition-colors"
                  >
                    <UserCircle className="h-4 w-4 nm-muted" style={{ color: "#7c8db5" }} />
                    Your Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); logout(); }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium w-full text-left hover:bg-[#fdeae8] transition-colors"
                    style={{ color: "#c0533a" }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
