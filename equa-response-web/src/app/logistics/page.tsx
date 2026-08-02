"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Timer, 
  Scale,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useOptimizationStore } from "@/store/optimizationStore";
import { fetchScenarioDetails } from "@/lib/api";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function LogisticsPage() {
  const {
    alpha,
    rankedIncidents,
    metrics,
    isOptimizing,
    setAlpha,
    setScenarioData,
    runOptimization
  } = useOptimizationStore();

  const [localAlpha, setLocalAlpha] = useState(alpha);
  const debouncedAlpha = useDebounce(localAlpha, 450);

  // Load scenario data on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Load first scenario by default (Kalutara flood)
        const scenario = await fetchScenarioDetails("kalutara_flood_2017");
        
        setScenarioData(
          scenario.incidents || [],
          scenario.resources || [],
          scenario.center as [number, number]
        );
        
      } catch (error) {
        console.error("Failed to load scenario:", error);
      }
    }
    loadData();
  }, [setScenarioData]);
  
  // Initial optimization after data loads
  useEffect(() => {
    if (rankedIncidents.length > 0 && !isOptimizing) {
      runOptimization();
    }
  }, [rankedIncidents.length]); // Run when we first get incidents

  // Update store alpha when debounced value changes
  useEffect(() => {
    setAlpha(debouncedAlpha);
  }, [debouncedAlpha, setAlpha]);

  // Auto-run optimization when alpha changes
  useEffect(() => {
    if (rankedIncidents.length > 0) {
      runOptimization();
    }
  }, [debouncedAlpha]); // Only re-run when alpha changes, not on every ranking

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalAlpha(parseFloat(e.target.value));
  };

  const handleForceOptimize = () => {
    runOptimization();
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex h-full w-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="relative min-w-0 flex-1 overflow-hidden">
            {/* Header Section */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent px-8 py-6 backdrop-blur-sm border-b border-white/5">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-cyan-400 tracking-wider uppercase">
                      Logistics Control
                    </h1>
                    <p className="mt-2 text-sm text-slate-400 font-mono">
                      Dynamic Route Optimization · Fairness-Efficiency Trade-off
                    </p>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isOptimizing ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className="text-xs font-mono-data text-slate-400">
                      {isOptimizing ? 'OPTIMIZING' : 'READY'}
                    </span>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-5 gap-4 mt-4">
                  {/* Efficiency Score */}
                  <div className="glass-panel rounded-lg px-4 py-2">
                    <div className="text-[10px] text-slate-500 uppercase">Efficiency</div>
                    <div className="text-lg font-mono font-bold text-cyan-400">
                      {metrics.efficiencyScore.toFixed(2)}
                    </div>
                  </div>

                  {/* Equity Variance */}
                  <div className="glass-panel rounded-lg px-4 py-2">
                    <div className="text-[10px] text-slate-500 uppercase">Equity Var</div>
                    <div className="text-lg font-mono font-bold text-purple-400">
                      {metrics.equityVariance.toFixed(1)}
                    </div>
                  </div>

                  {/* Route Distance */}
                  <div className="glass-panel rounded-lg px-4 py-2">
                    <div className="text-[10px] text-slate-500 uppercase">Distance</div>
                    <div className="text-lg font-mono font-bold text-blue-400">
                      {metrics.routeDistanceKm ? `${metrics.routeDistanceKm.toFixed(1)} km` : '—'}
                    </div>
                  </div>

                  {/* Delta Distance */}
                  <div className="glass-panel rounded-lg px-4 py-2">
                    <div className="text-[10px] text-slate-500 uppercase">Δ Distance</div>
                    <div className={`text-lg font-mono font-bold flex items-center gap-1 ${
                      metrics.deltaDistanceKm === undefined ? 'text-slate-500' :
                      metrics.deltaDistanceKm > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {metrics.deltaDistanceKm === undefined ? '—' : (
                        <>
                          {metrics.deltaDistanceKm > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {Math.abs(metrics.deltaDistanceKm).toFixed(1)} km
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delta ETA */}
                  <div className="glass-panel rounded-lg px-4 py-2">
                    <div className="text-[10px] text-slate-500 uppercase">Δ ETA</div>
                    <div className={`text-lg font-mono font-bold flex items-center gap-1 ${
                      metrics.deltaEtaMin === undefined ? 'text-slate-500' :
                      metrics.deltaEtaMin > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {metrics.deltaEtaMin === undefined ? '—' : (
                        <>
                          {metrics.deltaEtaMin > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {Math.abs(metrics.deltaEtaMin).toFixed(0)} min
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="absolute inset-0 pt-48 px-8 pb-8">
              <div className="h-full max-w-7xl mx-auto">
                <div className="flex gap-6 h-full">
                  {/* Left: Ranked Incidents Table (2/3) */}
                  <div className="flex-1 min-w-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="h-full flex flex-col bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden"
                    >
                      {/* Table Header */}
                      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 bg-slate-950/50">
                        <h2 className="text-sm font-bold text-cyan-400 tracking-wider flex items-center gap-2">
                          <AlertTriangle size={16} />
                          RANKED INCIDENTS (α = {alpha.toFixed(2)})
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          Priority descending · Reranked on alpha change
                        </p>
                      </div>

                      {/* Table Content */}
                      <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm border-b border-white/5">
                            <tr className="text-slate-500 text-[10px] uppercase">
                              <th className="text-left px-3 py-2 font-mono">Rank</th>
                              <th className="text-left px-3 py-2 font-mono">Type</th>
                              <th className="text-left px-3 py-2 font-mono">Severity</th>
                              <th className="text-left px-3 py-2 font-mono">Description</th>
                              <th className="text-right px-3 py-2 font-mono">Wait (min)</th>
                              <th className="text-right px-3 py-2 font-mono">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rankedIncidents.map((incident, idx) => (
                              <motion.tr
                                key={incident.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.02 }}
                                className="border-b border-white/5 hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="px-3 py-2 font-mono text-cyan-400 font-bold">
                                  #{incident.rank}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    incident.type === 'FLOOD' ? 'bg-blue-500/20 text-blue-300' :
                                    incident.type === 'LANDSLIDE' ? 'bg-orange-500/20 text-orange-300' :
                                    incident.type === 'WIND' ? 'bg-red-500/20 text-red-300' :
                                    'bg-gray-500/20 text-gray-300'
                                  }`}>
                                    {incident.type}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`font-bold ${
                                    incident.severity >= 9 ? 'text-red-400' :
                                    incident.severity >= 7 ? 'text-orange-400' :
                                    incident.severity >= 5 ? 'text-yellow-400' :
                                    'text-green-400'
                                  }`}>
                                    {incident.severity}/10
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-300 max-w-xs truncate">
                                  {incident.description}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-slate-400">
                                  {incident.waitProxy.toFixed(0)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-purple-400 font-bold">
                                  {incident.priorityScore.toFixed(3)}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {rankedIncidents.length === 0 && (
                          <div className="flex items-center justify-center h-full text-slate-500">
                            <div className="text-center">
                              <AlertTriangle size={48} className="mx-auto mb-2 opacity-20" />
                              <p className="text-sm">No incidents loaded</p>
                              <p className="text-xs mt-1">Select a scenario to begin</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Right: Fairness Slider Panel (1/3) */}
                  <div className="w-96 flex-shrink-0">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="h-full flex flex-col gap-4"
                    >
                      {/* Slider Panel */}
                      <div className="flex-shrink-0 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                        <h3 className="text-sm font-bold text-cyan-400 tracking-wider mb-4 flex items-center gap-2">
                          <Scale size={16} />
                          FAIRNESS SLIDER (α)
                        </h3>

                        {/* Slider Value Display */}
                        <div className="mb-6 text-center">
                          <div className="text-4xl font-mono font-bold text-purple-400">
                            {localAlpha.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {localAlpha < 0.33 ? 'Efficiency Focus' :
                             localAlpha > 0.66 ? 'Equity Focus' :
                             'Balanced'}
                          </div>
                        </div>

                        {/* Slider */}
                        <div className="relative mb-6">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={localAlpha}
                            onChange={handleSliderChange}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer
                                     bg-gradient-to-r from-cyan-500 via-purple-500 to-purple-600
                                     [&::-webkit-slider-thumb]:appearance-none
                                     [&::-webkit-slider-thumb]:w-4
                                     [&::-webkit-slider-thumb]:h-4
                                     [&::-webkit-slider-thumb]:rounded-full
                                     [&::-webkit-slider-thumb]:bg-white
                                     [&::-webkit-slider-thumb]:shadow-lg
                                     [&::-webkit-slider-thumb]:cursor-pointer
                                     [&::-webkit-slider-thumb]:border-2
                                     [&::-webkit-slider-thumb]:border-purple-400"
                          />
                        </div>

                        {/* Slider Labels */}
                        <div className="flex items-center justify-between text-xs mb-6">
                          <div className="flex items-center gap-1 text-cyan-400">
                            <Timer size={14} />
                            <span>Efficiency</span>
                          </div>
                          <div className="flex items-center gap-1 text-purple-400">
                            <Scale size={14} />
                            <span>Equity</span>
                          </div>
                        </div>

                        {/* Force Optimize Button */}
                        <button
                          onClick={handleForceOptimize}
                          disabled={isOptimizing || rankedIncidents.length === 0}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                                   bg-cyan-500/20 border border-cyan-500/30 text-cyan-400
                                   hover:bg-cyan-500/30 hover:border-cyan-500/50
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-all font-mono text-sm font-bold"
                        >
                          <RefreshCw size={16} className={isOptimizing ? 'animate-spin' : ''} />
                          {isOptimizing ? 'OPTIMIZING...' : 'FORCE RE-OPTIMIZE'}
                        </button>

                        {/* Explanation */}
                        <div className="mt-4 p-3 rounded bg-slate-950/50 border border-white/5">
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            <span className="text-cyan-400 font-bold">α</span> trades speed vs fairness.
                            Higher α reduces wait-time disparity across incidents (more equitable).
                            Lower α maximizes efficiency (severity/distance ratio).
                          </p>
                        </div>
                      </div>

                      {/* Legend Panel */}
                      <div className="flex-shrink-0 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3">
                          SCORE CALCULATION
                        </h3>
                        <div className="space-y-2 text-[10px] text-slate-500 font-mono">
                          <div>
                            <span className="text-cyan-400">Efficiency:</span> severity / wait_time
                          </div>
                          <div>
                            <span className="text-purple-400">Equity:</span> normalize(wait_time)
                          </div>
                          <div>
                            <span className="text-white">Priority:</span> (1-α)·eff + α·equity
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
