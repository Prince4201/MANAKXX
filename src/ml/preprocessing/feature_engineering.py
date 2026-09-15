import re

def parse_number_and_unit(text):
    if not text:
        return None, None
    match = re.search(r'([\d\.]+)\s*([a-zA-Z%]+)?', str(text))
    if match:
        val = float(match.group(1))
        unit = match.group(2).lower() if match.group(2) else None
        
        # Normalize some common units for comparison
        if unit in ['mm', 'cm', 'm']:
            if unit == 'mm': val /= 1000
            elif unit == 'cm': val /= 100
            unit = 'm'
        elif unit in ['g', 'kg', 'ton']:
            if unit == 'g': val /= 1000
            elif unit == 'ton': val *= 1000
            unit = 'kg'
            
        return val, unit
    return None, None

def evaluate_requirement(req_text, product_specs):
    req_text_lower = req_text.lower()
    
    # Check if we can find a matching specification for this requirement
    best_spec = None
    best_score = -1
    
    # Simple heuristic to find the most relevant spec
    for spec in product_specs:
        spec_text = (spec.get('parameter', '') + ' ' + spec.get('value', '')).lower()
        
        # Word overlap
        req_words = set(req_text_lower.split())
        spec_words = set(spec_text.split())
        overlap = len(req_words.intersection(spec_words))
        
        if overlap > best_score:
            best_score = overlap
            best_spec = spec
            
    if best_score == 0 or not best_spec:
        return "MISSING", "No matching specification found."

    # Try numeric parsing if there's an operator
    req_val, req_unit = parse_number_and_unit(req_text)
    spec_val, spec_unit = parse_number_and_unit(best_spec.get('value', ''))
    
    if req_val is not None and spec_val is not None and req_unit == spec_unit:
        if '>=' in req_text or 'min' in req_text_lower:
            if spec_val >= req_val:
                return "MATCH", f"Specification meets minimum requirement ({spec_val} >= {req_val})"
            else:
                return "CONFLICT", f"Specification {spec_val} is less than required {req_val}"
                
        elif '<=' in req_text or 'max' in req_text_lower:
            if spec_val <= req_val:
                return "MATCH", f"Specification meets maximum requirement ({spec_val} <= {req_val})"
            else:
                return "CONFLICT", f"Specification {spec_val} exceeds allowed {req_val}"
                
        elif '==' in req_text or 'equal' in req_text_lower:
            if spec_val == req_val:
                return "MATCH", f"Specification exactly matches requirement ({spec_val})"
            else:
                return "CONFLICT", f"Specification {spec_val} does not match {req_val}"

    # Fallback to text matching
    if best_score > 2:
        return "MATCH", "Textual description strongly aligns with requirement."
    else:
        return "PARTIAL", "Partial textual overlap, manual verification may be needed."

def engineer_features(request_data):
    """
    Extracts features and deterministic requirement results from the raw MLAssessmentRequest payload.
    """
    requirements = request_data.get('requirements', [])
    product_specs = request_data.get('product_specifications', [])
    documents = request_data.get('documents', [])
    vendor_product = request_data.get('vendor_product', {})
    
    results = []
    
    match_count = 0
    partial_count = 0
    missing_count = 0
    conflict_count = 0
    
    for req in requirements:
        status, reason = evaluate_requirement(req.get('text', ''), product_specs)
        
        if status == "MATCH": match_count += 1
        elif status == "PARTIAL": partial_count += 1
        elif status == "MISSING": missing_count += 1
        elif status == "CONFLICT": conflict_count += 1
        
        results.append({
            "requirement_id": req.get('id'),
            "status": status,
            "explanation": reason,
            "evidence": documents[0].get('file_name', 'Datasheet') if documents else None,
            "source_document_id": documents[0].get('id') if documents else None
        })
        
    total_reqs = len(requirements) if requirements else 1
    
    technical_match_ratio = match_count / total_reqs
    technical_partial_ratio = partial_count / total_reqs
    technical_missing_ratio = missing_count / total_reqs
    
    # Calculate synthetic features for the model
    features = {
        'technical_match_ratio': technical_match_ratio,
        'technical_partial_ratio': technical_partial_ratio,
        'technical_missing_ratio': technical_missing_ratio,
        'mandatory_requirement_compliance': 1 if technical_missing_ratio < 0.2 else 0,
        'document_completeness': 1.0 if len(documents) > 0 else 0.0,
        'required_documents_present': len(documents),
        'required_documents_missing': max(0, 3 - len(documents)),
        'evidence_coverage': 1.0 if documents else 0.0,
        'specification_match_score': technical_match_ratio * 100,
        'specification_conflict_count': conflict_count,
        'experience_years': vendor_product.get('experience_years', 5), # Default to 5 if not provided
        'relevant_experience_score': 80,
        'delivery_days': vendor_product.get('delivery_days', 30),
        'delivery_compliance': 1,
        'quoted_price': vendor_product.get('quoted_price', 25000),
        'price_score': 75,
        'standards_coverage': technical_match_ratio,
        'high_risk_requirement_count': conflict_count + missing_count,
        'missing_evidence_count': missing_count,
        'conflict_count': conflict_count
    }
    
    return features, results
