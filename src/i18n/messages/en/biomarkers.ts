import type { BiomarkerCopyMap } from '../../biomarkerIds';

export const biomarkers: BiomarkerCopyMap = {
  albumin: {
    name: 'Serum Albumin',
    shortName: 'Albumin',
    domain: 'Hepatic / Nutritional Synthesis',
    risk: 'Negative (Protective)',
    weight: 'Strong liver function & low frailty decelerates biological aging.',
  },
  creatinine: {
    name: 'Serum Creatinine',
    shortName: 'Creatinine',
    domain: 'Renal Filtration Efficiency',
    risk: 'Positive (Accelerant)',
    weight: 'Higher creatinine reflects reduced glomerulation and muscle waste burden.',
  },
  glucose: {
    name: 'Fasting Serum Glucose',
    shortName: 'Fasting Glucose',
    domain: 'Metabolic / Insulin Sensitivity',
    risk: 'Positive (Accelerant)',
    weight: 'Elevated fasting glycaemia correlates with advanced glycation end-products.',
  },
  crp: {
    name: 'hs-C-Reactive Protein',
    shortName: 'hs-CRP',
    domain: 'Systemic Sterile Inflammation',
    risk: 'Heavy Positive',
    weight: 'Logarithmic driver of systemic inflammaging and arterial stiffness.',
  },
  lymphocyte: {
    name: 'Lymphocyte Percentage',
    shortName: 'Lymphocytes',
    domain: 'Immunosenescence Balance',
    risk: 'Negative (Protective)',
    weight: 'Preserved lymphoid lineage over myeloid expansion indicates young immunity.',
  },
  mcv: {
    name: 'Mean Corpuscular Volume (MCV)',
    shortName: 'MCV',
    domain: 'Hematology & Methylation',
    risk: 'Positive (Accelerant)',
    weight: 'Erythrocyte macrocytosis is tied to impaired folate/B12 methylation.',
  },
  rdw: {
    name: 'Red Cell Distribution Width (RDW)',
    shortName: 'RDW',
    domain: 'Erythrocyte Turnover / Frailty',
    risk: 'Heavy Positive',
    weight: 'High anisocytosis is one of the strongest pan-cause mortality markers in NHANES.',
  },
  alp: {
    name: 'Alkaline Phosphatase (ALP)',
    shortName: 'Alk Phos',
    domain: 'Biliary / Bone Mineralization',
    risk: 'Positive (Accelerant)',
    weight: 'Marker of vascular calcification, hepatic stress, and bone remodeling turnover.',
  },
  wbc: {
    name: 'White Blood Cell Count (WBC)',
    shortName: 'WBC',
    domain: 'Innate Immune Activation',
    risk: 'Positive (Accelerant)',
    weight: 'Elevated baseline leukocyte count indicates persistent non-resolving inflammation.',
  },
};
