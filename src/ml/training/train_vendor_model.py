import pandas as pd
import os
import json
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

def train():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, 'dataset', 'vendor_training_data.csv')
    model_dir = os.path.join(base_dir, 'models')
    
    if not os.path.exists(dataset_path):
        print("Dataset not found. Please run generate_synthetic_data.py first.")
        return
        
    print(f"Loading dataset from {dataset_path}...")
    df = pd.read_csv(dataset_path)
    
    # Define features and target
    target_col = 'compliance_class'
    feature_cols = [c for c in df.columns if c != target_col]
    
    X = df[feature_cols]
    y = df[target_col]
    
    # Train-test split
    print("Splitting dataset (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Train model
    print("Training RandomForestClassifier...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    clf.fit(X_train, y_train)
    
    # Evaluate
    print("Evaluating model...")
    y_pred = clf.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    print("\nModel Metrics on Test Set:")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model and metadata
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)
        
    model_path = os.path.join(model_dir, 'vendor_evaluator.pkl')
    meta_path = os.path.join(model_dir, 'model_metadata.json')
    
    print(f"Saving model to {model_path}...")
    joblib.dump(clf, model_path)
    
    metadata = {
        "model": "RandomForestClassifier",
        "dataset": "synthetic-v1",
        "samples": len(df),
        "features": feature_cols,
        "metrics": {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1": f1
        }
    }
    
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print("Training complete.")

if __name__ == "__main__":
    train()
