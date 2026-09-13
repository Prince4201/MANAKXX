/**
 * Real-time Supabase data hooks for dashboards.
 * Replaces the BASELINE synthetic counters with live database queries.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ------------------------------------------------------------------
// Generic count helper
// ------------------------------------------------------------------
async function countRows(table: string, filters?: Record<string, string>): Promise<number> {
  if (!supabase) return 0;
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filters) {
    for (const [col, val] of Object.entries(filters)) {
      query = query.eq(col, val);
    }
  }
  const { count, error } = await query;
  if (error) {
    console.error(`[useRealtime] countRows(${table}) error:`, error.message);
    return 0;
  }
  return count ?? 0;
}

// ------------------------------------------------------------------
// Admin Dashboard Stats
// ------------------------------------------------------------------
export type AdminStats = {
  totalUsers: number;
  pendingOfficers: number;
  pendingVendors: number;
  activeUsers: number;
  officerCount: number;
  reviewerCount: number;
  vendorCount: number;
  adminCount: number;
  totalStandards: number;
  activeStandards: number;
  totalAnalyses: number;
  totalReviews: number;
  totalFeedback: number;
};

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }

    const [
      totalUsers,
      pendingOfficers,
      pendingVendors,
      activeUsers,
      officerCount,
      reviewerCount,
      vendorCount,
      adminCount,
      totalStandards,
      activeStandards,
      totalAnalyses,
      totalReviews,
      totalFeedback,
    ] = await Promise.all([
      countRows("profiles"),
      countRows("profiles", { status: "PENDING_APPROVAL", role: "Government Procurement Officer" }),
      countRows("profiles", { status: "PENDING_REVIEW", role: "Vendor/Supplier" }),
      countRows("profiles", { status: "ACTIVE" }),
      countRows("profiles", { role: "Government Procurement Officer" }),
      countRows("profiles", { role: "Technical Reviewer" }),
      countRows("profiles", { role: "Vendor/Supplier" }),
      countRows("profiles", { role: "Admin" }),
      countRows("standards"),
      countRows("standards", { status: "Active — Demo" }),
      countRows("analyses"),
      countRows("reviews"),
      countRows("feedback"),
    ]);

    setStats({
      totalUsers,
      pendingOfficers,
      pendingVendors,
      activeUsers,
      officerCount,
      reviewerCount,
      vendorCount,
      adminCount,
      totalStandards,
      activeStandards,
      totalAnalyses,
      totalReviews,
      totalFeedback,
    });
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, refresh };
}

// ------------------------------------------------------------------
// Reviewer Dashboard Stats
// ------------------------------------------------------------------
export type ReviewerStats = {
  pendingReviewCount: number;
  completedReviews: number;
  approvedCount: number;
  rejectedCount: number;
  modifiedCount: number;
  pendingVendors: number;
};

export function useReviewerStats() {
  const [stats, setStats] = useState<ReviewerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }

    const [
      pendingReviewCount,
      approvedCount,
      rejectedCount,
      modifiedCount,
      pendingVendors,
    ] = await Promise.all([
      countRows("analyses", { status: "Needs Review" }),
      countRows("reviews", { decision: "Approved" }),
      countRows("reviews", { decision: "Rejected" }),
      countRows("reviews", { decision: "Review Requested" }),
      countRows("profiles", { status: "PENDING_REVIEW", role: "Vendor/Supplier" }),
    ]);

    setStats({
      pendingReviewCount,
      completedReviews: approvedCount + rejectedCount + modifiedCount,
      approvedCount,
      rejectedCount,
      modifiedCount,
      pendingVendors,
    });
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, refresh };
}

// ------------------------------------------------------------------
// Officer Dashboard Stats
// ------------------------------------------------------------------
export type OfficerStats = {
  totalAnalyses: number;
  drafts: number;
  active: number;
  approved: number;
  needsReview: number;
  totalRecommendations: number;
  totalGaps: number;
  totalConflicts: number;
};

export function useOfficerStats() {
  const [stats, setStats] = useState<OfficerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }

    const [totalAnalyses, drafts, active, approved, needsReview, completed, totalRecommendations, totalGaps, totalConflicts] =
      await Promise.all([
        countRows("analyses"),
        countRows("analyses", { status: "Draft" }),
        countRows("analyses", { status: "Completed" }),
        countRows("analyses", { status: "Approved" }),
        countRows("analyses", { status: "Needs Review" }),
        countRows("analyses", { status: "Completed" }),
        countRows("recommendations"),
        countRows("gaps"),
        countRows("conflicts"),
      ]);

    setStats({
      totalAnalyses,
      drafts,
      active: active + needsReview,
      approved,
      needsReview,
      totalRecommendations,
      totalGaps,
      totalConflicts,
    });
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, refresh };
}

// ------------------------------------------------------------------
// Vendor Dashboard Stats
// ------------------------------------------------------------------
export type VendorStats = {
  availableProcurements: number;
};

export function useVendorStats() {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }

    // Vendors can see analyses that are "Approved" or "Completed"
    const [approvedCount, completedCount] = await Promise.all([
      countRows("analyses", { status: "Approved" }),
      countRows("analyses", { status: "Completed" }),
    ]);

    setStats({
      availableProcurements: approvedCount + completedCount,
    });
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, refresh };
}

// ------------------------------------------------------------------
// Fetch actual rows from tables (for tables/charts, not just counts)
// ------------------------------------------------------------------
export function useSupabaseQuery<T = any>(
  table: string,
  options?: {
    select?: string;
    filters?: Record<string, string>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  },
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }

    let query = supabase.from(table).select(options?.select ?? "*");
    if (options?.filters) {
      for (const [col, val] of Object.entries(options.filters)) {
        query = query.eq(col, val);
      }
    }
    if (options?.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error(`[useSupabaseQuery] ${table}:`, error.message);
    } else if (rows) {
      setData(rows as T[]);
    }
    setLoading(false);
  }, [table, JSON.stringify(options)]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, refresh };
}
