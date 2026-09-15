import { createFileRoute } from "@tanstack/react-router";
import { Upload, FileText, Trash2, Loader2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/manakx/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/manakx/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/vendor/documents")({
  head: () => ({ meta: [{ title: "Documents — MANAKX" }] }),
  component: VendorDocuments,
});

function VendorDocuments() {
  const { user } = useStore();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    if (!supabase || !user) return;
    setLoading(true);
    
    // In a real app we might query a documents table.
    // For now we just list from the storage bucket directly.
    const { data, error } = await supabase.storage.from("vendor_documents").list(user.id);
    
    if (error) {
      toast.error("Failed to load documents", { description: error.message });
    } else if (data) {
      setFiles(data.filter(f => f.name !== ".emptyFolderPlaceholder"));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [user]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase || !user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage.from("vendor_documents").upload(filePath, file);

    if (error) {
      toast.error("Upload failed", { description: error.message });
    } else {
      toast.success("Document uploaded");
      fetchFiles();
    }
    setUploading(false);
  };

  const handleDelete = async (fileName: string) => {
    if (!supabase || !user) return;
    if (!window.confirm(`Delete ${fileName}?`)) return;

    const { error } = await supabase.storage.from("vendor_documents").remove([`${user.id}/${fileName}`]);

    if (error) {
      toast.error("Delete failed", { description: error.message });
    } else {
      toast.success("Document deleted");
      fetchFiles();
    }
  };

  const downloadFile = async (fileName: string) => {
    if (!supabase || !user) return;
    const { data, error } = await supabase.storage.from("vendor_documents").download(`${user.id}/${fileName}`);
    
    if (error) {
      toast.error("Download failed", { description: error.message });
      return;
    }
    
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/^\d+_/, ''); // Strip timestamp if we added one
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell 
      title="Document Library" 
      description="Manage your uploaded product datasheets, certificates, and test reports." 
      crumbs={[{ label: "Vendor", to: "/vendor" }, { label: "Documents" }]}
      actions={
        <div className="relative">
          <Input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            onChange={handleUpload} 
            disabled={uploading}
            accept=".pdf,.doc,.docx,.jpg,.png" 
          />
          <Label htmlFor="file-upload">
            <Button asChild disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload Document
              </span>
            </Button>
          </Label>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed border-2 rounded-lg">
              <FileText className="h-10 w-10 mb-4 opacity-50" />
              <p>No documents uploaded yet.</p>
              <p className="text-xs mt-1">Upload datasheets or certificates to use in tender applications.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {file.name.replace(/^\d+_/, '')}
                      </div>
                    </TableCell>
                    <TableCell>{file.metadata?.size ? (file.metadata.size / 1024).toFixed(1) : "0.0"} KB</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {file.created_at ? new Date(file.created_at).toLocaleString() : "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => downloadFile(file.name)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(file.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}


