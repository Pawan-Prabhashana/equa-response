"use client";

import { useState, useEffect } from "react";
import { 
  ChevronDown, 
  Database,
  Zap,
  AlertCircle,
  CheckCircle2,
  Route,
  Navigation,
  X,
  Loader2
} from "lucide-react";
import { fetchScenarios, type ScenarioMetadata, type OptimizationResponse } from "@/lib/api";

interface HUDProps {
  onScenarioChange?: (scenarioId: string) => void;
  selectedScenarioId?: string;
  incidentCount?: number;
  resourceCount?: number;
  alpha?: number;
  onAlphaChange?: (alpha: number) => void;
  onOptimize?: () => void;
  onClearRoute?: () => void;
  optimizedRoute?: OptimizationResponse | null;
  isOptimizing?: boolean;
}

export default function HUD({ 
  onScenarioChange, 
  selectedScenarioId,
  incidentCount = 0,
  resourceCount = 0,
  alpha = 0.5,
  onAlphaChange,
  onOptimize,
  onClearRoute,
  optimizedRoute,
  isOptimizing = false
}: HUDProps) {
  const [scenarios, setScenarios] = useState<ScenarioMetadata[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioMetadata | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch scenarios from API
  useEffect(() => {
    async function loadScenarios() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchScenarios();
        setScenarios(data);
        
        // Set first scenario as default or use provided selectedScenarioId
        if (data.length > 0) {
          const defaultScenario = selectedScenarioId
            ? data.find(s => s.id === selectedScenarioId) || data[0]
            : data[0];
          setSelectedScenario(defaultScenario);
        }
      } catch (err) {
        console.error("Failed to load scenarios:", err);
        setError(err instanceof Error ? err.message : "Failed to load scenarios");
      } finally {
        setLoading(false);
      }
    }

    loadScenarios();
  }, [selectedScenarioId]);

  // Update time
  useEffect(() => {
    const updateTime = () => {
      setLastUpdated(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleScenarioChange = (scenario: ScenarioMetadata) => {
    setSelectedScenario(scenario);
    setIsDropdownOpen(false);
    if (onScenarioChange) {
      onScenarioChange(scenario.id);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
        {/* Top Right: Scenario Loader */}
        <div className="pointer-events-auto absolute right-6 top-6">
        <div className="glass-panel rounded-lg p-4 min-w-[280px]">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle size={16} className="text-cyan-400" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Active Scenario
            </span>
          </div>

          <div className="relative">
            {loading ? (
              <div className="flex w-full items-center justify-center rounded border border-slate-700 bg-slate-900/70 px-3 py-2">
                <span className="text-sm text-slate-400 animate-pulse">Loading scenarios...</span>
              </div>
            ) : error ? (
              <div className="rounded border border-red-500/30 bg-red-900/20 px-3 py-2">
                <span className="text-xs text-red-400">Failed to load scenarios</span>
              </div>
            ) : selectedScenario ? (
              <>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex w-full items-center justify-between rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-left transition-colors hover:border-cyan-500"
                >
                  <span className="text-sm font-medium text-cyan-400">
                    {selectedScenario.name}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full glass-panel rounded border border-slate-700 overflow-hidden max-h-60 overflow-y-auto">
                    {scenarios.map((scenario) => (
                      <button
                        key={scenario.id}
                        onClick={() => handleScenarioChange(scenario)}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-cyan-500/10 ${
                          scenario.id === selectedScenario.id
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "text-slate-300"
                        }`}
                      >
                        <div>{scenario.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {scenario.incident_count} incidents • {scenario.resource_count} resources
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {!loading && !error && selectedScenario && (
            <div className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-xs font-mono-data text-emerald-400">
                SCENARIO LOADED
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Right: Optimization Panel */}
      <div className="pointer-events-auto absolute bottom-6 right-6 space-y-3">
        {/* Live Metrics */}
        <div className="glass-panel rounded-lg p-4 min-w-[320px]">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Scenario Metrics
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-red-400" />
                <span className="text-xs text-slate-400">Active Incidents</span>
              </div>
              <span className="font-mono-data text-sm font-medium text-cyan-400">
                {incidentCount}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-emerald-400" />
                <span className="text-xs text-slate-400">Available Resources</span>
              </div>
              <span className="font-mono-data text-sm font-medium text-cyan-400">
                {resourceCount}
              </span>
            </div>

            {optimizedRoute && (
              <>
                <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
                  <div className="flex items-center gap-2">
                    <Route size={14} className="text-purple-400" />
                    <span className="text-xs text-slate-400">Route Distance</span>
                  </div>
                  <span className="font-mono-data text-sm font-medium text-purple-400">
                    {optimizedRoute.total_distance_km.toFixed(1)} km
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-yellow-400" />
                    <span className="text-xs text-slate-400">Algorithm</span>
                  </div>
                  <span className="font-mono-data text-xs font-medium text-yellow-400">
                    {optimizedRoute.algorithm}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Last Updated</span>
              <span className="font-mono-data text-slate-400">
                {lastUpdated || "--:--:--"}
              </span>
            </div>
          </div>
        </div>

        {/* Optimization Control Panel */}
        <div className="glass-panel rounded-lg p-4 min-w-[320px]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-purple-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Route Optimizer
              </span>
            </div>
            {optimizedRoute && (
              <button
                onClick={onClearRoute}
                className="text-slate-500 hover:text-red-400 transition-colors"
                title="Clear route"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Alpha Slider */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Optimization Mode</span>
              <span className="font-mono-data text-cyan-400">
                α = {alpha.toFixed(2)}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={alpha}
              onChange={(e) => onAlphaChange?.(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer
                bg-linear-to-r from-cyan-500 via-purple-500 to-red-500
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-slate-700
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-cyan-500/50
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-slate-700"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono-data">
              <span>EFFICIENCY</span>
              <span>BALANCED</span>
              <span>EQUITY</span>
            </div>

            <div className="text-[10px] text-slate-400 mt-2 leading-relaxed">
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
            className={`w-full py-2 px-4 rounded border transition-all font-medium text-sm
              ${isOptimizing || incidentCount === 0
                ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                : optimizedRoute
                ? "bg-purple-500/20 border-purple-500/50 text-purple-400 hover:bg-purple-500/30"
                : "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
              }
              flex items-center justify-center gap-2`}
          >
            {isOptimizing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : optimizedRoute ? (
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
            <div className="mt-2 text-[10px] text-amber-500/80 text-center">
              ⚠️ Load a scenario with incidents first
            </div>
          )}
        </div>
      </div>

      {/* Bottom Left: System Info */}
      <div className="pointer-events-auto absolute bottom-6 left-6">
        <div className="glass-panel rounded-lg px-4 py-2">
          <div className="font-mono-data text-xs text-slate-500">
            ENGINE: <span className="text-cyan-400 font-semibold">EQUA-RESPONSE v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
