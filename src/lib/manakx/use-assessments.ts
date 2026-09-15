import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/manakx/store";
import { toast } from "sonner";
import type { Assessment, AssessmentResult } from "./types";

export function useVendorAssessments() {
  const { user } = useStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssessments = useCallback(async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("assessments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load assessments", { description: error.message });
    } else {
      setAssessments(data as Assessment[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  return { assessments, loading, refetch: fetchAssessments };
}

export function useAssessmentResults(assessmentId?: string) {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    if (!supabase || !assessmentId) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("assessment_results")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load assessment results", { description: error.message });
    } else {
      setResults(data as AssessmentResult[]);
    }
    setLoading(false);
  }, [assessmentId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { results, loading, refetch: fetchResults };
}
