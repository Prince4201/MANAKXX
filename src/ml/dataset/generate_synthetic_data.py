import pandas as pd
import numpy as np
import os
import random

# Ensure reproducible random state
np.random.seed(42)
random.seed(42)

def generate_dataset(num_samples=3500):
    print(f"Generating synthetic dataset with {num_samples} samples...")
    
    data = []
    
    for i in range(num_samples):
        # Base quality of this vendor submission (hidden variable to generate correlated features)
        # 0 = Poor, 1 = Mediocre, 2 = Good, 3 = Excellent
        base_quality = np.random.choice([0, 1, 2, 3], p=[0.15, 0.25, 0.35, 0.25])
        
        # Technical
        if base_quality == 3:
            technical_match_ratio = np.random.uniform(0.8, 1.0)
            technical_missing_ratio = np.random.uniform(0.0, 0.05)
            mandatory_requirement_compliance = 1
        elif base_quality == 2:
            technical_match_ratio = np.random.uniform(0.6, 0.9)
            technical_missing_ratio = np.random.uniform(0.0, 0.15)
            mandatory_requirement_compliance = np.random.choice([0, 1], p=[0.05, 0.95])
        elif base_quality == 1:
            technical_match_ratio = np.random.uniform(0.3, 0.7)
            technical_missing_ratio = np.random.uniform(0.1, 0.4)
            mandatory_requirement_compliance = np.random.choice([0, 1], p=[0.4, 0.6])
        else:
            technical_match_ratio = np.random.uniform(0.0, 0.4)
            technical_missing_ratio = np.random.uniform(0.3, 0.8)
            mandatory_requirement_compliance = np.random.choice([0, 1], p=[0.9, 0.1])
            
        technical_partial_ratio = max(0, 1.0 - technical_match_ratio - technical_missing_ratio)
        
        # Documents
        document_completeness = min(1.0, technical_match_ratio + np.random.uniform(-0.2, 0.2))
        document_completeness = max(0.0, document_completeness)
        
        required_documents_present = int(document_completeness * 5)
        required_documents_missing = 5 - required_documents_present
        
        evidence_coverage = document_completeness * np.random.uniform(0.8, 1.0)
        missing_evidence_count = int((1.0 - evidence_coverage) * 10)
        
        # Specifications
        specification_match_score = technical_match_ratio * 100
        specification_conflict_count = int(technical_missing_ratio * 15)
        conflict_count = specification_conflict_count + np.random.randint(0, 3)
        
        # Experience
        if base_quality >= 2:
            experience_years = np.random.randint(3, 15)
        else:
            experience_years = np.random.randint(0, 5)
        relevant_experience_score = min(100, experience_years * 10 + np.random.randint(-10, 20))
        
        # Delivery
        delivery_days = np.random.randint(7, 90)
        delivery_compliance = 1 if delivery_days <= 30 or base_quality >= 2 else 0
        
        # Commercial / Price (Inverse relationship sometimes - cheap but poor quality)
        if base_quality == 0:
            quoted_price = np.random.uniform(5000, 20000) # Cheap
        elif base_quality == 3:
            quoted_price = np.random.uniform(15000, 50000) # Expensive
        else:
            quoted_price = np.random.uniform(10000, 35000)
            
        price_score = max(0, 100 - (quoted_price / 500))
        
        # Standards and Risk
        standards_coverage = np.random.uniform(technical_match_ratio - 0.2, technical_match_ratio + 0.1)
        standards_coverage = max(0.0, min(1.0, standards_coverage))
        
        high_risk_requirement_count = int((1.0 - technical_match_ratio) * 5)
        
        # Target logic (Compliance Class)
        # We define strict rules for the synthetic target so the ML model can learn them
        score = 0
        if mandatory_requirement_compliance == 1:
            score += 40
        score += technical_match_ratio * 30
        score += document_completeness * 15
        score += (relevant_experience_score / 100) * 10
        score += delivery_compliance * 5
        
        # Penalties
        score -= conflict_count * 2
        score -= missing_evidence_count * 1
        
        if score >= 80:
            compliance_class = 3 # EXCELLENT
        elif score >= 60:
            compliance_class = 2 # GOOD
        elif score >= 40:
            compliance_class = 1 # PARTIAL
        else:
            compliance_class = 0 # POOR
            
        # Introduce a tiny bit of noise so it's not a perfectly clean rule system
        if np.random.random() < 0.05:
            compliance_class = max(0, min(3, compliance_class + np.random.choice([-1, 1])))
            
        data.append({
            'technical_match_ratio': round(technical_match_ratio, 3),
            'technical_partial_ratio': round(technical_partial_ratio, 3),
            'technical_missing_ratio': round(technical_missing_ratio, 3),
            'mandatory_requirement_compliance': mandatory_requirement_compliance,
            'document_completeness': round(document_completeness, 3),
            'required_documents_present': required_documents_present,
            'required_documents_missing': required_documents_missing,
            'evidence_coverage': round(evidence_coverage, 3),
            'specification_match_score': round(specification_match_score, 1),
            'specification_conflict_count': specification_conflict_count,
            'experience_years': experience_years,
            'relevant_experience_score': relevant_experience_score,
            'delivery_days': delivery_days,
            'delivery_compliance': delivery_compliance,
            'quoted_price': round(quoted_price, 2),
            'price_score': round(price_score, 1),
            'standards_coverage': round(standards_coverage, 3),
            'high_risk_requirement_count': high_risk_requirement_count,
            'missing_evidence_count': missing_evidence_count,
            'conflict_count': conflict_count,
            'compliance_class': compliance_class
        })

    df = pd.DataFrame(data)
    
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(output_dir, 'vendor_training_data.csv')
    df.to_csv(output_file, index=False)
    
    print(f"Dataset generated successfully! Saved to {output_file}")
    print("\nClass distribution:")
    print(df['compliance_class'].value_counts(normalize=True).sort_index() * 100)

if __name__ == "__main__":
    generate_dataset()
