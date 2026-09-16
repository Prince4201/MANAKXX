import pandas as pd
import numpy as np
import os

def generate_synthetic_data(num_samples=4000):
    np.random.seed(42)
    
    records = []
    
    # Generate balanced classes by controlling the feature distributions per class
    samples_per_class = num_samples // 3
    remainder = num_samples - samples_per_class * 3
    
    # --- COMPLIANT vendors (~1/3) ---
    for _ in range(samples_per_class + remainder):
        records.append({
            'requirement_match_ratio': np.random.uniform(0.85, 1.0),
            'mandatory_requirement_match_ratio': np.random.uniform(0.95, 1.0),
            'document_completeness_ratio': np.random.uniform(0.85, 1.0),
            'evidence_strength': np.random.uniform(0.75, 1.0),
            'missing_requirement_count': np.random.randint(0, 2),
            'critical_gap_count': 0,
            'price_competitiveness': np.random.uniform(0.7, 1.2),
            'experience_years': np.random.randint(3, 20),
            'compliance_class': 'COMPLIANT'
        })
    
    # --- PARTIALLY_COMPLIANT vendors (~1/3) ---
    for _ in range(samples_per_class):
        records.append({
            'requirement_match_ratio': np.random.uniform(0.55, 0.90),
            'mandatory_requirement_match_ratio': np.random.uniform(0.70, 0.95),
            'document_completeness_ratio': np.random.uniform(0.50, 0.85),
            'evidence_strength': np.random.uniform(0.40, 0.75),
            'missing_requirement_count': np.random.randint(1, 5),
            'critical_gap_count': np.random.choice([0, 1], p=[0.6, 0.4]),
            'price_competitiveness': np.random.uniform(0.6, 1.4),
            'experience_years': np.random.randint(1, 15),
            'compliance_class': 'PARTIALLY_COMPLIANT'
        })
    
    # --- NON_COMPLIANT vendors (~1/3) ---
    for _ in range(samples_per_class):
        records.append({
            'requirement_match_ratio': np.random.uniform(0.20, 0.65),
            'mandatory_requirement_match_ratio': np.random.uniform(0.20, 0.75),
            'document_completeness_ratio': np.random.uniform(0.10, 0.60),
            'evidence_strength': np.random.uniform(0.10, 0.50),
            'missing_requirement_count': np.random.randint(3, 10),
            'critical_gap_count': np.random.randint(1, 5),
            'price_competitiveness': np.random.uniform(0.5, 1.5),
            'experience_years': np.random.randint(0, 10),
            'compliance_class': 'NON_COMPLIANT'
        })
    
    df = pd.DataFrame(records)
    
    # Introduce ~5% label noise for realism
    noise_idx = np.random.choice(df.index, size=int(0.05 * len(df)), replace=False)
    classes = ['NON_COMPLIANT', 'PARTIALLY_COMPLIANT', 'COMPLIANT']
    for idx in noise_idx:
        current = df.loc[idx, 'compliance_class']
        others = [c for c in classes if c != current]
        df.loc[idx, 'compliance_class'] = np.random.choice(others)
    
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    os.makedirs('ml/data', exist_ok=True)
    df.to_csv('ml/data/training_dataset.csv', index=False)
    print(f"Generated {len(df)} rows in ml/data/training_dataset.csv")
    print("Class distribution:")
    print(df['compliance_class'].value_counts())

if __name__ == "__main__":
    generate_synthetic_data()
