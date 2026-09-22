import React, { useEffect, useMemo, useState } from 'react';
import { TabType, LabPanelData, HistoricalTestRecord, AccountState, PhenoAgeCalculation } from './types';
import { INITIAL_BIOMARKERS, INITIAL_HISTORY, PRESET_LAB_PANELS } from './data/phenoAgeData';
import { PHENOAGE_DISCLAIMER, fetchPhenoAge, PhenoAgeScore } from './api/phenoage';
import { displayBiomarkerScores, displayPercentile, generateCryptoHash } from './utils/phenoAgeMath';
import {
  clearStoredToken,
  createAccount,
  fetchCurrentAccount,
  loginWithMnemonic,
  logoutAccount,
  readStoredToken,
  storeToken,
  updateShareSettings,
} from './api/accounts';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview-landing');
  const [chronologicalAge, setChronologicalAge] = useState<number>(42.0);
  const [biomarkers, setBiomarkers] = useState<Record<string, number>>(INITIAL_BIOMARKERS);
  const [history, setHistory] = useState<HistoricalTestRecord[]>(INITIAL_HISTORY);
  const [account, setAccount] = useState<AccountState | null>(null);
  const [revealedMnemonic, setRevealedMnemonic] = useState<string[] | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [phenoAgeScore, setPhenoAgeScore] = useState<PhenoAgeScore | null>(null);
  const [phenoAgeError, setPhenoAgeError] = useState<string | null>(null);

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

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const current = await fetchCurrentAccount(token);
        if (!cancelled) {
          setAccount({
            publicId: current.publicId,
            isPublic: current.isPublic,
            createdAt: current.createdAt,
            accessToken: token,
          });
        }
      } catch {
        clearStoredToken();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const publicIdLabel = account?.publicId ?? 'Guest';

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchPhenoAge(chronologicalAge, biomarkers, controller.signal)
        .then((score) => {
          setPhenoAgeScore(score);
          setPhenoAgeError(null);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') {
            return;
          }
          setPhenoAgeError(err instanceof Error ? err.message : 'PhenoAge request failed');
        });
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [chronologicalAge, biomarkers]);

  const phenoAgeCalculation = useMemo<PhenoAgeCalculation>(() => {
    const biomarkerScores = displayBiomarkerScores(biomarkers);
    if (!phenoAgeScore) {
      return {
        chronologicalAge,
        phenoAge: 0,
        ageDelta: 0,
        mortalityScore10yr: 0,
        percentileRank: 50,
        biomarkerScores,
        isValid: false,
        activeCount: Object.keys(biomarkers).length,
        disclaimer: PHENOAGE_DISCLAIMER,
      };
    }
    return {
      chronologicalAge: phenoAgeScore.chronologicalAge,
      phenoAge: phenoAgeScore.phenoAge,
      ageDelta: phenoAgeScore.ageDelta,
      mortalityScore10yr: Math.round(phenoAgeScore.mortalityScore10yr * 1000) / 10,
      percentileRank: displayPercentile(phenoAgeScore.ageDelta),
      biomarkerScores,
      isValid: true,
      activeCount: Object.keys(biomarkers).length,
      disclaimer: phenoAgeScore.disclaimer,
    };
  }, [biomarkers, chronologicalAge, phenoAgeScore]);

  const activeHash = useMemo(() => {
    return generateCryptoHash({ chronologicalAge, biomarkers });
  }, [chronologicalAge, biomarkers]);

  const handleLoadPanel = (panel: LabPanelData) => {
    setCurrentPanel(panel);
    setBiomarkers({ ...panel.biomarkers });
    setChronologicalAge(panel.chronologicalAge);
  };

  const handleSaveToHistory = () => {
    if (!phenoAgeCalculation.isValid) {
      return;
    }
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

  const handlePurgeMemory = () => {
    setBiomarkers(INITIAL_BIOMARKERS);
    setChronologicalAge(42.0);
    setHistory(INITIAL_HISTORY.slice(0, 2));
  };

  const handleCreateAccount = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const created = await createAccount();
      storeToken(created.accessToken);
      setAccount({
        publicId: created.publicId,
        isPublic: created.isPublic,
        createdAt: created.createdAt,
        accessToken: created.accessToken,
      });
      setRevealedMnemonic(created.mnemonic.trim().split(/\s+/));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogin = async (mnemonic: string) => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const session = await loginWithMnemonic(mnemonic);
      storeToken(session.accessToken);
      setAccount({
        publicId: session.publicId,
        isPublic: session.isPublic,
        createdAt: session.createdAt,
        accessToken: session.accessToken,
      });
      setRevealedMnemonic(null);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    const token = account?.accessToken;
    setAuthBusy(true);
    setAuthError(null);
    try {
      if (token) {
        await logoutAccount(token);
      }
    } catch {
      // Client still signs out even if the API is unreachable.
    } finally {
      clearStoredToken();
      setAccount(null);
      setRevealedMnemonic(null);
      setAuthBusy(false);
    }
  };

  const handleTogglePublic = async (isPublic: boolean) => {
    if (!account) {
      setIsSeedPhraseModalOpen(true);
      return;
    }
    const previous = account.isPublic;
    setAccount({ ...account, isPublic });
    try {
      const updated = await updateShareSettings(account.accessToken, isPublic);
      setAccount({ ...account, isPublic: updated.isPublic });
    } catch {
      setAccount({ ...account, isPublic: previous });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff] text-[#0b1c30] antialiased">
      {/* Top Fixed Header with Brand, Tabs, and Ephemeral Address */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTerminal={() => setIsTerminalModalOpen(true)}
        onOpenSeedPhrase={() => {
          setAuthError(null);
          setIsSeedPhraseModalOpen(true);
        }}
        accountAddress={publicIdLabel}
        isAuthenticated={account !== null}
      />

      {/* Main Content Pane */}
      <main className="w-full pt-20 flex-1 bg-[#f8f9ff]">
        {/* Live Biological Biomarker Status Ribbon */}
        <StatusRibbon biomarkers={biomarkers} />

        {/* Tab 1: Overview / Landing */}
        {activeTab === 'overview-landing' && (
          <OverviewTab
            setActiveTab={setActiveTab}
            onOpenSeedPhrase={() => {
              setAuthError(null);
              setIsSeedPhraseModalOpen(true);
            }}
            onOpenProofModal={() => setIsProofModalOpen(true)}
            biomarkers={biomarkers}
            onUpdateBiomarkers={setBiomarkers}
            phenoAge={phenoAgeCalculation.isValid ? phenoAgeCalculation.phenoAge : null}
            chronologicalAge={chronologicalAge}
            disclaimer={phenoAgeCalculation.disclaimer}
            isAuthenticated={account !== null}
          />
        )}

        {/* Tab 2: Upload Lab */}
        {activeTab === 'upload-lab' && (
          <UploadLabTab
            onLoadPanel={handleLoadPanel}
            setActiveTab={setActiveTab}
            accountAddress={publicIdLabel}
            accessToken={account?.accessToken ?? null}
            isAuthenticated={account !== null}
            onRequestAuth={() => {
              setAuthError(null);
              setIsSeedPhraseModalOpen(true);
            }}
          />
        )}

        {/* Tab 3: Review & Extraction */}
        {activeTab === 'review-extraction' && (
          <ReviewExtractionTab
            currentPanel={currentPanel}
            onUpdateBiomarkers={setBiomarkers}
            setActiveTab={setActiveTab}
            accessToken={account?.accessToken ?? null}
          />
        )}

        {/* Tab 4: PhenoAge™ Engine */}
        {activeTab === 'phenoage-engine' && (
          <PhenoAgeEngineTab
            calculation={phenoAgeCalculation}
            scoreError={phenoAgeError}
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
            accountAddress={publicIdLabel}
            isAuthenticated={account !== null}
            isPublic={account?.isPublic ?? false}
            onTogglePublic={handleTogglePublic}
            onPurgeMemory={handlePurgeMemory}
            onOpenSeedPhrase={() => {
              setAuthError(null);
              setIsSeedPhraseModalOpen(true);
            }}
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
        publicId={account?.publicId ?? null}
        revealedMnemonic={revealedMnemonic}
        isAuthenticated={account !== null}
        isBusy={authBusy}
        error={authError}
        onCreateAccount={() => {
          void handleCreateAccount();
        }}
        onLogin={(mnemonic) => {
          void handleLogin(mnemonic);
        }}
        onLogout={() => {
          void handleLogout();
        }}
        onConfirmPhraseSaved={() => setRevealedMnemonic(null)}
      />

      {/* WebAssembly Terminal Modal */}
      <TerminalModal
        isOpen={isTerminalModalOpen}
        onClose={() => setIsTerminalModalOpen(false)}
        accountAddress={publicIdLabel}
        phenoAge={phenoAgeCalculation.phenoAge}
      />
    </div>
  );
}
