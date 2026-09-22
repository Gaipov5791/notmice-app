import React, { useEffect, useState } from 'react';
import { TabType } from '../../types';
import {
  DatasetRequestError,
  downloadPublicDatasetExport,
  fetchPublicDataset,
  fetchPublicTimeseries,
  PublicDatasetPage,
  PublicExportKind,
  PublicTimeseries,
} from '../../api/dataset';
import {
  Download,
  Share2,
  Trash2,
  Lock,
  FileCode,
  EyeOff,
  FlaskConical,
} from 'lucide-react';

interface DataSovereigntyTabProps {
  accountAddress: string;
  isAuthenticated: boolean;
  isPublic: boolean;
  onTogglePublic: (isPublic: boolean) => void;
  onPurgeMemory: () => void;
  onOpenSeedPhrase: () => void;
  setActiveTab: (tab: TabType) => void;
}

export const DataSovereigntyTab: React.FC<DataSovereigntyTabProps> = ({
  accountAddress,
  isAuthenticated,
  isPublic,
  onTogglePublic,
  onPurgeMemory,
  onOpenSeedPhrase,
  setActiveTab,
}) => {
  const [exportKind, setExportKind] = useState<PublicExportKind | null>(null);
  const [exportSuccess, setExportSuccess] = useState<PublicExportKind | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [datasetReload, setDatasetReload] = useState(0);
  const [datasetPage, setDatasetPage] = useState<PublicDatasetPage | null>(null);
  const [datasetError, setDatasetError] = useState<string | null>(null);
  const [datasetLoading, setDatasetLoading] = useState(true);
  const [series, setSeries] = useState<PublicTimeseries | null>(null);
  const [seriesNote, setSeriesNote] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setDatasetLoading(true);
    setDatasetError(null);
    void fetchPublicDataset({ limit: 20, signal: controller.signal })
      .then((page) => {
        setDatasetPage(page);
        setDatasetLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setDatasetPage(null);
        setDatasetError(
          err instanceof DatasetRequestError
            ? `Public dataset request failed (${err.status}).`
            : 'Public dataset API did not respond.',
        );
        setDatasetLoading(false);
      });
    return () => controller.abort();
  }, [datasetReload, isPublic]);

  useEffect(() => {
    if (!isPublic || accountAddress === 'Guest') {
      setSeries(null);
      setSeriesNote(null);
      return;
    }
    const controller = new AbortController();
    setSeriesNote('Loading this profile from the public API…');
    void fetchPublicTimeseries(accountAddress, controller.signal)
      .then((payload) => {
        setSeries(payload);
        setSeriesNote(
          payload.points.length === 0
            ? 'No confirmed biomarker rows are public for this profile yet.'
            : null,
        );
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setSeries(null);
        setSeriesNote(
          err instanceof DatasetRequestError && err.status === 404
            ? 'This profile is not in the public dataset.'
            : 'Could not load this profile from the public API.',
        );
      });
    return () => controller.abort();
  }, [accountAddress, isPublic, datasetReload]);

  const downloadExport = (kind: PublicExportKind) => {
    setExportError(null);
    setExportKind(kind);
    void downloadPublicDatasetExport(kind)
      .then(() => {
        setExportSuccess(kind);
        setExportKind(null);
        window.setTimeout(() => {
          setExportSuccess((current) => (current === kind ? null : current));
        }, 3000);
      })
      .catch((err: unknown) => {
        setExportKind(null);
        setExportSuccess(null);
        setExportError(
          err instanceof DatasetRequestError
            ? `Export failed (${err.status}).`
            : 'The public dataset export did not respond.',
        );
      });
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
                Public dataset export
              </span>
              <span className="font-['JetBrains_Mono'] text-xs bg-[#eff4ff] text-[#006194] px-2 py-0.5 rounded font-semibold">
                CC0-1.0
              </span>
            </div>

            <p className="font-['Inter'] text-xs text-[#565e74] leading-relaxed">
              CSV, Parquet, and the datasheet are built on the server from opted-in rows in Postgres.
              Names, dates of birth, and internal ids are not in these files.
            </p>

            {exportError && (
              <p className="text-xs text-[#ba1a1a]" role="alert">
                {exportError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => downloadExport('csv')}
                disabled={exportKind !== null}
                className="p-4 rounded-lg border border-[#e2e8f0] hover:border-[#006194] hover:bg-[#eff4ff] transition-all flex flex-col gap-1 text-left cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['Inter'] text-xs font-bold text-[#0b1c30] group-hover:text-[#006194]">
                    CSV
                  </span>
                  <Download className="w-4 h-4 text-[#006947]" />
                </div>
                <span className="text-[11px] text-[#565e74]">
                  One row per confirmed analyte.
                </span>
                <span className="text-[10px] text-[#006947] font-semibold mt-2">
                  {exportSuccess === 'csv' ? 'Downloaded!' : 'Download .csv'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => downloadExport('parquet')}
                disabled={exportKind !== null}
                className="p-4 rounded-lg border border-[#e2e8f0] hover:border-[#006194] hover:bg-[#eff4ff] transition-all flex flex-col gap-1 text-left cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['Inter'] text-xs font-bold text-[#0b1c30] group-hover:text-[#006194]">
                    Parquet
                  </span>
                  <Download className="w-4 h-4 text-[#006947]" />
                </div>
                <span className="text-[11px] text-[#565e74]">
                  Columnar file for R and Python.
                </span>
                <span className="text-[10px] text-[#006947] font-semibold mt-2">
                  {exportSuccess === 'parquet' ? 'Downloaded!' : 'Download .parquet'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => downloadExport('datasheet')}
                disabled={exportKind !== null}
                className="p-4 rounded-lg border border-[#e2e8f0] hover:border-[#006194] hover:bg-[#eff4ff] transition-all flex flex-col gap-1 text-left cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['Inter'] text-xs font-bold text-[#0b1c30] group-hover:text-[#006194]">
                    Datasheet
                  </span>
                  <FileCode className="w-4 h-4 text-[#006194]" />
                </div>
                <span className="text-[11px] text-[#565e74]">
                  Composition, license, and limits.
                </span>
                <span className="text-[10px] text-[#006947] font-semibold mt-2">
                  {exportSuccess === 'datasheet' ? 'Downloaded!' : 'Download .md'}
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
                Open account
              </button>
            </div>
            <p className="text-xs text-[#565e74] leading-relaxed">
              Sign in with your 12-word BIP-39 recovery phrase. The server stores only an argon2id
              hash of the phrase, never email, phone, or the words themselves.
            </p>
            <div className="flex items-center justify-between p-2.5 bg-[#f8f9ff] rounded border border-[#e2e8f0] font-['JetBrains_Mono'] text-xs text-[#565e74]">
              <span>Active ID: {accountAddress}</span>
              <span className="text-[#006947] font-semibold">
                {isAuthenticated ? 'Authenticated' : 'Guest'}
              </span>
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
                  {isAuthenticated
                    ? 'Write confirmed biomarker rows to the public dataset when you opt in'
                    : 'Sign in first, then opt in to the public dataset'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => onTogglePublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#cbd5e1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#cbd5e1] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00855b]"></div>
              </label>
            </div>

            {/* IPFS Hash Preview */}
            {isPublic && (
              <div className="p-3 bg-[#f8f9ff] rounded border border-[#dce9ff] flex flex-col gap-1.5 text-xs animate-in fade-in">
                <span className="font-['JetBrains_Mono'] text-[#006947] font-semibold">
                  Public sharing is on
                </span>
                <p className="text-[11px] text-[#565e74] leading-relaxed">
                  Confirmed biomarker rows for this account are included in the read-only public
                  dataset. Original lab files are never stored.
                </p>
                {seriesNote && <p className="text-[11px] text-[#0b1c30]">{seriesNote}</p>}
                {series && series.points.length > 0 && (
                  <p className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">
                    {series.points.length} collection {series.points.length === 1 ? 'date' : 'dates'}{' '}
                    on {series.publicId}
                  </p>
                )}
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

      <div className="bg-[#ffffff] p-6 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-['Inter'] text-base font-bold text-[#0b1c30]">
            Public dataset
          </span>
          <button
            type="button"
            onClick={() => setDatasetReload((value) => value + 1)}
            className="font-['Inter'] text-xs font-semibold text-[#006194] hover:underline cursor-pointer"
          >
            Reload
          </button>
        </div>
        <p className="font-['Inter'] text-xs text-[#565e74] leading-relaxed">
          Live read from GET /api/v1/dataset. The CSV, Parquet, and datasheet above are the same
          opted-in rows. Names, dates of birth, and internal ids are not in this response.
        </p>
        {datasetLoading && (
          <p className="text-xs text-[#565e74]">Loading the public dataset…</p>
        )}
        {datasetError && (
          <p className="text-xs text-[#ba1a1a]" role="alert">
            {datasetError}
          </p>
        )}
        {datasetPage && !datasetLoading && datasetPage.total === 0 && (
          <p className="text-xs text-[#565e74]">The public dataset has no confirmed rows yet.</p>
        )}
        {datasetPage && !datasetLoading && datasetPage.rows.length > 0 && (
          <div className="overflow-x-auto">
            <p className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] mb-2">
              Showing {datasetPage.rows.length} of {datasetPage.total}
            </p>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="font-['Inter'] text-[#565e74] border-b border-[#e2e8f0]">
                  <th className="py-2 pr-3 font-semibold">Public id</th>
                  <th className="py-2 pr-3 font-semibold">Collected</th>
                  <th className="py-2 pr-3 font-semibold">LOINC</th>
                  <th className="py-2 pr-3 font-semibold">Marker</th>
                  <th className="py-2 pr-3 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {datasetPage.rows.map((row, index) => (
                  <tr
                    key={`${row.publicId}-${row.loincCode ?? row.rawName}-${row.collectedAt ?? 'na'}-${index}`}
                    className="border-b border-[#f1f5f9] font-['JetBrains_Mono'] text-[#0b1c30]"
                  >
                    <td className="py-2 pr-3">{row.publicId}</td>
                    <td className="py-2 pr-3">{row.collectedAt ?? '—'}</td>
                    <td className="py-2 pr-3">{row.loincCode ?? '—'}</td>
                    <td className="py-2 pr-3">{row.canonicalName ?? row.rawName}</td>
                    <td className="py-2 pr-3">
                      {row.value} {row.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
