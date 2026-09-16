import { useSyncExternalStore } from "react";
import { DEFAULT_WEIGHTS, detectConflicts, detectGaps, recommend } from "./engine";
import { STANDARDS } from "./standards";
import type {
  Analysis,
  AppState,
  Feedback,
  Review,
  Standard,
  User,
  Weights,
} from "./types";

import { pushToSupabase, pullFromSupabase } from "./sync";

const KEY = "manakx.state.v2";

// AppState is now defined in types.ts to avoid circular imports
export type { AppState };

/** Baseline synthetic counters so the demo dashboard reads like a live deployment. */
export const BASELINE = {
  analyses: 236,
  standardsRecommended: 1216,
  gaps: 351,
  reviews: 176,
  acceptedReviews: 153,
};

function seedState(): AppState {
  return {
    user: null,
    analyses: [],
    reviews: [],
    feedback: [],
    standards: STANDARDS,
    weights: DEFAULT_WEIGHTS,
    theme: "light",
    compare: [],
  };
}

let state: AppState = seedState();
let hydrated = false;
let seededToSupabase = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        user: state.user,
        analyses: state.analyses,
        reviews: state.reviews,
        feedback: state.feedback,
        standards: state.standards,
        weights: state.weights,
        theme: state.theme,
      }),
    );
  } catch {
    /* storage unavailable — prototype continues in memory */
  }

  // Push to Supabase asynchronously in the background
  pushToSupabase(state).catch((err) => console.error("Supabase push error:", err));
}

/**
 * Seeds Supabase with the initial demo data if the DB tables are empty.
 * Then pulls everything back from Supabase so the app uses the DB as source of truth.
 */
async function seedAndPullFromSupabase() {
  if (seededToSupabase) return;
  seededToSupabase = true;

  try {
    // Check if Supabase already has data
    const remoteState = await pullFromSupabase();

    if (remoteState && remoteState.analyses && remoteState.analyses.length > 0) {
      // Supabase has data — use it as source of truth
      console.log(`[ManakX] Loaded ${remoteState.analyses.length} analyses from Supabase`);
      state = {
        ...state,
        analyses: remoteState.analyses,
        standards: remoteState.standards || state.standards,
        reviews: remoteState.reviews || state.reviews,
        feedback: remoteState.feedback || state.feedback,
        compare: [],
      };
      emit();
    } else {
      // Supabase is empty — push the seed data
      console.log("[ManakX] Supabase is empty, seeding with demo data...");
      await pushToSupabase(state);
      console.log("[ManakX] Seed data pushed to Supabase successfully");
    }
  } catch (err) {
    console.error("[ManakX] Supabase sync error:", err);
  }
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      state = { ...state, ...parsed, compare: [] };
    }
  } catch {
    /* ignore corrupt state */
  }
  applyTheme(state.theme);
  emit();

  // Connect to Supabase: seed if empty, pull if it has data
  seedAndPullFromSupabase();

  // Keep user in sync with real auth session
  import("../../lib/supabase").then(({ supabase }) => {
    if (!supabase) return;
    
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        import("../../lib/auth").then(({ getProfile }) => {
          getProfile(session.user.id).then((profile) => {
            if (profile) {
              state = { ...state, user: profile };
              emit();
            }
          });
        });
      } else {
        state = { ...state, user: null };
        emit();
      }
    });

    // Listen to changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { getProfile } = await import("../../lib/auth");
        const profile = await getProfile(session.user.id);
        if (profile) {
          state = { ...state, user: profile };
          emit();
        }
      } else {
        state = { ...state, user: null };
        emit();
      }
    });
  });
}

export function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function set(updater: (s: AppState) => AppState) {
  state = updater(state);
  persist();
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => state;

export function useStore(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* ---------------------------- actions ---------------------------- */

export const actions = {
  login(user: User) {
    set((s) => ({ ...s, user }));
  },
  logout() {
    set((s) => ({ ...s, user: null }));
  },
  setTheme(theme: "light" | "dark") {
    applyTheme(theme);
    set((s) => ({ ...s, theme }));
  },
  toggleTheme() {
    actions.setTheme(state.theme === "dark" ? "light" : "dark");
  },
  addAnalysis(a: Analysis) {
    set((s) => ({ ...s, analyses: [a, ...s.analyses] }));
  },
  updateAnalysis(id: string, patch: Partial<Analysis>) {
    set((s) => ({
      ...s,
      analyses: s.analyses.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  },
  /** Re-run matching for an analysis after its requirements were edited. */
  recompute(id: string) {
    set((s) => ({
      ...s,
      analyses: s.analyses.map((a) => {
        if (a.id !== id) return a;
        const recommendations = recommend(a.requirements, a.category, a.product, s.weights, s.standards);
        return {
          ...a,
          recommendations,
          gaps: detectGaps(a.requirements),
          conflicts: detectConflicts(a.specText, a.requirements),
        };
      }),
    }));
  },
  upsertReview(review: Review) {
    set((s) => {
      const existing = s.reviews.find(
        (r) => r.analysisId === review.analysisId && r.standardId === review.standardId,
      );
      const reviews = existing
        ? s.reviews.map((r) => (r.id === existing.id ? { ...r, ...review, id: existing.id } : r))
        : [review, ...s.reviews];
      const analyses = s.analyses.map((a) =>
        a.id === review.analysisId && a.status !== "APPROVED"
          ? { ...a, status: review.decision === "Approved" ? ("APPROVED" as const) : ("UNDER_REVIEW" as const) }
          : a,
      );
      return { ...s, reviews, analyses };
    });
  },
  addFeedback(fb: Feedback) {
    set((s) => ({ ...s, feedback: [fb, ...s.feedback] }));
  },
  setWeights(weights: Weights) {
    set((s) => ({ ...s, weights }));
  },
  saveStandard(std: Standard) {
    set((s) => ({
      ...s,
      standards: s.standards.some((x) => x.id === std.id)
        ? s.standards.map((x) => (x.id === std.id ? std : x))
        : [std, ...s.standards],
    }));
  },
  toggleStandardStatus(id: string) {
    set((s) => ({
      ...s,
      standards: s.standards.map((x) =>
        x.id === id
          ? { ...x, status: x.status === "Active — Demo" ? "Deprecated — Demo" : "Active — Demo" }
          : x,
      ),
    }));
  },
  setCompare(ids: string[]) {
    set((s) => ({ ...s, compare: ids.slice(0, 4) }));
  },
  toggleCompare(id: string) {
    set((s) => ({
      ...s,
      compare: s.compare.includes(id)
        ? s.compare.filter((x) => x !== id)
        : [...s.compare, id].slice(0, 4),
    }));
  },
  resetDemoData() {
    state = seedState();
    persist();
    applyTheme(state.theme);
    emit();
  },
};

export function getState() {
  return state;
}
