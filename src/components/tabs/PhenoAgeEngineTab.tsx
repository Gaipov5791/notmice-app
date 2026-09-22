import React, { useState } from 'react';
import { TabType, PhenoAgeCalculation } from '../../types';
import { PHENOAGE_BIOMARKERS } from '../../data/phenoAgeData';
import { LifestyleLongevityAdvisor } from '../LifestyleLongevityAdvisor';
import {
  Activity,
  Calculator,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Download,
  Save,
  CheckCircle,
  HelpCircle,
  FlaskConical,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface PhenoAgeEngineTabProps {
  calculation: PhenoAgeCalculation;
  scoreError: string | null;
  biomarkers: Record<string, number>;
  onUpdateBiomarkers: (biomarkers: Record<string, number>) => void;
  chronologicalAge: number;
  onUpdateChronologicalAge: (age: number) => void;
  onSaveToHistory: () => void;
  setActiveTab: (tab: TabType) => void;
  onOpenProofModal: () => void;
}

export const PhenoAgeEngineTab: React.FC<PhenoAgeEngineTabProps> = ({
  calculation,
  scoreError,
  biomarkers,
  onUpdateBiomarkers,
  chronologicalAge,
  onUpdateChronologicalAge,
  onSaveToHistory,
  setActiveTab,
  onOpenProofModal,
}) => {
  const [savedNotification, setSavedNotification] = useState(false);

  const handleSliderChange = (id: string, val: number) => {
    onUpdateBiomarkers({
      ...biomarkers,
      [id]: val,
    });
  };

  const handleSave = () => {
    onSaveToHistory();
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  const handleResetToBaseline = () => {
    onUpdateBiomarkers({
      albumin: 46.2,
      creatinine: 0.85,
      glucose: 84.0,
      crp: 0.80,
      lymphocyte: 33.2,
      mcv: 88.0,
      rdw: 12.0,
      alp: 58.0,
      wbc: 5.2,
    });
  };

  const isDecelerated = calculation.isValid && calculation.ageDelta <= 0;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#cce5ff] text-[#004b73] font-['JetBrains_Mono'] text-xs font-semibold px-2 py-0.5 rounded">
              Pipeline Stage 04
            </span>
            <span className="font-['JetBrains_Mono'] text-xs text-[#565e74]">
              Morgan Levine Gompertz Proportional Hazard Model
            </span>
          </div>
          <h1 className="font-['Inter'] text-2xl lg:text-3xl font-bold text-[#0b1c30]">
            PhenoAge™ Engine Scoreboard
          </h1>
          <p className="font-['Inter'] text-sm text-[#3f4850] mt-1 max-w-2xl">
            Calculated biological age based on NHANES IV multi-system clinical biomarkers. Adjust
            parameters below to simulate how intervention strategies shift your biological aging
            trajectory.
          </p>
          <p className="font-['Inter'] text-xs text-[#3f4850] mt-3 max-w-2xl border-l-2 border-[#006194] pl-3">
            {calculation.disclaimer}
          </p>
          {scoreError && (
            <p className="font-['Inter'] text-xs text-[#ba1a1a] mt-2">{scoreError}</p>
          )}
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleResetToBaseline}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold text-[#3f4850] hover:bg-[#eff4ff] border border-[#cbd5e1] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded font-['Inter'] text-xs font-bold bg-[#006947] hover:bg-[#00855b] text-[#ffffff] shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savedNotification ? 'Saved to History!' : 'Save to History'}</span>
          </button>

          <button
            onClick={onOpenProofModal}
            className="flex items-center gap-2 px-4 py-2 rounded font-['Inter'] text-xs font-bold bg-[#006194] hover:bg-[#007bb9] text-[#ffffff] shadow-sm transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Index details</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards: Chrono vs Bio vs Mortality */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Chronological Age Card */}
        <div className="bg-[#ffffff] p-5 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-[#565e74] text-xs mb-1 font-['JetBrains_Mono']">
              <span>CHRONOLOGICAL AGE</span>
              <span>CALENDAR YRS</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-['Inter'] text-3xl font-bold text-[#0b1c30]">
                {chronologicalAge.toFixed(1)}
              </span>
              <span className="text-xs text-[#565e74]">years</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
            <span className="text-xs text-[#565e74]">Adjust Age:</span>
            <input
              type="number"
              min="18"
              max="95"
              step="0.5"
              value={chronologicalAge}
              onChange={(e) => onUpdateChronologicalAge(parseFloat(e.target.value) || 40)}
              className="w-16 px-2 py-1 bg-[#eff4ff] border border-[#cbd5e1] rounded font-['JetBrains_Mono'] text-xs font-bold text-[#0b1c30] text-right"
            />
          </div>
        </div>

        {/* Biological PhenoAge Card */}
        <div className="bg-[#ffffff] p-5 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-[#006194] text-xs mb-1 font-['JetBrains_Mono'] font-bold">
              <span>BIOLOGICAL PHENOAGE</span>
              <span>LEVINE 2018</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-['Inter'] text-4xl font-bold text-[#006194]">
                {calculation.isValid ? calculation.phenoAge.toFixed(1) : '…'}
              </span>
              <span className="text-xs text-[#565e74]">years</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
            <span className="text-xs text-[#565e74]">Aging Variance (Δ):</span>
            <span
              className={`font-['JetBrains_Mono'] text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                isDecelerated ? 'bg-[#4edea3]/25 text-[#006947]' : 'bg-[#ffdad6] text-[#ba1a1a]'
              }`}
            >
              {isDecelerated ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              {calculation.isValid
                ? `${calculation.ageDelta > 0 ? '+' : ''}${calculation.ageDelta.toFixed(1)} Yrs`
                : '…'}
            </span>
          </div>
        </div>

        {/* 10-Year Mortality Probability Card */}
        <div className="bg-[#ffffff] p-5 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-[#565e74] text-xs mb-1 font-['JetBrains_Mono']">
              <span>10-YR MORTALITY HAZARD</span>
              <span>NHANES GOMPERTZ</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-['Inter'] text-3xl font-bold text-[#006947]">
                {calculation.isValid ? `${calculation.mortalityScore10yr.toFixed(1)}%` : '…'}
              </span>
              <span className="text-xs text-[#565e74]">cumulative</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs text-[#565e74]">
            <span>NHANES Cohort Avg:</span>
            <span className="font-['JetBrains_Mono'] font-bold text-[#0b1c30]">4.2%</span>
          </div>
        </div>

        {/* Longevity Percentile Rank Card */}
        <div className="bg-[#ffffff] p-5 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-[#565e74] text-xs mb-1 font-['JetBrains_Mono']">
              <span>POPULATION TIER</span>
              <span>PERCENTILE</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-['Inter'] text-3xl font-bold text-[#006194]">
                {calculation.isValid
                  ? `Top ${Math.max(1, 100 - calculation.percentileRank)}%`
                  : '…'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs text-[#565e74]">
            <span>Deceleration Status:</span>
            <span className="font-['Inter'] font-semibold text-[#006947]">
              {isDecelerated ? 'High Protection' : 'Attention Needed'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Section: Interactive 9-Biomarker Sliders & Contribution Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: All 9 Interactive Sliders */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-[#ffffff] p-6 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-['Inter'] text-base font-bold text-[#0b1c30] block">
                  All 9 PhenoAge Biomarker Sliders
                </span>
                <span className="font-['Inter'] text-xs text-[#565e74]">
                  Slide any biomarker to observe instantaneous Gompertz delta recalculations.
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-xs bg-[#eff4ff] text-[#006194] px-2.5 py-1 rounded font-bold">
                9 Active
              </span>
            </div>

            {/* Biomarker Sliders List */}
            <div className="flex flex-col gap-4">
              {PHENOAGE_BIOMARKERS.map((bio) => {
                const val = biomarkers[bio.id] ?? bio.optimalRange[0];
                const isOptimal = val >= bio.optimalRange[0] && val <= bio.optimalRange[1];

                return (
                  <div
                    key={bio.id}
                    className="p-3.5 bg-[#eff4ff]/60 rounded-lg border border-[#dce9ff] flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0b1c30]">{bio.name}</span>
                        <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">
                          ({bio.loinc})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-['JetBrains_Mono'] text-xs font-bold ${
                            isOptimal ? 'text-[#006947]' : 'text-[#006194]'
                          }`}
                        >
                          {val.toFixed(bio.step < 0.1 ? 2 : 1)} {bio.unit}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            isOptimal
                              ? 'bg-[#4edea3]/20 text-[#006947]'
                              : 'bg-[#e5eeff] text-[#3f4850]'
                          }`}
                        >
                          {isOptimal ? 'Optimal' : 'Normal'}
                        </span>
                      </div>
                    </div>

                    {/* Range Slider */}
                    <input
                      type="range"
                      min={bio.clinicalRange[0]}
                      max={bio.clinicalRange[1]}
                      step={bio.step}
                      value={val}
                      onChange={(e) => handleSliderChange(bio.id, parseFloat(e.target.value))}
                      className="w-full accent-[#006194] h-1.5 bg-[#dce9ff] rounded cursor-pointer"
                    />

                    <div className="flex justify-between text-[#565e74] font-['JetBrains_Mono'] text-[10px]">
                      <span>Min: {bio.clinicalRange[0]}</span>
                      <span className="text-[#006947] font-semibold">
                        Optimal: {bio.optimalRange[0]} - {bio.optimalRange[1]} {bio.unit}
                      </span>
                      <span>Max: {bio.clinicalRange[1]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Biomarker Impact Waterfall & Longevity Directives */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Biomarker Risk/Protection Breakdown */}
          <div className="bg-[#ffffff] p-6 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-['Inter'] text-sm font-bold text-[#0b1c30]">
                Biomarker Aging Delta Contributions
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">
                Weight Impact
              </span>
            </div>

            <p className="font-['Inter'] text-xs text-[#565e74]">
              Negative values (green) protect and decelerate aging; positive values accelerate
              biological mortality risk.
            </p>

            <div className="space-y-3 pt-2">
              {calculation.biomarkerScores.map((score) => {
                const isProtective = score.contribution <= 0;
                return (
                  <div key={score.id} className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#0b1c30]">{score.name}</span>
                      <span
                        className={`font-['JetBrains_Mono'] font-bold ${
                          isProtective ? 'text-[#006947]' : 'text-[#ba1a1a]'
                        }`}
                      >
                        {score.contribution > 0
                          ? `+${score.contribution.toFixed(1)} yrs`
                          : `${score.contribution.toFixed(1)} yrs`}
                      </span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full bg-[#f1f5f9] h-1.5 rounded-full overflow-hidden flex">
                      {isProtective ? (
                        <div
                          className="bg-[#00855b] h-full ml-auto rounded-l-full"
                          style={{
                            width: `${Math.min(100, Math.abs(score.contribution) * 25)}%`,
                          }}
                        ></div>
                      ) : (
                        <div
                          className="bg-[#ba1a1a] h-full mr-auto rounded-r-full"
                          style={{
                            width: `${Math.min(100, Math.abs(score.contribution) * 25)}%`,
                          }}
                        ></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Research Insight Card */}
          <div className="bg-[#eff4ff] p-5 rounded-xl border border-[#dce9ff] flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[#0b1c30]">
              <Sparkles className="w-4 h-4 text-[#006194]" />
              <span>Evidence-Based Longevity Levers</span>
            </div>
            <div className="text-xs text-[#3f4850] space-y-2 leading-relaxed">
              <p>
                <strong>hs-CRP & RDW Dominance:</strong> Levine's model assigns logarithmic weight
                to systemic sterile inflammation. Keeping hs-CRP &lt; 0.9 mg/L and RDW &lt; 12.5%
                accounts for over 60% of biological age deceleration variance.
              </p>
              <p>
                <strong>Hepatic Reserve:</strong> High serum albumin (&gt;45 g/L) reflects strong
                synthetic capacity and protein nutrition, providing an active negative hazard multiplier.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Actionable Longevity & Lifestyle Advisor based on current biomarkers */}
      <LifestyleLongevityAdvisor
        biomarkers={biomarkers}
        calculation={calculation}
        chronologicalAge={chronologicalAge}
      />
    </div>
  );
};
