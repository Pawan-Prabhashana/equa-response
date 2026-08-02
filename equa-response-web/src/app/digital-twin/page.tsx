"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { 
  Clock,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Layers,
  AlertTriangle,
  Home,
  Zap
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useOptimizationStore } from "@/store/optimizationStore";
import { fetchScenarios, fetchScenarioDetails, type DigitalTwinFrame } from "@/lib/api";

// Dynamic import to avoid SSR issues with Leaflet
const MainMap = dynamic(() => import("@/components/map/MainMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <div className="text-cyan-400 font-mono-data">LOADING DIGITAL TWIN...</div>
    </div>
  ),
});

export default function DigitalTwinPage() {
  const {
    digitalTwin,
    twinFrameIndex,
    setDigitalTwin,
    setTwinFrameIndex
  } = useOptimizationStore();

  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [availableScenarios, setAvailableScenarios] = useState<{ id: string; name: string; hasTwin: boolean }[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(false);

  // Load available scenarios on mount
  useEffect(() => {
    async function loadScenarios() {
      try {
        const scenarios = await fetchScenarios();
        const scenariosWithTwinInfo = await Promise.all(
          scenarios.map(async (s) => {
            try {
              const details = await fetchScenarioDetails(s.id);
              return {
                id: s.id,
                name: s.name,
                hasTwin: !!details.digital_twin
              };
            } catch {
              return { id: s.id, name: s.name, hasTwin: false };
            }
          })
        );
        setAvailableScenarios(scenariosWithTwinInfo);
        
        // Auto-select first scenario with digital twin
        const firstWithTwin = scenariosWithTwinInfo.find(s => s.hasTwin);
        if (firstWithTwin) {
          setSelectedScenarioId(firstWithTwin.id);
        }
      } catch (error) {
        console.error("Failed to load scenarios:", error);
      }
    }
    loadScenarios();
  }, []);

  // Load digital twin when scenario selected
  useEffect(() => {
    async function loadDigitalTwin() {
      if (!selectedScenarioId) return;
      
      setIsLoading(true);
      setIsPlaying(false);
      try {
        const scenario = await fetchScenarioDetails(selectedScenarioId);
        if (scenario.digital_twin) {
          setDigitalTwin(scenario.digital_twin);
        } else {
          setDigitalTwin(null);
        }
      } catch (error) {
        console.error("Failed to load digital twin:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDigitalTwin();
  }, [selectedScenarioId, setDigitalTwin]);

  // Get active frame data
  const activeFrame: DigitalTwinFrame | null = useMemo(() => {
    if (!digitalTwin || !digitalTwin.frames || digitalTwin.frames.length === 0) {
      return null;
    }
    return digitalTwin.frames[twinFrameIndex] || digitalTwin.frames[0];
  }, [digitalTwin, twinFrameIndex]);

  // Calculate map center from active frame
  const mapCenter: [number, number] = useMemo(() => {
    if (!activeFrame) return [8.5711, 81.2335]; // Default Trinco
    
    // Use cyclone cone center if available
    if (activeFrame.cyclone_cone?.centerline && activeFrame.cyclone_cone.centerline.length > 0) {
      return activeFrame.cyclone_cone.centerline[0];
    }
    
    // Use first incident location
    if (activeFrame.incidents && activeFrame.incidents.length > 0) {
      return [activeFrame.incidents[0].lat, activeFrame.incidents[0].lon];
    }
    
    return [8.5711, 81.2335];
  }, [activeFrame]);

  // Frame summary stats
  const frameSummary = useMemo(() => {
    if (!activeFrame) return { incidentCount: 0, criticalCount: 0, sheltersAtRisk: 0, roadsBlocked: 0 };
    
    const incidentCount = activeFrame.incidents?.length || 0;
    const criticalCount = activeFrame.incidents?.filter(i => i.severity >= 9).length || 0;
    const sheltersAtRisk = activeFrame.shelters?.filter(s => 
      (s.current_occupancy / s.capacity) >= 0.8
    ).length || 0;
    const roadsBlocked = activeFrame.ghost_roads?.length || 0;
    
    return { incidentCount, criticalCount, sheltersAtRisk, roadsBlocked };
  }, [activeFrame]);

  // Playback controls
  useEffect(() => {
    if (!isPlaying || !digitalTwin) return;
    
    const interval = setInterval(() => {
      setTwinFrameIndex((twinFrameIndex + 1) % digitalTwin.frames.length);
    }, 1000 / playbackSpeed); // Adjust speed
    
    return () => clearInterval(interval);
  }, [isPlaying, twinFrameIndex, digitalTwin, playbackSpeed, setTwinFrameIndex]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handlePrevFrame = () => {
    if (!digitalTwin) return;
    setTwinFrameIndex(Math.max(0, twinFrameIndex - 1));
    setIsPlaying(false);
  };
  const handleNextFrame = () => {
    if (!digitalTwin) return;
    setTwinFrameIndex(Math.min(digitalTwin.frames.length - 1, twinFrameIndex + 1));
    setIsPlaying(false);
  };
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTwinFrameIndex(parseInt(e.target.value));
    setIsPlaying(false);
  };

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
                    <h1 className="text-2xl font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-3">
                      <Layers size={28} />
                      DIGITAL TWIN SIMULATOR
                    </h1>
                    <p className="mt-1 text-xs text-slate-400 font-mono">
                      Time-indexed Scenario Playback · 4D Visualization
                    </p>
                  </div>

                  {/* Scenario Selector */}
                  <div className="flex items-center gap-4">
                    <label className="text-xs text-slate-500 font-mono">SCENARIO:</label>
                    <select
                      value={selectedScenarioId || ""}
                      onChange={(e) => setSelectedScenarioId(e.target.value)}
                      className="bg-slate-900/60 border border-slate-700/50 rounded px-4 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="">Select scenario...</option>
                      {availableScenarios.map((s) => (
                        <option key={s.id} value={s.id} disabled={!s.hasTwin}>
                          {s.name} {!s.hasTwin && "(No Digital Twin)"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Frame Info */}
                {activeFrame && (
                  <div className="mt-3 flex items-center gap-6">
                    <div className="text-xs text-slate-500">
                      Frame: <span className="text-cyan-400 font-bold font-mono">{twinFrameIndex + 1} / {digitalTwin?.frames.length || 0}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Time: <span className="text-purple-400 font-bold font-mono">{activeFrame.label}</span>
                    </div>
                    {digitalTwin && (
                      <div className="text-xs text-slate-500">
                        Sim Time: <span className="text-blue-400 font-mono">
                          {new Date(digitalTwin.start_ts).toLocaleTimeString()} + {twinFrameIndex * digitalTwin.step_minutes}min
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Map Area */}
            <div className="absolute inset-0 pt-32 pb-40">
              {activeFrame ? (
                <MainMap
                  incidents={activeFrame.incidents || []}
                  resources={[]} // No resources in twin mode
                  viewCenter={mapCenter}
                  optimizedRoute={null}
                  ghostRoads={activeFrame.ghost_roads || []}
                  cycloneCone={activeFrame.cyclone_cone || null}
                  floodPolygons={activeFrame.flood_polygons || []}
                  shelters={activeFrame.shelters || []}
                  selectedShelterId={null}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-950">
                  <div className="text-center">
                    <Clock size={64} className="mx-auto mb-4 text-slate-700" />
                    <p className="text-slate-500 text-lg">
                      {isLoading ? "Loading digital twin..." : "No digital twin data available"}
                    </p>
                    <p className="text-slate-600 text-sm mt-2">
                      Select a scenario with digital twin support
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Frame Summary Panel (Top-Right) */}
            {activeFrame && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-40 right-8 z-20 w-72 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-lg p-4"
              >
                <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3">
                  FRAME SUMMARY
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      Incidents
                    </span>
                    <span className="font-mono font-bold text-cyan-400">
                      {frameSummary.incidentCount} ({frameSummary.criticalCount} critical)
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Home size={14} />
                      Shelters at Risk
                    </span>
                    <span className="font-mono font-bold text-yellow-400">
                      {frameSummary.sheltersAtRisk}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Zap size={14} />
                      Roads Blocked
                    </span>
                    <span className="font-mono font-bold text-red-400">
                      {frameSummary.roadsBlocked}
                    </span>
                  </div>
                </div>

                {/* Hazard Status */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Hazard Status</div>
                  <div className={`text-xs font-bold ${
                    activeFrame.label.includes("LANDFALL") ? "text-red-400" :
                    activeFrame.label.includes("T-") ? "text-yellow-400" :
                    "text-green-400"
                  }`}>
                    {activeFrame.label.includes("LANDFALL") ? "🔴 CYCLONE LANDFALL" :
                     activeFrame.label.includes("T-") ? "⚠️ APPROACHING" :
                     "✓ POST-IMPACT RECOVERY"}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Timeline Scrubber (Bottom) */}
            {digitalTwin && digitalTwin.frames.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-8 py-6">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center gap-6">
                    {/* Playback Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevFrame}
                        disabled={twinFrameIndex === 0}
                        className="p-2 rounded bg-slate-800/50 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Previous Frame"
                      >
                        <SkipBack size={18} />
                      </button>
                      
                      {isPlaying ? (
                        <button
                          onClick={handlePause}
                          className="p-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 transition-colors"
                          title="Pause"
                        >
                          <Pause size={20} />
                        </button>
                      ) : (
                        <button
                          onClick={handlePlay}
                          className="p-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 transition-colors"
                          title="Play"
                        >
                          <Play size={20} />
                        </button>
                      )}
                      
                      <button
                        onClick={handleNextFrame}
                        disabled={twinFrameIndex === digitalTwin.frames.length - 1}
                        className="p-2 rounded bg-slate-800/50 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Next Frame"
                      >
                        <SkipForward size={18} />
                      </button>
                    </div>

                    {/* Timeline Slider */}
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max={digitalTwin.frames.length - 1}
                          value={twinFrameIndex}
                          onChange={handleSliderChange}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer
                                   bg-gradient-to-r from-yellow-500 via-red-500 to-green-500
                                   [&::-webkit-slider-thumb]:appearance-none
                                   [&::-webkit-slider-thumb]:w-5
                                   [&::-webkit-slider-thumb]:h-5
                                   [&::-webkit-slider-thumb]:rounded-full
                                   [&::-webkit-slider-thumb]:bg-cyan-400
                                   [&::-webkit-slider-thumb]:shadow-lg
                                   [&::-webkit-slider-thumb]:cursor-pointer
                                   [&::-webkit-slider-thumb]:border-2
                                   [&::-webkit-slider-thumb]:border-slate-900"
                        />
                        
                        {/* Frame Labels */}
                        <div className="flex justify-between mt-2">
                          {digitalTwin.frames.map((frame, idx) => (
                            <div
                              key={idx}
                              className={`text-[9px] font-mono ${
                                idx === twinFrameIndex ? "text-cyan-400 font-bold" : "text-slate-600"
                              }`}
                            >
                              {frame.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Speed Control */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">Speed:</span>
                      <select
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none"
                      >
                        <option value="0.5">0.5×</option>
                        <option value="1.0">1.0×</option>
                        <option value="2.0">2.0×</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
