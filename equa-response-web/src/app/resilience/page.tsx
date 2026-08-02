"use client";

import { motion } from "framer-motion";
import { Shield, Save, RotateCcw, AlertTriangle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useOperationsStore } from "@/store/operationsStore";
import { useScenarioHydration } from "@/hooks/useScenarioHydration";
import { useSystemSettings } from "@/store/systemSettings";

export default function ResiliencePage() {
  const { lastGoodSnapshot, degradedMode, saveSnapshot, restoreSnapshot, setDegradedMode } = useOperationsStore();
  const { incidents, scenarioId } = useScenarioHydration();
  const { dataMode, getDataFreshnessSec } = useSystemSettings();

  const freshness = getDataFreshnessSec();

  const handleSaveSnapshot = () => {
    if (!scenarioId) {
      alert("No scenario loaded");
      return;
    }
    saveSnapshot(scenarioId, incidents);
    alert("Snapshot saved successfully!");
  };

  const handleRestore = () => {
    if (!lastGoodSnapshot) {
      alert("No snapshot available");
      return;
    }
    if (confirm("Restore from snapshot? This will overwrite current operational state.")) {
      restoreSnapshot();
      alert("Snapshot restored!");
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex h-full w-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="relative min-w-0 flex-1 overflow-y-auto px-8 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-3">
                <Shield size={32} />
                RESILIENCE MODE
              </h1>
              <p className="mt-2 text-sm text-slate-400 font-mono">
                Offline/Degraded Operations · Snapshots · Rollback
              </p>
            </div>

            {degradedMode && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center gap-3"
              >
                <AlertTriangle size={24} className="text-red-400" />
                <div>
                  <div className="text-sm font-bold text-red-400">DEGRADED MODE ACTIVE</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Operating with cached data. Real-time comms disabled.
                  </div>
                </div>
              </motion.div>
            )}

            <div className="max-w-4xl space-y-6">
              {/* Status */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                <h2 className="text-sm font-bold text-slate-300 uppercase mb-4">System Status</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded bg-slate-950/50">
                    <div className="text-xs text-slate-500">Data Mode</div>
                    <div className={`text-lg font-mono font-bold mt-1 ${
                      dataMode === "LIVE" ? "text-emerald-400" : "text-orange-400"
                    }`}>
                      {dataMode}
                    </div>
                  </div>
                  <div className="p-4 rounded bg-slate-950/50">
                    <div className="text-xs text-slate-500">Last Fetch</div>
                    <div className="text-lg font-mono font-bold text-slate-300 mt-1">
                      {freshness === Infinity ? "Never" : `${freshness}s ago`}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => setDegradedMode(!degradedMode)}
                    className={`w-full px-4 py-3 rounded-lg border font-bold transition-all ${
                      degradedMode
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                    }`}
                  >
                    {degradedMode ? "EXIT DEGRADED MODE" : "ENTER DEGRADED MODE"}
                  </button>
                </div>
              </div>

              {/* Snapshot Management */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                <h2 className="text-sm font-bold text-slate-300 uppercase mb-4">Snapshot Management</h2>

                {lastGoodSnapshot ? (
                  <div className="mb-4 p-4 rounded bg-cyan-500/10 border border-cyan-500/30">
                    <div className="text-xs text-cyan-400 font-bold mb-2">Last Good Snapshot</div>
                    <div className="text-xs text-slate-300">
                      Saved: {new Date(lastGoodSnapshot.ts).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Scenario: {lastGoodSnapshot.scenarioId} | Incidents: {lastGoodSnapshot.incidents.length} | Missions: {lastGoodSnapshot.missions.length}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-4 rounded bg-slate-950/50 border border-slate-800 text-center">
                    <p className="text-xs text-slate-500">No snapshot saved yet</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveSnapshot}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 font-bold"
                  >
                    <Save size={18} />
                    Save Snapshot
                  </button>
                  <button
                    onClick={handleRestore}
                    disabled={!lastGoodSnapshot}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  >
                    <RotateCcw size={18} />
                    Restore Snapshot
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
