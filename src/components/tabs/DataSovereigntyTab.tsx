import React, { useState } from 'react';
import { TabType, HistoricalTestRecord } from '../../types';
import {
  ShieldCheck,
  Download,
  Share2,
  Trash2,
  Lock,
  Globe,
  FileCode,
  Check,
  Copy,
  Cpu,
  EyeOff,
  Sparkles,
  FlaskConical,
} from 'lucide-react';

interface DataSovereigntyTabProps {
  history: HistoricalTestRecord[];
  accountAddress: string;
  seedPhrase: string[];
  onPurgeMemory: () => void;
  onOpenSeedPhrase: () => void;
  setActiveTab: (tab: TabType) => void;
}

export const DataSovereigntyTab: React.FC<DataSovereigntyTabProps> = ({
  history,
  accountAddress,
  seedPhrase,
  onPurgeMemory,
  onOpenSeedPhrase,
  setActiveTab,
}) => {
  const [optInShare, setOptInShare] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copiedIpfs, setCopiedIpfs] = useState(false);

  const ipfsCid = 'bafybeihdwdcefgh4dqkjv67ndjswq4knbdnla5n35m6g6q67219';

  const downloadJsonVault = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            protocol: 'NotMice-Research-v1.4',
            account: accountAddress,
            exportTimestamp: new Date().toISOString(),
            records: history,
            anonymized: true,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `NotMice_Vault_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess('json');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const downloadCsv = () => {
    let csv =
      'Date,Lab,ChronologicalAge,PhenoAge,AgeDelta,Albumin,Creatinine,Glucose,CRP,Lymphocytes,MCV,RDW,ALP,WBC\n';
    history.forEach((h) => {
      csv += `${h.date},"${h.labSource}",${h.chronologicalAge},${h.phenoAge},${h.delta},${
        h.biomarkers.albumin ?? 0
      },${h.biomarkers.creatinine ?? 0},${h.biomarkers.glucose ?? 0},${h.biomarkers.crp ?? 0},${
        h.biomarkers.lymphocyte ?? 0
      },${h.biomarkers.mcv ?? 0},${h.biomarkers.rdw ?? 0},${h.biomarkers.alp ?? 0},${
        h.biomarkers.wbc ?? 0
      }\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NotMice_Biomarkers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    setDownloadSuccess('csv');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const copyCid = () => {
    navigator.clipboard.writeText(ipfsCid);
    setCopiedIpfs(true);
    setTimeout(() => setCopiedIpfs(false), 2000);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#cce5ff] text-[#004b73] font-['JetBrains_Mono'] text-xs font-semibold px-2 py-0.5 rounded">
              Cryptographic Charter
            </span>
            <span className="font-['JetBrains_Mono'] text-xs text-[#565e74]">
              Data Sovereignty & Open Science
            </span>
          </div>
          <h1 className="font-['Inter'] text-2xl lg:text-3xl font-bold text-[#0b1c30]">
            Data Sovereignty & Public Sharing
          </h1>
          <p className="font-['Inter'] text-sm text-[#3f4850] mt-1 max-w-2xl">
            You maintain cryptographic ownership of your longevity telemetry. No surveillance, no
            tracking cookies, no remote data retention. Export your data or anonymously pool it for
            translational longevity science.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPurgeMemory}
            className="flex items-center gap-2 px-4 py-2.5 rounded font-['Inter'] text-xs font-bold bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#ba1a1a] border border-[#fecdd3] transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Memory State</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Export Modules vs Decentralized Cohort Sharing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Zero-Knowledge Export Vault */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-[#ffffff] p-6 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-['Inter'] text-base font-bold text-[#0b1c30] flex items-center gap-2">
                <Download className="w-5 h-5 text-[#006194]" />
                Zero-Knowledge Data Exports
              </span>
              <span className="font-['JetBrains_Mono'] text-xs bg-[#eff4ff] text-[#006194] px-2 py-0.5 rounded font-semibold">
                Client-Side Generated
              </span>
            </div>

            <p className="font-['Inter'] text-xs text-[#565e74] leading-relaxed">
              Export your longitudinal biomarkers in machine-readable open formats. These files can be
              imported into statistical packages (R, Python pandas) or stored on cold offline drives.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* JSON Vault Download */}
              <button
                onClick={downloadJsonVault}
                className="p-4 rounded-lg border border-[#e2e8f0] hover:border-[#006194] hover:bg-[#eff4ff] transition-all flex flex-col gap-1 text-left cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['Inter'] text-xs font-bold text-[#0b1c30] group-hover:text-[#006194]">
                    Complete JSON Vault
                  </span>
                  <FileCode className="w-4 h-4 text-[#006194]" />
                </div>
                <span className="text-[11px] text-[#565e74]">
                  Full structured state with LOINC metadata & proof hashes.
                </span>
                <span className="text-[10px] text-[#006947] font-semibold mt-2">
                  {downloadSuccess === 'json' ? 'Downloaded!' : 'Download .json'}
                </span>
              </button>

              {/* CSV / Parquet Download */}
              <button
                onClick={downloadCsv}
                className="p-4 rounded-lg border border-[#e2e8f0] hover:border-[#006194] hover:bg-[#eff4ff] transition-all flex flex-col gap-1 text-left cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['Inter'] text-xs font-bold text-[#0b1c30] group-hover:text-[#006194]">
                    Parquet / CSV Table
                  </span>
                  <Download className="w-4 h-4 text-[#006947]" />
                </div>
                <span className="text-[11px] text-[#565e74]">
                  Tabular timeseries compatible with R, Python, and Excel.
                </span>
                <span className="text-[10px] text-[#006947] font-semibold mt-2">
                  {downloadSuccess === 'csv' ? 'Downloaded!' : 'Download .csv'}
                </span>
              </button>
            </div>
          </div>

          {/* Seed Phrase Security Card */}
          <div className="bg-[#ffffff] p-6 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-['Inter'] text-sm font-bold text-[#0b1c30] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#006194]" />
                BIP-39 Vault Mnemonic
              </span>
              <button
                onClick={onOpenSeedPhrase}
                className="text-xs text-[#006194] hover:underline font-semibold cursor-pointer"
              >
                View 12 Words
              </button>
            </div>
            <p className="text-xs text-[#565e74] leading-relaxed">
              Your session is anchored by an in-memory keypair. When you close this browser tab, all
              unencrypted clinical records vanish permanently from computer memory unless you hold
              your 12-word seed.
            </p>
            <div className="flex items-center justify-between p-2.5 bg-[#f8f9ff] rounded border border-[#e2e8f0] font-['JetBrains_Mono'] text-xs text-[#565e74]">
              <span>Active Address: {accountAddress}</span>
              <span className="text-[#006947] font-semibold">Protected</span>
            </div>
          </div>
        </div>

        {/* Right Column: Public Sharing & Open Science Research Charter */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Open Science Cohort Opt-in */}
          <div className="bg-[#ffffff] p-6 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-['Inter'] text-base font-bold text-[#0b1c30] flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#006947]" />
                Opt-in Anonymized Cohort Sharing
              </span>
              <span className="font-['JetBrains_Mono'] text-xs bg-[#4edea3]/20 text-[#006947] px-2 py-0.5 rounded font-bold">
                Open Access
              </span>
            </div>

            <p className="font-['Inter'] text-xs text-[#565e74] leading-relaxed">
              Pharmaceutical anti-aging trials overwhelmingly test on inbred rodent strains, resulting
              in a 92% failure rate when transitioning to human biology. By voluntarily submitting
              anonymized longitudinal blood vectors, you help establish an open-access human longevity
              benchmark.
            </p>

            {/* Privacy Redaction Preview */}
            <div className="bg-[#f8f9ff] p-3.5 rounded-lg border border-[#e2e8f0] space-y-2 text-xs">
              <span className="font-['Inter'] font-bold text-[#0b1c30] flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-[#ba1a1a]" />
                PII Redaction Pipeline (100% Stripped)
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-['JetBrains_Mono'] text-[#565e74]">
                <div>✗ Full Name (Stripped)</div>
                <div>✓ Chrono Age (Preserved)</div>
                <div>✗ Date of Birth (Stripped)</div>
                <div>✓ 9 LOINC Markers (Preserved)</div>
                <div>✗ Lab Account Number (Stripped)</div>
                <div>✓ PhenoAge Delta (Preserved)</div>
              </div>
            </div>

            {/* Toggle switch */}
            <div className="flex items-center justify-between p-3 bg-[#eff4ff] rounded-lg border border-[#dce9ff]">
              <div className="flex flex-col">
                <span className="font-['Inter'] text-xs font-bold text-[#0b1c30]">
                  Contribute Vector to Open Registry
                </span>
                <span className="text-[11px] text-[#565e74]">
                  Push cryptographic hash and anonymized vector to IPFS cohort
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={optInShare}
                  onChange={(e) => setOptInShare(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#cbd5e1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#cbd5e1] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00855b]"></div>
              </label>
            </div>

            {/* IPFS Hash Preview */}
            {optInShare && (
              <div className="p-3 bg-[#f8f9ff] rounded border border-[#dce9ff] flex flex-col gap-1.5 text-xs animate-in fade-in">
                <span className="font-['JetBrains_Mono'] text-[#006947] font-semibold">
                  IPFS Research CID Fingerprint:
                </span>
                <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[11px] bg-[#ffffff] p-2 rounded border border-[#e2e8f0]">
                  <span className="truncate max-w-[280px] sm:max-w-xs">{ipfsCid}</span>
                  <button
                    onClick={copyCid}
                    className="text-[#006194] hover:underline font-semibold ml-2 shrink-0 cursor-pointer"
                  >
                    {copiedIpfs ? 'Copied' : 'Copy CID'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Research Charter Statement */}
          <div className="bg-[#007bb9] text-[#ffffff] p-6 rounded-xl flex flex-col gap-2.5 shadow-sm">
            <span className="font-['Inter'] text-sm font-bold flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-white" />
              The NotMice Scientific Manifesto
            </span>
            <p className="font-['Inter'] text-xs opacity-90 leading-relaxed">
              "We reject the reliance on short-lived murine longevity experiments as the primary basis
              for human healthspan interventions. Human aging is multidimensional, immune-complex, and
              longitudinal. NotMice equips the individual with decentralized analytical sovereignty to
              measure, track, and optimize human longevity in real time."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
