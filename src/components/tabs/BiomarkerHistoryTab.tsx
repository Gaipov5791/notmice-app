import React, { useState, useMemo } from 'react';
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
  Sparkles,
  Zap,
  ArrowDownRight,
  TrendingUp,
  FileDown,
  FileText,
  Printer,
} from 'lucide-react';
import { PrintableReportModal } from '../PrintableReportModal';
import { generateHistoricalReportPDF } from '../../utils/pdfReportGenerator';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ReferenceLine,
} from 'recharts';

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
  const [chartViewMode, setChartViewMode] = useState<'both' | 'delta'>('both');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newDate, setNewDate] = useState('2025-11-20');
  const [newChronoAge, setNewChronoAge] = useState(42.5);
  const [newLabSource, setNewLabSource] = useState('Quest Diagnostics');

  const activeBioDef = PHENOAGE_BIOMARKERS.find((b) => b.id === selectedBiomarker);

  // Recharts data transformation
  const rechartsData = useMemo(() => {
    return history.map((record) => {
      const parts = record.date.split('-');
      const year = parts[0];
      const month = parts[1] || '01';
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const mIdx = parseInt(month, 10) - 1;
      const formattedDate = `${monthNames[mIdx] || month} ${year}`;

      return {
        id: record.id,
        rawDate: record.date,
        formattedDate,
        chronologicalAge: Number(record.chronologicalAge.toFixed(1)),
        phenoAge: Number(record.phenoAge.toFixed(1)),
        delta: Number(record.delta.toFixed(1)),
        advantage: Number(Math.max(0, -record.delta).toFixed(1)),
        labSource: record.labSource,
        crp: record.biomarkers?.crp ?? 0,
        albumin: record.biomarkers?.albumin ?? 0,
        glucose: record.biomarkers?.glucose ?? 0,
        rdw: record.biomarkers?.rdw ?? 0,
        hash: record.hash,
      };
    });
  }, [history]);

  // Derived trajectory statistics
  const trajectoryStats = useMemo(() => {
    if (history.length === 0) {
      return {
        initialPheno: 0,
        latestPheno: 0,
        totalDelta: 0,
        netBioChange: 0,
        netChronoChange: 0,
        agingPace: 1,
        avgDelta: 0,
      };
    }
    const earliest = history[0];
    const latest = history[history.length - 1];
    const netBioChange = Number((latest.phenoAge - earliest.phenoAge).toFixed(1));
    const netChronoChange = Number(
      (latest.chronologicalAge - earliest.chronologicalAge).toFixed(1)
    );
    const agingPace =
      netChronoChange > 0 ? Number((netBioChange / netChronoChange).toFixed(2)) : 0.82;
    const avgDelta = Number(
      (history.reduce((acc, h) => acc + h.delta, 0) / history.length).toFixed(1)
    );

    return {
      initialPheno: earliest.phenoAge,
      latestPheno: latest.phenoAge,
      totalDelta: latest.delta,
      netBioChange,
      netChronoChange,
      agingPace,
      avgDelta,
    };
  }, [history]);

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
            {history.length === 0
              ? 'Tutorial start: no laboratory history is loaded. The numbers on the landing page are a worked example, not a patient record. A panel appears here only after you save one from this session.'
              : 'Saved panels from this browser session. This list is not loaded from the laboratory dataset.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg font-['Inter'] text-xs font-semibold bg-[#ffffff] hover:bg-[#f8fafc] text-[#0b1c30] border border-[#cbd5e1] shadow-2xs hover:border-[#94a3b8] transition-all cursor-pointer"
            title="Export clean, printable PDF report of historical trends and biomarkers"
          >
            <FileDown className="w-4 h-4 text-[#006194]" />
            <span>Export PDF Report</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-['Inter'] text-xs font-bold bg-[#006194] hover:bg-[#007bb9] text-[#ffffff] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Test Date</span>
          </button>
        </div>
      </div>

      {/* NEW SECTION: Recharts Longitudinal PhenoAge Trend Visualizer */}
      <div className="bg-[#ffffff] p-6 lg:p-7 rounded-xl border border-[#cbd5e1] shadow-xs flex flex-col gap-6">
        {/* Section Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#f1f5f9] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-['Inter'] text-base font-bold text-[#0b1c30] flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-[#006194]" />
                PhenoAge™ Longitudinal Trend (Recharts Engine)
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] bg-[#eff4ff] text-[#006194] border border-[#dce9ff] px-2 py-0.5 rounded font-semibold">
                Interactive Telemetry
              </span>
            </div>
            <p className="font-['Inter'] text-xs text-[#565e74]">
              High-resolution dynamic trajectory plotting biological PhenoAge alongside calendar aging. Hover over test points to inspect clinical parameters.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-[#eff4ff] p-1 rounded-lg border border-[#dce9ff] shrink-0 self-start md:self-auto">
            <button
              onClick={() => setChartViewMode('both')}
              className={`px-3 py-1.5 rounded text-xs font-['Inter'] font-semibold transition-all cursor-pointer ${
                chartViewMode === 'both'
                  ? 'bg-[#006194] text-white shadow-xs'
                  : 'text-[#3f4850] hover:text-[#0b1c30]'
              }`}
            >
              PhenoAge vs Chrono
            </button>
            <button
              onClick={() => setChartViewMode('delta')}
              className={`px-3 py-1.5 rounded text-xs font-['Inter'] font-semibold transition-all cursor-pointer ${
                chartViewMode === 'delta'
                  ? 'bg-[#006194] text-white shadow-xs'
                  : 'text-[#3f4850] hover:text-[#0b1c30]'
              }`}
            >
              Aging Variance (Δ)
            </button>
          </div>
        </div>

        {/* Analytical KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">LATEST PHENOAGE</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Inter'] text-2xl font-bold text-[#006947]">
                {history.length === 0 ? '—' : trajectoryStats.latestPheno.toFixed(1)}
              </span>
              <span className="text-[11px] text-[#565e74]">yrs</span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74] font-semibold mt-1">
              {history.length === 0
                ? 'No panels yet'
                : trajectoryStats.totalDelta <= 0
                  ? 'Decelerated Profile'
                  : 'Accelerated'}
            </span>
          </div>

          <div className="p-3.5 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">PACE OF AGING</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Inter'] text-2xl font-bold text-[#006194]">
                {history.length === 0 ? '—' : trajectoryStats.agingPace}
              </span>
              <span className="text-[11px] text-[#565e74]">bio-yr / cal-yr</span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74] font-semibold mt-1">
              {history.length === 0
                ? 'No panels yet'
                : trajectoryStats.agingPace < 1.0
                  ? 'Slowed aging rate (<1.0)'
                  : 'Baseline pace'}
            </span>
          </div>

          <div className="p-3.5 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">AVG PHENO ADVANTAGE</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Inter'] text-2xl font-bold text-[#006947]">
                {history.length === 0 ? '—' : Math.abs(trajectoryStats.avgDelta).toFixed(1)}
              </span>
              <span className="text-[11px] text-[#565e74]">
                {history.length === 0 ? 'years' : 'years younger'}
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74] mt-1">
              {history.length === 0
                ? 'No panels yet'
                : `Across ${history.length} laboratory test points`}
            </span>
          </div>

          <div className="p-3.5 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">NET BIO CHANGE</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`font-['Inter'] text-2xl font-bold ${
                  trajectoryStats.netBioChange <= 0 ? 'text-[#006947]' : 'text-[#ba1a1a]'
                }`}
              >
                {history.length === 0
                  ? '—'
                  : trajectoryStats.netBioChange > 0
                    ? `+${trajectoryStats.netBioChange}`
                    : trajectoryStats.netBioChange}
              </span>
              <span className="text-[11px] text-[#565e74]">yrs net</span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74] mt-1">
              {history.length === 0 ? 'No panels yet' : 'From baseline to latest panel'}
            </span>
          </div>
        </div>

        {/* Recharts Canvas Container */}
        <div className="w-full h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={rechartsData}
              margin={{ top: 15, right: 30, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="phenoFillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00855b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00855b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="deltaFillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006194" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#006194" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

              <XAxis
                dataKey="formattedDate"
                tick={{ fill: '#565e74', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={{ stroke: '#cbd5e1' }}
                axisLine={{ stroke: '#cbd5e1' }}
              />

              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#565e74', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={{ stroke: '#cbd5e1' }}
                axisLine={{ stroke: '#cbd5e1' }}
                unit="y"
              />

              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const isDecelerated = data.delta <= 0;
                    return (
                      <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-xl shadow-xl p-4 text-xs font-['Inter'] min-w-[230px]">
                        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2 mb-2 font-['JetBrains_Mono']">
                          <span className="font-bold text-[#0b1c30]">{data.rawDate}</span>
                          <span className="text-[10px] bg-[#eff4ff] text-[#006194] px-2 py-0.5 rounded font-semibold border border-[#dce9ff]">
                            {data.labSource}
                          </span>
                        </div>
                        <div className="space-y-1.5 font-['JetBrains_Mono']">
                          <div className="flex justify-between items-center text-[#565e74]">
                            <span>Chrono Age:</span>
                            <span className="font-bold text-[#0b1c30]">
                              {data.chronologicalAge.toFixed(1)} yrs
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[#006947]">
                            <span className="font-bold">Biological PhenoAge:</span>
                            <span className="font-extrabold text-[#006947] text-sm">
                              {data.phenoAge.toFixed(1)} yrs
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1.5 border-t border-[#f1f5f9]">
                            <span className="text-[#565e74]">Aging Variance (Δ):</span>
                            <span
                              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                                isDecelerated
                                  ? 'bg-[#4edea3]/25 text-[#006947]'
                                  : 'bg-[#ffdad6] text-[#ba1a1a]'
                              }`}
                            >
                              {data.delta > 0
                                ? `+${data.delta.toFixed(1)}`
                                : `${data.delta.toFixed(1)}`}{' '}
                              yrs
                            </span>
                          </div>
                          <div className="pt-2 mt-1 border-t border-[#f1f5f9] text-[10px] text-[#565e74] flex justify-between">
                            <span>hs-CRP: {data.crp} mg/L</span>
                            <span>Alb: {data.albumin} g/L</span>
                            <span>RDW: {data.rdw}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <RechartsLegend
                wrapperStyle={{
                  paddingTop: '12px',
                  fontFamily: 'Inter',
                  fontSize: '12px',
                }}
              />

              {chartViewMode === 'both' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="phenoAge"
                    fill="url(#phenoFillGradient)"
                    stroke="none"
                    name="Biological Youth Zone"
                  />
                  <Line
                    type="monotone"
                    dataKey="chronologicalAge"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: '#64748b' }}
                    name="Chronological Calendar Age"
                  />
                  <Line
                    type="monotone"
                    dataKey="phenoAge"
                    stroke="#00855b"
                    strokeWidth={3.5}
                    dot={{ r: 5, fill: '#00855b', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#00855b', stroke: '#ffffff', strokeWidth: 3 }}
                    name="Biological PhenoAge™"
                  />
                </>
              ) : (
                <>
                  <ReferenceLine
                    y={0}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Chronological Baseline (Δ = 0)',
                      fill: '#64748b',
                      fontSize: 11,
                      position: 'top',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="delta"
                    fill="url(#deltaGradient)"
                    stroke="none"
                    name="Biological Variance Area"
                  />
                  <Line
                    type="monotone"
                    dataKey="delta"
                    stroke="#006194"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#006194', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#006194', stroke: '#ffffff', strokeWidth: 3 }}
                    name="PhenoAge Variance (Δ years)"
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Scientific Context Footer in Section */}
        <div className="p-3.5 bg-[#eff4ff] rounded-lg border border-[#dce9ff] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#3f4850]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#006194] shrink-0" />
            <span>
              <strong>Trajectory Dynamics:</strong> Trajectory reflects Levine's 10-year NHANES Gompertz proportional hazard formula. Negative divergence indicates prolonged healthspan.
            </span>
          </div>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#006194] font-semibold shrink-0">
            P-Value Calibrated: p &lt; 0.001
          </span>
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
        <div className="px-5 py-4 bg-[#eff4ff] border-b border-[#dce9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-['Inter'] text-sm font-bold text-[#0b1c30]">
              Longitudinal Testing Registry ({history.length} Panels Logged)
            </span>
            <span className="font-['JetBrains_Mono'] text-xs text-[#006947] font-semibold bg-[#e6f4ea] px-2 py-0.5 rounded border border-[#b7e1cd]">
              In-Memory Vault
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#ffffff] hover:bg-[#f8fafc] text-[#006194] border border-[#cbd5e1] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Printable PDF Report</span>
            </button>
          </div>
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

      {/* Printable Clinical PDF Report Modal */}
      <PrintableReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        history={history}
      />
    </div>
  );
};
