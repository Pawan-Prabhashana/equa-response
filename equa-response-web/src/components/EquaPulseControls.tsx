"use client";

import { Activity, AlertTriangle } from 'lucide-react';
import type { EvacuationZone } from '@/lib/equaPulse';

interface EquaPulseControlsProps {
  showRisk: boolean;
  showFairness: boolean;
  showEvacLine: boolean;
  threshold: number;
  evacZone: EvacuationZone | null;
  onToggleRisk: () => void;
  onToggleFairness: () => void;
  onToggleEvacLine: () => void;
  onThresholdChange: (value: number) => void;
}

export default function EquaPulseControls({
  showRisk,
  showFairness,
  showEvacLine,
  threshold,
  evacZone,
  onToggleRisk,
  onToggleFairness,
  onToggleEvacLine,
  onThresholdChange
}: EquaPulseControlsProps) {
  return (
    <div className="flex items-center justify-between gap-6 px-6 py-3">
      {/* Left: EquaPulse Branding */}
      <div className="flex items-center gap-3">
        <Activity size={20} className="text-cyan-400" />
        <div>
          <div className="text-sm font-bold text-cyan-400 tracking-wider">EQUA-PULSE</div>
          <div className="text-xs text-slate-500">Fairness Heatmap • Live Risk Surface</div>
        </div>
      </div>

      {/* Center: Layer Toggles */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={showRisk}
            onChange={onToggleRisk}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
          />
          <span className="text-slate-300">Risk Surface</span>
          <span className="w-3 h-3 rounded" style={{ background: 'linear-gradient(to right, rgba(59,130,246,0.3), rgba(239,68,68,0.7))' }}></span>
        </label>

        <div className="h-4 w-px bg-slate-700" />

        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={showFairness}
            onChange={onToggleFairness}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
          />
          <span className="text-slate-300">Fairness Surface</span>
          <span className="w-3 h-3 rounded" style={{ background: 'linear-gradient(to right, rgba(6,182,212,0.3), rgba(236,72,153,0.7))' }}></span>
        </label>

        <div className="h-4 w-px bg-slate-700" />

        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={showEvacLine}
            onChange={onToggleEvacLine}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-red-500 focus:ring-red-500 focus:ring-offset-0"
          />
          <span className="text-slate-300 font-bold">Evacuation Line</span>
          <AlertTriangle size={14} className="text-red-400" />
        </label>
      </div>

      {/* Right: Threshold + Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Threshold:</span>
          <input
            type="range"
            min="0.55"
            max="0.80"
            step="0.05"
            value={threshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            className="w-24"
          />
          <span className="text-xs font-mono font-bold text-cyan-400">
            {threshold.toFixed(2)}
          </span>
        </div>

        {evacZone && evacZone.boundary.length > 0 && (
          <>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-3 text-xs">
              <div>
                <span className="text-slate-500">Est. Population:</span>
                <span className="ml-1.5 font-mono font-bold text-red-400">
                  {evacZone.populationEstimate.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Avg Risk:</span>
                <span className="ml-1.5 font-mono font-bold text-orange-400">
                  {(evacZone.avgRisk * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
