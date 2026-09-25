export type TabType = 
  | 'overview-landing'
  | 'upload-lab'
  | 'review-extraction'
  | 'phenoage-engine'
  | 'biomarker-history'
  | 'data-sovereignty-public-sharing'
  | 'research-news'
  | 'user-instructions';

export interface BiomarkerDefinition {
  id: string;
  name: string;
  loinc: string;
  domain: string;
  unit: string;
  standardUnit: string;
  optimalRange: [number, number];
  clinicalRange: [number, number];
  riskInfluence: 'Positive (Accelerant)' | 'Negative (Protective)' | 'Heavy Positive';
  weightDescription: string;
  levineCoeff: number;
  step: number;
}

export interface BiomarkerValue {
  id: string;
  name: string;
  loinc: string;
  value: number;
  unit: string;
  confidence: number;
  status: 'optimal' | 'normal' | 'borderline' | 'elevated' | 'critical';
  verified: boolean;
}

export interface TokenUsageNotice {
  tokensUsed: number;
  tokensLimit: number;
  warning: boolean;
  limitReached?: boolean;
}

export interface LabPanelData {
  id: string;
  labName: string;
  testDate: string;
  sourceType: 'pdf' | 'manual' | 'demo';
  fileName?: string;
  chronologicalAge: number;
  gender: 'male' | 'female';
  biomarkers: Record<string, number>;
  confidenceScores: Record<string, number>;
  verified: boolean;
  hash: string;
  extractToken?: string;
  parserVersion?: string;
  extractedMarkers?: ExtractedMarker[];
  tokenUsage?: TokenUsageNotice;
}

export interface ExtractedMarker {
  rawName: string;
  canonicalId: string | null;
  loincCode: string | null;
  value: number;
  unit: string;
  confidence: number;
  mappingStatus: 'mapped' | 'unmapped';
  withinRange: boolean | null;
}

export interface PhenoAgeCalculation {
  chronologicalAge: number;
  phenoAge: number;
  ageDelta: number; // phenoAge - chronologicalAge
  mortalityScore10yr: number; // percentage
  percentileRank: number; // against NHANES cohort
  biomarkerScores: {
    id: string;
    name: string;
    value: number;
    unit: string;
    contribution: number; // positive = aging accelerant, negative = decelerant
    status: 'optimal' | 'normal' | 'borderline' | 'elevated';
  }[];
  isValid: boolean;
  activeCount: number;
  disclaimer: string;
}

export interface HistoricalTestRecord {
  id: string;
  date: string;
  chronologicalAge: number;
  phenoAge: number;
  delta: number;
  labSource: string;
  biomarkers: Record<string, number>;
  hash: string;
}

export interface AccountState {
  publicId: string;
  isPublic: boolean;
  createdAt: string;
  accessToken: string;
}
