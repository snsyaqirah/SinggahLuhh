import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { userFromMeta } from "@/lib/api";
import type { AuthUser } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  /** Manually set user state after login/OTP — onAuthStateChange also fires automatically */
  authenticate: (raw: {
    id: string;
    email: string;
    user_metadata: Record<string, unknown>;
  }) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session from localStorage (sync, no network call)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(userFromMeta({
          id: session.user.id,
          email: session.user.email!,
          user_metadata: session.user.user_metadata,
        }));
      }
      setIsLoading(false);
    });

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(userFromMeta({
          id: session.user.id,
          email: session.user.email!,
          user_metadata: session.user.user_metadata,
        }));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const authenticate = useCallback(
    (raw: { id: string; email: string; user_metadata: Record<string, unknown> }) => {
      setUser(userFromMeta(raw));
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

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
