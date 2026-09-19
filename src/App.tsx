import React, { useState, useMemo } from 'react';
import { TabType, LabPanelData, HistoricalTestRecord } from './types';
import { INITIAL_BIOMARKERS, INITIAL_HISTORY, PRESET_LAB_PANELS } from './data/phenoAgeData';
import { calculatePhenoAge, generateCryptoHash } from './utils/phenoAgeMath';
import { Header } from './components/Header';
import { StatusRibbon } from './components/StatusRibbon';
import { OverviewTab } from './components/tabs/OverviewTab';
import { UploadLabTab } from './components/tabs/UploadLabTab';
import { ReviewExtractionTab } from './components/tabs/ReviewExtractionTab';
import { PhenoAgeEngineTab } from './components/tabs/PhenoAgeEngineTab';
import { BiomarkerHistoryTab } from './components/tabs/BiomarkerHistoryTab';
import { DataSovereigntyTab } from './components/tabs/DataSovereigntyTab';
import { ProofModal } from './components/ProofModal';
import { SeedPhraseModal } from './components/SeedPhraseModal';
import { TerminalModal } from './components/TerminalModal';
import { Footer } from './components/Footer';

const INITIAL_MNEMONIC = [
  'quantum',
  'cellular',
  'longevity',
  'telomere',
  'biomarker',
  'hepatic',
  'hazard',
  'matrix',
  'isolate',
  'gompertz',
  'cipher',
  'sovereign',
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview-landing');
  const [chronologicalAge, setChronologicalAge] = useState<number>(42.0);
  const [biomarkers, setBiomarkers] = useState<Record<string, number>>(INITIAL_BIOMARKERS);
  const [history, setHistory] = useState<HistoricalTestRecord[]>(INITIAL_HISTORY);
  const [seedPhrase, setSeedPhrase] = useState<string[]>(INITIAL_MNEMONIC);
  const [accountAddress, setAccountAddress] = useState<string>('0x8f4c...b921');

  // Modals state
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isSeedPhraseModalOpen, setIsSeedPhraseModalOpen] = useState(false);
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);

  // Active panel loaded from upload
  const [currentPanel, setCurrentPanel] = useState<LabPanelData>({
    id: 'panel-init',
    labName: PRESET_LAB_PANELS.quest.source,
    testDate: PRESET_LAB_PANELS.quest.date,
    sourceType: 'demo',
    fileName: PRESET_LAB_PANELS.quest.fileName,
    chronologicalAge: 42.0,
    gender: 'male',
    biomarkers: { ...PRESET_LAB_PANELS.quest.values },
    confidenceScores: { ...PRESET_LAB_PANELS.quest.confidence },
    verified: true,
    hash: '0x8fbc...19a4',
  });

  // Dynamic real-time calculation using Levine 2018 algorithm
  const phenoAgeCalculation = useMemo(() => {
    return calculatePhenoAge(chronologicalAge, biomarkers);
  }, [chronologicalAge, biomarkers]);

  const activeHash = useMemo(() => {
    return generateCryptoHash({ chronologicalAge, biomarkers });
  }, [chronologicalAge, biomarkers]);

  const handleLoadPanel = (panel: LabPanelData) => {
    setCurrentPanel(panel);
    setBiomarkers({ ...panel.biomarkers });
    setChronologicalAge(panel.chronologicalAge);
  };

  const handleSaveToHistory = () => {
    const today = new Date().toISOString().split('T')[0];
    const newRecord: HistoricalTestRecord = {
      id: `hist-${Date.now()}`,
      date: today,
      chronologicalAge,
      phenoAge: phenoAgeCalculation.phenoAge,
      delta: phenoAgeCalculation.ageDelta,
      labSource: currentPanel.labName,
      biomarkers: { ...biomarkers },
      hash: activeHash,
    };
    setHistory((prev) => [...prev, newRecord]);
  };

  const handleSelectHistoricalRecord = (record: HistoricalTestRecord) => {
    setChronologicalAge(record.chronologicalAge);
    setBiomarkers({ ...record.biomarkers });
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleRegenerateKeys = () => {
    const words = [
      'solitary',
      'vector',
      'mitochondria',
      'glycan',
      'serum',
      'protocol',
      'epigenome',
      'somatic',
      'autophagy',
      'frailty',
      'longevity',
      'entropy',
    ];
    setSeedPhrase(words);
    const randHex = Math.random().toString(16).slice(2, 6);
    setAccountAddress(`0x${randHex}...${Math.random().toString(16).slice(2, 6)}`);
  };

  const handlePurgeMemory = () => {
    setBiomarkers(INITIAL_BIOMARKERS);
    setChronologicalAge(42.0);
    setHistory(INITIAL_HISTORY.slice(0, 2));
    handleRegenerateKeys();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff] text-[#0b1c30] antialiased">
      {/* Top Fixed Header with Brand, Tabs, and Ephemeral Address */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTerminal={() => setIsTerminalModalOpen(true)}
        onOpenSeedPhrase={() => setIsSeedPhraseModalOpen(true)}
        accountAddress={accountAddress}
      />

      {/* Main Content Pane */}
      <main className="w-full pt-20 flex-1 bg-[#f8f9ff]">
        {/* Live Biological Biomarker Status Ribbon */}
        <StatusRibbon biomarkers={biomarkers} />

        {/* Tab 1: Overview / Landing */}
        {activeTab === 'overview-landing' && (
          <OverviewTab
            setActiveTab={setActiveTab}
            onOpenSeedPhrase={() => setIsSeedPhraseModalOpen(true)}
            onOpenProofModal={() => setIsProofModalOpen(true)}
            biomarkers={biomarkers}
            onUpdateBiomarkers={setBiomarkers}
            phenoAge={phenoAgeCalculation.phenoAge}
            chronologicalAge={chronologicalAge}
          />
        )}

        {/* Tab 2: Upload Lab */}
        {activeTab === 'upload-lab' && (
          <UploadLabTab
            onLoadPanel={handleLoadPanel}
            setActiveTab={setActiveTab}
            accountAddress={accountAddress}
          />
        )}

        {/* Tab 3: Review & Extraction */}
        {activeTab === 'review-extraction' && (
          <ReviewExtractionTab
            currentPanel={currentPanel}
            onUpdateBiomarkers={setBiomarkers}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Tab 4: PhenoAge™ Engine */}
        {activeTab === 'phenoage-engine' && (
          <PhenoAgeEngineTab
            calculation={phenoAgeCalculation}
            biomarkers={biomarkers}
            onUpdateBiomarkers={setBiomarkers}
            chronologicalAge={chronologicalAge}
            onUpdateChronologicalAge={setChronologicalAge}
            onSaveToHistory={handleSaveToHistory}
            setActiveTab={setActiveTab}
            onOpenProofModal={() => setIsProofModalOpen(true)}
          />
        )}

        {/* Tab 5: Biomarker History */}
        {activeTab === 'biomarker-history' && (
          <BiomarkerHistoryTab
            history={history}
            onAddHistory={(rec) => setHistory((prev) => [...prev, rec])}
            onDeleteHistory={handleDeleteHistory}
            onSelectRecord={handleSelectHistoricalRecord}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Tab 6: Data Sovereignty & Public Sharing */}
        {activeTab === 'data-sovereignty-public-sharing' && (
          <DataSovereigntyTab
            history={history}
            accountAddress={accountAddress}
            seedPhrase={seedPhrase}
            onPurgeMemory={handlePurgeMemory}
            onOpenSeedPhrase={() => setIsSeedPhraseModalOpen(true)}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Protocol Footer */}
      <Footer />

      {/* Proof Modal */}
      <ProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        hash={activeHash}
        biomarkers={biomarkers}
        phenoAge={phenoAgeCalculation.phenoAge}
        chronologicalAge={chronologicalAge}
      />

      {/* Seed Phrase Vault Modal */}
      <SeedPhraseModal
        isOpen={isSeedPhraseModalOpen}
        onClose={() => setIsSeedPhraseModalOpen(false)}
        seedPhrase={seedPhrase}
        accountAddress={accountAddress}
        onRegenerateKeys={handleRegenerateKeys}
        onPurgeMemory={handlePurgeMemory}
      />

      {/* WebAssembly Terminal Modal */}
      <TerminalModal
        isOpen={isTerminalModalOpen}
        onClose={() => setIsTerminalModalOpen(false)}
        accountAddress={accountAddress}
        phenoAge={phenoAgeCalculation.phenoAge}
      />
    </div>
  );
}
