"use client";

import { Navigation, Route, X, Loader2 } from "lucide-react";

interface OptimizationPanelProps {
  incidentCount: number;
  alpha: number;
  onAlphaChange: (alpha: number) => void;
  onOptimize: () => void;
  onClearRoute: () => void;
  isOptimizing: boolean;
  hasRoute: boolean;
  routeDistance?: number;
  algorithm?: string;
}

export default function OptimizationPanel({
  incidentCount,
  alpha,
  onAlphaChange,
  onOptimize,
  onClearRoute,
  isOptimizing,
  hasRoute,
  routeDistance,
  algorithm
}: OptimizationPanelProps) {
  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999] pointer-events-auto"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999
      }}
    >
      <div className="space-y-3" style={{ width: '320px' }}>
        {/* Metrics Panel */}
        <div 
          className="rounded-lg p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <div 
              className="h-2 w-2 rounded-full"
              style={{ background: '#10b981', animation: 'pulse 2s infinite' }}
            />
            <span 
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: '#94a3b8' }}
            >
              Scenario Metrics
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.5)' }}>
              <span className="text-xs" style={{ color: '#94a3b8' }}>Active Incidents</span>
              <span className="text-sm font-medium font-mono" style={{ color: '#22d3ee' }}>
                {incidentCount}
              </span>
            </div>

            {hasRoute && routeDistance && (
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.5)' }}>
                <span className="text-xs" style={{ color: '#94a3b8' }}>Route Distance</span>
                <span className="text-sm font-medium font-mono" style={{ color: '#a855f7' }}>
                  {routeDistance.toFixed(1)} km
                </span>
              </div>
            )}

            {hasRoute && algorithm && (
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#94a3b8' }}>Algorithm</span>
                <span className="text-xs font-medium font-mono" style={{ color: '#facc15' }}>
                  {algorithm}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Optimization Control Panel */}
        <div 
          className="rounded-lg p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation size={16} style={{ color: '#a855f7' }} />
              <span 
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: '#94a3b8' }}
              >
                Route Optimizer
              </span>
            </div>
            {hasRoute && (
              <button
                onClick={onClearRoute}
                className="transition-colors"
                style={{ color: '#64748b' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                title="Clear route"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Alpha Slider */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: '#94a3b8' }}>Optimization Mode</span>
              <span className="font-mono" style={{ color: '#22d3ee' }}>
                α = {alpha.toFixed(2)}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={alpha}
              onChange={(e) => onAlphaChange(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '8px',
                background: 'linear-gradient(to right, #22d3ee, #a855f7, #ef4444)',
                cursor: 'pointer',
                appearance: 'none'
              }}
            />

            <div className="flex justify-between text-[10px] font-mono" style={{ color: '#64748b' }}>
              <span>EFFICIENCY</span>
              <span>BALANCED</span>
              <span>EQUITY</span>
            </div>

            <div className="text-[10px] leading-relaxed" style={{ color: '#94a3b8' }}>
              {alpha < 0.3 
                ? "⚡ Efficiency Mode: Minimize distance (Nearest Neighbor)"
                : alpha > 0.7
                ? "⚖️ Equity Mode: Prioritize critical severity"
                : "🎯 Balanced: Mix of distance & severity"}
            </div>
          </div>

          {/* Optimize Button */}
          <button
            onClick={onOptimize}
            disabled={isOptimizing || incidentCount === 0}
            className="w-full py-2 px-4 rounded border transition-all font-medium text-sm flex items-center justify-center gap-2"
            style={{
              background: isOptimizing || incidentCount === 0
                ? '#1e293b'
                : hasRoute
                ? 'rgba(168, 85, 247, 0.2)'
                : 'rgba(34, 211, 238, 0.2)',
              borderColor: isOptimizing || incidentCount === 0
                ? '#334155'
                : hasRoute
                ? 'rgba(168, 85, 247, 0.5)'
                : 'rgba(34, 211, 238, 0.5)',
              color: isOptimizing || incidentCount === 0
                ? '#64748b'
                : hasRoute
                ? '#a855f7'
                : '#22d3ee',
              cursor: isOptimizing || incidentCount === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {isOptimizing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : hasRoute ? (
              <>
                <Route size={16} />
                <span>Re-Optimize Route</span>
              </>
            ) : (
              <>
                <Navigation size={16} />
                <span>Calculate Optimal Route</span>
              </>
            )}
          </button>

          {incidentCount === 0 && (
            <div className="mt-2 text-[10px] text-center" style={{ color: 'rgba(245, 158, 11, 0.8)' }}>
              ⚠️ Load a scenario with incidents first
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
