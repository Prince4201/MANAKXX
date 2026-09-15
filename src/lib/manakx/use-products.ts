import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/manakx/store";
import { toast } from "sonner";
import type { Product, ProductDocument, ProductSpecification } from "./types";

export function useVendorProducts() {
  const { user } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load products", { description: error.message });
    } else {
      setProducts(data as Product[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, refetch: fetchProducts };
}

export function useProductDocuments(productId?: string) {
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!supabase || !productId) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("product_documents")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load documents", { description: error.message });
    } else {
      setDocuments(data as ProductDocument[]);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, refetch: fetchDocuments };
}

export function useProductSpecifications(productId?: string) {
  const [specs, setSpecs] = useState<ProductSpecification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpecs = useCallback(async () => {
    if (!supabase || !productId) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("product_specifications")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load specifications", { description: error.message });
    } else {
      setSpecs(data as ProductSpecification[]);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchSpecs();
  }, [fetchSpecs]);

  return { specs, loading, refetch: fetchSpecs };
}
