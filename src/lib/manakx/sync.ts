import { supabase, hasSupabaseConfig } from "../supabase";
import type { Analysis, AppState, Review, Feedback, Standard } from "./types";

/**
 * Pushes the full local state to Supabase.
 * Each table upsert logs errors individually so we can pinpoint issues.
 */
export async function pushToSupabase(state: AppState) {
  if (!hasSupabaseConfig || !supabase) {
    console.log("[ManakX] Supabase not configured, skipping push");
    return;
  }

  console.log("[ManakX] Pushing state to Supabase...", {
    standards: state.standards.length,
    analyses: state.analyses.length,
    reviews: state.reviews.length,
    feedback: state.feedback.length,
  });

  try {
    // 1. Upsert Standards (must go first — analyses reference them via reviews/feedback)
    if (state.standards.length > 0) {
      const { error } = await supabase.from("standards").upsert(
        state.standards.map((s) => ({
          id: s.id,
          title: s.title,
          category: s.category,
          product_domain: s.productDomain,
          scope: s.scope,
          keywords: s.keywords,
          requirement_areas: s.requirementAreas,
          applicable_products: s.applicableProducts,
          related_standards: s.relatedStandards,
          version: s.version,
          status: s.status,
          source_type: s.sourceType,
          last_updated: s.lastUpdated,
          synthetic: s.synthetic,
        }))
      );
      if (error) console.error("[ManakX] standards upsert error:", error);
      else console.log(`[ManakX] ✓ ${state.standards.length} standards upserted`);
    }

    // 2. Upsert Analyses
    if (state.analyses.length > 0) {
      const { error } = await supabase.from("analyses").upsert(
        state.analyses.map((a) => ({
          id: a.id,
          tender_title: a.tenderTitle,
          reference: a.reference,
          category: a.category,
          product: a.product,
          input_method: a.inputMethod,
          source_name: a.sourceName,
          spec_text: a.specText,
          status: a.status,
          created_by: a.createdBy,
          created_at: a.createdAt,
        }))
      );
      if (error) console.error("[ManakX] analyses upsert error:", error);
      else console.log(`[ManakX] ✓ ${state.analyses.length} analyses upserted`);

      // Flatten nested data from analyses
      const requirements: any[] = [];
      const gaps: any[] = [];
      const conflicts: any[] = [];

      for (const a of state.analyses) {
        for (const req of a.requirements) {
          requirements.push({
            id: req.id,
            analysis_id: a.id,
            text: req.text,
            type: req.type,
            importance: req.importance,
            confidence: req.confidence,
            source_sentence: req.sourceSentence,
          });
        }
        for (const g of a.gaps) {
          gaps.push({
            id: g.id,
            analysis_id: a.id,
            area: g.area,
            severity: g.severity,
            reason: g.reason,
            recommended_review: g.recommendedReview,
          });
        }
        for (const c of a.conflicts) {
          conflicts.push({
            id: c.id,
            analysis_id: a.id,
            title: c.title,
            severity: c.severity,
            detail: c.detail,
            recommendation: c.recommendation,
          });
        }
      }

      if (requirements.length > 0) {
        const { error } = await supabase.from("requirements").upsert(requirements);
        if (error) console.error("[ManakX] requirements upsert error:", error);
        else console.log(`[ManakX] ✓ ${requirements.length} requirements upserted`);
      }
      if (gaps.length > 0) {
        const { error } = await supabase.from("gaps").upsert(gaps);
        if (error) console.error("[ManakX] gaps upsert error:", error);
        else console.log(`[ManakX] ✓ ${gaps.length} gaps upserted`);
      }
      if (conflicts.length > 0) {
        const { error } = await supabase.from("conflicts").upsert(conflicts);
        if (error) console.error("[ManakX] conflicts upsert error:", error);
        else console.log(`[ManakX] ✓ ${conflicts.length} conflicts upserted`);
      }
    }

    // 3. Upsert Reviews
    if (state.reviews.length > 0) {
      const { error } = await supabase.from("reviews").upsert(
        state.reviews.map((r) => ({
          id: r.id,
          analysis_id: r.analysisId,
          standard_id: r.standardId,
          ai_score: r.aiScore,
          reviewer: r.reviewer,
          decision: r.decision,
          comment: r.comment,
          updated_at: r.updatedAt,
        }))
      );
      if (error) console.error("[ManakX] reviews upsert error:", error);
      else console.log(`[ManakX] ✓ ${state.reviews.length} reviews upserted`);
    }

    // 4. Upsert Feedback
    if (state.feedback.length > 0) {
      const { error } = await supabase.from("feedback").upsert(
        state.feedback.map((f) => ({
          id: f.id,
          analysis_id: f.analysisId,
          standard_id: f.standardId,
          kind: f.kind,
          comment: f.comment,
          created_at: f.createdAt,
        }))
      );
      if (error) console.error("[ManakX] feedback upsert error:", error);
      else console.log(`[ManakX] ✓ ${state.feedback.length} feedback upserted`);
    }

    console.log("[ManakX] Push complete");
  } catch (error) {
    console.error("[ManakX] Fatal push error:", error);
  }
}

/**
 * Pulls the full state from Supabase.
 */
export async function pullFromSupabase(): Promise<Partial<AppState> | null> {
  if (!hasSupabaseConfig || !supabase) {
    console.log("[ManakX] Supabase not configured, skipping pull");
    return null;
  }

  try {
    const { data: analysesData, error: aErr } = await supabase.from("analyses").select("*");
    if (aErr) { console.error("[ManakX] pull analyses error:", aErr); return null; }

    const { data: requirementsData, error: rErr } = await supabase.from("requirements").select("*");
    if (rErr) console.error("[ManakX] pull requirements error:", rErr);

    const { data: standardsData, error: sErr } = await supabase.from("standards").select("*");
    if (sErr) { console.error("[ManakX] pull standards error:", sErr); return null; }

    const { data: reviewsData, error: rvErr } = await supabase.from("reviews").select("*");
    if (rvErr) console.error("[ManakX] pull reviews error:", rvErr);

    const { data: feedbackData, error: fErr } = await supabase.from("feedback").select("*");
    if (fErr) console.error("[ManakX] pull feedback error:", fErr);

    const { data: gapsData, error: gErr } = await supabase.from("gaps").select("*");
    if (gErr) console.error("[ManakX] pull gaps error:", gErr);

    const { data: conflictsData, error: cErr } = await supabase.from("conflicts").select("*");
    if (cErr) console.error("[ManakX] pull conflicts error:", cErr);

    console.log("[ManakX] Pulled from Supabase:", {
      analyses: analysesData?.length ?? 0,
      standards: standardsData?.length ?? 0,
      requirements: requirementsData?.length ?? 0,
      reviews: reviewsData?.length ?? 0,
      feedback: feedbackData?.length ?? 0,
    });

    if (!analysesData || !standardsData) return null;

    // Reconstruct the analyses
    const analyses: Analysis[] = analysesData.map((a: any) => ({
      id: a.id,
      tenderTitle: a.tender_title,
      reference: a.reference,
      category: a.category,
      product: a.product,
      inputMethod: a.input_method,
      sourceName: a.source_name,
      specText: a.spec_text,
      status: a.status,
      createdBy: a.created_by,
      createdAt: a.created_at,
      requirements: requirementsData?.filter((r: any) => r.analysis_id === a.id).map((r: any) => ({
        id: r.id,
        text: r.text,
        type: r.type,
        importance: r.importance,
        confidence: r.confidence,
        sourceSentence: r.source_sentence,
      })) || [],
      recommendations: [], // Recommendations are recomputed client-side from requirements + standards
      gaps: gapsData?.filter((g: any) => g.analysis_id === a.id).map((g: any) => ({
        id: g.id,
        area: g.area,
        severity: g.severity,
        reason: g.reason,
        recommendedReview: g.recommended_review,
      })) || [],
      conflicts: conflictsData?.filter((c: any) => c.analysis_id === a.id).map((c: any) => ({
        id: c.id,
        title: c.title,
        severity: c.severity,
        detail: c.detail,
        recommendation: c.recommendation,
      })) || [],
    }));

    const standards: Standard[] = standardsData.map((s: any) => ({
      id: s.id,
      title: s.title,
      category: s.category,
      productDomain: s.product_domain,
      scope: s.scope,
      keywords: s.keywords,
      requirementAreas: s.requirement_areas,
      applicableProducts: s.applicable_products,
      relatedStandards: s.related_standards,
      version: s.version,
      status: s.status,
      sourceType: s.source_type,
      lastUpdated: s.last_updated,
      synthetic: s.synthetic,
    }));

    const reviews: Review[] = (reviewsData || []).map((r: any) => ({
      id: r.id,
      analysisId: r.analysis_id,
      standardId: r.standard_id,
      aiScore: r.ai_score,
      reviewer: r.reviewer,
      decision: r.decision,
      comment: r.comment,
      updatedAt: r.updated_at,
    }));

    const feedback: Feedback[] = (feedbackData || []).map((f: any) => ({
      id: f.id,
      analysisId: f.analysis_id,
      standardId: f.standard_id,
      kind: f.kind,
      comment: f.comment,
      createdAt: f.created_at,
    }));

    return {
      analyses,
      standards,
      reviews,
      feedback,
    };
  } catch (error) {
    console.error("[ManakX] Fatal pull error:", error);
    return null;
  }
}
