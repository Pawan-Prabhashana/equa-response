"use client";

import { Activity } from 'lucide-react';

interface GodViewBottomDockProps {
  selectedScenarioId?: string;
  scenarios: Array<{ id: string; name: string }>;
  onScenarioChange: (id: string) => void;
  alpha: number;
  onAlphaChange: (alpha: number) => void;
  dataFreshness: string; // e.g., "Live • 3s ago"
}

export default function GodViewBottomDock({
  selectedScenarioId,
  scenarios,
  onScenarioChange,
  alpha,
  onAlphaChange,
  dataFreshness
}: GodViewBottomDockProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 h-full">
      {/* Left: Scenario Selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">
          Scenario:
        </label>
        <select
          value={selectedScenarioId || ''}
          onChange={(e) => onScenarioChange(e.target.value)}
          className="bg-slate-800/80 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
        >
          <option value="">Select scenario...</option>
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Center: Alpha Slider (minimal) */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-bold">FAIRNESS α:</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={alpha}
          onChange={(e) => onAlphaChange(parseFloat(e.target.value))}
          className="w-32"
        />
        <span className="text-xs font-mono font-bold text-cyan-400 w-8">
          {alpha.toFixed(1)}
        </span>
      </div>

      {/* Right: Data Freshness */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded">
        <Activity size={14} className="text-emerald-400 animate-pulse" />
        <span className="text-xs font-bold text-emerald-400">{dataFreshness}</span>
      </div>
    </div>
  );
}
