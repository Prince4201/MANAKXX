import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, CheckCircle2, ClipboardCheck, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/manakx/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/manakx/store";
import { useVendorProducts } from "@/lib/manakx/use-products";
import { supabase } from "@/lib/supabase";
import type { RequiredDocument } from "@/lib/manakx/types";

export const Route = createFileRoute("/vendor/applications/new")({
  validateSearch: (search: Record<string, unknown>): { procurement?: string } =>
    typeof search["procurement"] === "string" ? { procurement: search["procurement"] } : {},
  component: VendorApplicationWizard,
});

const STEPS = [
  "Company",
  "Product",
  "Specs",
  "Documents",
  "Evidence",
  "Commercial",
  "Delivery",
  "AI Check",
  "Submit",
];

function VendorApplicationWizard() {
  const { procurement: tenderId } = Route.useSearch();
  const navigate = useNavigate();
  const { analyses, user } = useStore();
  const { products } = useVendorProducts();
  
  const [step, setStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const tender = analyses.find((a) => a.id === tenderId);
  const requiredDocs: RequiredDocument[] = tender?.required_documents || [];

  if (!tenderId || !tender) {
    return (
      <AppShell title="Application Wizard" crumbs={[{ label: "Procurements", to: "/vendor/procurements" }]}>
        <div className="p-8 text-center text-muted-foreground">Tender not found.</div>
      </AppShell>
    );
  }

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submitApplication = async () => {
    if (!supabase || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("tender_applications").upsert({
        tender_id: tender.id,
        vendor_id: user.id,
        product_id: selectedProduct,
        status: "SUBMITTED",
        submitted_at: new Date().toISOString()
      }, { onConflict: 'tender_id,vendor_id,product_id' }).select().single();

      if (error) throw error;
      
      toast.success("Application Submitted!", { description: "Your tender application is now under review." });
      navigate({ to: "/vendor/procurements" });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit application", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Company Details Verification</h3>
            <p className="text-sm text-muted-foreground">Verify your company details before applying.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Company Name</Label>
                <Input value={user?.company_name || ""} disabled />
              </div>
              <div>
                <Label>Industry</Label>
                <Input value={user?.industry || ""} disabled />
              </div>
            </div>
            <div className="rounded border bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              If these details are incorrect, please update your profile settings first.
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Select Product</h3>
            <p className="text-sm text-muted-foreground">Which product are you applying with?</p>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.category})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" asChild className="w-full mt-2">
              <Link to="/vendor/products">Manage Products</Link>
            </Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Technical Specifications</h3>
            <p className="text-sm text-muted-foreground">Map your product specifications to the tender requirements.</p>
            <div className="rounded border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              Specifications mapped automatically from your product profile.
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Required Documents</h3>
            <p className="text-sm text-muted-foreground">Upload the mandatory documents requested by the procurement officer.</p>
            
            <div className="mb-4 rounded border bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
              <span className="font-semibold">Compliance Hint:</span> The AI evaluation engine strictly checks for required test reports and ISO certificates. Missing documents will heavily penalize your documentation score.
            </div>

            {requiredDocs.length === 0 ? (
              <div className="rounded border p-4 text-center text-sm text-muted-foreground">No specific documents required.</div>
            ) : (
              <ul className="space-y-3">
                {requiredDocs.map((doc, i) => {
                  const isUploaded = uploadedDocs.has(i);
                  return (
                    <li key={i} className={`flex items-center justify-between rounded border p-3 ${isUploaded ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : ''}`}>
                      <div>
                        <span className="font-medium text-sm flex items-center gap-2">
                          {isUploaded && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          {doc.name}
                        </span>
                        {!isUploaded && doc.required && <span className="text-[10px] text-destructive uppercase tracking-wide font-semibold">Required</span>}
                        {isUploaded && <span className="text-[10px] text-green-600 uppercase tracking-wide font-semibold">Uploaded</span>}
                      </div>
                      <Button 
                        size="sm" 
                        variant={isUploaded ? "ghost" : "outline"}
                        onClick={() => {
                          const newSet = new Set(uploadedDocs);
                          if (isUploaded) newSet.delete(i);
                          else newSet.add(i);
                          setUploadedDocs(newSet);
                          if (!isUploaded) toast.success(`${doc.name} uploaded successfully.`);
                        }}
                      >
                        {isUploaded ? "Remove" : "Upload"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
            
            {requiredDocs.some((d, i) => d.required && !uploadedDocs.has(i)) && (
              <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                You have missing required documents. You may proceed, but this will affect your AI evaluation score.
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Evidence Linking</h3>
            <p className="text-sm text-muted-foreground">Link specific pages in your documents to the tender requirements.</p>
            <div className="rounded border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              MANAKX will attempt to auto-link evidence using AI.
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Commercial Offer</h3>
            <p className="text-sm text-muted-foreground">Enter your price and commercial terms.</p>
            <div className="space-y-3">
              <div>
                <Label>Total Price (INR)</Label>
                <Input type="number" placeholder="Enter amount" />
              </div>
              <div>
                <Label>Validity Period (Days)</Label>
                <Input type="number" defaultValue="90" />
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Delivery Schedule</h3>
            <p className="text-sm text-muted-foreground">Commit to a delivery timeline.</p>
            <div>
              <Label>Lead Time (Days)</Label>
              <Input type="number" placeholder="e.g. 30" />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Pre-submission AI Check</h3>
            <p className="text-sm text-muted-foreground">Run a private self-assessment to gauge your application's strength.</p>
            <div className="rounded border border-primary/20 bg-primary/5 p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">Advisory AI Check</p>
                <p className="text-xs text-muted-foreground mt-1">This does not submit your application.</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/vendor/assessments/new" search={{ procurement: tenderId }} target="_blank">Run Check</Link>
              </Button>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4 text-center py-6">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success mb-4" />
            <h3 className="font-semibold text-xl">Ready to Submit</h3>
            <p className="text-sm text-muted-foreground">
              By submitting, you agree to the tender terms and declare all provided information is accurate.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell
      title="Application Wizard"
      description={`Applying for: ${tender.tenderTitle}`}
      crumbs={[
        { label: "Procurements", to: "/vendor/procurements" },
        { label: tender.id, to: "/vendor/procurements" },
        { label: "Apply" }
      ]}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">{STEPS[step]}</span>
            <span className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          </div>
          <Progress value={(step / (STEPS.length - 1)) * 100} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step]}</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {renderStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 0 || loading}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {step === STEPS.length - 1 ? (
            <Button onClick={submitApplication} disabled={loading || !selectedProduct}>
              {loading ? "Submitting..." : "Submit Application"} <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={next} disabled={step === 1 && !selectedProduct}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
