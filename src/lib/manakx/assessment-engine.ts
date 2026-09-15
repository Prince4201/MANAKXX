import type { MLAssessmentRequest, MLAssessmentResponse } from "./types";

/**
 * Service Boundary for MANAKX AI Assessment.
 * Calls the Python FastAPI ML backend to evaluate vendor products.
 */
export async function runAssessment(
  request: MLAssessmentRequest,
  onProgress?: (stage: string) => void
): Promise<MLAssessmentResponse> {
  
  if (onProgress) onProgress("Initializing AI Demo pipeline...");
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (onProgress) onProgress("Analyzing specifications and requirements...");
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (onProgress) onProgress("Scoring vendor compliance...");
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Deterministic mock based on the vendor or just returning a generic strong score for the demo self-assessment
  const isMissingDocs = request.documents?.length === 0;
  
  return {
    overall_score: isMissingDocs ? 72 : 94,
    confidence: 88,
    requirement_results: request.requirements.map(req => ({
      requirement_id: req.id,
      status: "MATCH",
      score: 95,
      evidence: "Matched from product specification sheet",
      explanation: "The provided product meets this requirement."
    })),
    gaps: isMissingDocs ? ["Missing required BIS Test Report"] : [],
    warnings: isMissingDocs ? ["Documentation is incomplete"] : [],
    recommendations: ["Ensure all mandatory test reports are updated"]
  };
}
