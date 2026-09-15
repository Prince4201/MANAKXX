# MANAKX Vendor ML Pipeline

This directory contains the machine learning backend for evaluating vendor products against government procurement requirements.

## Architecture

The ML system acts as a service boundary, taking the structured JSON request from the React frontend, processing deterministic rule-based matches, extracting ML features, and running predictions using a trained `RandomForestClassifier`.

1. `dataset/`: Contains synthetic data generation script to train the model.
2. `preprocessing/`: Contains deterministic requirement parsers and feature engineering logic.
3. `training/`: Contains the model training script that outputs a `.pkl` file.
4. `models/`: Stores the trained weights and metadata.
5. `api/`: Exposes the FastAPI endpoint `POST /api/ml/vendor-evaluate` for the Node/React frontend to consume.

## Setup Instructions

### 1. Install Dependencies
Make sure you have Python installed. From the `MANAKX` project root directory, run:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r src\ml\requirements.txt
```

### 2. Generate Dataset & Train Model
Run the following commands to generate the synthetic dataset (3500 samples) and train the Random Forest model. 
This will create `models/vendor_evaluator.pkl`.

```powershell
.\.venv\Scripts\Activate.ps1
python src\ml\dataset\generate_synthetic_data.py
python src\ml\training\train_vendor_model.py
```

### 3. Start the FastAPI Backend
Start the ML inference server. The React frontend will attempt to POST to `http://localhost:8000/api/ml/vendor-evaluate` when a vendor runs a Self-Assessment.

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn src.ml.api.main:app --reload --port 8000
```
