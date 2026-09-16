export type RequirementType =
  | "Product"
  | "Material"
  | "Safety"
  | "Performance"
  | "Dimension"
  | "Capacity"
  | "Testing"
  | "Certification"
  | "Environmental"
  | "Operational"
  | "Quality";

export const REQUIREMENT_TYPES: RequirementType[] = [
  "Product",
  "Material",
  "Safety",
  "Performance",
  "Dimension",
  "Capacity",
  "Testing",
  "Certification",
  "Environmental",
  "Operational",
  "Quality",
];

export type Importance = "High" | "Medium" | "Low";

export interface Requirement {
  id: string;
  text: string;
  type: RequirementType;
  importance: Importance;
  confidence: number; // 0-100
  sourceSentence: string;
}

export interface Standard {
  id: string;
  title: string;
  category: string;
  productDomain: string;
  scope: string;
  keywords: string[];
  requirementAreas: string[];
  applicableProducts: string[];
  relatedStandards: string[];
  version: string;
  status: "Active — Demo" | "Deprecated — Demo" | "Draft — Demo";
  sourceType: string;
  lastUpdated: string;
  synthetic: true;
}

export type MatchStrength = "Strong" | "Partial" | "No Match";

export interface RequirementMatch {
  requirementId: string;
  requirementText: string;
  strength: MatchStrength;
  score: number; // 0-100
  evidence: string;
}

export interface Recommendation {
  standardId: string;
  relevance: number; // 0-100
  confidence: number; // 0-100
  coverage: number; // 0-100
  breakdown: {
    productDomain: number;
    requirementSimilarity: number;
    scope: number;
    keywords: number;
    category: number;
  };
  matches: RequirementMatch[];
  why: string;
  band: "Highly Relevant" | "Relevant" | "Partial";
}

export interface Gap {
  id: string;
  area: string;
  severity: "High" | "Medium" | "Low";
  reason: string;
  recommendedReview: string;
}

export interface Conflict {
  id: string;
  title: string;
  severity: "High" | "Medium" | "Low";
  detail: string;
  recommendation: string;
}

export type AnalysisStatus = "DRAFT" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "PUBLISHED" | "AWARDED" | "COMPLETED" | "CLOSED";

export interface Analysis {
  id: string;
  tenderTitle: string;
  reference: string;
  category: string;
  product: string;
  inputMethod: "Upload" | "Paste" | "Demo";
  sourceName: string;
  specText: string;
  requirements: Requirement[];
  recommendations: Recommendation[];
  gaps: Gap[];
  conflicts: Conflict[];
  status: AnalysisStatus;
  required_documents?: RequiredDocument[];
  evaluation_weights?: EvaluationWeights;
  createdAt: string;
  createdBy: string;
}

export type ReviewDecision = "Approved" | "Rejected" | "Review Requested" | "Pending";

export interface Review {
  id: string;
  analysisId: string;
  standardId: string;
  aiScore: number;
  reviewer: string;
  decision: ReviewDecision;
  comment: string;
  updatedAt: string;
}

export type FeedbackKind =
  | "Correct recommendation"
  | "Partially correct"
  | "Incorrect recommendation"
  | "Missing standard"
  | "Wrong requirement extraction";

export interface Feedback {
  id: string;
  analysisId: string;
  standardId: string;
  kind: FeedbackKind;
  comment: string;
  createdAt: string;
}

export type Role =
  | "Government Procurement Officer"
  | "Technical Reviewer"
  | "Vendor/Supplier"
  | "Admin";

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  status: "PENDING_APPROVAL" | "PENDING_REVIEW" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  organization?: string;
  department?: string;
  employee_id?: string;
  company_name?: string;
  industry?: string;
  phone?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
}

export interface Weights {
  productDomain: number;
  requirementSimilarity: number;
  scope: number;
  keywords: number;
  category: number;
}

export type ProductStatus = "DRAFT" | "NEEDS_DOCUMENT" | "READY" | "INACTIVE";

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  code?: string;
  category: string;
  subcategory?: string;
  manufacturer?: string;
  model_number?: string;
  description?: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductDocument {
  id: string;
  product_id: string;
  vendor_id: string;
  document_type: string;
  file_name: string;
  storage_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface ProductSpecification {
  id: string;
  product_id: string;
  vendor_id: string;
  parameter: string;
  value: string;
  unit?: string;
  normalized_value?: string;
  source_document_id?: string;
  source_text?: string;
  confidence?: number;
  is_manual: boolean;
  created_at: string;
}

export interface AppState {
  user: User | null;
  analyses: Analysis[];
  reviews: Review[];
  feedback: Feedback[];
  standards: Standard[];
  weights: Weights;
  theme: "light" | "dark";
  compare: string[]; // standard ids
}

// ------------------------------------------------------------------
// STEP 4: VENDOR ASSESSMENT TYPES
// ------------------------------------------------------------------

export type AssessmentStatus = "DRAFT" | "PROCESSING" | "COMPLETED" | "FAILED";
export type AssessmentResultStatus = "MATCH" | "PARTIAL" | "MISSING" | "WARNING" | "NOT_ASSESSABLE";

export interface Assessment {
  id: string;
  procurement_id: string;
  product_id: string;
  vendor_id: string;
  status: AssessmentStatus;
  overall_score?: number;
  confidence?: number;
  engine_version?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  requirement_id: string;
  status: AssessmentResultStatus;
  score?: number;
  product_value?: string;
  required_value?: string;
  unit?: string;
  evidence?: string;
  explanation?: string;
  source_document_id?: string;
  created_at: string;
}

// Contract for ML Integration
export interface MLAssessmentRequest {
  procurement: Partial<Analysis>;
  requirements: Requirement[];
  vendor_product: Partial<Product>;
  product_specifications: ProductSpecification[];
  documents: ProductDocument[];
  standards?: any[];
}

export interface MLAssessmentResponse {
  overall_score: number;
  confidence: number;
  compliance_class?: string;
  feature_scores?: Record<string, number>;
  explanation?: string;
  model_version?: string;
  requirement_results: Array<{
    requirement_id: string;
    status: AssessmentResultStatus;
    score: number;
    product_value?: string;
    required_value?: string;
    evidence?: string;
    explanation?: string;
    source_document_id?: string;
    severity?: string;
  }>;
  gaps: any[];
  warnings: any[];
  recommendations?: any[];
  metadata?: {
    model_version?: string;
    explanation?: string;
    predicted_class?: number;
  };
}

// ------------------------------------------------------------------
// FINAL EVALUATION & APPLICATION TYPES
// ------------------------------------------------------------------

export interface RequiredDocument {
  type: string;
  name: string;
  required: boolean;
}

export interface EvaluationWeights {
  technical: number;
  documentation: number;
  experience: number;
  delivery: number;
  price: number;
}

export type TenderApplicationStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "SHORTLISTED" | "NOT_SHORTLISTED" | "WITHDRAWN" | "AWARDED";

export interface TenderApplication {
  id: string;
  tender_id: string;
  vendor_id: string;
  product_id: string;
  status: TenderApplicationStatus;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorEvaluation {
  id: string;
  application_id: string;
  tender_id: string;
  vendor_id: string;
  model_version?: string;
  technical_score?: number;
  documentation_score?: number;
  experience_score?: number;
  delivery_score?: number;
  price_score?: number;
  overall_score?: number;
  confidence?: number;
  risk_level?: string;
  rank?: number;
  recommendation?: string;
  evaluation_timestamp: string;
}
