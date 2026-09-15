import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { TenderApplication, VendorEvaluation } from "./types";

export function useVendorApplications() {
  const [applications, setApplications] = useState<TenderApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) return setLoading(false);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const { data, error } = await supabase
        .from("tender_applications")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading vendor applications:", error);
        toast.error("Failed to load applications");
      } else {
        setApplications(data as TenderApplication[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { applications, loading };
}

export function useTenderApplications(tenderId: string) {
  const [applications, setApplications] = useState<TenderApplication[]>([]);
  const [evaluations, setEvaluations] = useState<VendorEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!supabase || !tenderId) return setLoading(false);
    setLoading(true);

    try {
      const { data: appsData, error: appsError } = await supabase
        .from("tender_applications")
        .select("*")
        .eq("tender_id", tenderId)
        .order("submitted_at", { ascending: false });

      if (appsError) throw appsError;

      const { data: evalsData, error: evalsError } = await supabase
        .from("vendor_evaluations")
        .select("*")
        .eq("tender_id", tenderId)
        .order("rank", { ascending: true });

      if (evalsError) throw evalsError;

      setApplications((appsData || []) as TenderApplication[]);
      setEvaluations((evalsData || []) as VendorEvaluation[]);
    } catch (err: any) {
      console.error("Error loading tender applications:", err);
      toast.error("Failed to load applications", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tenderId]);

  return { applications, evaluations, loading, reload: load };
}
