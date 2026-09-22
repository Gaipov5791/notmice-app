import React from 'react';
import { X, CheckCircle, ShieldCheck, Binary, Cpu, FileCheck } from 'lucide-react';

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  hash: string;
  biomarkers: Record<string, number>;
  phenoAge: number;
  chronologicalAge: number;
}

export const ProofModal: React.FC<ProofModalProps> = ({
  isOpen,
  onClose,
  biomarkers,
  phenoAge,
  chronologicalAge,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#ffffff] rounded-xl border border-[#cbd5e1] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#eff4ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#cce5ff] flex items-center justify-center text-[#006194]">
              <ShieldCheck className="w-5 h-5 text-[#006194]" />
            </div>
            <div>
              <h3 className="font-['Inter'] text-base font-bold text-[#0b1c30]">
                PhenoAge research index
              </h3>
              <p className="font-['JetBrains_Mono'] text-xs text-[#565e74]">
                Levine et al., Aging 2018. Not a medical service.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#565e74] hover:bg-[#e2e8f0] hover:text-[#0b1c30] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Status banner */}
          <div className="bg-[#eff4ff] border border-[#bbf7d0] p-3.5 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#006947] shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold text-[#0b1c30] block">
                Calculated from the numbers on this screen
              </span>
              <span className="text-[#3f4850] text-xs leading-relaxed">
                The score uses the Levine 2018 formula on the server. It is a research index, not a
                diagnosis or a treatment recommendation.
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-['Inter'] text-xs font-semibold text-[#0b1c30] uppercase tracking-wider block">
              Method
            </label>
            <div className="bg-[#f8f9ff] border border-[#e2e8f0] p-3 rounded font-['JetBrains_Mono'] text-xs space-y-2 text-[#3f4850]">
              <div className="flex justify-between items-center gap-4">
                <span className="text-[#565e74]">Citation:</span>
                <span className="text-[#0b1c30] text-right">Aging (Albany NY) 2018; 10(4):573–591</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[#565e74]">Inputs:</span>
                <span className="text-[#0b1c30]">9 LOINC biomarkers and chronological age</span>
              </div>
            </div>
          </div>

          {/* Provenance Tree */}
          <div className="space-y-2">
            <label className="font-['Inter'] text-xs font-semibold text-[#0b1c30] uppercase tracking-wider block">
              Execution Trace Verification
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-[#f8f9ff] rounded border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 font-semibold text-[#0b1c30] mb-1">
                  <Binary className="w-4 h-4 text-[#006194]" />
                  <span>Input Vector</span>
                </div>
                <div className="text-[#565e74] space-y-0.5 font-mono text-[11px]">
                  <p>Chronological: {chronologicalAge.toFixed(1)} yrs</p>
                  <p>PhenoAge markers: 9</p>
                  <p>Albumin: {biomarkers['albumin'] ?? 46.0} g/L</p>
                  <p>hs-CRP: {biomarkers['crp'] ?? 0.8} mg/L</p>
                </div>
              </div>
              <div className="p-3 bg-[#f8f9ff] rounded border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 font-semibold text-[#0b1c30] mb-1">
                  <Cpu className="w-4 h-4 text-[#006947]" />
                  <span>Computed Hazard</span>
                </div>
                <div className="text-[#565e74] space-y-0.5 font-mono text-[11px]">
                  <p>Biological PhenoAge: {phenoAge.toFixed(1)} yrs</p>
                  <p>Age difference: {(phenoAge - chronologicalAge).toFixed(1)} yrs</p>
                  <p>Where: server, Levine 2018</p>
                  <p>Use: research index only</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#eff4ff] p-3 rounded text-xs text-[#3f4850] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#006194] shrink-0" />
            <span>
              The nine PhenoAge markers use the versioned LOINC dictionary shipped with the API.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8f9ff] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-['Inter'] text-sm font-semibold bg-[#006194] text-[#ffffff] hover:bg-[#007bb9] transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
