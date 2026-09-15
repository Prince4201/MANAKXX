import type { MLAssessmentRequest, MLAssessmentResponse, AssessmentResultStatus } from "./types";

/**
 * Service Boundary for MANAKX AI Assessment.
 * 
 * IMPORTANT: This currently uses a MOCK DEVELOPMENT ENGINE for UI/workflow testing.
 * The teammate's final ML model should be integrated here by replacing this
 * implementation and calling their inference endpoint or service.
 */
export async function runAssessment(
  request: MLAssessmentRequest,
  onProgress?: (stage: string) => void
): Promise<MLAssessmentResponse> {
  
  if (onProgress) onProgress("Analyzing product specifications...");
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (onProgress) onProgress("Comparing procurement requirements...");
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (onProgress) onProgress("Evaluating evidence...");
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (onProgress) onProgress("Preparing assessment report...");
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // --- MOCK LOGIC (DO NOT USE IN PRODUCTION) ---
  const results: MLAssessmentResponse["requirement_results"] = [];
  let scoreSum = 0;
  let matches = 0;
  let partials = 0;
  let missing = 0;
  let warnings = 0;
  
  const gaps: any[] = [];
  const reqWarnings: any[] = [];

  const firstDocument = request.documents?.[0];
  const docRef = firstDocument ? firstDocument.file_name : "Vendor Document";
  const docId = firstDocument ? firstDocument.id : undefined;

  // We loop through real requirements and generate plausible mock outputs
  request.requirements.forEach((req, index) => {
    // Generate a deterministically pseudo-random outcome based on the requirement id or text length
    const hash = req.text.length + index;
    let status: AssessmentResultStatus;
    let score: number;
    let explanation: string;
    let evidence: string | undefined;

    if (hash % 5 === 0) {
      status = "MISSING";
      score = 0;
      explanation = "No supporting evidence found in the provided product specifications or datasheet.";
      missing++;
      gaps.push({ requirement: req.text, issue: "No evidence found" });
    } else if (hash % 7 === 0) {
      status = "PARTIAL";
      score = 50;
      explanation = "Product partially meets this requirement but lacks specific detail on some parameters.";
      evidence = `${docRef} (General Specifications section)`;
      partials++;
      gaps.push({ requirement: req.text, issue: "Incomplete specification match" });
    } else if (hash % 11 === 0) {
      status = "WARNING";
      score = 30;
      explanation = "Requirement wording implies a certification or specific test report that is not provided.";
      evidence = "N/A";
      warnings++;
      reqWarnings.push({ requirement: req.text, issue: "Missing test report / certificate" });
    } else {
      status = "MATCH";
      score = 100;
      explanation = "Product specification strongly aligns with the procurement requirement.";
      evidence = `${docRef} (Page ${1 + (hash % 10)})`;
      matches++;
    }

    scoreSum += score;

    results.push({
      requirement_id: req.id,
      status,
      score,
      explanation,
      evidence,
      source_document_id: docId,
    });
  });

  const overallScore = request.requirements.length > 0 
    ? Math.round(scoreSum / request.requirements.length) 
    : 0;

  // Mock confidence based on the number of matches
  const confidence = Math.min(
    95, 
    Math.max(50, overallScore - (missing * 5) - (warnings * 2))
  );

  return {
    overall_score: overallScore,
    confidence,
    requirement_results: results,
    gaps,
    warnings: reqWarnings,
    recommendations: request.standards || []
  };
}
