import type { Standard } from "./types";

export const CATEGORIES = [
  "Electronics & Electrical",
  "Food & Agriculture",
  "Healthcare & Medical",
  "Construction & Infrastructure",
  "Industrial & Manufacturing",
  "Automotive & Transport",
  "Chemicals",
  "Textiles",
  "Environment",
  "Mechanical Engineering",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PRODUCTS_BY_CATEGORY: Record<string, string[]> = {
  "Electronics & Electrical": [
    "Electrical Cable",
    "LED Lighting System",
    "Transformer",
    "Battery System",
    "Power Supply",
    "Switchgear Panel",
  ],
  "Food & Agriculture": [
    "Packaged Food",
    "Drinking Water",
    "Food Packaging",
    "Fertilizer",
    "Agricultural Equipment",
  ],
  "Healthcare & Medical": [
    "Medical Gloves",
    "Surgical Equipment",
    "Hospital Bed",
    "Protective Equipment",
    "Diagnostic Device",
  ],
  "Construction & Infrastructure": [
    "Cement",
    "Steel Product",
    "Concrete Product",
    "Building Material",
    "Construction Equipment",
  ],
  "Industrial & Manufacturing": [
    "Safety Helmet",
    "Industrial Motor",
    "Pressure Equipment",
    "Industrial Tools",
    "Protective Equipment",
  ],
  "Automotive & Transport": ["Vehicle Tyre", "Automotive Lighting", "Brake System", "Seat Belt"],
  Chemicals: ["Industrial Solvent", "Paint & Coating", "Laboratory Reagent", "Adhesive"],
  Textiles: ["Uniform Fabric", "Protective Clothing", "Technical Textile", "Cotton Yarn"],
  Environment: ["Air Quality Monitor", "Water Treatment Unit", "Waste Handling Equipment", "Noise Monitor"],
  "Mechanical Engineering": ["Industrial Pump", "Valve Assembly", "Bearing", "Gearbox"],
};

type Seed = [
  title: string,
  domain: string,
  products: string[],
  keywords: string[],
  areas: string[],
  scope: string,
];

const SEEDS: Record<string, Seed[]> = {
  "Electronics & Electrical": [
    ["Low Voltage Power Cable — Synthetic Demo Standard", "Electrical Cable", ["Electrical Cable", "Power Supply"], ["cable", "conductor", "copper", "voltage", "insulation", "pvc", "low voltage", "electrical"], ["Conductor material", "Insulation", "Voltage rating", "Testing"], "Synthetic standard describing construction and performance requirements for low voltage power cables with copper conductors."],
    ["Cable Insulation and Sheathing Materials — Synthetic Demo Standard", "Electrical Cable", ["Electrical Cable"], ["insulation", "sheath", "xlpe", "pvc", "temperature", "thermal", "cable"], ["Material", "Temperature resistance", "Ageing", "Testing"], "Synthetic standard covering thermoplastic and cross-linked insulation and sheathing compounds for electrical cables."],
    ["Fire Performance of Electrical Cables — Synthetic Demo Standard", "Electrical Cable", ["Electrical Cable"], ["fire", "flame retardant", "smoke", "halogen", "burning", "cable", "safety"], ["Flame propagation", "Smoke density", "Halogen content", "Testing"], "Synthetic standard for flame retardance, low smoke and halogen behaviour of electrical cables in buildings."],
    ["LED Luminaire Performance — Synthetic Demo Standard", "LED Lighting System", ["LED Lighting System"], ["led", "luminaire", "lumen", "lighting", "efficacy", "illumination"], ["Luminous efficacy", "Colour rendering", "Life expectancy", "Testing"], "Synthetic standard describing photometric and efficacy requirements for LED luminaires used in public lighting."],
    ["Solar Photovoltaic Street Lighting Systems — Synthetic Demo Standard", "LED Lighting System", ["LED Lighting System", "Battery System"], ["solar", "photovoltaic", "street light", "battery", "autonomy", "outdoor", "led"], ["System performance", "Battery autonomy", "Ingress protection", "Testing"], "Synthetic standard covering stand-alone solar photovoltaic street lighting systems including module, battery and luminaire."],
    ["Ingress Protection for Electrical Enclosures — Synthetic Demo Standard", "Switchgear Panel", ["LED Lighting System", "Switchgear Panel", "Power Supply"], ["ip65", "ingress", "enclosure", "dust", "water", "outdoor", "environmental"], ["Ingress protection", "Environmental conditions", "Testing"], "Synthetic standard defining degrees of protection provided by enclosures for electrical equipment."],
    ["Distribution Transformer Efficiency — Synthetic Demo Standard", "Transformer", ["Transformer"], ["transformer", "kva", "losses", "efficiency", "winding", "oil", "distribution"], ["Efficiency class", "Losses", "Insulation", "Testing"], "Synthetic standard for energy efficiency levels and loss limits of oil-immersed distribution transformers."],
    ["Secondary Lithium Battery Systems — Synthetic Demo Standard", "Battery System", ["Battery System"], ["battery", "lithium", "cycle", "charge", "capacity", "ah", "storage"], ["Capacity", "Cycle life", "Safety", "Testing"], "Synthetic standard covering safety and performance of rechargeable lithium battery systems for stationary use."],
    ["Switchgear Assemblies for Distribution — Synthetic Demo Standard", "Switchgear Panel", ["Switchgear Panel", "Power Supply"], ["switchgear", "panel", "busbar", "short circuit", "breaker", "distribution"], ["Short-circuit withstand", "Clearances", "Protection", "Testing"], "Synthetic standard for low voltage switchgear and controlgear assemblies used in distribution networks."],
    ["Electromagnetic Compatibility of Electrical Equipment — Synthetic Demo Standard", "Power Supply", ["Power Supply", "LED Lighting System", "Diagnostic Device"], ["emc", "emission", "immunity", "harmonic", "interference", "electrical"], ["Emission limits", "Immunity", "Testing"], "Synthetic standard describing electromagnetic emission and immunity requirements for electrical equipment."],
  ],
  "Food & Agriculture": [
    ["Flexible Food Contact Packaging — Synthetic Demo Standard", "Food Packaging", ["Food Packaging", "Packaged Food"], ["food contact", "packaging", "migration", "film", "laminate", "food grade", "hygiene"], ["Food contact safety", "Migration limits", "Material", "Testing"], "Synthetic standard covering flexible multilayer packaging materials intended for direct contact with food."],
    ["Migration Testing of Packaging Materials — Synthetic Demo Standard", "Food Packaging", ["Food Packaging"], ["migration", "overall migration", "simulant", "testing", "food contact", "packaging"], ["Testing", "Migration limits", "Sampling"], "Synthetic standard describing overall and specific migration test procedures for food contact materials."],
    ["Packaging Mechanical Strength — Synthetic Demo Standard", "Food Packaging", ["Food Packaging", "Packaged Food"], ["seal strength", "burst", "tensile", "puncture", "packaging", "strength", "durability"], ["Seal strength", "Puncture resistance", "Performance", "Testing"], "Synthetic standard for mechanical performance including seal integrity and puncture resistance of packaging."],
    ["Packaged Drinking Water Quality — Synthetic Demo Standard", "Drinking Water", ["Drinking Water", "Packaged Food"], ["drinking water", "potable", "microbiological", "tds", "quality", "water"], ["Chemical parameters", "Microbiological limits", "Testing"], "Synthetic standard specifying quality parameters for packaged drinking water intended for human consumption."],
    ["Hygienic Practices for Packaged Foods — Synthetic Demo Standard", "Packaged Food", ["Packaged Food"], ["hygiene", "shelf life", "labelling", "storage", "food safety", "packaged"], ["Hygiene", "Shelf life", "Labelling", "Storage"], "Synthetic standard describing hygienic handling, labelling and shelf-life declaration for packaged food products."],
    ["Temperature Tolerance of Food Packaging — Synthetic Demo Standard", "Food Packaging", ["Food Packaging"], ["temperature", "thermal", "hot fill", "freezer", "heat", "packaging"], ["Temperature tolerance", "Thermal stability", "Testing"], "Synthetic standard covering thermal performance of packaging under refrigerated, ambient and hot-fill conditions."],
    ["Solid Chemical Fertilizer Composition — Synthetic Demo Standard", "Fertilizer", ["Fertilizer"], ["fertilizer", "nitrogen", "urea", "nutrient", "granule", "agriculture"], ["Nutrient content", "Granulometry", "Moisture", "Testing"], "Synthetic standard for nutrient composition and physical properties of solid chemical fertilizers."],
    ["Agricultural Machinery Operator Safety — Synthetic Demo Standard", "Agricultural Equipment", ["Agricultural Equipment"], ["tractor", "agricultural", "operator", "guard", "machinery", "safety"], ["Operator safety", "Guarding", "Performance", "Testing"], "Synthetic standard describing operator protection and guarding requirements for agricultural machinery."],
  ],
  "Healthcare & Medical": [
    ["Single-Use Medical Examination Gloves — Synthetic Demo Standard", "Medical Gloves", ["Medical Gloves", "Protective Equipment"], ["glove", "examination", "latex", "nitrile", "single use", "medical", "barrier"], ["Material", "Barrier integrity", "Dimensions", "Testing"], "Synthetic standard for single-use examination gloves used in medical and diagnostic procedures."],
    ["Barrier Integrity of Medical Gloves — Synthetic Demo Standard", "Medical Gloves", ["Medical Gloves"], ["watertight", "pinhole", "barrier", "leak", "aql", "glove", "protection"], ["Barrier protection", "Leak testing", "Sampling"], "Synthetic standard describing watertightness and pinhole detection sampling for medical gloves."],
    ["Sizing and Dimensional Tolerance of Gloves — Synthetic Demo Standard", "Medical Gloves", ["Medical Gloves"], ["size", "length", "thickness", "dimension", "tolerance", "glove"], ["Dimensions", "Tolerances", "Testing"], "Synthetic standard for nominal sizes, length and thickness tolerances of medical gloves."],
    ["Biocompatibility of Medical Devices — Synthetic Demo Standard", "Diagnostic Device", ["Medical Gloves", "Surgical Equipment", "Diagnostic Device"], ["biocompatibility", "cytotoxicity", "irritation", "skin", "medical", "safety"], ["Biological safety", "Material", "Testing"], "Synthetic standard describing biological evaluation of materials in contact with patients or users."],
    ["Reusable Surgical Instruments — Synthetic Demo Standard", "Surgical Equipment", ["Surgical Equipment"], ["surgical", "stainless steel", "sterilization", "autoclave", "instrument", "corrosion"], ["Material", "Corrosion resistance", "Sterilization", "Testing"], "Synthetic standard for stainless steel reusable surgical instruments and their sterilization behaviour."],
    ["Hospital Bed Safety and Performance — Synthetic Demo Standard", "Hospital Bed", ["Hospital Bed"], ["hospital bed", "load", "side rail", "castor", "patient", "safe working load"], ["Load capacity", "Safety", "Dimensions", "Testing"], "Synthetic standard covering mechanical safety and load performance of powered and manual hospital beds."],
    ["Personal Protective Equipment for Healthcare — Synthetic Demo Standard", "Protective Equipment", ["Protective Equipment", "Medical Gloves"], ["ppe", "gown", "mask", "protection", "healthcare", "infection"], ["Barrier protection", "Material", "Comfort", "Testing"], "Synthetic standard for protective clothing and equipment used in healthcare infection control."],
    ["Diagnostic Device Accuracy and Calibration — Synthetic Demo Standard", "Diagnostic Device", ["Diagnostic Device"], ["accuracy", "calibration", "measurement", "diagnostic", "device", "performance"], ["Accuracy", "Calibration", "Performance", "Testing"], "Synthetic standard describing measurement accuracy and calibration intervals for diagnostic devices."],
  ],
  "Construction & Infrastructure": [
    ["Ordinary Portland Cement Grades — Synthetic Demo Standard", "Cement", ["Cement", "Concrete Product"], ["cement", "opc", "grade", "43 grade", "53 grade", "compressive strength", "setting time"], ["Grade", "Compressive strength", "Setting time", "Testing"], "Synthetic standard specifying grades, strength classes and setting behaviour of ordinary portland cement."],
    ["Blended Cement Composition — Synthetic Demo Standard", "Cement", ["Cement"], ["ppc", "fly ash", "slag", "blended", "cement", "composition"], ["Composition", "Strength", "Durability", "Testing"], "Synthetic standard for portland pozzolana and slag blended cements and their constituent proportions."],
    ["Cement Packaging and Marking — Synthetic Demo Standard", "Cement", ["Cement", "Building Material"], ["bag", "50 kg", "packaging", "marking", "storage", "cement"], ["Packaging", "Marking", "Storage"], "Synthetic standard covering bag mass, packaging integrity and marking for cementitious products."],
    ["Testing Methods for Hydraulic Cement — Synthetic Demo Standard", "Cement", ["Cement", "Concrete Product"], ["testing", "cube", "consistency", "soundness", "fineness", "cement"], ["Testing", "Sampling", "Strength"], "Synthetic standard describing physical test methods for hydraulic cement including strength and soundness."],
    ["Reinforcement Steel Bars for Concrete — Synthetic Demo Standard", "Steel Product", ["Steel Product", "Concrete Product"], ["rebar", "steel", "yield strength", "fe500", "ductility", "reinforcement"], ["Yield strength", "Ductility", "Dimensions", "Testing"], "Synthetic standard for hot-rolled deformed reinforcement bars used in concrete construction."],
    ["Structural Steel Sections — Synthetic Demo Standard", "Steel Product", ["Steel Product"], ["structural steel", "section", "tensile", "weldability", "beam", "yield"], ["Mechanical properties", "Chemical composition", "Tolerances", "Testing"], "Synthetic standard covering mechanical and chemical requirements for structural steel sections."],
    ["Ready Mixed Concrete Performance — Synthetic Demo Standard", "Concrete Product", ["Concrete Product"], ["concrete", "slump", "m25", "mix", "workability", "cube strength"], ["Mix design", "Workability", "Strength", "Testing"], "Synthetic standard for production and performance verification of ready mixed concrete."],
    ["Durability of Building Materials in Aggressive Environments — Synthetic Demo Standard", "Building Material", ["Building Material", "Cement", "Concrete Product"], ["durability", "sulphate", "chloride", "exposure", "coastal", "environment"], ["Durability", "Environmental exposure", "Testing"], "Synthetic standard describing durability provisions for building materials in aggressive exposure conditions."],
    ["Construction Equipment Operational Safety — Synthetic Demo Standard", "Construction Equipment", ["Construction Equipment"], ["crane", "excavator", "operator", "site", "construction", "safety"], ["Operational safety", "Load rating", "Testing"], "Synthetic standard for safe operation and load rating of site construction equipment."],
  ],
  "Industrial & Manufacturing": [
    ["Industrial Protective Headgear — Synthetic Demo Standard", "Safety Helmet", ["Safety Helmet", "Protective Equipment"], ["helmet", "industrial safety", "impact protection", "head protection", "shell", "harness", "hard hat"], ["Impact protection", "Material", "Retention system", "Testing"], "Synthetic standard describing requirements for industrial protective headgear including shell, harness and impact behaviour."],
    ["Impact and Penetration Testing of Protective Helmets — Synthetic Demo Standard", "Safety Helmet", ["Safety Helmet"], ["impact", "penetration", "shock absorption", "striker", "helmet", "testing"], ["Testing", "Impact protection", "Sampling"], "Synthetic standard for laboratory impact attenuation and penetration test methods for protective helmets."],
    ["Retention Systems for Head Protection — Synthetic Demo Standard", "Safety Helmet", ["Safety Helmet"], ["chin strap", "retention", "adjustable", "harness", "ratchet", "helmet", "fit"], ["Retention system", "Adjustability", "Testing"], "Synthetic standard covering chin straps, ratchet adjustment and retention effectiveness of head protection."],
    ["Thermoplastic Materials for Protective Equipment — Synthetic Demo Standard", "Protective Equipment", ["Safety Helmet", "Protective Equipment"], ["hdpe", "abs", "polymer", "thermoplastic", "material", "durable", "lightweight"], ["Material", "Ageing", "Mass", "Testing"], "Synthetic standard for thermoplastic shell materials used in personal protective equipment."],
    ["Electrical Insulation of Protective Headgear — Synthetic Demo Standard", "Safety Helmet", ["Safety Helmet", "Protective Equipment"], ["electrical insulation", "dielectric", "live working", "helmet", "safety"], ["Electrical safety", "Dielectric strength", "Testing"], "Synthetic standard for optional electrical insulation performance of industrial helmets."],
    ["Three-Phase Industrial Motors — Synthetic Demo Standard", "Industrial Motor", ["Industrial Motor"], ["motor", "kw", "induction", "efficiency", "ie3", "torque", "industrial"], ["Efficiency class", "Torque", "Insulation", "Testing"], "Synthetic standard for efficiency classes and performance of three-phase induction motors."],
    ["Unfired Pressure Vessels — Synthetic Demo Standard", "Pressure Equipment", ["Pressure Equipment"], ["pressure", "vessel", "bar", "design pressure", "weld", "hydrostatic"], ["Design pressure", "Material", "Welding", "Testing"], "Synthetic standard covering design, fabrication and hydrostatic testing of unfired pressure vessels."],
    ["Hand and Portable Industrial Tools — Synthetic Demo Standard", "Industrial Tools", ["Industrial Tools"], ["tool", "hand tool", "torque", "grip", "portable", "industrial"], ["Mechanical strength", "Ergonomics", "Testing"], "Synthetic standard for mechanical strength and ergonomic requirements of industrial hand tools."],
    ["Occupational Protective Footwear — Synthetic Demo Standard", "Protective Equipment", ["Protective Equipment"], ["footwear", "toe cap", "slip", "sole", "protection", "occupational"], ["Impact protection", "Slip resistance", "Material", "Testing"], "Synthetic standard for safety footwear used in industrial workplaces."],
    ["High Visibility Industrial Clothing — Synthetic Demo Standard", "Protective Equipment", ["Protective Equipment"], ["high visibility", "reflective", "clothing", "vest", "industrial", "safety"], ["Visibility", "Material", "Colourfastness", "Testing"], "Synthetic standard describing retroreflective performance of high visibility workwear."],
  ],
  "Automotive & Transport": [
    ["Pneumatic Tyres for Commercial Vehicles — Synthetic Demo Standard", "Vehicle Tyre", ["Vehicle Tyre"], ["tyre", "tread", "load index", "rolling", "vehicle", "rubber"], ["Load rating", "Tread", "Material", "Testing"], "Synthetic standard for construction and load performance of pneumatic tyres on commercial vehicles."],
    ["Automotive Lighting Photometry — Synthetic Demo Standard", "Automotive Lighting", ["Automotive Lighting"], ["headlamp", "photometry", "beam", "automotive", "lighting", "luminous"], ["Photometric performance", "Durability", "Testing"], "Synthetic standard defining photometric requirements for automotive lighting devices."],
    ["Hydraulic Brake System Performance — Synthetic Demo Standard", "Brake System", ["Brake System"], ["brake", "hydraulic", "stopping", "fade", "vehicle", "safety"], ["Braking performance", "Fade resistance", "Testing"], "Synthetic standard covering hydraulic braking performance and fade behaviour."],
    ["Occupant Restraint Assemblies — Synthetic Demo Standard", "Seat Belt", ["Seat Belt"], ["seat belt", "restraint", "webbing", "buckle", "occupant", "safety"], ["Strength", "Retention system", "Testing"], "Synthetic standard for webbing strength and buckle release of occupant restraint assemblies."],
  ],
  Chemicals: [
    ["Industrial Solvent Purity — Synthetic Demo Standard", "Industrial Solvent", ["Industrial Solvent"], ["solvent", "purity", "volatile", "chemical", "grade"], ["Purity", "Storage", "Testing"], "Synthetic standard for purity grades and handling of industrial solvents."],
    ["Protective Paints and Coatings — Synthetic Demo Standard", "Paint & Coating", ["Paint & Coating"], ["paint", "coating", "adhesion", "corrosion", "dft", "finish"], ["Adhesion", "Corrosion protection", "Testing"], "Synthetic standard covering protective coating systems for steel and concrete surfaces."],
    ["Laboratory Reagent Classification — Synthetic Demo Standard", "Laboratory Reagent", ["Laboratory Reagent"], ["reagent", "analytical", "laboratory", "purity", "labelling"], ["Purity", "Labelling", "Testing"], "Synthetic standard for classification and labelling of laboratory reagents."],
    ["Structural Adhesives — Synthetic Demo Standard", "Adhesive", ["Adhesive"], ["adhesive", "bond", "shear", "cure", "structural"], ["Bond strength", "Cure", "Testing"], "Synthetic standard for shear strength and curing behaviour of structural adhesives."],
    ["Chemical Storage and Environmental Safety — Synthetic Demo Standard", "Industrial Solvent", ["Industrial Solvent", "Paint & Coating", "Laboratory Reagent"], ["storage", "ventilation", "spill", "environment", "chemical", "safety"], ["Environmental safety", "Storage", "Handling"], "Synthetic standard describing safe storage and environmental controls for chemical products."],
  ],
  Textiles: [
    ["Woven Uniform Fabric — Synthetic Demo Standard", "Uniform Fabric", ["Uniform Fabric"], ["fabric", "gsm", "cotton", "weave", "uniform", "textile"], ["Material", "Mass per unit area", "Colourfastness", "Testing"], "Synthetic standard for woven fabrics used in institutional uniforms."],
    ["Protective Clothing Against Heat — Synthetic Demo Standard", "Protective Clothing", ["Protective Clothing", "Protective Equipment"], ["flame", "heat", "protective clothing", "thermal", "textile", "safety"], ["Thermal protection", "Material", "Testing"], "Synthetic standard for clothing protecting against heat and flame exposure."],
    ["Technical Textiles for Geotechnical Use — Synthetic Demo Standard", "Technical Textile", ["Technical Textile"], ["geotextile", "permeability", "tensile", "technical textile", "soil"], ["Tensile strength", "Permeability", "Testing"], "Synthetic standard for geotextiles used in soil separation and drainage."],
    ["Cotton Yarn Count and Strength — Synthetic Demo Standard", "Cotton Yarn", ["Cotton Yarn"], ["yarn", "count", "twist", "cotton", "strength"], ["Count", "Strength", "Testing"], "Synthetic standard describing yarn count, twist and tensile requirements for cotton yarn."],
  ],
  Environment: [
    ["Ambient Air Quality Monitoring Instruments — Synthetic Demo Standard", "Air Quality Monitor", ["Air Quality Monitor"], ["air quality", "pm2.5", "monitor", "sensor", "ambient", "environment"], ["Accuracy", "Calibration", "Environmental conditions", "Testing"], "Synthetic standard for performance of ambient air quality monitoring instruments."],
    ["Water Treatment Unit Performance — Synthetic Demo Standard", "Water Treatment Unit", ["Water Treatment Unit", "Drinking Water"], ["water treatment", "filtration", "turbidity", "flow rate", "capacity"], ["Treatment efficiency", "Capacity", "Testing"], "Synthetic standard covering treatment efficiency and capacity of packaged water treatment units."],
    ["Solid Waste Handling Equipment — Synthetic Demo Standard", "Waste Handling Equipment", ["Waste Handling Equipment"], ["waste", "bin", "collection", "hygiene", "municipal", "environment"], ["Capacity", "Material", "Hygiene", "Testing"], "Synthetic standard for municipal solid waste handling and collection equipment."],
    ["Environmental Noise Measurement — Synthetic Demo Standard", "Noise Monitor", ["Noise Monitor"], ["noise", "decibel", "sound level", "measurement", "environment"], ["Accuracy", "Calibration", "Testing"], "Synthetic standard for sound level meters used in environmental noise measurement."],
  ],
  "Mechanical Engineering": [
    ["Centrifugal Pumps for Water Service — Synthetic Demo Standard", "Industrial Pump", ["Industrial Pump"], ["pump", "head", "flow", "centrifugal", "impeller", "efficiency"], ["Hydraulic performance", "Material", "Efficiency", "Testing"], "Synthetic standard for hydraulic performance and construction of centrifugal water pumps."],
    ["Industrial Valve Assemblies — Synthetic Demo Standard", "Valve Assembly", ["Valve Assembly"], ["valve", "gate valve", "pressure rating", "leakage", "seat", "flange"], ["Pressure rating", "Leakage class", "Material", "Testing"], "Synthetic standard for pressure rating and leak tightness of industrial valves."],
    ["Rolling Bearings Dimensions and Tolerance — Synthetic Demo Standard", "Bearing", ["Bearing"], ["bearing", "tolerance", "bore", "radial", "load", "dimension"], ["Dimensions", "Tolerances", "Load rating", "Testing"], "Synthetic standard covering boundary dimensions and tolerances of rolling bearings."],
    ["Industrial Gearbox Performance — Synthetic Demo Standard", "Gearbox", ["Gearbox", "Industrial Motor"], ["gearbox", "ratio", "torque", "lubrication", "noise", "mechanical"], ["Torque rating", "Lubrication", "Noise", "Testing"], "Synthetic standard for load rating and lubrication of industrial gear units."],
    ["Mechanical Vibration Limits for Rotating Machinery — Synthetic Demo Standard", "Industrial Pump", ["Industrial Pump", "Industrial Motor", "Gearbox"], ["vibration", "rotating", "balance", "machinery", "limit"], ["Vibration limits", "Performance", "Testing"], "Synthetic standard defining acceptable vibration severity for rotating machinery."],
  ],
};

function pad(n: number) {
  return String(n).padStart(3, "0");
}

export const STANDARDS: Standard[] = (() => {
  const out: Standard[] = [];
  let n = 0;
  for (const category of CATEGORIES) {
    const seeds = SEEDS[category] ?? [];
    seeds.forEach((s, i) => {
      n += 1;
      const id = `DEMO-IS-${pad(n)}`;
      out.push({
        id,
        title: s[0],
        category,
        productDomain: s[1],
        applicableProducts: s[2],
        keywords: s[3],
        requirementAreas: s[4],
        scope: s[5],
        relatedStandards: [],
        version: `v${1 + (i % 3)}.${(i * 3) % 7}`,
        status: i === seeds.length - 1 && category === "Textiles" ? "Draft — Demo" : "Active — Demo",
        sourceType: "Synthetic Prototype Dataset",
        lastUpdated: new Date(2025, (n * 3) % 12, ((n * 7) % 27) + 1).toISOString().slice(0, 10),
        synthetic: true,
      });
    });
  }
  // relate standards within the same product domain
  for (const std of out) {
    std.relatedStandards = out
      .filter((o) => o.id !== std.id && (o.productDomain === std.productDomain || o.category === std.category))
      .slice(0, 4)
      .map((o) => o.id);
  }
  return out;
})();

export const STANDARD_MAP = new Map(STANDARDS.map((s) => [s.id, s]));
