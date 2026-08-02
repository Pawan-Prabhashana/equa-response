"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Monitor,
  Gauge,
  Shield,
  Database,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Zap,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import {
  useSystemSettings,
  type ThemePreset,
  type Density,
  type Role,
  type StreamSpeed,
  hasPermission,
} from "@/store/systemSettings";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const {
    themePreset,
    density,
    reduceMotion,
    demoMode,
    streamSpeed,
    role,
    dataMode,
    enableDecisionLedger,
    ledgerEntries,
    getDataFreshnessSec,
    setThemePreset,
    setDensity,
    setReduceMotion,
    setDemoMode,
    setStreamSpeed,
    setRole,
    setDataMode,
    setEnableDecisionLedger,
    resetDemoState,
  } = useSystemSettings();

  const [verifyingLayers, setVerifyingLayers] = useState(false);
  const [layerVerification, setLayerVerification] = useState<Array<{ name: string; status: "pass" | "fail" | "warn"; message: string }> | null>(null);

  const dataFreshness = getDataFreshnessSec();
  const isDataStale = dataFreshness > 60;

  const handleVerifyLayers = async () => {
    setVerifyingLayers(true);
    
    // Simulate verification (in real app, would fetch and validate)
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const results = [
      { name: "Cyclone Cone", status: "pass" as const, message: "Polygon valid, 7 vertices" },
      { name: "Flood Polygons", status: "pass" as const, message: "3 polygons, depths valid" },
      { name: "Ghost Roads", status: "warn" as const, message: "2/3 roads have recent updates" },
      { name: "Shelters", status: "pass" as const, message: "4 shelters, capacity data OK" },
      { name: "Incidents", status: "pass" as const, message: "8 incidents, all geocoded" },
      { name: "Digital Twin", status: "pass" as const, message: "8 frames, complete timeline" },
    ];
    
    setLayerVerification(results);
    setVerifyingLayers(false);
  };

  const handleResetDemo = () => {
    if (confirm("Reset demo state? This will clear the decision ledger and reset simulation controls.")) {
      resetDemoState();
    }
  };

  const handleViewLedger = () => {
    router.push("/ledger");
  };

  const isOperator = hasPermission(role, "OPERATOR");

  return (
    <div className="h-screen w-screen overflow-hidden bg-primary text-primary">
      <div className="flex h-full w-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="relative min-w-0 flex-1 overflow-y-auto px-8 py-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-accent tracking-wider uppercase flex items-center gap-3">
                <SettingsIcon size={32} />
                SYSTEM OPS
              </h1>
              <p className="mt-2 text-sm text-muted font-mono">
                Operational Controls · Theme · Simulation · Role-Based Access · Data Integrity
              </p>
            </div>

            <div className="max-w-6xl space-y-6">
              {/* Display Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-panel backdrop-blur-xl rounded-lg p-6"
              >
                <h2 className="text-sm font-bold text-primary tracking-wider uppercase flex items-center gap-2 mb-4">
                  <Monitor size={18} />
                  Display
                </h2>

                <div className="space-y-6">
                  {/* Theme Preset */}
                  <div>
                    <label className="block text-xs text-muted mb-2">Theme Preset</label>
                    <div className="flex gap-2">
                      {(["COMMAND", "DAWN", "STEALTH"] as ThemePreset[]).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setThemePreset(theme)}
                          className={`flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-bold ${
                            themePreset === theme
                              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                              : "bg-panel border-primary text-muted hover:bg-[var(--panel)] hover:border-[var(--accent)]"
                          }`}
                        >
                          {theme === "COMMAND" && "⚡ Command"}
                          {theme === "DAWN" && "☀️ Dawn"}
                          {theme === "STEALTH" && "🌙 Stealth"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Density */}
                  <div>
                    <label className="block text-xs text-muted mb-2">Interface Density</label>
                    <div className="flex gap-2">
                      {(["COMPACT", "COMFORTABLE"] as Density[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDensity(d)}
                          className={`flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-bold ${
                            density === d
                              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                              : "bg-panel border-primary text-muted hover:bg-[var(--panel)] hover:border-[var(--accent)]"
                          }`}
                        >
                          {d === "COMPACT" ? "Compact" : "Comfortable"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reduce Motion */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted">Reduce Motion</div>
                      <div className="text-[10px] text-muted opacity-60 mt-0.5">
                        Disable animations (accessibility)
                      </div>
                    </div>
                    <button
                      onClick={() => setReduceMotion(!reduceMotion)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        reduceMotion ? "bg-cyan-500/30" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                          reduceMotion ? "translate-x-7" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Operations Mode */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6"
              >
                <h2 className="text-sm font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2 mb-4">
                  <Shield size={18} />
                  Operations Mode
                </h2>

                <div className="space-y-6">
                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["OPERATOR", "ANALYST", "PUBLIC"] as Role[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`px-4 py-3 rounded-lg border transition-all text-sm font-bold ${
                            role === r
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                              : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600"
                          }`}
                        >
                          {r === "OPERATOR" && "👨‍✈️ Operator"}
                          {r === "ANALYST" && "📊 Analyst"}
                          {r === "PUBLIC" && "👥 Public"}
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-2">
                      {role === "OPERATOR" && "Full access to all controls"}
                      {role === "ANALYST" && "Read-only access to most features"}
                      {role === "PUBLIC" && "Limited public dashboard view"}
                    </div>
                  </div>

                  {/* Demo Mode */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                    <div>
                      <div className="text-xs text-slate-300 font-bold flex items-center gap-2">
                        <Zap size={14} className="text-yellow-400" />
                        Demo Mode
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        Shows “DEMO” badge in status bar
                      </div>
                    </div>
                    <button
                      onClick={() => setDemoMode(!demoMode)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        demoMode ? "bg-yellow-500/30" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                          demoMode ? "translate-x-7" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Simulation Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6"
              >
                <h2 className="text-sm font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2 mb-4">
                  <Gauge size={18} />
                  Simulation Controls
                </h2>

                <div className="space-y-6">
                  {/* Stream Speed */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">
                      Event Stream Speed (Truth Engine)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {([0.5, 1, 2, 4] as StreamSpeed[]).map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setStreamSpeed(speed)}
                          disabled={!isOperator}
                          className={`px-4 py-3 rounded-lg border transition-all text-sm font-bold ${
                            streamSpeed === speed
                              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                              : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          }`}
                        >
                          {speed}×
                        </button>
                      ))}
                    </div>
                    {!isOperator && (
                      <div className="text-[10px] text-orange-400 mt-2">
                        ⚠️ Operator-only control
                      </div>
                    )}
                  </div>

                  {/* Reset Demo State */}
                  <button
                    onClick={handleResetDemo}
                    disabled={!isOperator}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                             bg-red-500/20 border border-red-500/30 text-red-400
                             hover:bg-red-500/30 hover:border-red-500/50
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all font-bold text-sm"
                  >
                    <RefreshCw size={16} />
                    Reset Demo State
                  </button>
                </div>
              </motion.div>

              {/* Data & Integrity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6"
              >
                <h2 className="text-sm font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2 mb-4">
                  <Database size={18} />
                  Data & Integrity
                </h2>

                <div className="space-y-6">
                  {/* Data Mode */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Data Mode</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDataMode("LIVE")}
                        disabled={!isOperator}
                        className={`flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-bold ${
                          dataMode === "LIVE"
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                            : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                      >
                        🟢 LIVE
                      </button>
                      <button
                        onClick={() => setDataMode("CACHED")}
                        disabled={!isOperator}
                        className={`flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-bold ${
                          dataMode === "CACHED"
                            ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                            : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                      >
                        📦 CACHED
                      </button>
                    </div>
                  </div>

                  {/* Data Freshness */}
                  <div className={`p-4 rounded-lg border ${
                    isDataStale
                      ? "bg-orange-500/10 border-orange-500/30"
                      : "bg-slate-950/50 border-slate-800"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-300 font-bold">Data Freshness</div>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          {dataFreshness === Infinity
                            ? "No data fetched yet"
                            : `Last fetch: ${dataFreshness}s ago`}
                        </div>
                      </div>
                      {isDataStale && (
                        <AlertTriangle size={20} className="text-orange-400" />
                      )}
                    </div>
                  </div>

                  {/* Verify Layers */}
                  <button
                    onClick={handleVerifyLayers}
                    disabled={verifyingLayers}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                             bg-cyan-500/20 border border-cyan-500/30 text-cyan-400
                             hover:bg-cyan-500/30 hover:border-cyan-500/50
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all font-bold text-sm"
                  >
                    {verifyingLayers ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Verify Layers
                      </>
                    )}
                  </button>

                  {/* Verification Results */}
                  {layerVerification && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      {layerVerification.map((result, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            result.status === "pass"
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : result.status === "warn"
                              ? "bg-yellow-500/10 border-yellow-500/30"
                              : "bg-red-500/10 border-red-500/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {result.status === "pass" && <CheckCircle size={14} className="text-emerald-400" />}
                            {result.status === "warn" && <AlertTriangle size={14} className="text-yellow-400" />}
                            {result.status === "fail" && <XCircle size={14} className="text-red-400" />}
                            <div className="text-xs font-bold text-slate-200">{result.name}</div>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 ml-6">
                            {result.message}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Decision Ledger */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6"
              >
                <h2 className="text-sm font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2 mb-4">
                  <FileText size={18} />
                  Decision Ledger
                </h2>

                <div className="space-y-6">
                  {/* Enable Ledger */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-300 font-bold">Enable Decision Ledger</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        Records optimization decisions for audit trail
                      </div>
                    </div>
                    <button
                      onClick={() => setEnableDecisionLedger(!enableDecisionLedger)}
                      disabled={!isOperator}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        enableDecisionLedger ? "bg-emerald-500/30" : "bg-slate-700"
                      } ${!isOperator ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                          enableDecisionLedger ? "translate-x-7" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Ledger Status */}
                  <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-300 font-bold">Ledger Entries</div>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          {ledgerEntries.length} {ledgerEntries.length === 1 ? "entry" : "entries"} recorded
                        </div>
                      </div>
                      <div className="text-2xl font-mono font-bold text-cyan-400">
                        {ledgerEntries.length}
                      </div>
                    </div>
                  </div>

                  {/* View Ledger Button */}
                  <button
                    onClick={handleViewLedger}
                    disabled={ledgerEntries.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                             bg-cyan-500/20 border border-cyan-500/30 text-cyan-400
                             hover:bg-cyan-500/30 hover:border-cyan-500/50
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all font-bold text-sm"
                  >
                    <Eye size={16} />
                    View Ledger
                  </button>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
