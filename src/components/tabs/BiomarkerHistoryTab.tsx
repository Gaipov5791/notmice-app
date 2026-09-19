import React, { useState } from 'react';
import { TabType, HistoricalTestRecord } from '../../types';
import { PHENOAGE_BIOMARKERS } from '../../data/phenoAgeData';
import {
  Calendar,
  TrendingDown,
  Plus,
  Trash2,
  ExternalLink,
  LineChart as LineChartIcon,
  Activity,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface BiomarkerHistoryTabProps {
  history: HistoricalTestRecord[];
  onAddHistory: (record: HistoricalTestRecord) => void;
  onDeleteHistory: (id: string) => void;
  onSelectRecord: (record: HistoricalTestRecord) => void;
  setActiveTab: (tab: TabType) => void;
}

export const BiomarkerHistoryTab: React.FC<BiomarkerHistoryTabProps> = ({
  history,
  onAddHistory,
  onDeleteHistory,
  onSelectRecord,
  setActiveTab,
}) => {
  const [selectedBiomarker, setSelectedBiomarker] = useState<string>('crp');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDate, setNewDate] = useState('2025-11-20');
  const [newChronoAge, setNewChronoAge] = useState(42.5);
  const [newLabSource, setNewLabSource] = useState('Quest Diagnostics');

  const activeBioDef = PHENOAGE_BIOMARKERS.find((b) => b.id === selectedBiomarker);

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };

  // Calculate points for Biological Age vs Chrono Age chart
  const minAge = Math.min(...history.map((h) => Math.min(h.chronologicalAge, h.phenoAge))) - 1;
  const maxAge = Math.max(...history.map((h) => Math.max(h.chronologicalAge, h.phenoAge))) + 1;

  const getX = (index: number) => {
    if (history.length <= 1) return padding.left;
    return (
      padding.left +
      (index / (history.length - 1)) * (chartWidth - padding.left - padding.right)
    );
  };

  const getY = (val: number) => {
    const range = maxAge - minAge || 1;
    return (
      chartHeight -
      padding.bottom -
      ((val - minAge) / range) * (chartHeight - padding.top - padding.bottom)
    );
  };

  // Biomarker specific chart calculations
  const bioValues = history.map((h) => h.biomarkers[selectedBiomarker] ?? 0);
  const minBio = Math.min(...bioValues) * 0.85;
  const maxBio = Math.max(...bioValues) * 1.15 || 1;
  const getBioY = (val: number) => {
    const range = maxBio - minBio || 1;
    return (
      chartHeight -
      padding.bottom -
      ((val - minBio) / range) * (chartHeight - padding.top - padding.bottom)
    );
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    const latest = history[history.length - 1];
    const newRecord: HistoricalTestRecord = {
      id: `hist-${Date.now()}`,
      date: newDate,
      chronologicalAge: newChronoAge,
      phenoAge: Math.round((newChronoAge - 5.0) * 10) / 10,
      delta: -5.0,
      labSource: newLabSource,
      biomarkers: { ...latest.biomarkers, crp: 0.72, albumin: 47.0 },
      hash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random()
        .toString(16)
        .slice(2, 6)}`,
    };
    onAddHistory(newRecord);
    setShowAddModal(false);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#cce5ff] text-[#004b73] font-['JetBrains_Mono'] text-xs font-semibold px-2 py-0.5 rounded">
              Longitudinal Protocol
            </span>
            <span className="font-['JetBrains_Mono'] text-xs text-[#565e74]">
              Multi-Year PhenoAge Trajectory
            </span>
          </div>
          <h1 className="font-['Inter'] text-2xl lg:text-3xl font-bold text-[#0b1c30]">
            Biomarker & PhenoAge History
          </h1>
          <p className="font-['Inter'] text-sm text-[#3f4850] mt-1 max-w-2xl">
            Track biological deceleration across repeated laboratory test dates. Observe how lifestyle,
            dietary, or pharmacological longevity protocols alter your trajectory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded font-['Inter'] text-xs font-bold bg-[#006194] hover:bg-[#007bb9] text-[#ffffff] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Test Date</span>
          </button>
        </div>
      </div>

      {/* Dual Charts: PhenoAge Divergence Chart + Biomarker Specific Track */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Chart: Biological vs Chronological Trajectory */}
        <div className="lg:col-span-7 bg-[#ffffff] p-6 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-['Inter'] text-sm font-bold text-[#0b1c30] block">
                Longevity Vector: Biological vs Chronological Age
              </span>
              <span className="font-['Inter'] text-xs text-[#565e74]">
                Widening green gap represents growing biological youthfulness.
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-['JetBrains_Mono']">
              <span className="flex items-center gap-1.5 text-[#0b1c30]">
                <span className="w-3 h-0.5 bg-[#565e74] inline-block"></span> Chrono Age
              </span>
              <span className="flex items-center gap-1.5 text-[#006947] font-bold">
                <span className="w-3 h-0.5 bg-[#006947] inline-block"></span> PhenoAge
              </span>
            </div>
          </div>

          {/* SVG Chart Container */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[500px]"
            >
              {/* Grid lines */}
              {[minAge, (minAge + maxAge) / 2, maxAge].map((tick, i) => {
                const y = getY(tick);
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94a3b8"
                      fontFamily="JetBrains Mono"
                    >
                      {tick.toFixed(0)}y
                    </text>
                  </g>
                );
              })}

              {/* Chronological Age Line (Dashed) */}
              <polyline
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="5 5"
                points={history.map((h, i) => `${getX(i)},${getY(h.chronologicalAge)}`).join(' ')}
              />

              {/* Biological PhenoAge Line (Solid Green) */}
              <polyline
                fill="none"
                stroke="#006947"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={history.map((h, i) => `${getX(i)},${getY(h.phenoAge)}`).join(' ')}
              />

              {/* Points and Labels */}
              {history.map((h, i) => {
                const cx = getX(i);
                const cyBio = getY(h.phenoAge);
                const cyChrono = getY(h.chronologicalAge);
                return (
                  <g key={h.id}>
                    {/* Date label */}
                    <text
                      x={cx}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#565e74"
                      fontFamily="JetBrains Mono"
                    >
                      {h.date.slice(0, 7)}
                    </text>

                    {/* Chrono dot */}
                    <circle cx={cx} cy={cyChrono} r="4" fill="#565e74" />

                    {/* Bio dot */}
                    <circle cx={cx} cy={cyBio} r="6" fill="#006947" stroke="#ffffff" strokeWidth="2" />

                    {/* Delta label above dot */}
                    <text
                      x={cx}
                      y={cyBio - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#006947"
                      fontFamily="JetBrains Mono"
                    >
                      {h.delta}y
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Individual Biomarker Trend Track */}
        <div className="lg:col-span-5 bg-[#ffffff] p-6 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-['Inter'] text-sm font-bold text-[#0b1c30]">
              Biomarker Specific Trajectory
            </span>
            <select
              value={selectedBiomarker}
              onChange={(e) => setSelectedBiomarker(e.target.value)}
              className="px-2.5 py-1 bg-[#eff4ff] border border-[#cbd5e1] rounded text-xs font-['JetBrains_Mono'] text-[#0b1c30] focus:outline-none cursor-pointer"
            >
              {PHENOAGE_BIOMARKERS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.unit})
                </option>
              ))}
            </select>
          </div>

          {activeBioDef && (
            <div className="text-xs text-[#565e74] flex justify-between bg-[#f8f9ff] p-2.5 rounded border border-[#e2e8f0] font-['JetBrains_Mono']">
              <span>LOINC: {activeBioDef.loinc}</span>
              <span className="text-[#006947] font-semibold">
                Target: {activeBioDef.optimalRange[0]} - {activeBioDef.optimalRange[1]}{' '}
                {activeBioDef.unit}
              </span>
            </div>
          )}

          {/* SVG for Specific Biomarker */}
          <div className="w-full">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
              {/* Line */}
              <polyline
                fill="none"
                stroke="#006194"
                strokeWidth="3"
                points={history
                  .map((h, i) => `${getX(i)},${getBioY(h.biomarkers[selectedBiomarker] ?? 0)}`)
                  .join(' ')}
              />
              {/* Nodes */}
              {history.map((h, i) => {
                const val = h.biomarkers[selectedBiomarker] ?? 0;
                const cx = getX(i);
                const cy = getBioY(val);
                return (
                  <g key={h.id}>
                    <circle cx={cx} cy={cy} r="5" fill="#006194" stroke="#ffffff" strokeWidth="2" />
                    <text
                      x={cx}
                      y={cy - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#006194"
                      fontFamily="JetBrains Mono"
                    >
                      {val.toFixed(1)}
                    </text>
                    <text
                      x={cx}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#565e74"
                      fontFamily="JetBrains Mono"
                    >
                      {h.date.slice(0, 7)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Historical Records Table */}
      <div className="bg-[#ffffff] rounded-xl border border-[#cbd5e1] shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-[#eff4ff] border-b border-[#dce9ff] flex items-center justify-between">
          <span className="font-['Inter'] text-sm font-bold text-[#0b1c30]">
            Longitudinal Testing Registry ({history.length} Panels Logged)
          </span>
          <span className="font-['JetBrains_Mono'] text-xs text-[#006947] font-semibold">
            In-Memory Vault
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-['Inter'] text-xs">
            <thead>
              <tr className="bg-[#f8f9ff] text-[#565e74] font-['JetBrains_Mono'] text-[11px] uppercase tracking-wider border-b border-[#e2e8f0]">
                <th className="py-3 px-4">Test Date</th>
                <th className="py-3 px-3">Laboratory</th>
                <th className="py-3 px-3">Chrono Age</th>
                <th className="py-3 px-3">PhenoAge</th>
                <th className="py-3 px-3">Variance (Δ)</th>
                <th className="py-3 px-3">Audit Proof</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {history.map((record) => (
                <tr key={record.id} className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#0b1c30] flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#006194]" />
                    <span>{record.date}</span>
                  </td>
                  <td className="py-3.5 px-3 text-[#3f4850]">{record.labSource}</td>
                  <td className="py-3.5 px-3 font-['JetBrains_Mono'] text-[#565e74]">
                    {record.chronologicalAge.toFixed(1)}y
                  </td>
                  <td className="py-3.5 px-3 font-['JetBrains_Mono'] font-bold text-[#006194]">
                    {record.phenoAge.toFixed(1)}y
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`font-['JetBrains_Mono'] text-xs font-bold px-2 py-0.5 rounded ${
                        record.delta <= 0
                          ? 'bg-[#4edea3]/25 text-[#006947]'
                          : 'bg-[#ffdad6] text-[#ba1a1a]'
                      }`}
                    >
                      {record.delta > 0 ? `+${record.delta}` : record.delta} yrs
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-['JetBrains_Mono'] text-[#565e74]">
                    {record.hash}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          onSelectRecord(record);
                          setActiveTab('phenoage-engine');
                        }}
                        className="px-2.5 py-1 rounded bg-[#eff4ff] hover:bg-[#e5eeff] text-[#006194] font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Load Engine
                      </button>
                      {history.length > 1 && (
                        <button
                          onClick={() => onDeleteHistory(record.id)}
                          className="p-1 rounded text-[#ba1a1a] hover:bg-[#fff1f2] transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Date Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/50 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleAddNew}
            className="bg-[#ffffff] rounded-xl border border-[#cbd5e1] shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="font-['Inter'] text-lg font-bold text-[#0b1c30]">
              Log New Historical Test
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#565e74] font-medium mb-1">Blood Test Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded font-['JetBrains_Mono']"
                  required
                />
              </div>
              <div>
                <label className="block text-[#565e74] font-medium mb-1">
                  Chronological Age at Test
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newChronoAge}
                  onChange={(e) => setNewChronoAge(parseFloat(e.target.value) || 40)}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded font-['JetBrains_Mono']"
                  required
                />
              </div>
              <div>
                <label className="block text-[#565e74] font-medium mb-1">Laboratory Source</label>
                <input
                  type="text"
                  value={newLabSource}
                  onChange={(e) => setNewLabSource(e.target.value)}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded font-['Inter']"
                  placeholder="e.g. LabCorp, Quest, NHS"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-[#cbd5e1] rounded text-xs font-semibold text-[#565e74] hover:bg-[#eff4ff]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#006194] text-white rounded text-xs font-semibold hover:bg-[#007bb9]"
              >
                Add Test Panel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
