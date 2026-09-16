import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Camera, CheckCircle2, ChevronRight, ClipboardCheck, QrCode, ScanLine, Search, UploadCloud } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/manakx/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/manakx/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export const Route = createFileRoute("/officer/inspection")({
  head: () => ({ meta: [{ title: "Product Inspection — MANAKX" }] }),
  component: OfficerInspection,
});

function OfficerInspection() {
  const { analyses } = useStore();
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>("");
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);

  const approved = analyses.filter((a) => a.status === "PUBLISHED" || a.status === "AWARDED" || a.status === "COMPLETED");

  // Mock demo scan function
  const handleDemoScan = (e?: React.ChangeEvent<HTMLInputElement>) => {
    setIsScanning(true);
    toast.info("Analyzing image with ML model...");
    setTimeout(() => {
      setIsScanning(false);
      setScannedData({
        height: "750 mm",
        material: "Steel (Powder Coated)",
        load: "85 kg", // Intentionally lower to trigger review
        edges: "Rounded",
      });
      setStep(3);
    }, 2000);
  };

  const handleSaveReport = () => {
    toast.success("Inspection Report Saved", { description: "The results have been securely logged to the vendor's record." });
    setStep(1);
    setSelectedAnalysis("");
    setScannedData(null);
  };

  return (
    <AppShell
      title="Post-Award Product Inspection"
      description="Decision support tool for physical product inspections against approved specifications."
      crumbs={[{ label: "Inspection" }]}
    >
      <div className="mx-auto max-w-4xl">
        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between text-sm font-medium text-muted-foreground">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : ""}`}>
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</span>
            Select Procurement
          </div>
          <div className="h-px w-12 flex-1 bg-border mx-4" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : ""}`}>
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</span>
            Data Collection
          </div>
          <div className="h-px w-12 flex-1 bg-border mx-4" />
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : ""}`}>
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>3</span>
            Comparison Result
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Procurement for Inspection</CardTitle>
              <CardDescription>Choose the approved procurement specification you are inspecting against.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Approved Procurements</Label>
                <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a procurement..." />
                  </SelectTrigger>
                  <SelectContent>
                    {approved.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.id} — {a.tenderTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!selectedAnalysis}>
                  Next Step <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Collect Product Data</CardTitle>
              <CardDescription>Scan barcodes, labels, or manually enter the observed product data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="scan">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="scan"><QrCode className="mr-2 h-4 w-4" /> Scan Label</TabsTrigger>
                  <TabsTrigger value="photo"><Camera className="mr-2 h-4 w-4" /> Photo Upload</TabsTrigger>
                  <TabsTrigger value="manual"><ClipboardCheck className="mr-2 h-4 w-4" /> Manual Entry</TabsTrigger>
                </TabsList>
                
                <TabsContent value="scan" className="space-y-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                    {isScanning ? (
                      <div className="flex flex-col items-center">
                        <ScanLine className="mb-4 h-12 w-12 animate-pulse text-primary" />
                        <p className="text-sm font-medium">Scanning for metadata...</p>
                        <p className="text-xs text-muted-foreground">Keep the product label in frame.</p>
                      </div>
                    ) : (
                      <>
                        <QrCode className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 font-semibold">Ready to Scan</h3>
                        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                          Scan the manufacturer's QR code or standard compliance barcode to automatically extract specifications.
                        </p>
                        <Button onClick={() => handleDemoScan()}>
                          <Camera className="mr-2 h-4 w-4" /> Open Camera Scanner
                        </Button>
                        <p className="mt-4 text-[10px] text-muted-foreground uppercase tracking-widest">(Hackathon Prototype Trigger)</p>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="photo">
                   <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                      <UploadCloud className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 font-semibold">Upload Product Image</h3>
                      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                        Upload a photo of the product data sheet, test report, or physical dimensions. AI will extract the values.
                      </p>
                      <Label htmlFor="officer-photo-upload" className="cursor-pointer">
                        <div className={`flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isScanning ? "Processing..." : "Browse Files"}
                        </div>
                        <input
                          id="officer-photo-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleDemoScan}
                          disabled={isScanning}
                        />
                      </Label>
                   </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Observed Height / Dimension</Label>
                      <Input placeholder="e.g. 750 mm" />
                    </div>
                    <div className="space-y-2">
                      <Label>Observed Material</Label>
                      <Input placeholder="e.g. Steel" />
                    </div>
                    <div className="space-y-2">
                      <Label>Observed Load Capacity</Label>
                      <Input placeholder="e.g. 100 kg" />
                    </div>
                  </div>
                  <Button onClick={() => { setScannedData({ height: "Manual", material: "Manual", load: "Manual", edges: "Manual" }); setStep(3); }}>
                    Run Comparison
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {step === 3 && scannedData && (
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-4 p-4 text-sm">
                <Search className="h-5 w-5 text-primary shrink-0" />
                <p>
                  <strong>AI Comparison Complete.</strong> The observed product specifications have been compared against the approved requirements for procurement <strong>{selectedAnalysis}</strong>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inspection Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {/* Row 1 - Match */}
                  <div className="flex items-start justify-between py-4">
                    <div className="grid flex-1 gap-1">
                      <p className="font-semibold">Height / Dimension</p>
                      <div className="grid grid-cols-2 text-sm text-muted-foreground">
                        <span><span className="font-medium text-foreground">Required:</span> 750 mm</span>
                        <span><span className="font-medium text-foreground">Observed:</span> {scannedData.height}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Match
                    </Badge>
                  </div>
                  <Separator />
                  
                  {/* Row 2 - Match */}
                  <div className="flex items-start justify-between py-4">
                    <div className="grid flex-1 gap-1">
                      <p className="font-semibold">Material Construction</p>
                      <div className="grid grid-cols-2 text-sm text-muted-foreground">
                        <span><span className="font-medium text-foreground">Required:</span> Steel</span>
                        <span><span className="font-medium text-foreground">Observed:</span> {scannedData.material}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Match
                    </Badge>
                  </div>
                  <Separator />

                  {/* Row 3 - Conflict */}
                  <div className="flex items-start justify-between py-4 bg-amber-50/50 -mx-6 px-6">
                    <div className="grid flex-1 gap-1">
                      <p className="font-semibold">Load Capacity</p>
                      <div className="grid grid-cols-2 text-sm text-muted-foreground">
                        <span><span className="font-medium text-foreground">Required:</span> ≥100 kg</span>
                        <span><span className="font-medium text-foreground">Observed:</span> {scannedData.load}</span>
                      </div>
                      <p className="mt-1 text-xs text-amber-700">Observed capacity is lower than the mandatory procurement specification.</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                      <AlertTriangle className="mr-1 h-3 w-3" /> Review Required
                    </Badge>
                  </div>
                  <Separator />

                  {/* Row 4 - Match */}
                  <div className="flex items-start justify-between py-4">
                    <div className="grid flex-1 gap-1">
                      <p className="font-semibold">Safety Edges</p>
                      <div className="grid grid-cols-2 text-sm text-muted-foreground">
                        <span><span className="font-medium text-foreground">Required:</span> Rounded</span>
                        <span><span className="font-medium text-foreground">Observed:</span> {scannedData.edges}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Match
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed bg-muted/20">
              <CardContent className="p-4 text-center text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Disclaimer:</span> This is a decision-support tool. AI extraction from scans and photos should be verified by the officer. Do not automatically claim legal acceptance or rejection based solely on this output.
              </CardContent>
            </Card>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>Scan Another Product</Button>
              <Button onClick={handleSaveReport}>Save Inspection Report</Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
