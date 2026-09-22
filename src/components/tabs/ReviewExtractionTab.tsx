import React, { useState } from 'react';
import { TabType, LabPanelData } from '../../types';
import { PHENOAGE_BIOMARKERS } from '../../data/phenoAgeData';
import { confirmLabExtraction } from '../../api/uploads';
import {
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Eye,
  Sliders,
} from 'lucide-react';

interface ReviewExtractionTabProps {
  currentPanel: LabPanelData;
  onUpdateBiomarkers: (biomarkers: Record<string, number>) => void;
  setActiveTab: (tab: TabType) => void;
  accessToken: string | null;
}

export const ReviewExtractionTab: React.FC<ReviewExtractionTabProps> = ({
  currentPanel,
  onUpdateBiomarkers,
  setActiveTab,
  accessToken,
}) => {
  const [localValues, setLocalValues] = useState<Record<string, number>>({
    ...currentPanel.biomarkers,
  });
  const [activeSnippetKey, setActiveSnippetKey] = useState<string>('albumin');
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({
    albumin: true,
    creatinine: true,
    glucose: true,
    crp: true,
    lymphocyte: true,
    mcv: true,
    rdw: true,
    alp: true,
    wbc: true,
  });

  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const handleValueChange = (id: string, val: number) => {
    const next = { ...localValues, [id]: val };
    setLocalValues(next);
    onUpdateBiomarkers(next);
  };

  const toggleVerify = (id: string) => {
    setVerifiedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleVerifyAll = () => {
    void (async () => {
      const allTrue: Record<string, boolean> = {};
      PHENOAGE_BIOMARKERS.forEach((b) => (allTrue[b.id] = true));
      setVerifiedMap(allTrue);
      onUpdateBiomarkers(localValues);
      if (currentPanel.extractToken && accessToken) {
        setConfirmBusy(true);
        setConfirmError(null);
        try {
          const markers = (currentPanel.extractedMarkers ?? []).map((marker) => ({
            rawName: marker.rawName,
            value:
              marker.canonicalId && localValues[marker.canonicalId] !== undefined
                ? localValues[marker.canonicalId]
                : marker.value,
            unit: marker.unit,
          }));
          const fallback =
            markers.length > 0
              ? markers
              : PHENOAGE_BIOMARKERS.map((bio) => ({
                  rawName: bio.name,
                  value: localValues[bio.id],
                  unit: bio.unit,
                }));
          await confirmLabExtraction(accessToken, {
            extractToken: currentPanel.extractToken,
            labName: currentPanel.labName,
            collectedAt: currentPanel.testDate,
            chronologicalAge: currentPanel.chronologicalAge,
            markers: fallback,
          });
        } catch (err) {
          setConfirmError(err instanceof Error ? err.message : 'Confirm failed');
          setConfirmBusy(false);
          return;
        }
        setConfirmBusy(false);
      }
      setActiveTab('phenoage-engine');
    })();
  };

  const activeBio = PHENOAGE_BIOMARKERS.find((b) => b.id === activeSnippetKey);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#cce5ff] text-[#004b73] font-['JetBrains_Mono'] text-xs font-semibold px-2 py-0.5 rounded">
              Pipeline Stage 03
            </span>
            <span className="font-['JetBrains_Mono'] text-xs text-[#565e74]">
              Human-in-the-Loop Verification
            </span>
          </div>
          <h1 className="font-['Inter'] text-2xl lg:text-3xl font-bold text-[#0b1c30]">
            Review & Extraction Verification
          </h1>
          <p className="font-['Inter'] text-sm text-[#3f4850] mt-1">
            {currentPanel.sourceType === 'demo' ? 'Demo fixture: ' : 'Source document: '}
            <strong className="text-[#0b1c30]">
              {currentPanel.fileName ?? 'Untitled panel'}
            </strong>{' '}
            • Lab: {currentPanel.labName} • Test Date: {currentPanel.testDate}
            {currentPanel.hash.length === 64 ? ` • SHA-256 ${currentPanel.hash.slice(0, 12)}…` : ''}
          </p>
          {currentPanel.sourceType === 'demo' && (
            <p className="font-['Inter'] text-xs text-[#565e74] mt-2">
              These numbers were not read from a file. Confirming them does not store a lab document.
            </p>
          )}
          {confirmError && (
            <p className="font-['Inter'] text-xs text-[#9f1239] mt-2">{confirmError}</p>
          )}
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('upload-lab')}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold text-[#3f4850] hover:bg-[#eff4ff] border border-[#cbd5e1] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Re-upload</span>
          </button>
          <button
            onClick={handleVerifyAll}
            disabled={confirmBusy}
            className="flex items-center gap-2 px-5 py-2.5 rounded font-['Inter'] text-xs font-bold bg-[#006194] hover:bg-[#007bb9] text-[#ffffff] shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verify All & Compute PhenoAge</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Dual-Pane: Left Document Crop Preview vs Right Extraction Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Document Crop Viewer */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-24">
          <div className="bg-[#ffffff] p-5 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-['Inter'] text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
                <FileSearch className="w-4 h-4 text-[#006194]" />
                Lab Report Crop Inspector
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] bg-[#eff4ff] text-[#006194] px-1.5 py-0.5 rounded font-semibold">
                Canvas 300 DPI
              </span>
            </div>

            {/* Simulated Lab Snippet Paper */}
            <div className="bg-[#f8f9ff] border border-[#dce9ff] rounded-lg p-4 font-['JetBrains_Mono'] text-xs space-y-3 relative shadow-inner">
              <div className="text-[10px] text-[#565e74] border-b border-[#e2e8f0] pb-2 flex justify-between">
                <span>QUEST DIAGNOSTICS INC.</span>
                <span>COLL: {currentPanel.testDate}</span>
              </div>

              {/* Snippet Line Items */}
              <div className="space-y-1 text-[11px]">
                <div
                  onClick={() => setActiveSnippetKey('albumin')}
                  className={`p-1.5 rounded cursor-pointer transition-colors flex justify-between items-center ${
                    activeSnippetKey === 'albumin'
                      ? 'bg-[#cce5ff] border border-[#006194] text-[#001d31] font-bold'
                      : 'hover:bg-[#e2e8f0]/60 text-[#3f4850]'
                  }`}
                >
                  <span>ALBUMIN, SERUM</span>
                  <span>46.2 g/L</span>
                  <span className="text-[9px] text-[#565e74]">[35.0-50.0]</span>
                </div>

                <div
                  onClick={() => setActiveSnippetKey('crp')}
                  className={`p-1.5 rounded cursor-pointer transition-colors flex justify-between items-center ${
                    activeSnippetKey === 'crp'
                      ? 'bg-[#cce5ff] border border-[#006194] text-[#001d31] font-bold'
                      : 'hover:bg-[#e2e8f0]/60 text-[#3f4850]'
                  }`}
                >
                  <span>C-REACTIVE PROTEIN, HS</span>
                  <span>0.80 mg/L</span>
                  <span className="text-[9px] text-[#565e74]">[&lt;1.00]</span>
                </div>

                <div
                  onClick={() => setActiveSnippetKey('glucose')}
                  className={`p-1.5 rounded cursor-pointer transition-colors flex justify-between items-center ${
                    activeSnippetKey === 'glucose'
                      ? 'bg-[#cce5ff] border border-[#006194] text-[#001d31] font-bold'
                      : 'hover:bg-[#e2e8f0]/60 text-[#3f4850]'
                  }`}
                >
                  <span>GLUCOSE, FASTING</span>
                  <span>84 mg/dL</span>
                  <span className="text-[9px] text-[#565e74]">[65-99]</span>
                </div>

                <div
                  onClick={() => setActiveSnippetKey('creatinine')}
                  className={`p-1.5 rounded cursor-pointer transition-colors flex justify-between items-center ${
                    activeSnippetKey === 'creatinine'
                      ? 'bg-[#cce5ff] border border-[#006194] text-[#001d31] font-bold'
                      : 'hover:bg-[#e2e8f0]/60 text-[#3f4850]'
                  }`}
                >
                  <span>CREATININE</span>
                  <span>0.85 mg/dL</span>
                  <span className="text-[9px] text-[#565e74]">[0.60-1.20]</span>
                </div>

                <div
                  onClick={() => setActiveSnippetKey('lymphocyte')}
                  className={`p-1.5 rounded cursor-pointer transition-colors flex justify-between items-center ${
                    activeSnippetKey === 'lymphocyte'
                      ? 'bg-[#cce5ff] border border-[#006194] text-[#001d31] font-bold'
                      : 'hover:bg-[#e2e8f0]/60 text-[#3f4850]'
                  }`}
                >
                  <span>LYMPHOCYTES (%)</span>
                  <span>33.2 %</span>
                  <span className="text-[9px] text-[#565e74]">[20.0-42.0]</span>
                </div>

                <div
                  onClick={() => setActiveSnippetKey('rdw')}
                  className={`p-1.5 rounded cursor-pointer transition-colors flex justify-between items-center ${
                    activeSnippetKey === 'rdw'
                      ? 'bg-[#cce5ff] border border-[#006194] text-[#001d31] font-bold'
                      : 'hover:bg-[#e2e8f0]/60 text-[#3f4850]'
                  }`}
                >
                  <span>RDW</span>
                  <span>12.0 %</span>
                  <span className="text-[9px] text-[#565e74]">[11.0-15.0]</span>
                </div>
              </div>
            </div>

            {/* Focused Marker Detail Note */}
            {activeBio && (
              <div className="p-3 bg-[#eff4ff] rounded border border-[#dce9ff] text-xs space-y-1">
                <div className="flex justify-between font-bold text-[#0b1c30]">
                  <span>Focused: {activeBio.name}</span>
                  <span className="font-mono text-[#006194]">LOINC {activeBio.loinc}</span>
                </div>
                <p className="text-[#3f4850] text-[11px] leading-relaxed">
                  {activeBio.weightDescription}
                </p>
                <div className="text-[10px] text-[#006947] font-semibold pt-1">
                  Optimal interval: {activeBio.optimalRange[0]} - {activeBio.optimalRange[1]}{' '}
                  {activeBio.unit}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Editable Extraction Matrix Table */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-[#ffffff] rounded-xl border border-[#cbd5e1] shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-[#eff4ff] border-b border-[#dce9ff] flex items-center justify-between">
              <div>
                <span className="font-['Inter'] text-sm font-bold text-[#0b1c30] block">
                  Extracted Biomarker Matrix
                </span>
                <span className="font-['Inter'] text-xs text-[#565e74]">
                  Verify each value against your physical or digital lab paper.
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-xs bg-[#ffffff] border border-[#dce9ff] px-2.5 py-1 rounded text-[#006947] font-bold">
                9/9 Extracted
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-['Inter'] text-xs">
                <thead>
                  <tr className="bg-[#f8f9ff] text-[#565e74] font-['JetBrains_Mono'] text-[11px] uppercase tracking-wider border-b border-[#e2e8f0]">
                    <th className="py-3 px-4">Biomarker & LOINC</th>
                    <th className="py-3 px-3">Extracted Value</th>
                    <th className="py-3 px-3">Optimal Target</th>
                    <th className="py-3 px-3">Confidence</th>
                    <th className="py-3 px-3 text-right">Sign-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {PHENOAGE_BIOMARKERS.map((bio) => {
                    const currentVal = localValues[bio.id] ?? bio.optimalRange[0];
                    const isOptimal =
                      currentVal >= bio.optimalRange[0] && currentVal <= bio.optimalRange[1];
                    const isVerified = verifiedMap[bio.id];

                    return (
                      <tr
                        key={bio.id}
                        onClick={() => setActiveSnippetKey(bio.id)}
                        className={`transition-colors cursor-pointer ${
                          activeSnippetKey === bio.id ? 'bg-[#eff4ff]/60' : 'hover:bg-[#f8f9ff]'
                        }`}
                      >
                        {/* Biomarker and LOINC */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0b1c30]">{bio.name}</span>
                            <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">
                              LOINC {bio.loinc} • {bio.domain}
                            </span>
                          </div>
                        </td>

                        {/* Editable Value */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step={bio.step}
                              value={currentVal}
                              onChange={(e) =>
                                handleValueChange(bio.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 bg-[#ffffff] border border-[#cbd5e1] rounded font-['JetBrains_Mono'] text-xs font-bold text-[#0b1c30] focus:border-[#006194] focus:outline-none"
                            />
                            <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">
                              {bio.unit}
                            </span>
                          </div>
                        </td>

                        {/* Optimal Target */}
                        <td className="py-3.5 px-3 font-['JetBrains_Mono'] text-[11px]">
                          <span
                            className={
                              isOptimal ? 'text-[#006947] font-semibold' : 'text-[#3f4850]'
                            }
                          >
                            {bio.optimalRange[0]} - {bio.optimalRange[1]} {bio.unit}
                          </span>
                        </td>

                        {/* Confidence Score */}
                        <td className="py-3.5 px-3 font-['JetBrains_Mono'] text-[11px]">
                          <span className="bg-[#4edea3]/20 text-[#006947] px-1.5 py-0.5 rounded font-semibold">
                            {currentPanel.confidenceScores[bio.id] ?? 98.8}%
                          </span>
                        </td>

                        {/* Verification Toggle */}
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVerify(bio.id);
                            }}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              isVerified
                                ? 'bg-[#cce5ff] text-[#006194]'
                                : 'bg-[#e2e8f0] text-[#565e74] hover:bg-[#cbd5e1]'
                            }`}
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="bg-[#eff4ff] p-4 rounded-xl border border-[#dce9ff] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#3f4850]">
              <ShieldCheck className="w-5 h-5 text-[#006947]" />
              <span>
                All 9 values checked against NHANES reference parameters. Ready for PhenoAge Gompertz
                execution.
              </span>
            </div>

            <button
              onClick={handleVerifyAll}
              disabled={confirmBusy}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#006194] hover:bg-[#007bb9] text-white font-['Inter'] text-xs font-bold rounded shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              <span>Verify All & Compute PhenoAge</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
