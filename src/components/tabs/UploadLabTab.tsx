import React, { useState } from 'react';
import { TabType, LabPanelData } from '../../types';
import { PRESET_LAB_PANELS } from '../../data/phenoAgeData';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Lock,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  FileCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface UploadLabTabProps {
  onLoadPanel: (panel: LabPanelData) => void;
  setActiveTab: (tab: TabType) => void;
  accountAddress: string;
}

export const UploadLabTab: React.FC<UploadLabTabProps> = ({
  onLoadPanel,
  setActiveTab,
  accountAddress,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const simulateOcrProcess = (
    fileName: string,
    presetKey: 'quest' | 'labcorp' | 'nhs' = 'quest'
  ) => {
    setIsProcessing(true);
    setSelectedFileName(fileName);
    setProgressStep(1);
    setProgressMsg('Mounting local PDF canvas into in-memory WebWorker...');

    const preset = PRESET_LAB_PANELS[presetKey];

    setTimeout(() => {
      setProgressStep(2);
      setProgressMsg('Tesseract WebAssembly 2.0 isolating tabular cell boundaries...');
    }, 400);

    setTimeout(() => {
      setProgressStep(3);
      setProgressMsg('Matching optical text indices to LOINC 2024.2 clinical dictionary...');
    }, 850);

    setTimeout(() => {
      setProgressStep(4);
      setProgressMsg('Converting units (g/dL ⇄ g/L, mg/dL ⇄ μmol/L) & calculating checksum...');
    }, 1300);

    setTimeout(() => {
      setProgressStep(5);
      setProgressMsg('Extraction verified! 9 of 9 PhenoAge biomarkers ready for sign-off.');

      const newPanel: LabPanelData = {
        id: `panel-${Date.now()}`,
        labName: preset.source,
        testDate: preset.date,
        sourceType: 'pdf',
        fileName: fileName,
        chronologicalAge: preset.age,
        gender: 'male',
        biomarkers: { ...preset.values },
        confidenceScores: { ...preset.confidence },
        verified: false,
        hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random()
          .toString(16)
          .slice(2, 6)}`,
      };

      onLoadPanel(newPanel);
      setIsProcessing(false);
      setActiveTab('review-extraction');
    }, 1800);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      simulateOcrProcess(files[0].name, 'quest');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateOcrProcess(e.target.files[0].name, 'quest');
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header and Step Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#cce5ff] text-[#004b73] font-['JetBrains_Mono'] text-xs font-semibold px-2 py-0.5 rounded">
              Pipeline Stage 01
            </span>
            <span className="font-['JetBrains_Mono'] text-xs text-[#565e74]">
              WebAssembly In-Memory Ingestion
            </span>
          </div>
          <h1 className="font-['Inter'] text-2xl lg:text-3xl font-bold text-[#0b1c30]">
            Upload Laboratory Blood Panel
          </h1>
          <p className="font-['Inter'] text-sm text-[#3f4850] mt-1 max-w-2xl">
            Drop Quest Diagnostics, LabCorp, NHS, or any clinical laboratory PDF. The PDF is parsed
            directly within your browser's WebAssembly sandbox with zero network transmission.
          </p>
        </div>

        {/* Security badge */}
        <div className="bg-[#ffffff] border border-[#dce9ff] p-3 rounded-lg shadow-xs flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#4edea3]/20 flex items-center justify-center text-[#006947]">
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#0b1c30]">
              Zero-Cloud Retention
            </span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#006947]">
              0 network bytes transmitted
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Dropzone & Preset Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dropzone & Progress */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Dropzone container */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 lg:p-12 text-center transition-all bg-[#ffffff] flex flex-col items-center justify-center gap-4 ${
              isDragging
                ? 'border-[#006194] bg-[#eff4ff]'
                : 'border-[#cbd5e1] hover:border-[#006194]'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-center text-[#006194]">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-1 max-w-md">
              <span className="font-['Inter'] text-base font-bold text-[#0b1c30]">
                Drag and drop your PDF lab report here
              </span>
              <span className="font-['Inter'] text-xs text-[#565e74]">
                Accepts PDF, TIFF, PNG, or scan files from Quest, LabCorp, BioReference, NHS, or
                private clinics.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="bg-[#006194] hover:bg-[#007bb9] text-[#ffffff] px-5 py-2.5 rounded font-['Inter'] text-xs font-semibold transition-colors cursor-pointer shadow-xs">
                Select Lab PDF File
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.tiff"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>
              <span className="text-xs text-[#94a3b8] font-mono">or try a sample panel below</span>
            </div>

            <div className="pt-4 mt-2 border-t border-[#f1f5f9] w-full flex items-center justify-center gap-6 text-xs text-[#565e74] font-['JetBrains_Mono']">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#006947]" /> WASM Tesseract 2.0
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006194]" /> In-Memory Isolation
              </span>
            </div>
          </div>

          {/* Processing Simulation Animation */}
          {isProcessing && (
            <div className="bg-[#ffffff] p-5 rounded-xl border border-[#cbd5e1] shadow-md flex flex-col gap-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-['JetBrains_Mono'] text-[#006194] font-bold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#006194]" />
                  OCR Parsing: {selectedFileName}
                </span>
                <span className="font-['JetBrains_Mono'] text-[#565e74]">Step {progressStep}/5</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#eff4ff] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#006194] h-full transition-all duration-300"
                  style={{ width: `${(progressStep / 5) * 100}%` }}
                ></div>
              </div>

              <span className="font-['JetBrains_Mono'] text-xs text-[#0b1c30] font-medium bg-[#f8f9ff] p-2.5 rounded border border-[#e2e8f0]">
                {progressMsg}
              </span>
            </div>
          )}

          {/* Verification Protocol Info Box */}
          <div className="bg-[#eff4ff] p-4 rounded-xl border border-[#dce9ff] flex items-start gap-3 text-xs text-[#3f4850]">
            <FileCheck className="w-5 h-5 text-[#006194] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-[#0b1c30] block mb-0.5">
                Human-in-the-Loop Safeguard:
              </strong>
              After parsing, you will be presented with a side-by-side verification screen where you
              can inspect high-confidence extractions, verify units, and sign off on values before
              any mathematical computation occurs.
            </div>
          </div>
        </div>

        {/* Right Column: Pre-configured Clinical Sample Panels */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#ffffff] p-6 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-['Inter'] text-sm font-bold text-[#0b1c30] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#006194]" />
                Interactive Preset Lab Panels
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">
                1-Click Testing
              </span>
            </div>
            <p className="font-['Inter'] text-xs text-[#565e74] leading-relaxed">
              Don't have your own lab PDF right now? Click any realistic standardized test panel below
              to inspect the complete end-to-end extraction and PhenoAge workflow.
            </p>

            {/* Presets List */}
            <div className="flex flex-col gap-3">
              {/* Preset 1: Quest */}
              <button
                onClick={() => simulateOcrProcess('Quest_Diagnostics_Panel_2025_08.pdf', 'quest')}
                disabled={isProcessing}
                className="text-left p-3.5 rounded-lg border border-[#e2e8f0] hover:border-[#006194] hover:bg-[#eff4ff] transition-all bg-[#ffffff] group cursor-pointer flex flex-col gap-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['Inter'] text-xs font-bold text-[#0b1c30] group-hover:text-[#006194]">
                    Quest Diagnostics (Longevity Panel)
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[10px] bg-[#4edea3]/20 text-[#006947] font-semibold px-1.5 py-0.5 rounded">
                    Optimal Profile (Age 42)
                  </span>
                </div>
                <div className="text-[11px] text-[#565e74] flex items-center justify-between">
                  <span>9/9 LOINCs • hs-CRP: 0.8 mg/L • Alb: 46.2 g/L</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#006194] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {/* Preset 2: LabCorp */}
              <button
                onClick={() => simulateOcrProcess('LabCorp_Requisition_B7719.pdf', 'labcorp')}
                disabled={isProcessing}
                className="text-left p-3.5 rounded-lg border border-[#e2e8f0] hover:border-[#006194] hover:bg-[#eff4ff] transition-all bg-[#ffffff] group cursor-pointer flex flex-col gap-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['Inter'] text-xs font-bold text-[#0b1c30] group-hover:text-[#006194]">
                    LabCorp Biomarker Comprehensive Profile
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[10px] bg-[#eff4ff] text-[#006194] font-semibold px-1.5 py-0.5 rounded">
                    Mild Inflammation (Age 42)
                  </span>
                </div>
                <div className="text-[11px] text-[#565e74] flex items-center justify-between">
                  <span>9/9 LOINCs • hs-CRP: 1.15 mg/L • Alb: 44.8 g/L</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#006194] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {/* Preset 3: NHS */}
              <button
                onClick={() => simulateOcrProcess('NHS_Blood_Sciences_Report_0924.pdf', 'nhs')}
                disabled={isProcessing}
                className="text-left p-3.5 rounded-lg border border-[#e2e8f0] hover:border-[#006194] hover:bg-[#eff4ff] transition-all bg-[#ffffff] group cursor-pointer flex flex-col gap-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['Inter'] text-xs font-bold text-[#0b1c30] group-hover:text-[#006194]">
                    NHS Core Clinical Biochemistry Report
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[10px] bg-[#fff1f2] text-[#ba1a1a] font-semibold px-1.5 py-0.5 rounded">
                    Baseline Entry (Age 41)
                  </span>
                </div>
                <div className="text-[11px] text-[#565e74] flex items-center justify-between">
                  <span>9/9 LOINCs • hs-CRP: 1.6 mg/L • Alb: 43.5 g/L</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#006194] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>
          </div>

          {/* Supported Format Specifications Card */}
          <div className="bg-[#ffffff] p-5 rounded-xl border border-[#e2e8f0] flex flex-col gap-2.5 text-xs text-[#3f4850]">
            <span className="font-['Inter'] font-bold text-[#0b1c30]">
              Automated Parsing Dictionary Coverage
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#565e74] font-['JetBrains_Mono']">
              <div>✓ CBC w/ Differential</div>
              <div>✓ Comprehensive Metabolic (CMP)</div>
              <div>✓ Cardio hs-CRP Assay</div>
              <div>✓ Alkaline Phosphatase (ALP)</div>
              <div>✓ Glucose (Fasting Serum)</div>
              <div>✓ Red Cell Distribution (RDW)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
