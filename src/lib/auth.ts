import { useState, useEffect, useCallback } from "react";
import { supabase, hasSupabaseConfig } from "./supabase";
import type { Role, User } from "./manakx/types";
import type { Session } from "@supabase/supabase-js";

/* ---------- Auth functions ---------- */

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: Role,
) {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getProfile(userId: string): Promise<User | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as Role,
    approved: data.approved,
  };
}

/* ---------- useAuth hook ---------- */

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth(): AuthState & {
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!supabase) {
      setState({ user: null, session: null, loading: false });
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setState({ user: profile, session, loading: false });
      } else {
        setState({ user: null, session: null, loading: false });
      }
    } catch {
      setState({ user: null, session: null, loading: false });
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setState({ user: null, session: null, loading: false });
      return;
    }

    // Initial load
    refresh();

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setState({ user: profile, session, loading: false });
      } else {
        setState({ user: null, session: null, loading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  return { ...state, refresh };
}
