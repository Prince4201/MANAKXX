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

export type AnalysisStatus = "Draft" | "Completed" | "Needs Review" | "Approved";

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
