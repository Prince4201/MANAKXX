import os
import json
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

app = FastAPI(title="MANAKX ML Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and metadata
MODEL_PATH = "ml/models/vendor_compliance_model.pkl"
METADATA_PATH = "ml/models/model_metadata.json"

clf = None
metadata = {}

@app.on_event("startup")
def load_model():
    global clf, metadata
    if os.path.exists(MODEL_PATH) and os.path.exists(METADATA_PATH):
        clf = joblib.load(MODEL_PATH)
        with open(METADATA_PATH, "r") as f:
            metadata = json.load(f)
    else:
        print("Warning: Model not found. Please train the model first.")

class MLAssessmentRequest(BaseModel):
    procurement: Dict[str, Any]
    requirements: List[Dict[str, Any]]
    vendor_product: Dict[str, Any]
    product_specifications: List[Dict[str, Any]]
    documents: List[Dict[str, Any]]
    standards: Optional[List[Dict[str, Any]]] = []

def extract_features(req: MLAssessmentRequest) -> pd.DataFrame:
    # Basic Feature Engineering from Request
    
    total_reqs = len(req.requirements)
    if total_reqs == 0: total_reqs = 1
    
    mandatory_reqs = [r for r in req.requirements if r.get('importance') == 'High']
    total_mandatory = len(mandatory_reqs)
    if total_mandatory == 0: total_mandatory = 1
    
    # We will simulate feature extraction by comparing product_specifications to requirements
    # In a fully developed NLP pipeline, this would use semantic similarity.
    # Here, we do a simplistic matching simulation based on presence for the demo.
    
    # Calculate matches
    matched_reqs = 0
    matched_mandatory = 0
    critical_gaps = 0
    
    req_results = []
    
    for r in req.requirements:
        # Smart keyword matching: tokenize and compare with synonyms
        req_type = r.get('type', '').lower()
        req_text = r.get('text', '').lower()
        req_tokens = set(req_type.split() + req_text.replace(',', ' ').replace('.', ' ').split())
        
        # Domain synonym expansion for common procurement terms
        synonyms = {
            'dimension': ['height', 'width', 'length', 'size', 'desk_height', 'depth', 'mm', 'cm'],
            'material': ['steel', 'wood', 'metal', 'plastic', 'iron', 'aluminum', 'frame', 'powder', 'coating'],
            'safety': ['edge', 'round', 'rounded', 'protection', 'safe', 'guard', 'compliance', 'edges'],
            'load': ['capacity', 'weight', 'bearing', 'load_capacity', 'kg', 'strength'],
            'durability': ['strength', 'load', 'capacity', 'resistant', 'heavy', 'duty'],
            'weight': ['kg', 'load', 'capacity', 'mass'],
            'finish': ['coating', 'powder', 'paint', 'surface', 'polish'],
            'standard': ['bis', 'iso', 'is', 'certification', 'compliance'],
        }
        expanded_tokens = set(req_tokens)
        for key, syns in synonyms.items():
            if key in req_tokens or any(s in req_tokens for s in syns):
                expanded_tokens.update(syns)
                expanded_tokens.add(key)
        
        spec_match = False
        for s in req.product_specifications:
            spec_param = s.get('parameter', s.get('attribute_name', '')).lower()
            spec_val = s.get('value', s.get('attribute_value', '')).lower()
            spec_tokens = set(spec_param.replace('_', ' ').split() + spec_val.replace(',', ' ').replace('.', ' ').split())
            
            overlap = expanded_tokens & spec_tokens
            if len(overlap) >= 1:
                spec_match = True
                break
        
        if spec_match:
            matched_reqs += 1
            if r.get('importance') == 'High':
                matched_mandatory += 1
            req_results.append({
                "requirement_id": r.get('id'),
                "status": "MATCH",
                "score": 100,
                "evidence": "Found in product specifications",
                "explanation": "Requirement successfully verified against product attributes."
            })
        else:
            if r.get('importance') == 'High':
                critical_gaps += 1
                req_results.append({
                    "requirement_id": r.get('id'),
                    "status": "MISSING",
                    "score": 0,
                    "explanation": "Failed mandatory requirement.",
                    "severity": "HIGH"
                })
            else:
                req_results.append({
                    "requirement_id": r.get('id'),
                    "status": "PARTIAL",
                    "score": 50,
                    "explanation": "Requirement not explicitly met but is non-mandatory.",
                    "severity": "LOW"
                })
                
    requirement_match_ratio = matched_reqs / total_reqs
    mandatory_requirement_match_ratio = matched_mandatory / total_mandatory
    missing_requirement_count = total_reqs - matched_reqs
    
    # Documents
    expected_docs = 4 # Assumed standard number of expected docs
    doc_count = len(req.documents)
    document_completeness_ratio = min(doc_count / expected_docs, 1.0)
    evidence_strength = document_completeness_ratio * 0.9
    
    # Commercials
    price_competitiveness = 1.0 # Default median
    experience_years = 5
    
    features = {
        'requirement_match_ratio': [requirement_match_ratio],
        'mandatory_requirement_match_ratio': [mandatory_requirement_match_ratio],
        'document_completeness_ratio': [document_completeness_ratio],
        'evidence_strength': [evidence_strength],
        'missing_requirement_count': [missing_requirement_count],
        'critical_gap_count': [critical_gaps],
        'price_competitiveness': [price_competitiveness],
        'experience_years': [experience_years]
    }
    
    return pd.DataFrame(features), req_results, critical_gaps

@app.post("/api/ml/vendor-evaluate")
def evaluate_vendor(request: MLAssessmentRequest):
    if clf is None:
        raise HTTPException(status_code=503, detail="ML Model not loaded.")
        
    df_features, req_results, critical_gaps = extract_features(request)
    
    # Predict compliance class
    prediction = clf.predict(df_features)[0]
    
    # Calculate an overall score based on the prediction and features
    base_score = 0
    if prediction == 'COMPLIANT':
        base_score = 90
    elif prediction == 'PARTIALLY_COMPLIANT':
        base_score = 70
    else:
        base_score = 40
        
    # Adjust score with actual ratios
    overall_score = base_score + (df_features['requirement_match_ratio'][0] * 10) - (critical_gaps * 5)
    overall_score = max(0, min(100, overall_score))
    
    gaps = []
    # Build structured gap objects matching the frontend's expected shape: { requirement, issue }
    for rr in req_results:
        if rr["status"] == "MISSING":
            # Find the original requirement text
            orig_req = next((r for r in request.requirements if r.get("id") == rr["requirement_id"]), None)
            req_text = orig_req.get("text", rr["requirement_id"]) if orig_req else rr["requirement_id"]
            gaps.append({"requirement": req_text, "issue": "Missing mandatory requirement"})
        elif rr["status"] == "PARTIAL":
            orig_req = next((r for r in request.requirements if r.get("id") == rr["requirement_id"]), None)
            req_text = orig_req.get("text", rr["requirement_id"]) if orig_req else rr["requirement_id"]
            gaps.append({"requirement": req_text, "issue": "Partially met"})
    
    if df_features['document_completeness_ratio'][0] < 1.0:
        gaps.append({"requirement": "Documentation Completeness", "issue": f"Only {int(df_features['document_completeness_ratio'][0]*100)}% of expected documents provided"})
        
    explanation = f"Model classified this application as {prediction}. "
    explanation += f"It matched {df_features['requirement_match_ratio'][0]*100:.0f}% of requirements."
    
    return {
        "model_version": metadata.get("model_version", "1.0"),
        "compliance_class": prediction,
        "overall_score": int(overall_score),
        "confidence": int(metadata.get("metrics", {}).get("accuracy", 0.85) * 100),
        "feature_scores": {
            "requirement_match": df_features['requirement_match_ratio'][0],
            "document_completeness": df_features['document_completeness_ratio'][0]
        },
        "requirement_results": req_results,
        "gaps": gaps,
        "warnings": [],
        "recommendations": ["Review missing mandatory requirements."] if critical_gaps > 0 else ["Application looks strong."],
        "explanation": explanation,
        "metadata": {
            "model_version": metadata.get("model_version", "1.0"),
            "explanation": explanation,
            "predicted_class": prediction
        }
    }

@app.get("/api/ml/metadata")
def get_metadata():
    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found")
    return metadata

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml.api:app", host="0.0.0.0", port=8000, reload=True)
