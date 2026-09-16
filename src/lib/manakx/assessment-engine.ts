import type { MLAssessmentRequest, MLAssessmentResponse } from "./types";

/**
 * Service Boundary for MANAKX AI Assessment.
 * Calls the Python FastAPI ML backend to evaluate vendor products.
 */
export async function runAssessment(
  request: MLAssessmentRequest,
  onProgress?: (stage: string) => void
): Promise<MLAssessmentResponse> {
  
  if (onProgress) onProgress("Initializing ML pipeline...");
  
  try {
    const API_URL = import.meta.env['VITE_ML_API_URL'] || "http://localhost:8000";
    const ENDPOINT = `${API_URL}/api/ml/vendor-evaluate`;
    
    if (onProgress) onProgress("Sending vendor data for ML analysis...");
    
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      let errorDetail = "Evaluation failed.";
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
      } catch (e) {}
      throw new Error(`ML Service Error: ${response.status} - ${errorDetail}`);
    }
    
    if (onProgress) onProgress("Processing AI prediction...");
    
    const data: MLAssessmentResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error("Failed to run ML assessment:", error);
    throw error;
  }
}
