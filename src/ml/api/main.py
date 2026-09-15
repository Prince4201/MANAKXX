from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import joblib
import os
import json
import logging
import sys

# Add src/ml to python path so we can import preprocessing
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocessing.feature_engineering import engineer_features

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MANAKX Vendor Evaluation ML API", version="1.0")

# Enable CORS for the frontend React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and metadata on startup
# Try __file__-relative first, then fall back to CWD-relative
_file_based_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
_cwd_based_dir = os.path.join(os.getcwd(), 'src', 'ml', 'models')
MODEL_DIR = _file_based_dir if os.path.isdir(_file_based_dir) else _cwd_based_dir
MODEL_PATH = os.path.join(MODEL_DIR, 'vendor_evaluator.pkl')
META_PATH = os.path.join(MODEL_DIR, 'model_metadata.json')

model = None
metadata = {}

@app.on_event("startup")
async def load_model():
    global model, metadata
    if os.path.exists(MODEL_PATH) and os.path.exists(META_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            with open(META_PATH, 'r') as f:
                metadata = json.load(f)
            logger.info("ML Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
    else:
        logger.warning(f"Model files not found at {MODEL_DIR}. Please run training script.")

@app.get("/")
def read_root():
    return {"status": "ok", "service": "MANAKX ML Vendor Evaluation"}

@app.post("/api/ml/vendor-evaluate")
async def evaluate_vendor(request: Request):
    if model is None:
        raise HTTPException(status_code=503, detail="ML Model is not loaded. Run training first.")
        
    try:
        # Parse incoming TS MLAssessmentRequest
        data = await request.json()
        
        # 1. Feature Engineering & Deterministic Matching
        features, req_results = engineer_features(data)
        
        # 2. Prepare feature vector for model (must match training feature order)
        feature_cols = metadata.get('features', [])
        
        # Convert features dict to 2D array for sklearn
        X_input = []
        for col in feature_cols:
            if col in features:
                X_input.append(features[col])
            else:
                X_input.append(0) # Default if missing
                
        # 3. Model Prediction
        prediction = model.predict([X_input])[0]
        probabilities = model.predict_proba([X_input])[0]
        
        # compliance_class mapping: 0=POOR, 1=PARTIAL, 2=GOOD, 3=EXCELLENT
        confidence = round(probabilities[prediction] * 100, 1)
        
        # Map class to a numeric overall score out of 100
        # If class 3 -> 80-100
        # If class 2 -> 60-79
        # If class 1 -> 40-59
        # If class 0 -> 0-39
        # We can fine-tune this using the deterministic features to provide a continuous score
        
        base_score = {3: 80, 2: 60, 1: 40, 0: 10}[int(prediction)]
        # Add some continuous variance based on match ratio
        overall_score = min(100, base_score + int(features['technical_match_ratio'] * 20))
        
        # 4. Generate Explainable Gaps and Warnings
        gaps = []
        warnings = []
        
        if features['missing_evidence_count'] > 0:
            gaps.append({"requirement": "Documentation", "issue": f"{features['missing_evidence_count']} missing evidence links"})
            
        if features['conflict_count'] > 0:
            gaps.append({"requirement": "Technical Specification", "issue": f"{features['conflict_count']} specification conflicts"})
            
        if features['delivery_compliance'] == 0:
            warnings.append({"requirement": "Delivery", "issue": "Delivery time exceeds typical limits"})
            
        # Add explanation logic
        if overall_score >= 80:
            explanation = "Excellent alignment with procurement requirements and complete documentation."
        elif overall_score >= 60:
            explanation = "Good alignment. Some minor gaps or missing evidence, but technically viable."
        elif overall_score >= 40:
            explanation = "Partial alignment. Significant gaps in specifications or missing documents."
        else:
            explanation = "Poor alignment. Product does not meet minimum technical requirements."
            
        # 5. Build MLAssessmentResponse
        response = {
            "overall_score": overall_score,
            "confidence": confidence,
            "requirement_results": req_results,
            "gaps": gaps,
            "warnings": warnings,
            "recommendations": data.get('standards', []),
            "metadata": {
                "model_version": metadata.get('dataset', 'unknown'),
                "explanation": explanation,
                "predicted_class": int(prediction)
            }
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error during evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
