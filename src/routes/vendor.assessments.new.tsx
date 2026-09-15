import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/manakx/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/manakx/store";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useVendorProducts, useProductDocuments, useProductSpecifications } from "@/lib/manakx/use-products";
import { runAssessment } from "@/lib/manakx/assessment-engine";
import { AlertCircle, CheckCircle2, ChevronRight, FileText, Activity, AlertTriangle, ArrowLeft } from "lucide-react";
import type { Analysis, Product, Requirement, MLAssessmentResponse } from "@/lib/manakx/types";
import { Progress } from "@/components/ui/progress";

const searchSchema = z.object({
  procurement: z.string(),
});

function mapAnalysisRow(row: any): Analysis {
  return {
    id: row.id,
    tenderTitle: row.tender_title,
    reference: row.reference,
    category: row.category,
    product: row.product,
    inputMethod: row.input_method,
    sourceName: row.source_name,
    specText: row.spec_text,
    requirements: [],
    recommendations: [],
    gaps: [],
    conflicts: [],
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapRequirementRow(row: any): Requirement {
  return {
    id: row.id,
    text: row.text,
    type: row.type,
    importance: row.importance,
    confidence: row.confidence,
    sourceSentence: row.source_sentence,
  };
}

export const Route = createFileRoute("/vendor/assessments/new")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Run Assessment — MANAKX" }] }),
  component: AssessmentWizard,
});

function AssessmentWizard() {
  const { procurement: procurementId } = Route.useSearch();
  const navigate = useNavigate();
  const { user, standards } = useStore();
  const { products, loading: productsLoading } = useVendorProducts();

  const [procurement, setProcurement] = useState<Analysis | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [assessmentStatus, setAssessmentStatus] = useState("");
  const [results, setResults] = useState<MLAssessmentResponse | null>(null);

  useEffect(() => {
    async function loadProcurement() {
      if (!supabase || !procurementId) return;

      const { data: analysis, error: aError } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", procurementId)
        .single();

      if (aError || !analysis) {
        toast.error("Procurement not found or access denied.");
        navigate({ to: "/vendor/procurements" });
        return;
      }

      const { data: reqs } = await supabase
        .from("requirements")
        .select("*")
        .eq("analysis_id", procurementId);

      const mappedRequirements = ((reqs as any[]) || []).map(mapRequirementRow);
      setRequirements(mappedRequirements);
      setProcurement({
        ...mapAnalysisRow(analysis),
        requirements: mappedRequirements,
      });
      setLoadingInitial(false);
    }
    loadProcurement();
  }, [procurementId, navigate]);

  const handleSelectProduct = (product: Product) => {
    if (product.status === "NEEDS_DOCUMENT" || product.status === "DRAFT") {
      toast.error("Datasheet required", { description: "Please upload a datasheet for this product first." });
      return;
    }
    setSelectedProduct(product);
    setStep(2);
  };

  const handleRunAssessment = async () => {
    if (!procurement || !selectedProduct || !user) return;
    setStep(3);

    try {
      // 1. Create DRAFT assessment record
      const { data: assessmentData, error: insertError } = await supabase!
        .from("assessments")
        .insert([{
          procurement_id: procurement.id,
          product_id: selectedProduct.id,
          vendor_id: user.id,
          status: "PROCESSING"
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      const assessmentId = assessmentData.id;

      // 2. Fetch required product data for the engine contract
      const [{ data: docs }, { data: specs }] = await Promise.all([
        supabase!.from("product_documents").select("*").eq("product_id", selectedProduct.id),
        supabase!.from("product_specifications").select("*").eq("product_id", selectedProduct.id)
      ]);

      // 3. Call the engine
      const response = await runAssessment({
        procurement,
        requirements,
        vendor_product: selectedProduct,
        product_specifications: specs || [],
        documents: docs || [],
        standards
      }, setAssessmentStatus);

      // 4. Save results to database
      const resultRows = response.requirement_results.map(r => ({
        assessment_id: assessmentId,
        requirement_id: r.requirement_id,
        status: r.status,
        score: r.score,
        evidence: r.evidence,
        explanation: r.explanation,
        source_document_id: r.source_document_id
      }));

      await supabase!.from("assessment_results").insert(resultRows);

      await supabase!.from("assessments").update({
        status: "COMPLETED",
        overall_score: response.overall_score,
        confidence: response.confidence,
        engine_version: response.metadata?.model_version || "v1-ml",
        completed_at: new Date().toISOString()
      }).eq("id", assessmentId);

      setResults(response);
      setStep(4);
      toast.success("Assessment completed successfully.");

    } catch (err: any) {
      toast.error("Assessment failed", { description: err.message });
      setStep(2); // Go back to review
    }
  };

  if (loadingInitial) {
    return (
      <AppShell title="Self-Assessment" description="Loading...">
        <div className="flex h-40 items-center justify-center">Loading procurement details...</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="AI-Assisted Self-Assessment"
      description="Compare your product against the government procurement requirements."
      crumbs={[{ label: "Vendor", path: "/vendor" }, { label: "Procurements", path: "/vendor/procurements" }, { label: "Assess" }]}
    >
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
          <span className={step >= 1 ? "text-primary" : ""}>1. Select Product</span>
          <ChevronRight className="h-4 w-4" />
          <span className={step >= 2 ? "text-primary" : ""}>2. Review</span>
          <ChevronRight className="h-4 w-4" />
          <span className={step >= 3 ? "text-primary" : ""}>3. Analyze</span>
          <ChevronRight className="h-4 w-4" />
          <span className={step === 4 ? "text-primary" : ""}>4. Results</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Select a Product</h2>
              <p className="text-muted-foreground">Choose the product you wish to assess for {procurement?.tenderTitle}.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/vendor/products">Manage Products</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {productsLoading ? (
              <p>Loading products...</p>
            ) : products.length === 0 ? (
              <Card className="col-span-full border-dashed bg-muted/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="mb-4 text-muted-foreground">No products registered yet.</p>
                  <Button asChild>
                    <Link to="/vendor/products">Add Product</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              products.map((p) => {
                const isReady = p.status === "READY";
                return (
                  <Card key={p.id} className={`transition-all hover:border-primary/50 ${!isReady ? "opacity-75" : "cursor-pointer hover:shadow-md"}`} onClick={() => isReady && handleSelectProduct(p)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-1">{p.name}</CardTitle>
                      <CardDescription>{p.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className={`h-4 w-4 ${isReady ? "text-emerald-500" : "text-amber-500"}`} />
                        {isReady ? "Datasheet Uploaded" : "No Datasheet"}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button className="w-full" disabled={!isReady} variant={isReady ? "default" : "secondary"}>
                        {isReady ? "Select Product" : "Requires Datasheet"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {step === 2 && procurement && selectedProduct && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold">Review Assessment Details</h2>
              <p className="text-muted-foreground">Verify the information before starting the AI analysis.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Procurement Requirements</CardTitle>
                <CardDescription>{procurement.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Tender:</span> {procurement.tenderTitle}
                </div>
                <div>
                  <span className="font-medium">Category:</span> {procurement.category}
                </div>
                <div>
                  <span className="font-medium">Extracted Requirements:</span> {requirements.length}
                </div>
                <div className="rounded-md bg-secondary/50 p-3">
                  <p className="font-medium mb-2">Sample Requirements:</p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    {requirements.slice(0, 3).map(r => (
                      <li key={r.id} className="line-clamp-1">{r.text}</li>
                    ))}
                    {requirements.length > 3 && <li>... and {requirements.length - 3} more</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vendor Product</CardTitle>
                <CardDescription>Product Specifications & Evidence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Product:</span> {selectedProduct.name}
                </div>
                <div>
                  <span className="font-medium">Code/Model:</span> {selectedProduct.code || selectedProduct.model_number || "-"}
                </div>
                <div className="rounded-md bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Evidence Ready</p>
                    <p className="text-xs opacity-80">Datasheet is available for AI extraction.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <Button size="lg" onClick={handleRunAssessment} className="w-full md:w-auto">
              Run AI Self-Assessment
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card className="max-w-md mx-auto mt-12 border-none shadow-none">
          <CardContent className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <Activity className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Running Analysis</h3>
              <p className="text-muted-foreground animate-pulse">{assessmentStatus || "Initializing..."}</p>
            </div>
            <Progress value={undefined} className="w-full" />
          </CardContent>
        </Card>
      )}

      {step === 4 && results && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Header & Score */}
          <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Assessment Results</h2>
              <p className="text-muted-foreground mt-1">
                Advisory result for {selectedProduct?.name}. Not an official certification.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-card rounded-lg border p-4 shadow-sm">
              <div className="text-center px-4">
                <div className="text-3xl font-bold text-primary">{results.overall_score}%</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Coverage</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center px-4">
                <div className="text-3xl font-bold">{results.confidence}%</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confidence</div>
              </div>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">{results.requirement_results.filter(r => r.status === "MATCH").length}</span>
                <span className="text-sm font-medium text-muted-foreground">Matched</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">{results.requirement_results.filter(r => r.status === "PARTIAL").length}</span>
                <span className="text-sm font-medium text-muted-foreground">Partial</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-amber-600">{results.warnings.length}</span>
                <span className="text-sm font-medium text-muted-foreground">Warnings</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-destructive">{results.gaps.length}</span>
                <span className="text-sm font-medium text-muted-foreground">Missing/Gaps</span>
              </CardContent>
            </Card>
          </div>

          {/* Gaps / Action Items */}
          {results.gaps.length > 0 && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-destructive">
                  <AlertTriangle className="mr-2 h-5 w-5" /> Requirements Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {results.gaps.map((gap, i) => (
                    <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between bg-background p-3 rounded border">
                      <span className="font-medium text-sm">{gap.requirement}</span>
                      <Badge variant="destructive" className="mt-2 sm:mt-0 w-fit">{gap.issue}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Model Explanation */}
          {results.metadata?.explanation && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-primary">
                  <Activity className="mr-2 h-5 w-5" /> AI Evaluation Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{results.metadata.explanation}</p>
                <p className="text-xs text-muted-foreground mt-2">Model Version: {results.metadata.model_version || "v1-ml"}</p>
              </CardContent>
            </Card>
          )}

          {/* Detailed Requirement Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Findings</CardTitle>
              <CardDescription>Requirement-by-requirement traceability to source evidence.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {results.requirement_results.map((r, i) => {
                  const req = requirements.find(req => req.id === r.requirement_id);
                  const isMatch = r.status === "MATCH";
                  const isPartial = r.status === "PARTIAL";
                  const isWarning = r.status === "WARNING";
                  const isMissing = r.status === "MISSING";

                  return (
                    <div key={i} className="border rounded-lg p-4 bg-background">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="font-medium text-sm leading-relaxed">{req?.text || r.requirement_id}</div>
                        <Badge variant={isMatch ? "default" : isPartial ? "secondary" : isWarning ? "outline" : "destructive"}
                          className={isMatch ? "bg-emerald-500" : isPartial ? "text-blue-600 border-blue-200" : isWarning ? "text-amber-600 border-amber-200" : ""}>
                          {r.status}
                        </Badge>
                      </div>

                      <div className="grid gap-3 text-sm md:grid-cols-2 mt-4 pt-4 border-t border-dashed">
                        <div>
                          <span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">AI Analysis</span>
                          <span className={isMissing ? "text-destructive" : ""}>{r.explanation}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Source Evidence</span>
                          {r.evidence ? (
                            <span className="flex items-center gap-1.5 font-medium text-primary">
                              <FileText className="h-3.5 w-3.5" />
                              {r.evidence}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">No evidence found</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-6">
            <Button asChild variant="outline">
              <Link to="/vendor/assessments">View Assessment History</Link>
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
