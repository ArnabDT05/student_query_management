/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { checkAndEscalateTickets } from "@/utils/sla";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const mapSupabaseUser = async (supabaseUser) => {
    // Fetch the detailed user row from public.users mapping standard credentials
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      // Fallback to metadata if the trigger hasn't completed yet
      const role = supabaseUser.user_metadata?.role || "student";
      const name = supabaseUser.user_metadata?.name || supabaseUser.email.split("@")[0];
      setUser({ id: supabaseUser.id, email: supabaseUser.email, name, role });
      return;
    }

    setUser({
      id: profile.id,
      email: supabaseUser.email,
      name: profile.name,
      role: profile.role,
      department: profile.department
    });
  };

  useEffect(() => {
    // Check active session on mount
    const initializeAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth session error:", error);
      }
      
      if (session?.user) {
        await mapSupabaseUser(session.user);
        checkAndEscalateTickets();
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await mapSupabaseUser(session.user);
          if (_event === 'SIGNED_IN') {
             checkAndEscalateTickets();
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- TEST FLOW 1 & 2 & 3: Login ---
  const login = async (email, password) => {
    console.log(`[TEST FLOW: AUTH] Attempting login for email: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error(`[TEST FLOW: AUTH] Login purely rejected by Supabase:`, error);
      throw error;
    }

    // Role check and sync
    console.log(`[TEST FLOW: AUTH] Login Success. UUID: ${data.user.id}. Fetching role...`);
    const { data: roleData, error: roleError } = await supabase
      .from("users")
      .select("role, name")
      .eq("id", data.user.id)
      .single();

    if (roleError || !roleData) {
      console.warn(`[TEST FLOW: AUTH] Warning: Native role mapping not found! Falling back to raw user_metadata.`);
      const fetchedUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || "Unknown User",
        role: data.user.user_metadata?.role || "student", 
      };
      setUser(fetchedUser);
      console.log(`[TEST FLOW: AUTH] Final Session Loaded (Metadata Fallback):`, fetchedUser);
      return { user: fetchedUser };
    }

    const fetchedUser = {
      id: data.user.id,
      email: data.user.email,
      name: roleData.name,
      role: roleData.role,
    };
    
    console.log(`[TEST FLOW: AUTH] Final Session Loaded (DB Verified):`, fetchedUser);
    setUser(fetchedUser);
    return { user: fetchedUser };
  };

  const signUp = async (email, password, role, name, department) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name,
          department
        }
      }
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
      return;
    }
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, isAuthenticated: !!user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
