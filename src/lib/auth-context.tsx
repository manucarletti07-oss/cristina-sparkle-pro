import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ADMIN_CREDENTIALS } from "./config";
import { getAuth, setAuth as setAuthLs } from "./storage";

type AuthCtx = {
  isAuth: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(getAuth());
    const handler = () => setIsAuth(getAuth());
    window.addEventListener("auth-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("auth-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const login = (email: string, password: string) => {
    const ok =
      email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
      password === ADMIN_CREDENTIALS.password;
    if (ok) {
      setAuthLs(true);
      setIsAuth(true);
    }
    return ok;
  };

  const logout = () => {
    setAuthLs(false);
    setIsAuth(false);
  };

  return <Ctx.Provider value={{ isAuth, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}