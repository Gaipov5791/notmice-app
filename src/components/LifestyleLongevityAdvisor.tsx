import React, { useState, useMemo } from 'react';
import { PhenoAgeCalculation } from '../types';
import { PHENOAGE_BIOMARKERS } from '../data/phenoAgeData';
import {
  LIFESTYLE_KNOWLEDGE_BASE,
  LifestyleRecommendation,
} from '../data/lifestyleInterventions';
import { isBiomarkerId } from '../i18n/biomarkerIds';
import { fill } from '../i18n/fill';
import { useI18n } from '../i18n/I18nProvider';
import { EVIDENCE_KEYS, isLifestyleId } from '../i18n/lifestyleIds';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Zap,
  TrendingDown,
  Dna,
  HeartPulse,
  Activity,
  CheckCircle2,
  Clock,
  BookOpen,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  Award,
} from 'lucide-react';

interface LifestyleLongevityAdvisorProps {
  biomarkers: Record<string, number>;
  calculation: PhenoAgeCalculation;
  chronologicalAge: number;
}

export const LifestyleLongevityAdvisor: React.FC<LifestyleLongevityAdvisorProps> = ({
  biomarkers,
  calculation,
  chronologicalAge,
}) => {
  const { m } = useI18n();
  const copy = m.lifestyleUi;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [completedInterventions, setCompletedInterventions] = useState<Record<string, boolean>>({});

  // Evaluate biomarkers and aggregate actionable longevity interventions
  const { recommendations, highPriorityCount, potentialYearsSaved, biomarkerStatusMap } =
    useMemo(() => {
      const recList: LifestyleRecommendation[] = [];
      const statusMap: Record<
        string,
        {
          name: string;
          val: number;
          unit: string;
          status: 'high_risk' | 'moderate' | 'optimal';
          contribution: number;
        }
      > = {};

      PHENOAGE_BIOMARKERS.forEach((def) => {
        const val = biomarkers[def.id] ?? def.optimalRange[0];
        const scoreEntry = calculation.biomarkerScores.find((s) => s.id === def.id);
        const contribution = scoreEntry ? scoreEntry.contribution : 0;

        let status: 'high_risk' | 'moderate' | 'optimal' = 'optimal';

        // Assess biomarker tier
        if (def.id === 'crp') {
          if (val > 2.0) status = 'high_risk';
          else if (val > 0.9) status = 'moderate';
          else status = 'optimal';
        } else if (def.id === 'albumin') {
          if (val < 42.0) status = 'high_risk';
          else if (val < 45.0) status = 'moderate';
          else status = 'optimal';
        } else if (def.id === 'glucose') {
          if (val > 105.0) status = 'high_risk';
          else if (val > 88.0) status = 'moderate';
          else status = 'optimal';
        } else if (def.id === 'rdw') {
          if (val > 13.5) status = 'high_risk';
          else if (val > 12.5) status = 'moderate';
          else status = 'optimal';
        } else if (def.id === 'creatinine') {
          if (val > 1.25) status = 'high_risk';
          else if (val > 1.05) status = 'moderate';
          else status = 'optimal';
        } else if (def.id === 'lymphocyte') {
          if (val < 22.0) status = 'high_risk';
          else if (val < 26.0) status = 'moderate';
          else status = 'optimal';
        } else if (def.id === 'wbc') {
          if (val > 7.5) status = 'high_risk';
          else if (val > 6.5) status = 'moderate';
          else status = 'optimal';
        } else if (def.id === 'mcv') {
          if (val > 95.0) status = 'high_risk';
          else if (val > 91.5) status = 'moderate';
          else status = 'optimal';
        } else if (def.id === 'alp') {
          if (val > 85.0) status = 'high_risk';
          else if (val > 72.0) status = 'moderate';
          else status = 'optimal';
        }

        statusMap[def.id] = {
          name: isBiomarkerId(def.id) ? m.biomarkers[def.id].name : def.name,
          val,
          unit: def.unit,
          status,
          contribution,
        };

        const knowledge = LIFESTYLE_KNOWLEDGE_BASE[def.id];
        if (knowledge) {
          if (status === 'high_risk') {
            recList.push(...knowledge.highRiskRecommendations);
          } else if (status === 'moderate') {
            recList.push(...knowledge.moderateRiskRecommendations);
          } else {
            recList.push(...knowledge.optimalRecommendations);
          }
        }
      });

      // Deduplicate recommendations by ID
      const uniqueRecs = Array.from(new Map(recList.map((r) => [r.id, r])).values());

      // Sort: high priority first, then moderate, then maintenance; and within by estimated PhenoReduction
      const priorityOrder = { high: 0, moderate: 1, maintenance: 2 };
      uniqueRecs.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.estimatedPhenoReductionYears - b.estimatedPhenoReductionYears;
      });

      const highPriority = uniqueRecs.filter((r) => r.priority === 'high').length;
      // Potential total biological age deceleration from actionable items
      const totalPotentialYears = uniqueRecs
        .filter((r) => r.priority !== 'maintenance')
        .reduce((sum, r) => sum + Math.abs(r.estimatedPhenoReductionYears), 0);

      return {
        recommendations: uniqueRecs,
        highPriorityCount: highPriority,
        potentialYearsSaved: Number(totalPotentialYears.toFixed(1)),
        biomarkerStatusMap: statusMap,
      };
    }, [biomarkers, calculation, m.biomarkers]);

  // Filter recommendations based on active tabs/filters
  const filteredRecs = useMemo(() => {
    return recommendations.filter((r) => {
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchPriority = selectedPriority === 'all' || r.priority === selectedPriority;
      return matchCat && matchPriority;
    });
  }, [recommendations, selectedCategory, selectedPriority]);

  const toggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedInterventions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedCount = Object.values(completedInterventions).filter(Boolean).length;

  const categories = [
    { id: 'all', label: copy.categories.all },
    { id: 'nutrition', label: copy.categories.nutrition },
    { id: 'exercise', label: copy.categories.exercise },
    { id: 'supplementation', label: copy.categories.supplementation },
    { id: 'sleep_circadian', label: copy.categories.sleep_circadian },
    { id: 'habits', label: copy.categories.habits },
  ];

  const getPriorityBadge = (priority: LifestyleRecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 font-['JetBrains_Mono'] text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]">
            <AlertTriangle className="w-3 h-3" /> {copy.priorityHigh}
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 font-['JetBrains_Mono'] text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
            {copy.priorityModerate}
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 font-['JetBrains_Mono'] text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#e6f4ea] text-[#006947] border border-[#ceead6]">
            <ShieldCheck className="w-3 h-3" /> {copy.priorityMaintenance}
          </span>
        );
    }
  };

  const getCategoryIcon = (cat: LifestyleRecommendation['category']) => {
    switch (cat) {
      case 'nutrition':
        return <HeartPulse className="w-4 h-4 text-[#006947]" />;
      case 'exercise':
        return <Activity className="w-4 h-4 text-[#006194]" />;
      case 'supplementation':
        return <Dna className="w-4 h-4 text-[#7c3aed]" />;
      case 'sleep_circadian':
        return <Clock className="w-4 h-4 text-[#0284c7]" />;
      case 'habits':
        return <Zap className="w-4 h-4 text-[#d97706]" />;
    }
  };

  return (
    <div
      id="lifestyle-longevity-advisor-root"
      className="bg-[#ffffff] rounded-xl border border-[#cbd5e1] shadow-xs p-6 lg:p-7 flex flex-col gap-6"
    >
      {/* Advisor Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#f1f5f9] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-['Inter'] text-lg font-bold text-[#0b1c30] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#006194]" />
              {copy.title}
            </span>
            <span className="font-['JetBrains_Mono'] text-[11px] bg-[#e6f4ea] text-[#006947] border border-[#ceead6] px-2 py-0.5 rounded font-semibold">
              {copy.badge}
            </span>
          </div>
          <p className="font-['Inter'] text-xs text-[#565e74] max-w-3xl leading-relaxed">
            {copy.lead}
          </p>
        </div>

        {/* Action summary badge */}
        <div className="flex items-center gap-3 shrink-0 bg-[#f8f9ff] px-4 py-2.5 rounded-lg border border-[#e2e8f0]">
          <div className="text-right">
            <span className="block font-['JetBrains_Mono'] text-[10px] text-[#565e74]">
              {copy.potential}
            </span>
            <span className="font-['Inter'] text-base font-bold text-[#006947] flex items-center justify-end gap-1">
              <TrendingDown className="w-4 h-4 text-[#006947]" />
              {fill(copy.upTo, { value: potentialYearsSaved })}
            </span>
          </div>
        </div>
      </div>

      {/* Top Longevity Telemetry Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">
            {copy.gap}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`font-['Inter'] text-2xl font-bold ${
                calculation.ageDelta <= 0 ? 'text-[#006947]' : 'text-[#ba1a1a]'
              }`}
            >
              {calculation.isValid
                ? `${calculation.ageDelta > 0 ? '+' : ''}${calculation.ageDelta.toFixed(1)}`
                : '…'}
            </span>
            <span className="text-xs text-[#565e74]">{copy.yrsBio}</span>
          </div>
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74] mt-1">
            {fill(copy.vsChrono, {
              pheno: calculation.isValid ? calculation.phenoAge.toFixed(1) : '…',
              chrono: chronologicalAge.toFixed(1),
            })}
          </span>
        </div>

        <div className="p-4 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">{copy.highLevers}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`font-['Inter'] text-2xl font-bold ${
                highPriorityCount > 0 ? 'text-[#ba1a1a]' : 'text-[#006947]'
              }`}
            >
              {highPriorityCount}
            </span>
            <span className="text-xs text-[#565e74]">{copy.urgent}</span>
          </div>
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74] mt-1">
            {highPriorityCount > 0
              ? copy.addressFirst
              : copy.allOptimal}
          </span>
        </div>

        <div className="p-4 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">
            {copy.identified}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-['Inter'] text-2xl font-bold text-[#006194]">
              {recommendations.length}
            </span>
            <span className="text-xs text-[#565e74]">{copy.recommendations}</span>
          </div>
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74] mt-1">
            {copy.grounded}
          </span>
        </div>

        <div className="p-4 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0] flex flex-col justify-between">
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">
            {copy.adherence}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-['Inter'] text-2xl font-bold text-[#006947]">
              {completedCount} / {recommendations.length}
            </span>
            <span className="text-xs text-[#565e74]">{copy.implemented}</span>
          </div>
          <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-[#00855b] h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  recommendations.length > 0 ? (completedCount / recommendations.length) * 100 : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Biomarker Status Quick-Triage Strip */}
      <div className="bg-[#eff4ff] p-4 rounded-xl border border-[#dce9ff] flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#0b1c30] flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-[#006194]" />
            {copy.glance}
          </span>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74]">
            {copy.profiled}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 pt-1">
          {Object.entries(biomarkerStatusMap).map(([id, info]) => {
            let bgClass = 'bg-[#e6f4ea] text-[#006947] border-[#ceead6]';
            if (info.status === 'high_risk') {
              bgClass = 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4ab] font-bold';
            } else if (info.status === 'moderate') {
              bgClass = 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]';
            }

            return (
              <div
                key={id}
                className={`p-2 rounded-lg border text-center flex flex-col justify-center gap-0.5 ${bgClass}`}
                title={`${info.name}: ${info.val} ${info.unit}`}
              >
                <span className="font-['JetBrains_Mono'] text-[10px] uppercase truncate">
                  {id}
                </span>
                <span className="font-['JetBrains_Mono'] text-xs font-bold truncate">
                  {info.val}
                </span>
                <span className="text-[9px] opacity-75 capitalize truncate">
                  {info.status === 'high_risk'
                    ? copy.statusHigh
                    : info.status === 'moderate'
                      ? copy.statusModerate
                      : copy.statusOptimal}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Category Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5" id="lifestyle-category-filters">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Inter'] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#006194] text-white shadow-xs'
                    : 'bg-[#f8f9ff] text-[#3f4850] hover:text-[#0b1c30] border border-[#e2e8f0]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Filter className="w-3.5 h-3.5 text-[#565e74]" />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-[#ffffff] border border-[#cbd5e1] rounded-lg px-2.5 py-1 text-xs text-[#0b1c30] font-['Inter'] focus:outline-none focus:border-[#006194] cursor-pointer"
          >
            <option value="all">{copy.priorities.all}</option>
            <option value="high">{copy.priorities.high}</option>
            <option value="moderate">{copy.priorities.moderate}</option>
            <option value="maintenance">{copy.priorities.maintenance}</option>
          </select>
        </div>
      </div>

      {/* Recommendation Action Cards List */}
      <div className="space-y-3.5">
        {filteredRecs.length === 0 ? (
          <div className="text-center py-10 bg-[#f8f9ff] rounded-xl border border-[#e2e8f0] text-[#565e74] text-xs">
            {copy.empty}
          </div>
        ) : (
          filteredRecs.map((rec) => {
            const isExpanded = expandedCardId === rec.id;
            const isCompleted = !!completedInterventions[rec.id];
            const bioInfo = biomarkerStatusMap[rec.biomarkerId];
            const item = isLifestyleId(rec.id) ? m.lifestyle[rec.id] : undefined;
            const title = item?.title ?? rec.title;
            const mechanism = item?.clinicalMechanism ?? rec.clinicalMechanism;
            const steps = item?.actionProtocol ?? rec.actionProtocol;
            const goal = item?.targetGoal ?? rec.targetGoal;
            const note = item?.note ?? rec.contraindicationsOrNotes;
            const categoryLabel = copy.categories[rec.category];
            const evidenceLabel = copy.evidenceLabels[EVIDENCE_KEYS[rec.evidenceLevel]];

            return (
              <div
                key={rec.id}
                id={`rec-card-${rec.id}`}
                className={`rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-[#f8fafc] border-[#cbd5e1] opacity-75'
                    : rec.priority === 'high'
                    ? 'bg-[#ffffff] border-[#ffb4ab] shadow-xs'
                    : 'bg-[#ffffff] border-[#cbd5e1] hover:border-[#94a3b8]'
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedCardId(isExpanded ? null : rec.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Completion checkbox button */}
                    <button
                      onClick={(e) => toggleComplete(rec.id, e)}
                      title={isCompleted ? copy.markProgress : copy.markAdopted}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all shrink-0 mt-0.5 sm:mt-0 cursor-pointer ${
                        isCompleted
                          ? 'bg-[#00855b] border-[#00855b] text-white'
                          : 'border-[#cbd5e1] hover:border-[#006194] bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getPriorityBadge(rec.priority)}
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#565e74] bg-[#f1f5f9] px-2 py-0.5 rounded capitalize">
                          {getCategoryIcon(rec.category)}
                          {categoryLabel}
                        </span>
                        <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74]">
                          {fill(copy.target, {
                            name: bioInfo?.name ?? rec.biomarkerId.toUpperCase(),
                            value: bioInfo?.val ?? '',
                            unit: bioInfo?.unit ?? '',
                          })}
                        </span>
                      </div>
                      <h3
                        className={`font-['Inter'] text-sm sm:text-base font-bold text-[#0b1c30] ${
                          isCompleted ? 'line-through text-[#64748b]' : ''
                        }`}
                      >
                        {title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#f1f5f9]">
                    <div className="flex items-center gap-1.5 text-right font-['JetBrains_Mono'] text-xs font-bold text-[#006947] bg-[#e6f4ea] px-2.5 py-1 rounded">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>{rec.estimatedPhenoReductionYears.toFixed(1)} yrs</span>
                    </div>

                    <button
                      className="p-1 text-[#565e74] hover:text-[#0b1c30] transition-colors"
                      aria-label={copy.toggleDetails}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-[#f1f5f9] flex flex-col gap-4 text-xs">
                    {/* Clinical Mechanism */}
                    <div className="p-3.5 bg-[#f8f9ff] rounded-lg border border-[#e2e8f0]">
                      <span className="font-['JetBrains_Mono'] text-[10px] font-bold uppercase text-[#006194] block mb-1">
                        {copy.mechanism}
                      </span>
                      <p className="text-[#3f4850] leading-relaxed font-['Inter']">
                        {mechanism}
                      </p>
                    </div>

                    {/* Action Checklist */}
                    <div>
                      <span className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase text-[#0b1c30] block mb-2">
                        {copy.steps}
                      </span>
                      <ul className="space-y-2">
                        {steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-[#3f4850] font-['Inter']">
                            <span className="w-5 h-5 rounded-full bg-[#eff4ff] text-[#006194] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-[#dce9ff]">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Target Goal & Evidence Footer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f1f5f9] text-[11px]">
                      <div>
                        <span className="font-bold text-[#565e74] block font-['JetBrains_Mono']">
                          {copy.objective}
                        </span>
                        <span className="text-[#006947] font-semibold">{goal}</span>
                      </div>
                      <div>
                        <span className="font-bold text-[#565e74] block font-['JetBrains_Mono']">
                          {copy.evidence}
                        </span>
                        <span className="text-[#3f4850]">{evidenceLabel}</span>
                        <span className="block text-[10px] text-[#64748b] italic mt-0.5">
                          {rec.studyReference}
                        </span>
                      </div>
                    </div>

                    {note && (
                      <div className="p-2.5 bg-[#fef2f2] rounded border border-[#fecaca] text-[11px] text-[#991b1b] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{note}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Longevity Disclaimer */}
      <div className="p-4 bg-[#eff4ff] rounded-xl border border-[#dce9ff] flex items-start gap-3 text-xs text-[#3f4850]">
        <Lightbulb className="w-5 h-5 text-[#006194] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>{copy.disclaimerTitle}</strong> {copy.disclaimer}
        </div>
      </div>
    </div>
  );
};
