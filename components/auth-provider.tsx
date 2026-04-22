"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

type AuthContextValue = {
  authEnabled: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  updateProfile: (fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const authEnabled = Boolean(supabase);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(authEnabled);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isActive) {
        return;
      }

      if (error) {
        setSession(null);
      } else {
        setSession(data.session);
      }

      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [authEnabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authEnabled,
      isLoading,
      session,
      user: session?.user ?? null,
      signIn: async (email: string, password: string) => {
        if (!supabase) {
          return { error: "Supabase Auth n'est pas configure." };
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        return { error: error?.message ?? null };
      },
      updateProfile: async (fullName: string) => {
        if (!supabase) {
          return { error: "Supabase Auth n'est pas configure." };
        }

        const sanitizedName = fullName.trim();
        const { data, error } = await supabase.auth.updateUser({
          data: {
            full_name: sanitizedName,
            name: sanitizedName,
          },
        });

        if (!error && data.user) {
          setSession((current) => (current ? { ...current, user: data.user } : current));
        }

        return { error: error?.message ?? null };
      },
      signOut: async () => {
        if (!supabase) {
          return;
        }

        await supabase.auth.signOut();
      },
    }),
    [authEnabled, isLoading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
