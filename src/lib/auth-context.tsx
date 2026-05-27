import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  isAuth: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuth(!!data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuth(!!session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (!error) {
      setIsAuth(true);
      setLoading(false);
      return true;
    }
    // Primera vez: intentar registrar la cuenta de admin
    if (error.message?.toLowerCase().includes("invalid")) {
      const { error: signErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signErr) return false;
      const { error: retry } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (!retry) {
        setIsAuth(true);
        setLoading(false);
        return true;
      }
      return false;
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return <Ctx.Provider value={{ isAuth, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}