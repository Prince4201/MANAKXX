import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/manakx/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVendorProducts, useProductDocuments } from "@/lib/manakx/use-products";
import { useStore } from "@/lib/manakx/store";
import { supabase } from "@/lib/supabase";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { FileUp, FileText, Plus, Search, Trash2, Edit, CheckCircle2, AlertCircle } from "lucide-react";
import type { Product } from "@/lib/manakx/types";

export const Route = createFileRoute("/vendor/products")({
  head: () => ({ meta: [{ title: "My Products — MANAKX" }] }),
  component: VendorProductsPage,
});

function VendorProductsPage() {
  const { user } = useStore();
  const { products, loading, refetch } = useVendorProducts();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
        (p.model_number && p.model_number.toLowerCase().includes(search.toLowerCase()));
      const matchCat = categoryFilter === "All" || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(cats)].sort();
  }, [products]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Ready</Badge>;
      case "NEEDS_DOCUMENT":
        return <Badge variant="secondary" className="text-amber-600"><AlertCircle className="mr-1 h-3 w-3" /> Needs Datasheet</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppShell
      title="My Products"
      description="Manage your product catalog and technical datasheets."
      crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "My Products" }]}
      actions={
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      }
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Code/Model</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No products found. Add a product to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.code || p.model_number || "-"}
                  </TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{getStatusBadge(p.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setViewProduct(p)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Product Modal */}
      <AddProductDialog
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={() => {
          setAddModalOpen(false);
          refetch();
        }}
      />

      {/* View/Edit Product Modal */}
      {viewProduct && (
        <ViewProductDialog
          product={viewProduct}
          open={!!viewProduct}
          onOpenChange={(op) => !op && setViewProduct(null)}
          onUpdate={refetch}
        />
      )}
    </AppShell>
  );
}

function AddProductDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void }) {
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "",
    subcategory: "",
    manufacturer: user?.company_name || "",
    model_number: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;
    if (!formData.name || !formData.category) {
      toast.error("Please fill required fields (Name, Category)");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("products").insert([
      {
        vendor_id: user.id,
        name: formData.name,
        code: formData.code,
        category: formData.category,
        subcategory: formData.subcategory,
        manufacturer: formData.manufacturer,
        model_number: formData.model_number,
        description: formData.description,
        status: "NEEDS_DOCUMENT", // Default status, expecting a datasheet next
      },
    ]);

    setLoading(false);
    if (error) {
      toast.error("Failed to add product", { description: error.message });
    } else {
      toast.success("Product added successfully");
      onSuccess();
      setFormData({ name: "", code: "", category: "", subcategory: "", manufacturer: user?.company_name || "", model_number: "", description: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Register a product for future assessments.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Product Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Product Code / SKU</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Input value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Model Number</Label>
              <Input value={formData.model_number} onChange={(e) => setFormData({ ...formData, model_number: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewProductDialog({ product, open, onOpenChange, onUpdate }: { product: Product; open: boolean; onOpenChange: (open: boolean) => void; onUpdate: () => void }) {
  const { user } = useStore();
  const { documents, loading: docsLoading, refetch: refetchDocs } = useProductDocuments(product.id);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !supabase) return;

    setUploading(true);
    const filePath = `${user.id}/${product.id}/${Date.now()}_${file.name}`;
    
    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage.from("vendor_documents").upload(filePath, file);
    
    if (uploadError) {
      toast.error("Failed to upload document", { description: uploadError.message });
      setUploading(false);
      return;
    }

    // 2. Create Document Record
    const { error: dbError } = await supabase.from("product_documents").insert([
      {
        product_id: product.id,
        vendor_id: user.id,
        document_type: "DATASHEET",
        file_name: file.name,
        storage_path: filePath,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user.id,
      },
    ]);

    if (dbError) {
      toast.error("Document uploaded but failed to link to product", { description: dbError.message });
    } else {
      toast.success("Datasheet uploaded successfully");
      
      // 3. Update Product Status if it was NEEDS_DOCUMENT
      if (product.status === "NEEDS_DOCUMENT" || product.status === "DRAFT") {
        await supabase.from("products").update({ status: "READY" }).eq("id", product.id);
        onUpdate();
      }
      refetchDocs();
    }
    setUploading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone unless it is used in an assessment.")) return;
    if (!supabase) return;
    
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      toast.error("Failed to delete product", { description: error.message });
    } else {
      toast.success("Product deleted");
      onOpenChange(false);
      onUpdate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.category} · {product.code || "No Code"}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Manufacturer</dt>
                <dd className="font-medium">{product.manufacturer || "-"}</dd>
                <dt className="text-muted-foreground">Model Number</dt>
                <dd className="font-medium">{product.model_number || "-"}</dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium">{product.status}</dd>
                <dt className="col-span-2 text-muted-foreground mt-2">Description</dt>
                <dd className="col-span-2">{product.description || "-"}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Datasheets</CardTitle>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <p className="text-sm text-muted-foreground">Loading documents...</p>
              ) : documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()} · {(doc.file_size || 0) / 1000} KB
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No datasheet uploaded yet.
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <Label htmlFor={`upload-${product.id}`} className="cursor-pointer">
                  <div className={`flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <FileUp className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Datasheet"}
                  </div>
                  <input
                    id={`upload-${product.id}`}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc,image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
