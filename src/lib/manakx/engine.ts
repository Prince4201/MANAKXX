import { STANDARDS } from "./standards";
import type {
  Conflict,
  Gap,
  Importance,
  Recommendation,
  Requirement,
  RequirementMatch,
  RequirementType,
  Standard,
  Weights,
} from "./types";

export const DEFAULT_WEIGHTS: Weights = {
  productDomain: 30,
  requirementSimilarity: 35,
  scope: 20,
  keywords: 10,
  category: 5,
};

const STOPWORDS = new Set(
  "the a an and or of for to in on with shall must should be is are as at by from that this it its all any each per not no than then also may can will provide provided including include requirement requirements specification specifications tender item items supply supplied".split(
    " ",
  ),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.%\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[-.]+|[-.]+$/g, ""))
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function stem(t: string) {
  return t.replace(/(ing|ed|es|s)$/, "");
}

function tokenSet(text: string) {
  return new Set(tokenize(text).map(stem));
}

/** Similarity that rewards overlap relative to the shorter side (Szymkiewicz–Simpson blended with Jaccard). */
export function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const overlap = inter / Math.min(a.size, b.size);
  const jaccard = inter / (a.size + b.size - inter);
  return 0.65 * overlap + 0.35 * jaccard;
}

/* ------------------------------------------------------------------ */
/* 1. Requirement extraction                                           */
/* ------------------------------------------------------------------ */

const LEXICON: Record<RequirementType, string[]> = {
  Product: ["helmet", "cable", "glove", "cement", "packaging", "luminaire", "motor", "pump", "valve", "bed", "transformer", "battery", "tyre", "fabric", "vessel", "unit", "system", "equipment", "device", "product"],
  Material: ["material", "hdpe", "abs", "polymer", "copper", "aluminium", "steel", "nitrile", "latex", "stainless", "pvc", "xlpe", "cotton", "rubber", "grade", "composition", "thermoplastic", "food-grade", "alloy", "laminate"],
  Safety: ["safety", "protection", "protective", "impact", "hazard", "fire", "flame", "shock", "insulation", "barrier", "sterile", "hygiene", "guard", "risk", "electrical safety", "penetration"],
  Performance: ["performance", "strength", "efficiency", "efficacy", "output", "lumen", "torque", "speed", "resistance", "durability", "life", "cycle", "rating", "compressive", "tensile", "flow", "head", "accuracy"],
  Dimension: ["dimension", "size", "length", "width", "thickness", "diameter", "height", "weight", "mass", "gsm", "tolerance", "mm", "cm"],
  Capacity: ["capacity", "volume", "load", "kva", "ah", "litre", "capacity of", "quantity", "units", "throughput", "kg", "tonne"],
  Testing: ["test", "testing", "tested", "inspection", "sampling", "trial", "verification", "laboratory", "type test", "routine test", "hydrostatic"],
  Certification: ["certification", "certificate", "certified", "conformity", "marking", "licence", "license", "accredited", "iso", "compliance", "documentation"],
  Environmental: ["environment", "environmental", "temperature", "humidity", "outdoor", "ingress", "ip65", "corrosion", "weather", "uv", "coastal", "ambient", "storage condition"],
  Operational: ["operation", "operational", "installation", "maintenance", "warranty", "service", "handling", "commissioning", "usage", "delivery", "training"],
  Quality: ["quality", "finish", "defect", "workmanship", "uniform", "consistency", "aql", "batch"],
};

const TYPE_ORDER: RequirementType[] = [
  "Safety",
  "Testing",
  "Certification",
  "Environmental",
  "Capacity",
  "Dimension",
  "Material",
  "Performance",
  "Operational",
  "Quality",
  "Product",
];

function classify(sentence: string): { type: RequirementType; hits: number } {
  const toks = tokenize(sentence);
  const scored = TYPE_ORDER.map((type) => {
    const terms = LEXICON[type];
    let hits = 0;
    for (const term of terms) {
      if (term.includes(" ")) {
        if (sentence.toLowerCase().includes(term)) hits += 2;
      } else if (toks.some((t) => stem(t) === stem(term))) {
        hits += 1;
      }
    }
    return { type, hits };
  }).sort((a, b) => b.hits - a.hits);
  const top = scored[0]!;
  return top.hits > 0 ? top : { type: "Operational", hits: 0 };
}

function importanceOf(sentence: string): Importance {
  const s = sentence.toLowerCase();
  if (/\b(shall|must|mandatory|essential|required|not less than|minimum)\b/.test(s)) return "High";
  if (/\b(should|preferably|desirable|recommended)\b/.test(s)) return "Medium";
  if (/\b(may|optional)\b/.test(s)) return "Low";
  return "Medium";
}

function titleCase(text: string) {
  const t = text.trim().replace(/^[-•*\d.)\s]+/, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function splitSentences(text: string): string[] {
  return text
    .split(/\n+|(?<=[.;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

let seqCounter = 0;
export function uid(prefix: string) {
  seqCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${seqCounter.toString(36)}`;
}

export function extractRequirements(specText: string, product: string): Requirement[] {
  const sentences = splitSentences(specText);
  const reqs: Requirement[] = [];
  const seen = new Set<string>();

  for (const sentence of sentences) {
    if (/^(tender|reference|issued|department|date|section|annexure)\b/i.test(sentence.trim()) && sentence.length < 90) {
      continue;
    }
    const { type, hits } = classify(sentence);
    const toks = tokenize(sentence);
    if (toks.length < 2 || hits === 0) continue;

    const short = titleCase(sentence.length > 120 ? `${sentence.slice(0, 117)}...` : sentence);
    const key = short.toLowerCase().slice(0, 48);
    if (seen.has(key)) continue;
    seen.add(key);

    const numeric = /\d/.test(sentence) ? 8 : 0;
    const modal = /\b(shall|must)\b/i.test(sentence) ? 6 : 0;
    const confidence = Math.max(58, Math.min(98, 62 + hits * 7 + numeric + modal));

    reqs.push({
      id: uid("req"),
      text: short,
      type,
      importance: importanceOf(sentence),
      confidence,
      sourceSentence: sentence.trim(),
    });
  }

  if (product && !reqs.some((r) => r.type === "Product")) {
    reqs.unshift({
      id: uid("req"),
      text: `${product} procurement item`,
      type: "Product",
      importance: "High",
      confidence: 92,
      sourceSentence: `Category/product selected for this analysis: ${product}.`,
    });
  }
  return reqs.slice(0, 24);
}

/* ------------------------------------------------------------------ */
/* 2. Matching engine                                                  */
/* ------------------------------------------------------------------ */

function standardTokens(std: Standard) {
  return {
    domain: tokenSet(`${std.productDomain} ${std.applicableProducts.join(" ")}`),
    scope: tokenSet(std.scope),
    keywords: new Set(std.keywords.flatMap((k) => tokenize(k).map(stem))),
    areas: std.requirementAreas.map((a) => ({ area: a, set: tokenSet(a) })),
    all: tokenSet(`${std.title} ${std.scope} ${std.keywords.join(" ")} ${std.requirementAreas.join(" ")}`),
  };
}

function matchRequirement(req: Requirement, st: ReturnType<typeof standardTokens>): RequirementMatch {
  const reqSet = tokenSet(req.text);
  let best = 0;
  let evidence = "";
  for (const { area, set } of st.areas) {
    const s = similarity(reqSet, set);
    if (s > best) {
      best = s;
      evidence = `Requirement area "${area}"`;
    }
  }
  const kw = similarity(reqSet, st.keywords);
  if (kw > best) {
    best = kw;
    evidence = "Keyword overlap in standard index terms";
  }
  const sc = similarity(reqSet, st.scope) * 0.9;
  if (sc > best) {
    best = sc;
    evidence = "Scope statement overlap";
  }
  const score = Math.round(Math.min(1, best * 1.35) * 100);
  const strength: RequirementMatch["strength"] = score >= 48 ? "Strong" : score >= 20 ? "Partial" : "No Match";
  return {
    requirementId: req.id,
    requirementText: req.text,
    strength,
    score,
    evidence: strength === "No Match" ? "No comparable requirement area in this standard" : evidence,
  };
}

export function scoreStandard(
  std: Standard,
  requirements: Requirement[],
  category: string,
  product: string,
  weights: Weights,
): Recommendation {
  const st = standardTokens(std);
  const productSet = tokenSet(product);
  const matches = requirements.map((r) => matchRequirement(r, st));

  const domainSim = Math.max(
    similarity(productSet, st.domain),
    std.applicableProducts.includes(product) ? 1 : 0,
    std.productDomain === product ? 1 : 0,
  );
  const reqSim =
    matches.length > 0 ? matches.reduce((a, m) => a + m.score / 100, 0) / matches.length : 0;
  const scopeSim = similarity(
    tokenSet(requirements.map((r) => r.text).join(" ") + " " + product),
    st.scope,
  );
  const kwSim = similarity(
    new Set(requirements.flatMap((r) => tokenize(r.text).map(stem))),
    st.keywords,
  );
  const catSim = std.category === category ? 1 : 0;

  const breakdown = {
    productDomain: domainSim * weights.productDomain,
    requirementSimilarity: Math.min(1, reqSim * 1.6) * weights.requirementSimilarity,
    scope: Math.min(1, scopeSim * 1.7) * weights.scope,
    keywords: Math.min(1, kwSim * 1.8) * weights.keywords,
    category: catSim * weights.category,
  };
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const max = Object.values(weights).reduce((a, b) => a + b, 0) || 100;
  const relevance = Math.round(Math.min(100, (total / max) * 100));

  const strong = matches.filter((m) => m.strength === "Strong").length;
  const partial = matches.filter((m) => m.strength === "Partial").length;
  const coverage = matches.length
    ? Math.round(((strong + partial * 0.5) / matches.length) * 100)
    : 0;
  const confidence = Math.round(
    Math.min(98, relevance * 0.6 + coverage * 0.25 + (catSim ? 10 : 0) + (domainSim > 0.6 ? 8 : 0)),
  );

  const band: Recommendation["band"] =
    relevance >= 72 ? "Highly Relevant" : relevance >= 48 ? "Relevant" : "Partial";

  const strongAreas = matches
    .filter((m) => m.strength === "Strong")
    .slice(0, 3)
    .map((m) => m.requirementText.toLowerCase());

  const why =
    `The specification describes ${product ? `a ${product.toLowerCase()}` : "an item"} in the ` +
    `${std.category} domain. This synthetic standard covers ${std.productDomain.toLowerCase()} and its requirement areas ` +
    `(${std.requirementAreas.join(", ")}) align with ${strong} of ${matches.length} extracted requirements` +
    (strongAreas.length ? `, notably ${strongAreas.join("; ")}` : "") +
    `. ${partial} further requirement(s) match partially.`;

  return {
    standardId: std.id,
    relevance,
    confidence,
    coverage,
    breakdown,
    matches,
    why,
    band,
  };
}

export function recommend(
  requirements: Requirement[],
  category: string,
  product: string,
  weights: Weights = DEFAULT_WEIGHTS,
  pool: Standard[] = STANDARDS,
): Recommendation[] {
  return pool
    .filter((s) => s.status !== "Deprecated — Demo")
    .map((s) => scoreStandard(s, requirements, category, product, weights))
    .filter((r) => r.relevance >= 22)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 18);
}

/* ------------------------------------------------------------------ */
/* 3. Gap detection                                                    */
/* ------------------------------------------------------------------ */

const GAP_RULES: {
  type: RequirementType;
  area: string;
  severity: Gap["severity"];
  reason: string;
  review: string;
}[] = [
  { type: "Material", area: "Material specification", severity: "High", reason: "No requirement describing the material, composition or grade of the item was detected in the specification text.", review: "Consider specifying the material, grade or composition expected from the supplier." },
  { type: "Testing", area: "Testing requirement", severity: "High", reason: "No acceptance test, inspection or sampling requirement was detected.", review: "Consider specifying type tests, routine tests and the sampling plan for acceptance." },
  { type: "Performance", area: "Performance threshold", severity: "Medium", reason: "No measurable performance threshold (rating, strength, efficiency) was detected.", review: "Consider adding measurable performance thresholds so bids can be compared objectively." },
  { type: "Environmental", area: "Environmental operating condition", severity: "Medium", reason: "No operating environment (temperature, humidity, ingress, exposure) was detected.", review: "Consider stating the operating and storage environment for the item." },
  { type: "Certification", area: "Certification / conformity reference", severity: "Medium", reason: "No conformity, certification or marking requirement was detected.", review: "Consider stating which conformity evidence bidders must submit." },
  { type: "Dimension", area: "Dimensional requirement", severity: "Low", reason: "No dimension, size or tolerance requirement was detected.", review: "Consider specifying dimensions or acceptable tolerances where relevant." },
  { type: "Safety", area: "Safety requirement", severity: "High", reason: "No explicit safety or protection requirement was detected.", review: "Consider stating the safety characteristics the item must provide." },
  { type: "Operational", area: "Warranty / maintenance provision", severity: "Low", reason: "No warranty, installation or maintenance requirement was detected.", review: "Consider stating warranty period and post-supply support expectations." },
];

export function detectGaps(requirements: Requirement[]): Gap[] {
  const present = new Set(requirements.map((r) => r.type));
  return GAP_RULES.filter((rule) => !present.has(rule.type)).map((rule) => ({
    id: uid("gap"),
    area: `Potentially missing: ${rule.area}`,
    severity: rule.severity,
    reason: rule.reason,
    recommendedReview: rule.review,
  }));
}

/* ------------------------------------------------------------------ */
/* 4. Conflict detection                                               */
/* ------------------------------------------------------------------ */

const UNIT_RE =
  /(\b(?:min(?:imum)?|max(?:imum)?|not less than|not more than|at least|up to)\b)[^\d]{0,40}(\d+(?:\.\d+)?)\s*([a-z%°]+(?:\/[a-z]+)?)?/gi;

const MATERIAL_GROUPS = [
  ["latex", "nitrile"],
  ["copper", "aluminium"],
  ["hdpe", "abs"],
  ["pvc", "xlpe"],
];

export function detectConflicts(specText: string, requirements: Requirement[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const text = `${specText}\n${requirements.map((r) => r.sourceSentence).join("\n")}`.toLowerCase();

  // min / max numeric conflicts per unit
  const buckets = new Map<string, { min: number[]; max: number[] }>();
  for (const m of text.matchAll(UNIT_RE)) {
    const kind = /max|not more|up to/.test(m[1] ?? "") ? "max" : "min";
    const value = parseFloat(m[2] ?? "0");
    const unit = (m[3] ?? "unit").trim();
    if (!buckets.has(unit)) buckets.set(unit, { min: [], max: [] });
    buckets.get(unit)![kind].push(value);
  }
  for (const [unit, b] of buckets) {
    if (b.min.length && b.max.length) {
      const min = Math.max(...b.min);
      const max = Math.min(...b.max);
      if (min > max) {
        conflicts.push({
          id: uid("cf"),
          title: `Potential conflict in stated ${unit === "unit" ? "quantity" : unit} range`,
          severity: "High",
          detail: `A minimum of ${min} ${unit === "unit" ? "units" : unit} and a maximum of ${max} ${unit === "unit" ? "units" : unit} were both detected in the specification.`,
          recommendation: "Review these requirements for consistency before publishing the tender.",
        });
      }
    }
  }

  // conflicting material families
  for (const group of MATERIAL_GROUPS) {
    const found = group.filter((g) => new RegExp(`\\b${g}\\b`).test(text));
    if (found.length > 1 && /\b(only|exclusively|shall be made of|must be of)\b/.test(text)) {
      conflicts.push({
        id: uid("cf"),
        title: "Potentially conflicting material requirements",
        severity: "Medium",
        detail: `The specification refers to more than one exclusive material option (${found.join(" and ")}).`,
        recommendation: "Review whether one material is mandatory or whether alternatives are acceptable.",
      });
    }
  }

  // temperature range inversion
  const temps = [...text.matchAll(/(-?\d+(?:\.\d+)?)\s*(?:°\s*c|deg\s*c|celsius)/g)].map((m) => parseFloat(m[1] ?? "0"));
  if (temps.length >= 2) {
    const lowStated = /(?:from|between|above|minimum)\s*(-?\d+)\s*(?:°\s*c|deg\s*c)/.exec(text);
    const highStated = /(?:to|and|below|maximum|up to)\s*(-?\d+)\s*(?:°\s*c|deg\s*c)/.exec(text);
    if (lowStated && highStated && parseFloat(lowStated[1] ?? "0") > parseFloat(highStated[1] ?? "0")) {
      conflicts.push({
        id: uid("cf"),
        title: "Potential conflict in operating temperature range",
        severity: "Medium",
        detail: `A lower bound of ${lowStated[1]} °C is stated above the upper bound of ${highStated[1]} °C.`,
        recommendation: "Review the stated operating temperature range for consistency.",
      });
    }
  }

  // duplicate requirements
  const norm = requirements.map((r) => r.text.toLowerCase().slice(0, 40));
  const dupes = norm.filter((v, i) => norm.indexOf(v) !== i);
  if (dupes.length) {
    conflicts.push({
      id: uid("cf"),
      title: "Repeated requirement statements detected",
      severity: "Low",
      detail: `${dupes.length} requirement statement(s) appear to repeat the same condition.`,
      recommendation: "Review the specification for duplicated clauses that could confuse bidders.",
    });
  }

  return conflicts;
}
