# MANAKX — AI Standards Recommendation Engine (SIH26108)

A fully interactive prototype: procurement specs in, ranked Indian-Standards recommendations with explanations, gaps, conflicts, human review and reports out. Everything runs locally with synthetic data — no API keys, no external AI.

## What gets built

**Public**
- Landing page: hero (MANAKX, "AI-Powered Indian Standards Recommendation Engine"), 7 feature cards, workflow strip (Tender → Extraction → Matching → Recommendation → Review → Report), synthetic-data disclaimer, "Start Analysis" / "Explore Demo" CTAs.
- Demo login: pick Procurement Officer / Reviewer / Administrator, plus one-click "Continue as Demo Procurement Officer".

**Application (side-nav shell, light + dark mode)**
- Dashboard: 5 KPI cards, recent analyses table (clickable rows open the real analysis), 4 charts.
- New Analysis: category → product → input method (upload / paste / demo tender) → Analyze.
- Analysis Workspace: 10-step animated pipeline (~15–20s) with real per-step work, auto-navigates to results.
- Recommendations: ranked cards with relevance, confidence, matched/partial requirements, "Why recommended?" evidence panel, sort + filter, View Details / Compare / Add to Review.
- Extracted Requirements: type, importance, confidence, source sentence; add / edit / delete re-runs matching live.
- Requirement ↔ Standard mapping table with Strong / Partial / No Match and click-to-highlight.
- Gap & Conflict analysis with severity and "review recommended" wording.
- Compare Standards (2–4 side by side).
- Standard Details page.
- Human Review queue: accept / reject / request review / comment / structured feedback; updates dashboard stats.
- Reports: print-friendly full report page with Preview / Print / Download.
- Analysis History with filters; reopening restores the stored analysis.
- Standards Search with filters.
- Profile / Settings.

**Admin**
- Admin dashboard, standards database CRUD (add / edit / deactivate), dataset management, analytics charts. Scoring weights are editable in admin and feed the live engine.

## The matching engine (local, deterministic)

A rule + lexical-similarity pipeline in plain TypeScript:
1. Sentence split and normalise the spec text.
2. Extract requirements via domain lexicons and numeric/unit patterns; assign type, importance, confidence, source sentence.
3. Classify into Product / Material / Safety / Performance / Dimension / Capacity / Testing / Certification / Environmental / Operational / Quality.
4. Retrieve candidate standards, score each: product-domain 30, requirement similarity 35, scope 20, keyword overlap 10, category 5 (weights configurable), normalised 0–100.
5. Coverage, gap rules (missing requirement types for that product), conflict rules (min > max, unit clashes, contradictory materials).
6. Generate the explanation from actual matched evidence — no canned text.

Results genuinely change with category, product, edited requirements and typed text.

## Data

- 80–100 synthetic standards (DEMO-IS-xxx) across 10 categories, each labelled "SYNTHETIC DEMO STANDARD".
- 5 full demo scenarios: safety helmet, electrical cable, medical gloves, food packaging, cement — each yielding different recommendations, gaps and conflicts.
- Seeded history, reviews and analytics that stay internally consistent as the user adds new analyses.
- Entities: User, Tender, Analysis, Requirement, Standard, Recommendation, RequirementMatch, Gap, Conflict, Review, Feedback.

## Technical notes

- TanStack Start routes (one route per page), React + TypeScript, Tailwind, shadcn/ui, lucide icons, Recharts.
- Global store persisted to localStorage so every action (review decision, new analysis, admin edit) survives reload and flows into dashboard/analytics.
- Uploads: real file selection with type/size validation; PDF/DOCX text extraction is attempted client-side for text files and clearly falls back to a demo-tender path rather than faking a parse of arbitrary binaries.
- Toasts, tooltips, skeletons, empty states, confirm dialogs, breadcrumbs, pagination, status badges throughout. No dead buttons.
- Persistent "AI Confidence & Limitations" panel plus synthetic-data banner in the app shell.

## Build order

1. Design system, app shell, navigation, theme, data models.
2. Synthetic standards dataset and demo scenarios.
3. Analysis engine + store.
4. Landing, login, dashboard, new analysis, workspace, recommendations.
5. Gaps/conflicts, compare, standard details, review, reports, history, search.
6. Admin + analytics.
7. Polish pass and full end-to-end run of the SIH demo flow.
