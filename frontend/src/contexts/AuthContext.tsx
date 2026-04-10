import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, usersApi, ApiError } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount by fetching /users/me with stored token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    usersApi
      .me()
      .then((u) => setUser(u as User))
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await authApi.login({ email, password });
      const u = await usersApi.me();
      setUser(u as User);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<boolean> => {
    try {
      await authApi.register({ email, password, fullName });
      await authApi.login({ email, password });
      const u = await usersApi.me();
      setUser(u as User);
      return true;
    } catch (e) {
      // 409 = email already registered
      if (e instanceof ApiError && e.status === 409) return false;
      return false;
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
