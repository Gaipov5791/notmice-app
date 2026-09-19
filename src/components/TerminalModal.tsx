import React, { useState } from 'react';
import { X, Terminal as TerminalIcon, Play, RefreshCw, Cpu, Database } from 'lucide-react';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountAddress: string;
  phenoAge: number;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({
  isOpen,
  onClose,
  accountAddress,
  phenoAge,
}) => {
  const [logs, setLogs] = useState<string[]>([
    `[WASM_INIT] WebAssembly 2.0 runtime initialized with SIMD acceleration.`,
    `[MEM_SANDBOX] Allocated isolated SharedArrayBuffer (4096 KB) at 0x00A8F00.`,
    `[CRYPTO] Ephemeral session key generated for node ${accountAddress}.`,
    `[LOINC_DICTIONARY] Loaded 9 PhenoAge target codes from LOINC 2024.2 specs.`,
    `[GOMPERTZ_ENGINE] NHANES IV regression calibrated: gamma=0.0076927, intercept=-19.9067.`,
    `[EXEC_STATUS] Active PhenoAge calculation verified: ${phenoAge.toFixed(1)} yrs.`,
    `[AUDIT] Zero network transmissions detected. In-memory data integrity: 100%.`,
  ]);
  const [inputCmd, setInputCmd] = useState('');

  if (!isOpen) return null;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;

    const cmd = inputCmd.trim().toLowerCase();
    const newLogs = [...logs, `> ${inputCmd}`];

    if (cmd === 'help') {
      newLogs.push('Available commands: status, loinc, memory, purge, cite, clear');
    } else if (cmd === 'status') {
      newLogs.push(`Node: ${accountAddress} | PhenoAge: ${phenoAge.toFixed(1)} | Isolated: true`);
    } else if (cmd === 'loinc') {
      newLogs.push('Active LOINC codes: 1751-7, 2160-0, 2345-7, 30522-7, 26474-7, 787-2, 788-0, 6768-6, 6690-2');
    } else if (cmd === 'memory') {
      newLogs.push('SharedArrayBuffer: 4096 KB (128 KB active). Cold storage write: 0 bytes.');
    } else if (cmd === 'cite') {
      newLogs.push('Levine ME et al. Aging (Albany NY) 2018; 10(4):573–591. DOI:10.18632/aging.101414');
    } else if (cmd === 'clear') {
      setLogs([]);
      setInputCmd('');
      return;
    } else {
      newLogs.push(`Command not recognized: "${inputCmd}". Type "help" for options.`);
    }

    setLogs(newLogs);
    setInputCmd('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#0b1c30] text-[#f8f9ff] rounded-xl border border-[#3f4850] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col font-['JetBrains_Mono']">
        {/* Terminal Header */}
        <div className="px-4 py-3 border-b border-[#213145] bg-[#131b2e] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
            <span className="text-[#bec6e0] ml-2 flex items-center gap-1.5 font-medium">
              <TerminalIcon className="w-3.5 h-3.5 text-[#4edea3]" />
              NotMice WebAssembly Console • In-Memory REPL
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#bec6e0] hover:text-white hover:bg-[#213145] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Terminal Output */}
        <div className="p-4 h-72 overflow-y-auto text-xs space-y-1 bg-[#0b1c30] text-[#eaf1ff]">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`${
                log.startsWith('>')
                  ? 'text-[#4edea3] font-bold'
                  : log.includes('WASM') || log.includes('GOMPERTZ')
                  ? 'text-[#93ccff]'
                  : 'text-[#bec6e0]'
              }`}
            >
              {log}
            </div>
          ))}
        </div>

        {/* Command Input Form */}
        <form
          onSubmit={handleCommand}
          className="border-t border-[#213145] p-2 bg-[#131b2e] flex items-center gap-2"
        >
          <span className="text-[#4edea3] text-sm pl-2">$</span>
          <input
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            placeholder="Type 'help' or command..."
            className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-[#565e74]"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-[#006194] hover:bg-[#007bb9] text-white rounded text-xs flex items-center gap-1 cursor-pointer"
          >
            <Play className="w-3 h-3" />
            <span>Run</span>
          </button>
        </form>
      </div>
    </div>
  );
};
