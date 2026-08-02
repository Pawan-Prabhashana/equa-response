"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Home,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Building2,
  Search
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useOptimizationStore } from "@/store/optimizationStore";
import { fetchScenarios, fetchScenarioDetails } from "@/lib/api";
import {
  getCurrentPercent,
  predictOccupancy1h,
  getShelterColor,
  getSuggestedAction,
  filterSheltersByStatus
} from "@/lib/sheltrSat";

type FilterType = "ALL" | "AT_RISK" | "FULL" | "OPEN";

export default function SheltersPage() {
  const {
    shelters,
    selectedShelterId,
    selectShelter,
    alpha,
    incidents,
    setScenarioData
  } = useOptimizationStore();

  const [filter, setFilter] = useState<FilterType>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load scenario data on mount if not already loaded
  useEffect(() => {
    async function loadData() {
      // If shelters already loaded, skip
      if (shelters.length > 0) return;
      
      setIsLoading(true);
      try {
        // Get first scenario (default)
        const scenarios = await fetchScenarios();
        if (scenarios.length > 0) {
          const scenario = await fetchScenarioDetails(scenarios[0].id);
          setScenarioData(
            scenario.incidents || [],
            scenario.resources || [],
            scenario.center as [number, number],
            scenario.shelters || []
          );
        }
      } catch (error) {
        console.error("Failed to load shelters:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []); // Only run once on mount

  // Context for predictions
  const predictionContext = useMemo(() => ({
    alpha,
    incidentLoad: incidents.length
  }), [alpha, incidents.length]);

  // Filter and search shelters
  const filteredShelters = useMemo(() => {
    let filtered = filterSheltersByStatus(shelters, filter, predictionContext);
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.id.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [shelters, filter, searchTerm, predictionContext]);

  // Get selected shelter details
  const selectedShelter = shelters.find(s => s.id === selectedShelterId);
  const selectedPrediction = selectedShelter 
    ? predictOccupancy1h(selectedShelter, predictionContext)
    : null;

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalCapacity = shelters.reduce((sum, s) => sum + s.capacity, 0);
    const totalOccupancy = shelters.reduce((sum, s) => sum + s.current_occupancy, 0);
    const occupancyPercent = totalCapacity > 0 
      ? ((totalOccupancy / totalCapacity) * 100)
      : 0;
    const atRisk = shelters.filter(s => {
      const pred = predictOccupancy1h(s, predictionContext);
      return pred.predicted_percent_1h >= 80;
    }).length;
    const full = shelters.filter(s => getCurrentPercent(s) >= 99).length;
    
    return { totalCapacity, totalOccupancy, occupancyPercent, atRisk, full };
  }, [shelters, predictionContext]);

  const handleRowClick = (shelterId: string) => {
    selectShelter(selectedShelterId === shelterId ? null : shelterId);
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
                    <h1 className="text-3xl font-bold text-purple-400 tracking-wider uppercase flex items-center gap-3">
                      <Building2 size={32} />
                      SHELTR-SAT
                    </h1>
                    <p className="mt-2 text-sm text-slate-400 font-mono">
                      Dynamic Load Balancing · Predictive Occupancy Model
                    </p>
                    {/* Debug info */}
                    <p className="mt-1 text-xs text-slate-600 font-mono">
                      Loaded shelters: {shelters.length} {isLoading && "(Loading...)"}
                    </p>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {/* Total Capacity */}
                  <div className="glass-panel rounded-lg px-4 py-2">
                    <div className="text-[10px] text-slate-500 uppercase">Total Capacity</div>
                    <div className="text-lg font-mono font-bold text-purple-400">
                      {stats.totalCapacity}
                    </div>
                  </div>

                  {/* Current Occupancy */}
                  <div className="glass-panel rounded-lg px-4 py-2">
                    <div className="text-[10px] text-slate-500 uppercase">Current Occupancy</div>
                    <div className="text-lg font-mono font-bold text-cyan-400">
                      {stats.totalOccupancy} ({stats.occupancyPercent.toFixed(0)}%)
                    </div>
                  </div>

                  {/* At Risk */}
                  <div className="glass-panel rounded-lg px-4 py-2">
                    <div className="text-[10px] text-slate-500 uppercase">At Risk (≥80%)</div>
                    <div className="text-lg font-mono font-bold text-yellow-400 flex items-center gap-2">
                      <AlertTriangle size={18} />
                      {stats.atRisk}
                    </div>
                  </div>

                  {/* Full */}
                  <div className="glass-panel rounded-lg px-4 py-2">
                    <div className="text-[10px] text-slate-500 uppercase">Full (≥99%)</div>
                    <div className="text-lg font-mono font-bold text-red-400 flex items-center gap-2">
                      <XCircle size={18} />
                      {stats.full}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="absolute inset-0 pt-52 px-8 pb-8">
              <div className="h-full max-w-7xl mx-auto">
                <div className="flex gap-6 h-full">
                  {/* Left: Shelter Table (2/3) */}
                  <div className="flex-1 min-w-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="h-full flex flex-col bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden"
                    >
                      {/* Table Header with Filters */}
                      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 bg-slate-950/50">
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-sm font-bold text-purple-400 tracking-wider flex items-center gap-2">
                            <Home size={16} />
                            SHELTER NETWORK ({filteredShelters.length})
                          </h2>
                        </div>

                        {/* Filter Chips */}
                        <div className="flex items-center gap-2 mb-3">
                          {(["ALL", "AT_RISK", "FULL", "OPEN"] as FilterType[]).map((f) => (
                            <button
                              key={f}
                              onClick={() => setFilter(f)}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                filter === f
                                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                                  : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800"
                              }`}
                            >
                              {f.replace("_", " ")}
                            </button>
                          ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search shelters..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-9 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
                          />
                        </div>
                      </div>

                      {/* Table Content */}
                      <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm border-b border-white/5">
                            <tr className="text-slate-500 text-[10px] uppercase">
                              <th className="text-left px-3 py-2 font-mono">Name</th>
                              <th className="text-center px-3 py-2 font-mono">Status</th>
                              <th className="text-right px-3 py-2 font-mono">Current %</th>
                              <th className="text-right px-3 py-2 font-mono">Predicted %</th>
                              <th className="text-right px-3 py-2 font-mono">Capacity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredShelters.map((shelter, idx) => {
                              const currentPercent = getCurrentPercent(shelter);
                              const prediction = predictOccupancy1h(shelter, predictionContext);
                              const colorInfo = getShelterColor(currentPercent);
                              const predColorInfo = getShelterColor(prediction.predicted_percent_1h);
                              const isSelected = selectedShelterId === shelter.id;

                              return (
                                <motion.tr
                                  key={shelter.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: idx * 0.02 }}
                                  onClick={() => handleRowClick(shelter.id)}
                                  className={`border-b border-white/5 cursor-pointer transition-all ${
                                    isSelected
                                      ? "bg-purple-500/20 hover:bg-purple-500/30"
                                      : "hover:bg-slate-800/30"
                                  }`}
                                >
                                  <td className="px-3 py-3 font-medium text-slate-200">
                                    {shelter.name}
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      shelter.status === "OPEN" ? "bg-green-500/20 text-green-300" :
                                      shelter.status === "FULL" ? "bg-red-500/20 text-red-300" :
                                      "bg-gray-500/20 text-gray-300"
                                    }`}>
                                      {shelter.status || "OPEN"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-right">
                                    <span className={`px-2 py-1 rounded font-mono font-bold ${
                                      colorInfo.label === "GREEN" ? "bg-green-500/20 text-green-300" :
                                      colorInfo.label === "YELLOW" ? "bg-yellow-500/20 text-yellow-300" :
                                      "bg-red-500/20 text-red-300"
                                    }`}>
                                      {currentPercent.toFixed(0)}%
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-right">
                                    <span className={`px-2 py-1 rounded font-mono font-bold flex items-center justify-end gap-1 ${
                                      predColorInfo.label === "GREEN" ? "text-green-300" :
                                      predColorInfo.label === "YELLOW" ? "text-yellow-300" :
                                      "text-red-300"
                                    }`}>
                                      {prediction.predicted_percent_1h > currentPercent && (
                                        <TrendingUp size={12} />
                                      )}
                                      {prediction.predicted_percent_1h.toFixed(0)}%
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-right font-mono text-slate-400">
                                    {shelter.current_occupancy} / {shelter.capacity}
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {filteredShelters.length === 0 && (
                          <div className="flex items-center justify-center h-full text-slate-500">
                            <div className="text-center">
                              <Home size={48} className="mx-auto mb-2 opacity-20" />
                              <p className="text-sm">No shelters found</p>
                              <p className="text-xs mt-1">Try adjusting your filters</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Right: Detail Panel (1/3) */}
                  <div className="w-96 flex-shrink-0">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="h-full flex flex-col gap-4"
                    >
                      {selectedShelter && selectedPrediction ? (
                        <>
                          {/* Shelter Detail Card */}
                          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                            <h3 className="text-sm font-bold text-purple-400 tracking-wider mb-4 flex items-center gap-2">
                              <Building2 size={16} />
                              SHELTER DETAIL
                            </h3>

                            <div className="mb-4">
                              <div className="text-lg font-bold text-slate-200 mb-1">
                                {selectedShelter.name}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                ID: {selectedShelter.id}
                              </div>
                            </div>

                            {/* Current Occupancy Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Current Occupancy</span>
                                <span className="font-mono font-bold text-cyan-400">
                                  {selectedShelter.current_occupancy} / {selectedShelter.capacity}
                                </span>
                              </div>
                              <div className="h-3 bg-slate-950/50 rounded-full overflow-hidden border border-slate-700/50">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    getCurrentPercent(selectedShelter) >= 80
                                      ? "bg-gradient-to-r from-red-600 to-red-500"
                                      : getCurrentPercent(selectedShelter) >= 50
                                      ? "bg-gradient-to-r from-yellow-600 to-yellow-500"
                                      : "bg-gradient-to-r from-green-600 to-green-500"
                                  }`}
                                  style={{ width: `${Math.min(getCurrentPercent(selectedShelter), 100)}%` }}
                                />
                              </div>
                              <div className="text-right text-xs font-mono font-bold text-slate-400 mt-1">
                                {getCurrentPercent(selectedShelter).toFixed(1)}%
                              </div>
                            </div>

                            {/* Predicted Occupancy Bar */}
                            <div className="mb-4 pb-4 border-b border-slate-700/50">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Predicted (1 Hour)</span>
                                <span className="font-mono font-bold text-purple-400">
                                  {selectedPrediction.predicted_occupancy_1h} / {selectedShelter.capacity}
                                </span>
                              </div>
                              <div className="h-3 bg-slate-950/50 rounded-full overflow-hidden border border-slate-700/50">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    selectedPrediction.predicted_status_1h === "FULL"
                                      ? "bg-gradient-to-r from-red-600 to-red-500"
                                      : selectedPrediction.predicted_status_1h === "WARNING"
                                      ? "bg-gradient-to-r from-yellow-600 to-yellow-500"
                                      : "bg-gradient-to-r from-green-600 to-green-500"
                                  }`}
                                  style={{ width: `${Math.min(selectedPrediction.predicted_percent_1h, 100)}%` }}
                                />
                              </div>
                              <div className="text-right text-xs font-mono font-bold text-slate-400 mt-1">
                                {selectedPrediction.predicted_percent_1h.toFixed(1)}%
                              </div>
                            </div>

                            {/* Suggested Action */}
                            <div className="bg-slate-950/50 border border-purple-500/20 rounded p-3">
                              <div className="text-xs font-bold text-purple-300 mb-2 uppercase">
                                Suggested Action
                              </div>
                              <div className="text-xs text-slate-300 leading-relaxed">
                                {getSuggestedAction(selectedShelter, predictionContext)}
                              </div>
                            </div>
                          </div>

                          {/* Stats Card */}
                          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                            <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3">
                              SHELTER METRICS
                            </h3>
                            <div className="space-y-2 text-[10px] text-slate-500 font-mono">
                              <div className="flex justify-between">
                                <span>Intake Rate:</span>
                                <span className="text-cyan-400 font-bold">
                                  {selectedShelter.intake_rate_per_min?.toFixed(1) || "N/A"} ppl/min
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Projected Fill Time:</span>
                                <span className="text-purple-400 font-bold">
                                  {(() => {
                                    const remaining = selectedShelter.capacity - selectedShelter.current_occupancy;
                                    const rate = selectedShelter.intake_rate_per_min || 1;
                                    const hours = remaining / (rate * 60);
                                    return hours > 0 ? `${hours.toFixed(1)}h` : "FULL";
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Location:</span>
                                <span className="text-slate-400">
                                  {selectedShelter.location[0].toFixed(3)}°, {selectedShelter.location[1].toFixed(3)}°
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6 flex items-center justify-center h-full">
                          <div className="text-center text-slate-500">
                            <Home size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No shelter selected</p>
                            <p className="text-xs mt-2">
                              Click on a shelter in the table to view details
                            </p>
                          </div>
                        </div>
                      )}
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
