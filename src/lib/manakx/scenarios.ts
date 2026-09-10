export interface Scenario {
  key: string;
  name: string;
  category: string;
  product: string;
  tenderTitle: string;
  reference: string;
  text: string;
}

export const SCENARIOS: Scenario[] = [
  {
    key: "helmet",
    name: "Industrial Safety Helmet",
    category: "Industrial & Manufacturing",
    product: "Safety Helmet",
    tenderTitle: "Supply of Industrial Safety Helmets for Maintenance Workforce",
    reference: "TND/IND/2026/0412",
    text: `Tender for supply of industrial safety helmets for use by maintenance staff at plant and field locations.
The helmet shall provide impact protection against falling objects during industrial use.
The outer shell shall be manufactured from durable thermoplastic material such as HDPE or ABS.
The helmet shall be lightweight, with mass not exceeding 400 g including the harness.
An adjustable retention system with a ratchet type harness and chin strap shall be provided.
The helmet shall be suitable for continuous industrial use in outdoor conditions with exposure to sunlight and rain.
Each batch shall be subjected to impact attenuation and penetration testing before acceptance.
The supplier shall submit test reports from an accredited laboratory along with the delivery.
Minimum order quantity is 500 units and the maximum supply under this contract is 300 units per quarter.
Warranty of 12 months from the date of delivery shall be provided.`,
  },
  {
    key: "cable",
    name: "Electrical Cable",
    category: "Electronics & Electrical",
    product: "Electrical Cable",
    tenderTitle: "Procurement of Low Voltage Power Cables for Substation Works",
    reference: "TND/ELE/2026/0198",
    text: `Procurement of low voltage power cables for substation and distribution works.
The cable shall have a voltage rating of 1100 V for continuous service.
Conductor material shall be annealed copper of electrolytic grade.
Insulation shall be XLPE with an overall PVC sheath.
The cable shall withstand a continuous conductor temperature of 90 deg C.
Fire performance shall be flame retardant with low smoke and reduced halogen emission.
Routine and type test certificates shall be furnished for each drum supplied.
Cables shall be suitable for installation in outdoor cable trenches with exposure to moisture.`,
  },
  {
    key: "gloves",
    name: "Medical Gloves",
    category: "Healthcare & Medical",
    product: "Medical Gloves",
    tenderTitle: "Supply of Single-Use Medical Examination Gloves to District Hospitals",
    reference: "TND/MED/2026/0771",
    text: `Supply of single use medical examination gloves for district hospitals and primary health centres.
Gloves shall be manufactured from nitrile material and shall be powder free.
The gloves shall be intended for medical examination and diagnostic use only.
Gloves shall provide effective barrier protection against fluids and micro-organisms.
Sizes small, medium and large shall be supplied in the ratio specified in the schedule.
Minimum glove length shall be 240 mm with a thickness of not less than 0.08 mm at the finger.
Watertightness testing shall be conducted on a sampling basis for each consignment.
Gloves shall be stored below 30 deg C away from direct sunlight.`,
  },
  {
    key: "packaging",
    name: "Food Packaging Material",
    category: "Food & Agriculture",
    product: "Food Packaging",
    tenderTitle: "Procurement of Flexible Food Packaging Laminate for Mid-Day Meal Programme",
    reference: "TND/FOD/2026/0233",
    text: `Procurement of flexible laminate packaging material for packing of dry food commodities.
The material shall be food grade and suitable for direct food contact.
Laminate structure shall consist of a printed outer film with a food contact inner layer.
The packaging shall tolerate temperature from 5 deg C to 60 deg C during storage and transport.
Seal strength and puncture resistance shall be adequate to withstand handling and stacking.
Overall migration testing shall be carried out using appropriate food simulants.
The supplier shall ensure hygienic manufacturing and provide batch traceability.`,
  },
  {
    key: "cement",
    name: "Cement Procurement",
    category: "Construction & Infrastructure",
    product: "Cement",
    tenderTitle: "Supply of Ordinary Portland Cement for Rural Road Works",
    reference: "TND/CON/2026/0517",
    text: `Supply of ordinary portland cement for rural road and drainage works.
Cement shall be of 43 grade ordinary portland cement.
The minimum 28 day compressive strength shall be 43 MPa.
Initial setting time shall not be less than 30 minutes and final setting time shall not exceed 600 minutes.
Cement shall be supplied in 50 kg bags with clear marking of grade, batch and week of packing.
Consignments shall be tested for fineness, soundness and compressive strength before acceptance.
Cement shall be stored in a dry covered godown protected from moisture.`,
  },
  {
    key: "solar",
    name: "Solar Lighting System",
    category: "Electronics & Electrical",
    product: "LED Lighting System",
    tenderTitle: "Installation of Solar LED Street Lighting for Municipal Wards",
    reference: "TND/ELE/2026/0345",
    text: `Installation of stand alone solar LED street lighting systems in municipal wards.
Each system shall include a photovoltaic module, battery, controller and LED luminaire.
The LED luminaire shall deliver a minimum luminous efficacy suitable for street lighting.
The battery shall provide autonomy for at least two non-sunny days.
The luminaire and controller enclosure shall have ingress protection of IP65 for outdoor use.
Systems shall operate in ambient temperature from 5 deg C to 50 deg C.
Installation, commissioning and five year maintenance shall be included in the scope.`,
  },
];

export const SCENARIO_MAP = new Map(SCENARIOS.map((s) => [s.key, s]));
