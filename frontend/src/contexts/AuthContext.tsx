<<<<<<< HEAD
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, usersApi, ApiError } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => void;
=======
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authApi, userFromMeta, clearTokens, getAccessToken } from "@/lib/api";
import type { AuthUser } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  /** Call after verifyOtp or login succeeds — stores user in state */
  authenticate: (raw: {
    id: string;
    email: string;
    user_metadata: Record<string, unknown>;
  }) => void;
  logout: () => Promise<void>;
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
<<<<<<< HEAD
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount by fetching /users/me with stored token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
=======
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from stored token on mount
  useEffect(() => {
    const token = getAccessToken();
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
    if (!token) {
      setIsLoading(false);
      return;
    }
<<<<<<< HEAD
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
=======
    authApi
      .me()
      .then((raw) => setUser(userFromMeta(raw)))
      .catch(() => clearTokens())
      .finally(() => setIsLoading(false));
  }, []);

  const authenticate = useCallback(
    (raw: { id: string; email: string; user_metadata: Record<string, unknown> }) => {
      setUser(userFromMeta(raw));
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => null);
    setUser(null);
  }, []);
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f

  return (
    <AuthContext.Provider value={{ user, isLoading, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
