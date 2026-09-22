import React from 'react';
import { TabType } from '../../types';
import {
  Dna,
  Key,
  ShieldCheck,
  FileText,
  Cpu,
  Lock,
  Zap,
  CheckSquare,
  Share2,
  AlertCircle,
  Activity,
  Calculator,
  Database,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';

interface OverviewTabProps {
  setActiveTab: (tab: TabType) => void;
  onOpenSeedPhrase: () => void;
  onOpenProofModal: () => void;
  biomarkers: Record<string, number>;
  onUpdateBiomarkers: (updated: Record<string, number>) => void;
  phenoAge: number | null;
  chronologicalAge: number;
  disclaimer: string;
  isAuthenticated: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  setActiveTab,
  onOpenSeedPhrase,
  onOpenProofModal,
  biomarkers,
  onUpdateBiomarkers,
  phenoAge,
  chronologicalAge,
  disclaimer,
  isAuthenticated,
}) => {
  const alb = biomarkers['albumin'] ?? 46.0;
  const crp = biomarkers['crp'] ?? 0.8;
  const ageDelta = phenoAge === null ? null : phenoAge - chronologicalAge;

  const handleAlbuminChange = (val: number) => {
    onUpdateBiomarkers({ ...biomarkers, albumin: val });
  };

  const handleCrpChange = (val: number) => {
    onUpdateBiomarkers({ ...biomarkers, crp: val });
  };

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section with Dual Column Layout & Interactive Engine Preview */}
      <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 pt-8 pb-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column: Scientific Positioning & CTA */}
          <div className="xl:col-span-7 flex flex-col items-start gap-4">
            {/* Subhead Badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#cce5ff] text-[#004b73] px-3 py-1 rounded font-['JetBrains_Mono'] text-xs font-semibold uppercase tracking-wider">
              <Dna className="w-3.5 h-3.5" />
              <span>Open Science & Personal Longevity Analytics</span>
            </div>

            {/* Headline */}
            <h1 className="font-['Inter'] text-3xl sm:text-4xl lg:text-[44px] leading-tight lg:leading-[52px] text-[#0b1c30] tracking-tight font-bold">
              Transform Your Blood Panels into Biological Insights.{' '}
              <span className="text-[#006194] underline decoration-[#006194]/30 underline-offset-8">
                Original files are not stored.
              </span>
            </h1>

            {/* Value Proposition */}
            <p className="font-['Inter'] text-base text-[#3f4850] max-w-2xl leading-relaxed">
              NotMice reads a lab PDF on the server, asks you to confirm the numbers, and calculates
              PhenoAge as a research index. Confirmed values join the public dataset only if you
              turn sharing on.
            </p>

            {/* CTA Cluster */}
            <div className="flex flex-wrap items-center gap-4 pt-1 w-full sm:w-auto">
              <button
                onClick={onOpenSeedPhrase}
                className="w-full sm:w-auto bg-[#006194] hover:bg-[#007bb9] text-[#ffffff] px-6 py-3 rounded font-['Inter'] text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                id="btn-seed"
              >
                <Key className="w-4 h-4" />
                <span>{isAuthenticated ? 'Open Account' : 'Get Started with Seed Phrase'}</span>
              </button>
              <button
                onClick={() => setActiveTab('data-sovereignty-public-sharing')}
                className="w-full sm:w-auto bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] px-6 py-3 rounded font-['Inter'] text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-[#dce9ff] cursor-pointer"
                id="btn-charter"
              >
                <FileText className="w-4 h-4 text-[#006194]" />
                <span>Explore Open Dataset & Research Charter</span>
              </button>
            </div>

            {/* System Architecture Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full pt-4">
              <div className="bg-[#ffffff] p-3.5 rounded border border-[#e2e8f0] shadow-xs flex flex-col gap-0.5">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] uppercase">
                  Runtime Execution
                </span>
                <span className="font-['JetBrains_Mono'] text-xs text-[#006947] font-bold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Server extract
                </span>
              </div>
              <div className="bg-[#ffffff] p-3.5 rounded border border-[#e2e8f0] shadow-xs flex flex-col gap-0.5">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] uppercase">
                  Biomarker Standard
                </span>
                <span className="font-['JetBrains_Mono'] text-xs text-[#0b1c30] font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#006194]" /> LOINC dictionary
                </span>
              </div>
              <div className="bg-[#ffffff] p-3.5 rounded border border-[#e2e8f0] shadow-xs flex flex-col gap-0.5 col-span-2 sm:col-span-1">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] uppercase">
                  Mortality Validation
                </span>
                <span className="font-['JetBrains_Mono'] text-xs text-[#006194] font-semibold flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" /> Levine 2018 Model
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Biological Age Engine Showcase Card */}
          <div className="xl:col-span-5 w-full flex flex-col gap-4">
            {/* Main PhenoAge Showcase Deck */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#cbd5e1] shadow-md flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-[#cce5ff] flex items-center justify-center text-[#006194]">
                    <Activity className="w-5 h-5 text-[#006194]" />
                  </div>
                  <div>
                    <span className="font-['Inter'] text-sm font-bold text-[#0b1c30] block">
                      PhenoAge™ Engine Score
                    </span>
                    <span className="font-['JetBrains_Mono'] text-xs text-[#565e74]">
                      Tutorial example • calculated on the server
                    </span>
                  </div>
                </div>
                <span className="bg-[#eff4ff] text-[#004b73] font-['JetBrains_Mono'] text-xs px-2 py-1 rounded font-bold">
                  Worked example
                </span>
              </div>

              {/* Chrono vs Biological Gauge Comparison */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#eff4ff] rounded-lg border border-[#dce9ff]">
                <div className="flex flex-col">
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] uppercase font-medium">
                    Chronological
                  </span>
                  <span className="font-['Inter'] text-3xl sm:text-4xl font-bold text-[#0b1c30] mt-1">
                    {chronologicalAge.toFixed(1)}
                  </span>
                  <span className="font-['Inter'] text-xs text-[#565e74]">
                    Baseline Calendar Yrs
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] uppercase font-medium">
                    Biological (PhenoAge)
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className="font-['Inter'] text-3xl sm:text-4xl font-bold text-[#006194]"
                      id="bio-age-val"
                    >
                      {phenoAge === null ? '…' : phenoAge.toFixed(1)}
                    </span>
                    <span
                      className={`font-['JetBrains_Mono'] text-xs font-bold px-1.5 py-0.5 rounded ${
                        ageDelta !== null && ageDelta <= 0
                          ? 'bg-[#4edea3]/25 text-[#006947]'
                          : 'bg-[#ffdad6] text-[#ba1a1a]'
                      }`}
                    >
                      {ageDelta === null
                        ? '…'
                        : `${ageDelta > 0 ? '+' : ''}${ageDelta.toFixed(1)} Yrs`}
                    </span>
                  </div>
                  <span className="font-['Inter'] text-xs text-[#006947] font-semibold">
                    {ageDelta === null
                      ? 'Research index'
                      : ageDelta <= 0
                        ? 'Decelerated Aging Vector'
                        : 'Accelerated Aging Vector'}
                  </span>
                </div>
              </div>
              <p className="font-['Inter'] text-xs text-[#3f4850] border-l-2 border-[#006194] pl-3">
                {disclaimer}
              </p>

              {/* Dynamic Biomarker Interactive Sliders */}
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-['Inter'] text-xs font-semibold text-[#0b1c30]">
                    Interactive Algorithm Sensitivity
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">
                    Adjust to simulate Levine Delta
                  </span>
                </div>

                {/* Biomarker Micro Row 1: Albumin */}
                <div className="bg-[#eff4ff]/70 p-3 rounded border border-[#dce9ff] flex flex-col gap-1.5">
                  <div className="flex justify-between items-center font-['Inter'] text-xs">
                    <span className="font-medium text-[#0b1c30]">
                      Serum Albumin (LOINC 1751-7)
                    </span>
                    <span
                      className="font-['JetBrains_Mono'] text-xs font-bold text-[#006194]"
                      id="val-alb"
                    >
                      {alb.toFixed(1)} g/L
                    </span>
                  </div>
                  <div className="relative w-full flex items-center">
                    <input
                      className="w-full accent-[#006194] h-1.5 bg-[#dce9ff] rounded cursor-pointer"
                      id="slider-alb"
                      max="52"
                      min="30"
                      step="0.5"
                      type="range"
                      value={alb}
                      onChange={(e) => handleAlbuminChange(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="flex justify-between text-[#565e74] font-['JetBrains_Mono'] text-[10px]">
                    <span>30.0 (High Risk)</span>
                    <span className="text-[#006947] font-semibold">Optimum: &gt;45.0</span>
                    <span>52.0</span>
                  </div>
                </div>

                {/* Biomarker Micro Row 2: hs-CRP */}
                <div className="bg-[#eff4ff]/70 p-3 rounded border border-[#dce9ff] flex flex-col gap-1.5">
                  <div className="flex justify-between items-center font-['Inter'] text-xs">
                    <span className="font-medium text-[#0b1c30]">
                      hs-CRP High Sensitivity (LOINC 30522-7)
                    </span>
                    <span
                      className="font-['JetBrains_Mono'] text-xs font-bold text-[#006194]"
                      id="val-crp"
                    >
                      {crp.toFixed(2)} mg/L
                    </span>
                  </div>
                  <div className="relative w-full flex items-center">
                    <input
                      className="w-full accent-[#006194] h-1.5 bg-[#dce9ff] rounded cursor-pointer"
                      id="slider-crp"
                      max="6.0"
                      min="0.1"
                      step="0.1"
                      type="range"
                      value={crp}
                      onChange={(e) => handleCrpChange(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="flex justify-between text-[#565e74] font-['JetBrains_Mono'] text-[10px]">
                    <span className="text-[#006947] font-semibold">
                      &lt; 1.0 (Low Systemic Inflam)
                    </span>
                    <span>3.0 (Moderate)</span>
                    <span className="text-[#ba1a1a] font-semibold">&gt; 5.0 (High Risk)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#eff4ff] p-2.5 rounded border border-[#dce9ff] text-[#3f4850] font-['JetBrains_Mono'] text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <ShieldCheck className="w-4 h-4 text-[#006947] shrink-0" />
                  <span className="truncate">No lab file yet • SHA-256 appears after a real upload</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setActiveTab('phenoage-engine')}
                    className="text-[#006947] hover:underline font-['Inter'] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Longevity Advice</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={onOpenProofModal}
                    className="text-[#006194] hover:text-[#007bb9] font-['Inter'] text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Inspect Proof
                  </button>
                </div>
              </div>
            </div>

            {/* Comparative Mouse vs Human Research Callout Card */}
            <div className="bg-[#007bb9] text-[#ffffff] p-5 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-white/20 p-1 flex items-center justify-center shrink-0 ring-2 ring-white/30">
                <img
                  alt="NotMice Emblem"
                  className="w-full h-full rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida/AEtjO1WjhhiY5OJnWJ6GKB5XdTf0_4k-aMzMw4vleFit1BARxh5Y894ENmrKtb1bX1pM2IpF6MXccBv90qd5SUjX-u2Wfm0HbCGdw1ue2bTj_Qq3a9DMY-H_a2D16BAYpHB4TK81wRFE89ZlqiJCPuoY2QNRZL9Ey58WSJP6ieZEKS6dopki1jAcmzIk25NOnua_TWtIclMLHt4b7UlEbw_-4LMgKQXabLHR5l4-Ci4JOLXBIm5sTf02yq5LujEz36-P_xu9qvoBIPNz"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-['Inter'] text-lg font-bold leading-snug">
                  Why 'NotMice'?
                </span>
                <span className="font-['Inter'] text-xs opacity-90 mt-0.5 leading-relaxed">
                  92% of anti-aging trials fail translational leap from rodent models. We prioritize
                  longitudinal, standardized human blood data.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Method & Scientific Architecture Preview (4-Step Pipeline) */}
      <section className="w-full bg-[#eff4ff] py-12 border-y border-[#dce9ff]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-['JetBrains_Mono'] text-xs text-[#006194] font-bold uppercase tracking-widest">
                End-to-End Pipeline
              </span>
              <h2 className="font-['Inter'] text-2xl lg:text-3xl text-[#0b1c30] font-bold tracking-tight">
                Method & Scientific Architecture
              </h2>
            </div>
            <p className="font-['Inter'] text-sm text-[#3f4850] max-w-xl">
              A lab PDF is read on the server, checked by you, then scored with the Levine 2018 index.
            </p>
          </div>

          {/* Diagrammatic 4-Step Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col gap-3 relative">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded bg-[#eff4ff] flex items-center justify-center text-[#006194] font-['Inter'] text-lg font-bold">
                  01
                </div>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] uppercase bg-[#eff4ff] px-2 py-0.5 rounded font-medium">
                  Input
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="font-['Inter'] text-base font-bold text-[#0b1c30]">
                  Raw PDF Intake
                </span>
                <p className="font-['Inter'] text-xs text-[#3f4850] leading-relaxed">
                  Drop a lab PDF or scan. The server reads it in memory and does not write the
                  original file to disk.
                </p>
              </div>
              <div className="mt-auto pt-3 flex items-center gap-1.5 text-[#565e74] font-['JetBrains_Mono'] text-[11px]">
                <Lock className="w-3.5 h-3.5 text-[#006947]" />
                <span>SHA-256 kept in provenance</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col gap-3 relative">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded bg-[#eff4ff] flex items-center justify-center text-[#006194] font-['Inter'] text-lg font-bold">
                  02
                </div>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] uppercase bg-[#eff4ff] px-2 py-0.5 rounded font-medium">
                  Process
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="font-['Inter'] text-base font-bold text-[#0b1c30]">
                  Server extraction
                </span>
                <p className="font-['Inter'] text-xs text-[#3f4850] leading-relaxed">
                  Text PDFs are read with pdfplumber. Scans go to a vision model on the server, then
                  names are matched to the versioned LOINC dictionary.
                </p>
              </div>
              <div className="mt-auto pt-3 flex items-center gap-1.5 text-[#565e74] font-['JetBrains_Mono'] text-[11px]">
                <Zap className="w-3.5 h-3.5 text-[#006947]" />
                <span>Unmatched names stay in the unmapped queue</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col gap-3 relative">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded bg-[#eff4ff] flex items-center justify-center text-[#006194] font-['Inter'] text-lg font-bold">
                  03
                </div>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] uppercase bg-[#eff4ff] px-2 py-0.5 rounded font-medium">
                  Verify
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="font-['Inter'] text-base font-bold text-[#0b1c30]">
                  Human-in-the-Loop
                </span>
                <p className="font-['Inter'] text-xs text-[#3f4850] leading-relaxed">
                  You check and edit the extracted numbers before they are saved. Nothing is stored
                  as a confirmed result until you sign off.
                </p>
              </div>
              <div className="mt-auto pt-3 flex items-center gap-1.5 text-[#565e74] font-['JetBrains_Mono'] text-[11px]">
                <CheckSquare className="w-3.5 h-3.5 text-[#006947]" />
                <span>Manual unit conflict correction</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col gap-3 relative">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded bg-[#eff4ff] flex items-center justify-center text-[#006194] font-['Inter'] text-lg font-bold">
                  04
                </div>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] uppercase bg-[#eff4ff] px-2 py-0.5 rounded font-medium">
                  Compute
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="font-['Inter'] text-base font-bold text-[#0b1c30]">
                  PhenoAge and opt-in sharing
                </span>
                <p className="font-['Inter'] text-xs text-[#3f4850] leading-relaxed">
                  PhenoAge is the Levine 2018 research index, not a medical service. If you opt in,
                  anonymized rows appear in the public API and the CC0 export.
                </p>
              </div>
              <div className="mt-auto pt-3 flex items-center gap-1.5 text-[#565e74] font-['JetBrains_Mono'] text-[11px]">
                <Share2 className="w-3.5 h-3.5 text-[#006947]" />
                <span>CSV, Parquet, and datasheet</span>
              </div>
            </div>
          </div>

          {/* Scientific Disclaimer Banner */}
          <div className="w-full bg-[#ffffff] p-4 rounded-lg border border-[#cbd5e1] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#565e74] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-['Inter'] text-xs font-bold text-[#0b1c30]">
                Academic & Research Protocol Notice
              </span>
              <p className="font-['Inter'] text-xs text-[#3f4850] leading-relaxed">
                NotMice is an exploratory academic computation platform. It is not an FDA-cleared
                diagnostic device and should never replace clinical judgment by certified healthcare
                providers. Calculated PhenoAge represents a statistical regression against
                NHANES-calibrated mortality hazard, not an absolute diagnosis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Verification Protocol (3 Deep-Dive Cards) */}
      <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-12">
        <div className="flex flex-col gap-1 mb-6">
          <span className="font-['JetBrains_Mono'] text-xs text-[#006194] font-bold uppercase tracking-wider">
            Privacy and method
          </span>
          <h2 className="font-['Inter'] text-2xl lg:text-3xl text-[#0b1c30] font-bold">
            Trust & Verification Protocol
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="w-11 h-11 rounded bg-[#4edea3]/20 text-[#006947] flex items-center justify-center">
                <Cpu className="w-6 h-6 text-[#006947]" />
              </div>
              <h3 className="font-['Inter'] text-xl text-[#0b1c30] font-bold">
                Original files are not stored
              </h3>
              <p className="font-['Inter'] text-sm text-[#3f4850] leading-relaxed">
                The server reads the PDF in memory and keeps a SHA-256 in provenance. The original
                file is not written to disk. Confirmed biomarker values are stored in Postgres after
                you approve them.
              </p>
            </div>
            <div className="pt-4 mt-6 bg-[#eff4ff] p-3 rounded flex flex-col gap-1 border border-[#dce9ff]">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74] uppercase font-medium">
                What is kept
              </span>
              <span className="font-['JetBrains_Mono'] text-xs text-[#0b1c30] font-semibold">
                SHA-256, confirmed values, opt-in flag
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="w-11 h-11 rounded bg-[#cce5ff] text-[#006194] flex items-center justify-center">
                <Calculator className="w-6 h-6 text-[#006194]" />
              </div>
              <h3 className="font-['Inter'] text-xl text-[#0b1c30] font-bold">
                Validated Research Index
              </h3>
              <p className="font-['Inter'] text-sm text-[#3f4850] leading-relaxed">
                Computes Morgan Levine's 9-biomarker mortality-calibrated PhenoAge algorithm without
                diagnostic speculation or proprietary black-box scoring.
              </p>
            </div>
            <div className="pt-4 mt-6 bg-[#eff4ff] p-3 rounded flex flex-col gap-1 border border-[#dce9ff]">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74] uppercase font-medium">
                Algorithm Citation
              </span>
              <span className="font-['JetBrains_Mono'] text-xs text-[#0b1c30] font-semibold">
                Aging (Albany NY) 2018; 10(4):573–591
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="w-11 h-11 rounded bg-[#dae2fd] text-[#565e74] flex items-center justify-center">
                <Database className="w-6 h-6 text-[#006194]" />
              </div>
              <h3 className="font-['Inter'] text-xl text-[#0b1c30] font-bold">
                Opt-in public sharing
              </h3>
              <p className="font-['Inter'] text-sm text-[#3f4850] leading-relaxed">
                Opt-in to contribute anonymized cohorts to public Parquet/CSV research repositories
                via read-only APIs without revealing PII or clinical origin.
              </p>
            </div>
            <div className="pt-4 mt-6 bg-[#eff4ff] p-3 rounded flex flex-col gap-1 border border-[#dce9ff]">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74] uppercase font-medium">
                Public export
              </span>
              <span className="font-['JetBrains_Mono'] text-xs text-[#0b1c30] font-semibold">
                CC0-1.0 CSV, Parquet, datasheet
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Complete 9-Biomarker Scientific Roster Preview Table */}
      <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 pb-12">
        <div className="bg-[#ffffff] p-6 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-['Inter'] text-xl font-bold text-[#0b1c30]">
                The PhenoAge Nine: Required Biomarker Matrix
              </h3>
              <p className="font-['Inter'] text-xs text-[#3f4850]">
                Every biomarker is mathematically weighted according to Levine's 10-year proportional
                hazards model.
              </p>
            </div>
            <span className="font-['JetBrains_Mono'] text-xs bg-[#eff4ff] border border-[#dce9ff] px-2.5 py-1 rounded text-[#0b1c30] font-medium self-start sm:self-auto">
              9 of 9 LOINC codes active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-['Inter'] text-xs">
              <thead>
                <tr className="bg-[#eff4ff] text-[#565e74] font-['JetBrains_Mono'] text-[11px] uppercase tracking-wider border-b border-[#dce9ff]">
                  <th className="py-2.5 px-3">Biomarker</th>
                  <th className="py-2.5 px-3">LOINC Code</th>
                  <th className="py-2.5 px-3">Physiological Domain</th>
                  <th className="py-2.5 px-3">Sample Optimal</th>
                  <th className="py-2.5 px-3">Risk Influence</th>
                </tr>
              </thead>
              <tbody className="text-[#0b1c30] divide-y divide-[#f1f5f9]">
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-3 font-semibold">Serum Albumin</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] text-[#565e74]">1751-7</td>
                  <td className="py-3 px-3">Hepatic / Nutritional Synthesis</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] font-semibold text-[#006947]">
                    45 - 50 g/L
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[#006947] font-semibold">Negative (Protective)</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-3 font-semibold">Serum Creatinine</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] text-[#565e74]">2160-0</td>
                  <td className="py-3 px-3">Renal Filtration Efficiency</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] font-semibold">0.7 - 1.1 mg/dL</td>
                  <td className="py-3 px-3">
                    <span className="text-[#006194] font-semibold">Positive (Accelerant)</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-3 font-semibold">Fasting Serum Glucose</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] text-[#565e74]">2345-7</td>
                  <td className="py-3 px-3">Metabolic / Insulin Sensitivity</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] font-semibold text-[#006947]">
                    72 - 88 mg/dL
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[#006194] font-semibold">Positive (Accelerant)</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-3 font-semibold">hs-C-Reactive Protein</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] text-[#565e74]">30522-7</td>
                  <td className="py-3 px-3">Systemic Sterile Inflammation</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] font-semibold text-[#006947]">
                    &lt; 0.9 mg/L
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[#ba1a1a] font-semibold">Heavy Positive</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-3 font-semibold">Lymphocyte Percentage</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] text-[#565e74]">26474-7</td>
                  <td className="py-3 px-3">Immunosenescence Balance</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] font-semibold">25 - 40 %</td>
                  <td className="py-3 px-3">
                    <span className="text-[#006947] font-semibold">Negative (Protective)</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-3 font-semibold">Mean Corpuscular Volume (MCV)</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] text-[#565e74]">787-2</td>
                  <td className="py-3 px-3">Hematology & Methylation</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] font-semibold">86 - 92 fL</td>
                  <td className="py-3 px-3">
                    <span className="text-[#006194] font-semibold">Positive (Accelerant)</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-3 font-semibold">Red Cell Distribution Width (RDW)</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] text-[#565e74]">788-0</td>
                  <td className="py-3 px-3">Erythrocyte Turnover / Frailty</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] font-semibold text-[#006947]">
                    11.5 - 12.8 %
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[#ba1a1a] font-semibold">Heavy Positive</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-3 font-semibold">Alkaline Phosphatase (ALP)</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] text-[#565e74]">6768-6</td>
                  <td className="py-3 px-3">Biliary / Bone Mineralization</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] font-semibold">45 - 75 U/L</td>
                  <td className="py-3 px-3">
                    <span className="text-[#006194] font-semibold">Positive (Accelerant)</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-3 font-semibold">White Blood Cell Count (WBC)</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] text-[#565e74]">6690-2</td>
                  <td className="py-3 px-3">Innate Immune Activation</td>
                  <td className="py-3 px-3 font-['JetBrains_Mono'] font-semibold">
                    4.5 - 6.5 10³/µL
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[#006194] font-semibold">Positive (Accelerant)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom CTA / Activation Strip */}
      <section className="w-full bg-[#006194] py-8 text-[#ffffff]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <span className="font-['Inter'] text-xl lg:text-2xl font-bold">
              Ready to quantify your rate of biological aging?
            </span>
            <span className="font-['Inter'] text-xs opacity-90">
              Sign in with a recovery phrase, upload a lab PDF, and review the extracted numbers.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('upload-lab')}
              className="bg-[#ffffff] text-[#006194] hover:bg-[#eff4ff] font-['Inter'] text-sm px-6 py-3 rounded font-bold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              id="btn-bottom-start"
            >
              <span>Upload a lab PDF</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
