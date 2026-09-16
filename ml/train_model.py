import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
import json
import os
import datetime

def train_model():
    print("Loading data...")
    df = pd.read_csv('ml/data/training_dataset.csv')
    
    X = df.drop('compliance_class', axis=1)
    y = df['compliance_class']
    
    # Stratified split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Training RandomForestClassifier...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    clf.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = clf.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1 Score: {f1:.4f}")
    
    # Save model
    os.makedirs('ml/models', exist_ok=True)
    joblib.dump(clf, 'ml/models/vendor_compliance_model.pkl')
    
    # Save metadata
    metadata = {
        "model_version": "1.0.0",
        "algorithm": "RandomForestClassifier",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "features": list(X.columns),
        "classes": list(clf.classes_),
        "metrics": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4)
        },
        "last_trained": datetime.datetime.now().isoformat()
    }
    
    with open('ml/models/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print("Model and metadata saved successfully in ml/models/")

if __name__ == "__main__":
    train_model()
