/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { checkAndEscalateTickets } from "@/utils/sla";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const initRef = useRef(false);

  // Compare user objects to avoid unnecessary state updates
  const updateIfChanged = (newUser) => {
    setUser(prev => {
      if (!newUser && !prev) return null;
      if (newUser && prev && 
          newUser.id === prev.id && 
          newUser.role === prev.role && 
          newUser.email === prev.email) {
        return prev; // No change
      }
      return newUser;
    });
  };

  const mapSupabaseUser = async (supabaseUser) => {
    if (!supabaseUser) return null;
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.warn("Using metadata fallback for user:", supabaseUser.id);
        const fetched = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.name || supabaseUser.email.split("@")[0],
          role: supabaseUser.user_metadata?.role || "student"
        };
        updateIfChanged(fetched);
        return fetched;
      }

      const fetched = {
        id: profile.id,
        email: supabaseUser.email,
        name: profile.name,
        role: profile.role,
        department: profile.department
      };
      updateIfChanged(fetched);
      return fetched;
    } catch (e) {
      console.error("Map profile failure:", e);
      return null;
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Safety timeout: If auth takes > 10s, stop loading to prevent white screen
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth initialization timed out.");
        setLoading(false);
      }
    }, 10000);

    const initializeAuth = async () => {
      console.log("🕵️ [AUTH] Initializing session...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          console.log("👤 [AUTH] Detected active session for:", session.user.email);
          await mapSupabaseUser(session.user);
          // Run background tasks without blocking the UI
          checkAndEscalateTickets().catch(err => console.error("Background SLA Error:", err));
        } else {
          console.log("🚪 [AUTH] No active session found.");
        }
      } catch (err) {
        console.error("❌ Critical Auth Init Failure:", err);
      } finally {
        setLoading(false);
        console.log("🏁 [AUTH] Initialization complete.");
        clearTimeout(timeout);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AUTH EVENT] ${event}`);
        if (session?.user) {
          await mapSupabaseUser(session.user);
          if (event === 'SIGNED_IN') {
             checkAndEscalateTickets();
          }
        } else {
          updateIfChanged(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const u = await mapSupabaseUser(data.user);
    return { user: u };
  };

  const signUp = async (email, password, role, name, department) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { role, name, department } }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    updateIfChanged(null);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e0e5ec]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Initializing Session...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
