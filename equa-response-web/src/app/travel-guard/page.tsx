"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  MapPin,
  Globe,
  Users,
  Shield,
  Navigation,
  AlertTriangle
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { fetchScenarios, fetchScenarioDetails, type ScenarioDetails } from "@/lib/api";
import {
  processTravelGuardRequest,
  getRiskColor,
  getAlertColor,
  type TouristRequest,
  type TravelGuardResult
} from "@/lib/travelGuard";

// Dynamic import for map
const MainMap = dynamic(() => import("@/components/map/MainMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <div className="text-cyan-400 font-mono-data">LOADING MAP...</div>
    </div>
  ),
});

export default function TravelGuardPage() {
  // Scenario state
  const [scenarios, setScenarios] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioDetails | null>(null);

  // Form state
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [language, setLanguage] = useState<"EN" | "DE" | "SI">("EN");
  const [headcount, setHeadcount] = useState<string>("");

  // Result state
  const [result, setResult] = useState<TravelGuardResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load scenarios on mount
  useEffect(() => {
    async function loadScenarios() {
      try {
        const list = await fetchScenarios();
        setScenarios(list);
        
        // Auto-select cyclone scenario (has travel_guard)
        const cyclone = list.find(s => s.id.includes("cyclone"));
        if (cyclone) {
          setSelectedScenarioId(cyclone.id);
        } else if (list.length > 0) {
          setSelectedScenarioId(list[0].id);
        }
      } catch (error) {
        console.error("Failed to load scenarios:", error);
      }
    }
    loadScenarios();
  }, []);

  // Load scenario details when selected
  useEffect(() => {
    async function loadScenarioDetails() {
      if (!selectedScenarioId) return;
      
      try {
        const details = await fetchScenarioDetails(selectedScenarioId);
        setScenario(details);
      } catch (error) {
        console.error("Failed to load scenario:", error);
      }
    }
    loadScenarioDetails();
  }, [selectedScenarioId]);

  // Handle corridor generation
  const handleGenerateCorridor = () => {
    if (!scenario || !scenario.travel_guard) {
      alert("This scenario doesn't have Travel-Guard configuration");
      return;
    }
    
    if (!locationQuery.trim()) {
      alert("Please enter a location");
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate processing delay for realism
    setTimeout(() => {
      const request: TouristRequest = {
        query: locationQuery,
        language,
        headcount: headcount ? parseInt(headcount) : undefined
      };
      
      const travelResult = processTravelGuardRequest(
        request,
        scenario.travel_guard!,
        {
          cycloneCone: scenario.cyclone_cone,
          floodPolygons: scenario.flood_polygons,
          ghostRoads: scenario.ghost_roads
        }
      );
      
      setResult(travelResult);
      setIsProcessing(false);
    }, 400);
  };

  // Calculate map center and bounds
  const mapCenter: [number, number] = useMemo(() => {
    if (result) {
      return result.resolvedLocation;
    }
    return scenario?.center as [number, number] || [8.5711, 81.2335];
  }, [result, scenario]);

  // Prepare map data for corridor visualization
  const corridorPolyline = result?.corridor?.path || null;
  const touristMarker = result ? { location: result.resolvedLocation, name: result.resolvedName } : null;
  const destinationMarker = result ? { location: result.destination.location, name: result.destination.name } : null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex h-full w-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="relative min-w-0 flex-1 overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent px-8 py-4 backdrop-blur-sm border-b border-white/5">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-3">
                      <Shield size={28} />
                      TRAVEL-GUARD
                    </h1>
                    <p className="mt-1 text-xs text-slate-400 font-mono">
                      Tourist Safety System · Safe Corridor Generation · Multilingual Alerts
                    </p>
                  </div>

                  {/* Scenario Selector */}
                  <select
                    value={selectedScenarioId || ""}
                    onChange={(e) => setSelectedScenarioId(e.target.value)}
                    className="bg-slate-900/60 border border-slate-700/50 rounded px-4 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                  >
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="absolute inset-0 pt-28 px-8 pb-8">
              <div className="h-full max-w-7xl mx-auto flex gap-6">
                {/* Left Panel: Input Form */}
                <div className="w-96 flex-shrink-0">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="h-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6 overflow-y-auto"
                  >
                    <h2 className="text-sm font-bold text-emerald-400 tracking-wider mb-4 flex items-center gap-2">
                      <MapPin size={16} />
                      TOURIST LOCATION
                    </h2>

                    {/* Location Input */}
                    <div className="mb-4">
                      <label className="block text-xs text-slate-400 mb-2">
                        Location (Place name or lat,lon)
                      </label>
                      <input
                        type="text"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        placeholder="e.g., Nilaveli Beach or 8.68,81.19"
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                      />
                      <p className="text-[10px] text-slate-600 mt-1">
                        Try: Nilaveli, Trincomalee, Pigeon Island, Uppuveli
                      </p>
                    </div>

                    {/* Language Selector */}
                    <div className="mb-4">
                      <label className="block text-xs text-slate-400 mb-2 flex items-center gap-2">
                        <Globe size={14} />
                        Alert Language
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["EN", "DE", "SI"] as const).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`px-3 py-2 rounded text-xs font-bold transition-all ${
                              language === lang
                                ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800"
                            }`}
                          >
                            {lang === "EN" ? "English" : lang === "DE" ? "Deutsch" : "සිංහල"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Headcount (Optional) */}
                    <div className="mb-6">
                      <label className="block text-xs text-slate-400 mb-2 flex items-center gap-2">
                        <Users size={14} />
                        Headcount (Optional)
                      </label>
                      <input
                        type="number"
                        value={headcount}
                        onChange={(e) => setHeadcount(e.target.value)}
                        placeholder="Number of tourists"
                        min="1"
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>

                    {/* Generate Button */}
                    <button
                      onClick={handleGenerateCorridor}
                      disabled={isProcessing || !locationQuery.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                               bg-emerald-500/20 border border-emerald-500/30 text-emerald-400
                               hover:bg-emerald-500/30 hover:border-emerald-500/50
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all font-bold text-sm"
                    >
                      <Navigation size={18} />
                      {isProcessing ? "PROCESSING..." : "GENERATE SAFE CORRIDOR"}
                    </button>

                    {/* Resolved Location Display */}
                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 rounded bg-slate-950/50 border border-emerald-500/20"
                      >
                        <div className="text-[10px] text-slate-500 uppercase mb-1">Resolved Location</div>
                        <div className="text-xs text-emerald-400 font-mono">
                          {result.resolvedLocation[0].toFixed(4)}, {result.resolvedLocation[1].toFixed(4)}
                        </div>
                        <div className="text-xs text-slate-300 mt-1">
                          {result.resolvedName}
                        </div>
                      </motion.div>
                    )}

                    {/* Risk Assessment */}
                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`mt-4 p-4 rounded border ${getRiskColor(result.risk.level).bg} ${getRiskColor(result.risk.level).border}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={16} className={getRiskColor(result.risk.level).text} />
                          <div className={`text-sm font-bold ${getRiskColor(result.risk.level).text}`}>
                            RISK: {result.risk.level}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {result.risk.reasons.map((reason, idx) => (
                            <div key={idx} className="text-xs text-slate-300">
                              • {reason}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Route Info */}
                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 p-4 rounded bg-cyan-900/20 border border-cyan-500/30"
                      >
                        <div className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-2">
                          <Navigation size={14} />
                          ROUTE TO: {result.destination.name}
                        </div>
                        <div className="space-y-1 text-xs text-slate-300">
                          <div>Distance: <span className="font-mono text-cyan-400">{result.distanceKm?.toFixed(0)} km</span></div>
                          <div>Est. Time: <span className="font-mono text-cyan-400">{result.estimatedTimeHours?.toFixed(1)} hours</span></div>
                          <div>Type: <span className="font-mono">{result.destination.type}</span></div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                {/* Center: Map */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="h-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden relative"
                  >
                    {scenario ? (
                      <TravelGuardMap
                        scenario={scenario}
                        center={mapCenter}
                        touristMarker={touristMarker}
                        destinationMarker={destinationMarker}
                        corridorPath={corridorPolyline}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-slate-500">Loading scenario...</div>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Right Panel: Alerts */}
                <div className="w-96 flex-shrink-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="h-full overflow-y-auto space-y-4"
                  >
                    <AnimatePresence mode="wait">
                      {result ? (
                        result.alerts.map((alert, idx) => {
                          const colors = getAlertColor(alert.severity);
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`${colors.bg} backdrop-blur-xl border ${colors.border} rounded-lg p-5`}
                            >
                              <h3 className="text-sm font-bold text-white mb-3">
                                {alert.title}
                              </h3>
                              <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                                {alert.body}
                              </div>
                              <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-slate-500 font-mono">
                                Language: {alert.lang} | Severity: {alert.severity}
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6 text-center"
                        >
                          <Shield size={48} className="mx-auto mb-3 text-slate-700" />
                          <p className="text-slate-500 text-sm">No alerts generated</p>
                          <p className="text-slate-600 text-xs mt-2">
                            Enter a location and click “Generate Safe Corridor”
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TRAVEL-GUARD MAP COMPONENT
// ============================================

interface TravelGuardMapProps {
  scenario: ScenarioDetails;
  center: [number, number];
  touristMarker: { location: [number, number]; name: string } | null;
  destinationMarker: { location: [number, number]; name: string } | null;
  corridorPath: Array<[number, number]> | null;
}

function TravelGuardMap({
  scenario,
  center,
  touristMarker,
  destinationMarker,
  corridorPath
}: TravelGuardMapProps) {
  return (
    <div className="relative w-full h-full">
      {/* Use MainMap with scenario data + corridor overlay */}
      <MainMap
        incidents={[]} // Don't show incidents (focus on tourist route)
        resources={[]}
        viewCenter={center}
        optimizedRoute={null}
        ghostRoads={scenario.ghost_roads || []}
        cycloneCone={scenario.cyclone_cone || null}
        floodPolygons={scenario.flood_polygons || []}
        shelters={[]} // Don't clutter with shelters
        selectedShelterId={null}
        touristMarker={touristMarker}
        destinationMarker={destinationMarker}
        corridorPath={corridorPath}
      />

      {/* Info Cards Overlay */}
      {touristMarker && (
        <div className="absolute top-4 right-4 z-10 bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/50 rounded-lg px-4 py-2">
          <div className="text-xs text-emerald-400 font-bold">📍 Your Location</div>
          <div className="text-[10px] text-slate-300 mt-1">{touristMarker.name}</div>
        </div>
      )}
      
      {destinationMarker && (
        <div className="absolute top-20 right-4 z-10 bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/50 rounded-lg px-4 py-2">
          <div className="text-xs text-cyan-400 font-bold">✈️ Safe Destination</div>
          <div className="text-[10px] text-slate-300 mt-1">{destinationMarker.name}</div>
        </div>
      )}
    </div>
  );
}
