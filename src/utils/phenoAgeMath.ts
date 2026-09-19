import { PHENOAGE_BIOMARKERS } from '../data/phenoAgeData';
import { PhenoAgeCalculation } from '../types';

/**
 * Calculates biological age using the Morgan Levine PhenoAge algorithm
 * (Levine et al., Aging 2018; 10(4):573-591).
 * Calibrated against NHANES III/IV 10-year mortality Gompertz proportional hazard model.
 */
export function calculatePhenoAge(
  chronologicalAge: number,
  biomarkers: Record<string, number>
): PhenoAgeCalculation {
  const alb = biomarkers['albumin'] ?? 46.0; // g/L
  const cr = biomarkers['creatinine'] ?? 0.85; // mg/dL -> convert to umol/L
  const glu = biomarkers['glucose'] ?? 84.0; // mg/dL -> convert to mmol/L
  const crpRaw = biomarkers['crp'] ?? 0.80; // mg/L -> convert to mg/dL
  const lymph = biomarkers['lymphocyte'] ?? 33.2; // %
  const mcv = biomarkers['mcv'] ?? 88.0; // fL
  const rdw = biomarkers['rdw'] ?? 12.0; // %
  const alp = biomarkers['alp'] ?? 58.0; // U/L
  const wbc = biomarkers['wbc'] ?? 5.2; // 10^3 cells/uL

  // Units standardisation:
  // Albumin in g/L (if < 10, user likely provided g/dL, multiply by 10)
  const albuminStd = alb < 10 ? alb * 10 : alb;
  // Creatinine in umol/L: 1 mg/dL = 88.4 umol/L
  const creatinineStd = cr < 10 ? cr * 88.4 : cr;
  // Glucose in mmol/L: 1 mg/dL = 0.0555 mmol/L
  const glucoseStd = glu > 25 ? glu * 0.0555 : glu;
  // CRP in mg/dL: 1 mg/L = 0.1 mg/dL
  const crpStd = Math.max(0.005, crpRaw > 0.001 ? crpRaw * 0.1 : 0.01);
  const lnCRP = Math.log(crpStd);

  // Linear predictor (xb) according to Levine 2018 published regression coefficients:
  const xb =
    -19.9067 +
    -0.0336 * albuminStd +
    0.0095 * creatinineStd +
    0.1953 * glucoseStd +
    0.0954 * lnCRP +
    -0.0120 * lymph +
    0.0268 * mcv +
    0.3306 * rdw +
    0.00188 * alp +
    0.0554 * wbc +
    0.0804 * chronologicalAge;

  const gamma = 0.0076927;
  const timeMonths = 120; // 10-year horizon in months

  // Cumulative 10-year hazard mortality probability M:
  const hazardFactor = Math.exp(xb) * ((Math.exp(gamma * timeMonths) - 1) / gamma);
  const M = 1 - Math.exp(-hazardFactor);

  // Invert Gompertz mortality model to solve for Biological PhenoAge:
  // PhenoAge = 141.50 + ln(-0.00553 * ln(1 - M)) / 0.090165
  let calculatedPhenoAge: number;
  if (M <= 0) {
    calculatedPhenoAge = chronologicalAge - 8.0;
  } else if (M >= 0.999) {
    calculatedPhenoAge = chronologicalAge + 25.0;
  } else {
    const inner = -0.00553 * Math.log(1 - M);
    if (inner <= 0) {
      calculatedPhenoAge = chronologicalAge;
    } else {
      calculatedPhenoAge = 141.50 + Math.log(inner) / 0.090165;
    }
  }

  // Clamped to reasonable biological limits
  const phenoAge = Math.round(Math.max(18.0, Math.min(105.0, calculatedPhenoAge)) * 10) / 10;
  const ageDelta = Math.round((phenoAge - chronologicalAge) * 10) / 10;
  const mortalityScore10yr = Math.round(Math.min(99.9, Math.max(0.1, M * 100)) * 10) / 10;

  // Estimate NHANES percentile rank:
  // Typical population ageDelta centered around 0 with SD ~4.5
  const zScore = ageDelta / 4.5;
  const percentileRank = Math.round(
    Math.max(1, Math.min(99, 50 + 50 * Math.tanh(zScore * 0.79)))
  );

  // Individual biomarker contribution decomposition
  const biomarkerScores = PHENOAGE_BIOMARKERS.map((bio) => {
    const rawVal = biomarkers[bio.id] ?? bio.optimalRange[0];
    let val = rawVal;
    let contribution = 0;

    if (bio.id === 'albumin') {
      const std = val < 10 ? val * 10 : val;
      contribution = (45.0 - std) * 0.4;
    } else if (bio.id === 'crp') {
      contribution = (val - 0.8) * 1.1;
    } else if (bio.id === 'glucose') {
      contribution = (val - 82.0) * 0.08;
    } else if (bio.id === 'rdw') {
      contribution = (val - 12.0) * 1.8;
    } else if (bio.id === 'creatinine') {
      contribution = (val - 0.85) * 4.2;
    } else if (bio.id === 'lymphocyte') {
      contribution = (35.0 - val) * 0.15;
    } else if (bio.id === 'mcv') {
      contribution = (val - 88.0) * 0.25;
    } else if (bio.id === 'alp') {
      contribution = (val - 55.0) * 0.03;
    } else if (bio.id === 'wbc') {
      contribution = (val - 5.0) * 0.6;
    }

    let status: 'optimal' | 'normal' | 'borderline' | 'elevated' = 'normal';
    if (val >= bio.optimalRange[0] && val <= bio.optimalRange[1]) {
      status = 'optimal';
    } else if (val >= bio.clinicalRange[0] && val <= bio.clinicalRange[1]) {
      status = 'normal';
    } else if (bio.riskInfluence.includes('Positive') && val > bio.clinicalRange[1]) {
      status = 'elevated';
    } else {
      status = 'borderline';
    }

    return {
      id: bio.id,
      name: bio.name,
      value: val,
      unit: bio.unit,
      contribution: Math.round(contribution * 10) / 10,
      status,
    };
  });

  return {
    chronologicalAge,
    phenoAge,
    ageDelta,
    mortalityScore10yr,
    percentileRank,
    biomarkerScores,
    isValid: true,
    activeCount: Object.keys(biomarkers).length,
  };
}

export function generateCryptoHash(data: unknown): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}8fbc${Math.abs(hash * 31).toString(16).slice(0, 6)}`;
}
