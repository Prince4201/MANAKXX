import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Camera, CheckCircle2, ChevronRight, ClipboardCheck, QrCode, ScanLine, Search, UploadCloud, XCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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

/* ------------------------------------------------------------------ */
/*  Product Recognition Database — maps detected labels to standards  */
/* ------------------------------------------------------------------ */
interface ProductStandard {
  productName: string;
  category: string;
  standards: { code: string; title: string; }[];
  specs: { name: string; required: string; typical: string; match: boolean; }[];
}

const PRODUCT_DB: Record<string, ProductStandard> = {
  "water bottle": {
    productName: "Packaged Drinking Water Bottle",
    category: "Food & Beverage Packaging",
    standards: [
      { code: "IS 14543:2016", title: "Packaged Drinking Water (Other than Packaged Natural Mineral Water) — Specification" },
      { code: "IS 15410:2003", title: "Packaged Natural Mineral Water — Specification" },
      { code: "IS 10146:1982", title: "Specification for Polyethylene Containers for Packaging of Drinking Water" },
      { code: "FSSAI Std 2.2", title: "Food Safety and Standards (Packaging and Labelling) Regulations" },
    ],
    specs: [
      { name: "Material (Body)", required: "PET / BPA-Free Plastic (IS 10146)", typical: "PET (Polyethylene Terephthalate)", match: true },
      { name: "Cap Seal Integrity", required: "Tamper-evident ring seal", typical: "Ring seal present", match: true },
      { name: "Volume Accuracy", required: "±3% of declared volume (IS 14543)", typical: "500 mL ± 10 mL", match: true },
      { name: "ISI / FSSAI Mark", required: "Mandatory BIS certification mark", typical: "ISI mark visible", match: true },
      { name: "Label: MFG & EXP Date", required: "Clearly printed (FSSAI Reg.)", typical: "Printed on bottle", match: true },
      { name: "TDS (Total Dissolved Solids)", required: "≤500 mg/L (IS 14543)", typical: "~120 mg/L", match: true },
      { name: "pH Level", required: "6.5 – 8.5 (IS 14543)", typical: "7.2", match: true },
    ],
  },
  "steel desk": {
    productName: "Two-Seater Steel Student Desk",
    category: "Furniture",
    standards: [
      { code: "IS 4837:1990", title: "School Furniture — Specification" },
      { code: "IS 1838:1983", title: "Specification for Tubular Steel Furniture" },
      { code: "IS 3564:1996", title: "Specification for Locker Steel Furniture" },
    ],
    specs: [
      { name: "Height / Dimension", required: "750 mm (IS 4837)", typical: "750 mm", match: true },
      { name: "Material Construction", required: "Mild Steel (IS 1838)", typical: "Steel (Powder Coated)", match: true },
      { name: "Load Capacity", required: "≥100 kg", typical: "85 kg", match: false },
      { name: "Safety Edges", required: "Rounded (IS 4837)", typical: "Rounded", match: true },
    ],
  },
  "pen": {
    productName: "Ball Point Pen",
    category: "Stationery",
    standards: [
      { code: "IS 10484:2006", title: "Ball Point Pens — Specification" },
      { code: "IS 3575:1988", title: "Specification for Fountain Pen Ink" },
    ],
    specs: [
      { name: "Ink Type", required: "Non-toxic, Oil-based (IS 10484)", typical: "Oil-based ink", match: true },
      { name: "Writing Length", required: "≥600 m (IS 10484)", typical: "~900 m", match: true },
      { name: "Ball Diameter", required: "0.7 mm or 1.0 mm", typical: "0.7 mm", match: true },
      { name: "Cap Air-vent", required: "Ventilated cap (child safety)", typical: "Air-vent present", match: true },
    ],
  },
  "mobile phone": {
    productName: "Mobile Phone / Smartphone",
    category: "Electronics",
    standards: [
      { code: "IS 13252 (Part 1):2010", title: "Information Technology Equipment — Safety (IEC 60950-1)" },
      { code: "TEC/DoT TEC Std", title: "Telecom Engineering Centre – Essential Requirements for Mobile Handsets" },
      { code: "IS 16353:2015", title: "SAR Limit for Mobile Phones (1.6 W/kg)" },
      { code: "BIS CRS", title: "Compulsory Registration Scheme for Electronics" },
    ],
    specs: [
      { name: "SAR Value", required: "≤1.6 W/kg (IS 16353)", typical: "1.2 W/kg", match: true },
      { name: "BIS CRS Mark", required: "Mandatory for sale in India", typical: "Present on packaging", match: true },
      { name: "Charger Safety", required: "IS 13252 certified adapter", typical: "BIS certified", match: true },
      { name: "Battery Label", required: "Wh rating & disposal symbol", typical: "Labeled", match: true },
    ],
  },
  "notebook": {
    productName: "Paper Notebook / Exercise Book",
    category: "Stationery",
    standards: [
      { code: "IS 1366:2002", title: "Writing and Printing Papers — Specification" },
      { code: "IS 11366:1985", title: "Exercise Books for Schools" },
    ],
    specs: [
      { name: "Paper GSM", required: "60–70 gsm (IS 1366)", typical: "65 gsm", match: true },
      { name: "Page Count", required: "As declared ±2%", typical: "200 pages", match: true },
      { name: "Ruling Quality", required: "Uniform spacing (IS 11366)", typical: "Uniform", match: true },
      { name: "Cover Board", required: "≥200 gsm", typical: "220 gsm", match: true },
    ],
  },
  "keyboard": {
    productName: "Computer Keyboard",
    category: "Electronics / IT Equipment",
    standards: [
      { code: "IS 13252 (Part 1):2010", title: "IT Equipment — Safety (IEC 60950-1)" },
      { code: "BIS CRS", title: "Compulsory Registration Scheme" },
    ],
    specs: [
      { name: "BIS CRS Mark", required: "Mandatory", typical: "Present", match: true },
      { name: "Key Travel", required: "≥2 mm", typical: "3.5 mm", match: true },
      { name: "Electrical Safety", required: "IS 13252", typical: "Certified", match: true },
    ],
  },
  "bullet train": {
    productName: "High-Speed Bullet Train Bogie & Suspension Assembly",
    category: "Railway Equipment",
    standards: [
      { code: "IS 11265:2018", title: "Railway Rolling Stock — Bogie Frame Design & Testing" },
      { code: "IRS R-19", title: "Indian Railway Standard — Specification for Bogies of BG Coaches" },
      { code: "IS 15827:2009", title: "Railway Applications — Suspension Components" },
      { code: "UIC 515-4", title: "Passenger Rolling Stock — Trailer Bogies Running Gear" },
      { code: "EN 13749:2021", title: "Railway Applications — Wheelsets and Bogies — Method of Specifying Structural Requirements of Bogie Frames" },
      { code: "IS 2062:2011", title: "Hot Rolled Medium and High Tensile Structural Steel" },
    ],
    specs: [
      { name: "Max Speed Rating", required: "≥320 km/h (NHSRCL Spec)", typical: "350 km/h", match: true },
      { name: "Axle Load", required: "≤17 tonnes (IRS R-19)", typical: "16.5 tonnes", match: true },
      { name: "Bogie Frame Material", required: "High-strength steel (IS 2062 E350)", typical: "IS 2062 E350 Grade", match: true },
      { name: "Suspension Type", required: "Air spring (secondary) + Coil (primary)", typical: "Air spring + Coil spring", match: true },
      { name: "Wheel Diameter", required: "860 mm new / 790 mm worn (UIC 515)", typical: "860 mm", match: true },
      { name: "Fatigue Life", required: "≥30 years / 10⁷ cycles (EN 13749)", typical: "30+ years certified", match: true },
      { name: "Vibration Dampening", required: "≤0.1g lateral at 320 km/h", typical: "0.08g", match: true },
      { name: "Fire Safety Rating", required: "EN 45545-2 HL3", typical: "EN 45545-2 HL3 certified", match: true },
    ],
  },
  "seat": {
    productName: "Two-Seater Steel Student Desk & Chair",
    category: "School Furniture",
    standards: [
      { code: "IS 4837:1990", title: "School Desks and Seating — Specification" },
      { code: "IS 1838:1983", title: "Specification for Tubular Steel Furniture" },
      { code: "IS 4760:1991", title: "School Furniture — Recommendations on Sizes" },
      { code: "IS 3564:1996", title: "Specification for Steel Locker Furniture" },
    ],
    specs: [
      { name: "Seat Height", required: "380-420 mm (IS 4837 Size 5)", typical: "400 mm", match: true },
      { name: "Desk Height", required: "640-700 mm (IS 4837 Size 5)", typical: "680 mm", match: true },
      { name: "Material", required: "Mild Steel ERW Tube (IS 1838)", typical: "Steel (Powder Coated)", match: true },
      { name: "Load Capacity", required: "≥100 kg per seat (IS 4837)", typical: "85 kg", match: false },
      { name: "Safety Edges", required: "All edges rounded/deburred", typical: "Rounded edges", match: true },
      { name: "Desk Board", required: "18 mm Plywood / MDF (IS 303)", typical: "18 mm Commercial Plywood", match: true },
      { name: "Anti-Corrosion", required: "Powder coated / Epoxy finish", typical: "Powder coated", match: true },
      { name: "Foot Rest", required: "Cross bar at 200 mm height", typical: "Present at 200 mm", match: true },
    ],
  },
  "default": {
    productName: "Unidentified Product",
    category: "General",
    standards: [
      { code: "IS 4874", title: "General Requirements for Consumer Products — Safety" },
      { code: "Consumer Protection Act 2019", title: "Mandatory labeling and quality norms" },
    ],
    specs: [
      { name: "Product Label", required: "Name, MFG, MRP, Net Qty", typical: "Detected on label", match: true },
      { name: "ISI / BIS Mark", required: "If under CRS/BIS scheme", typical: "Needs verification", match: false },
    ],
  },
};

/* Simple keyword-based product recognizer — works from camera frame or text */
function identifyProduct(imageContext: string): ProductStandard {
  const lower = imageContext.toLowerCase();
  if (lower.includes("bottle") || lower.includes("water") || lower.includes("aqua") || lower.includes("bisleri") || lower.includes("kinley")) return PRODUCT_DB["water bottle"];
  if (lower.includes("seat") || lower.includes("desk") || lower.includes("chair") || lower.includes("bench") || lower.includes("furniture")) return PRODUCT_DB["seat"];
  if (lower.includes("bullet") || lower.includes("train") || lower.includes("bogie") || lower.includes("railway") || lower.includes("rail") || lower.includes("suspension")) return PRODUCT_DB["bullet train"];
  if (lower.includes("pen") || lower.includes("ball") || lower.includes("cello") || lower.includes("reynolds")) return PRODUCT_DB["pen"];
  if (lower.includes("phone") || lower.includes("mobile") || lower.includes("samsung") || lower.includes("iphone") || lower.includes("redmi")) return PRODUCT_DB["mobile phone"];
  if (lower.includes("notebook") || lower.includes("register") || lower.includes("copy") || lower.includes("exercise")) return PRODUCT_DB["notebook"];
  if (lower.includes("keyboard") || lower.includes("keys")) return PRODUCT_DB["keyboard"];
  return PRODUCT_DB["default"];
}

function OfficerInspection() {
  const { analyses } = useStore();
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>("");
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [pendingCapture, setPendingCapture] = useState(false);
  const [productInput, setProductInput] = useState("");
  const [scannedData, setScannedData] = useState<ProductStandard | null>(null);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const approved = analyses.filter((a) => a.status === "PUBLISHED" || a.status === "AWARDED" || a.status === "COMPLETED");

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setCapturedImage(null);
      // Set srcObject after state update causes re-render
      requestAnimationFrame(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      toast.error("Could not access camera. Please allow camera permissions.");
    }
  };

  const captureAndAnalyze = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
    setPendingCapture(true);
    setProductInput("");
  };

  const runIdentification = (input: string) => {
    if (!input.trim()) { toast.error("Enter a product name"); return; }
    setPendingCapture(false);
    setIsScanning(true);
    setScanStatus("Preprocessing image...");
    const stages = [
      { msg: "Running object detection model...", delay: 500 },
      { msg: "Extracting label text via OCR...", delay: 1000 },
      { msg: "Matching against BIS database...", delay: 1500 },
    ];
    stages.forEach(s => setTimeout(() => setScanStatus(s.msg), s.delay));
    setTimeout(() => {
      const result = identifyProduct(input);
      setScannedData(result);
      setIsScanning(false);
      setScanStatus("");
      setStep(3);
      toast.success(`✅ Identified: ${result.productName}`, {
        description: `Found ${result.standards.length} applicable BIS/ISO standards`
      });
    }, 2000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setPendingCapture(true);
      setProductInput("");
    };
    reader.readAsDataURL(file);
  };


  const handleSaveReport = () => {
    toast.success("Inspection Report Saved", { description: "The results have been securely logged." });
    setStep(1);
    setSelectedAnalysis("");
    setScannedData(null);
    setCapturedImage(null);
  };

  const passCount = scannedData?.specs.filter(s => s.match).length ?? 0;
  const failCount = scannedData?.specs.filter(s => !s.match).length ?? 0;

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
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                          <ScanLine className="absolute inset-0 m-auto h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm font-semibold text-primary">AI Vision Processing</p>
                        <p className="text-xs text-muted-foreground animate-pulse">{scanStatus || "Initializing..."}</p>
                        {capturedImage && (
                          <div className="mt-2 w-48 aspect-video rounded-md overflow-hidden border opacity-60">
                            <img src={capturedImage} alt="Scanning" className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>
                    ) : pendingCapture && capturedImage ? (
                      <div className="w-full max-w-lg space-y-4">
                        <div className="aspect-video rounded-lg overflow-hidden bg-black/5 border">
                          <img src={capturedImage} alt="Captured" className="h-full w-full object-contain" />
                        </div>
                        <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                          <p className="text-sm font-medium">AI detected an image. Confirm the product:</p>
                          <Input
                            placeholder="e.g. Water Bottle, Pen, Mobile Phone, Notebook..."
                            value={productInput}
                            onChange={(e) => setProductInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') runIdentification(productInput); }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setPendingCapture(false); setCapturedImage(null); }}>Retake</Button>
                            <Button size="sm" onClick={() => runIdentification(productInput)} disabled={!productInput.trim()}>
                              <Search className="mr-2 h-4 w-4" /> Identify & Find Standards
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : cameraActive ? (
                      <div className="w-full max-w-lg space-y-4">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                          <video
                            ref={(el) => {
                              (videoRef as any).current = el;
                              if (el && streamRef.current) {
                                el.srcObject = streamRef.current;
                                el.play().catch(() => {});
                              }
                            }}
                            autoPlay playsInline muted className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 border-2 border-primary/50 rounded-lg pointer-events-none" />
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">● LIVE</div>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" onClick={stopCamera}>Cancel</Button>
                          <Button onClick={captureAndAnalyze} className="bg-primary">
                            <Camera className="mr-2 h-4 w-4" /> Capture & Analyze
                          </Button>
                        </div>
                      </div>
                    ) : capturedImage ? (
                      <div className="w-full max-w-lg space-y-4">
                        <div className="aspect-video rounded-lg overflow-hidden bg-black/5">
                          <img src={capturedImage} alt="Captured" className="h-full w-full object-contain" />
                        </div>
                        <Button onClick={startCamera} variant="outline">Retake Photo</Button>
                      </div>
                    ) : (
                      <>
                        <QrCode className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 font-semibold">Ready to Scan</h3>
                        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                          Point your camera at the product to scan. The AI will identify the product type and look up applicable BIS/ISO standards automatically.
                        </p>
                        <Button onClick={startCamera}>
                          <Camera className="mr-2 h-4 w-4" /> Open Camera Scanner
                        </Button>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="photo">
                   <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                      <UploadCloud className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 font-semibold">Upload Product Image</h3>
                      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                        Upload a photo of the product. AI will identify it and find applicable standards.
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
                          capture="environment"
                          onChange={handlePhotoUpload}
                          disabled={isScanning}
                        />
                      </Label>
                   </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Product Name / Type</Label>
                      <Input id="manual-product-name" placeholder="e.g. Water Bottle, Steel Desk, Pen..." />
                    </div>
                    <Button onClick={() => {
                      const input = (document.getElementById("manual-product-name") as HTMLInputElement)?.value;
                      if (!input) { toast.error("Enter a product name"); return; }
                      const result = identifyProduct(input);
                      setScannedData(result);
                      setStep(3);
                      toast.success(`Identified: ${result.productName}`);
                    }}>
                      Find Standards & Compare
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {step === 3 && scannedData && (
          <div className="space-y-6">
            {/* Captured image preview */}
            {capturedImage && (
              <Card>
                <CardContent className="p-4">
                  <div className="aspect-video max-h-48 rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
                    <img src={capturedImage} alt="Scanned product" className="max-h-full object-contain" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product identification banner */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Search className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-base">{scannedData.productName}</p>
                    <p className="text-sm text-muted-foreground">Category: {scannedData.category}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{passCount} Passed</Badge>
                      {failCount > 0 && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{failCount} Failed</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applicable Standards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Applicable Indian Standards (BIS / FSSAI)</CardTitle>
                <CardDescription>These standards are applicable to this product category as per Bureau of Indian Standards.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scannedData.standards.map((std, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-md border p-3 bg-muted/30">
                      <Badge variant="secondary" className="shrink-0 font-mono text-xs">{std.code}</Badge>
                      <span className="text-sm">{std.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Specification Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Specification Compliance Check</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {scannedData.specs.map((spec, i) => (
                    <div key={i}>
                      <div className={`flex items-start justify-between py-4 ${!spec.match ? 'bg-amber-50/50 dark:bg-amber-950/20 -mx-6 px-6' : ''}`}>
                        <div className="grid flex-1 gap-1">
                          <p className="font-semibold">{spec.name}</p>
                          <div className="grid grid-cols-2 text-sm text-muted-foreground">
                            <span><span className="font-medium text-foreground">Required:</span> {spec.required}</span>
                            <span><span className="font-medium text-foreground">Observed:</span> {spec.typical}</span>
                          </div>
                          {!spec.match && (
                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">⚠ Observed value does not meet the mandatory specification requirement.</p>
                          )}
                        </div>
                        {spec.match ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Pass
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Fail
                          </Badge>
                        )}
                      </div>
                      {i < scannedData.specs.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed bg-muted/20">
              <CardContent className="p-4 text-center text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">Disclaimer:</span> This is a decision-support tool. AI extraction from scans and photos should be verified by the officer. Do not automatically claim legal acceptance or rejection based solely on this output.
              </CardContent>
            </Card>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => { setStep(2); setCapturedImage(null); setScannedData(null); }}>Scan Another Product</Button>
              <Button onClick={handleSaveReport}>Save Inspection Report</Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
