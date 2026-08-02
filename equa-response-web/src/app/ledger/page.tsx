"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Search,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useSystemSettings } from "@/store/systemSettings";

export default function LedgerPage() {
  const { ledgerEntries, clearLedger } = useSystemSettings();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return ledgerEntries;
    
    const lowerSearch = searchTerm.toLowerCase();
    return ledgerEntries.filter(
      (entry) =>
        entry.scenarioId.toLowerCase().includes(lowerSearch) ||
        entry.id.toLowerCase().includes(lowerSearch) ||
        entry.triggeredConstraints.some((c) => c.toLowerCase().includes(lowerSearch))
    );
  }, [ledgerEntries, searchTerm]);

  // Export as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(ledgerEntries, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `decision-ledger-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLedger = () => {
    if (confirm("Clear all ledger entries? This cannot be undone.")) {
      clearLedger();
    }
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDelta = (delta: number) => {
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta.toFixed(1)}`;
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0.5) return <TrendingUp size={14} className="text-red-400" />;
    if (delta < -0.5) return <TrendingDown size={14} className="text-emerald-400" />;
    return <Minus size={14} className="text-slate-500" />;
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex h-full w-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="relative min-w-0 flex-1 overflow-hidden flex flex-col px-8 py-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-3">
                <FileText size={32} />
                DECISION LEDGER
              </h1>
              <p className="mt-2 text-sm text-slate-400 font-mono">
                Audit Trail · Optimization History · Constraint Tracking
              </p>
            </div>

            {/* Controls */}
            <div className="mb-6 flex items-center gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by scenario, ID, or constraint..."
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Export */}
              <button
                onClick={handleExport}
                disabled={ledgerEntries.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-cyan-500/20 border border-cyan-500/30 text-cyan-400
                         hover:bg-cyan-500/30 hover:border-cyan-500/50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all font-bold text-sm"
              >
                <Download size={16} />
                Export JSON
              </button>

              {/* Clear */}
              <button
                onClick={handleClearLedger}
                disabled={ledgerEntries.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-red-500/20 border border-red-500/30 text-red-400
                         hover:bg-red-500/30 hover:border-red-500/50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all font-bold text-sm"
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>

            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-4 gap-4">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                <div className="text-xs text-slate-500 uppercase">Total Entries</div>
                <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                  {ledgerEntries.length}
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                <div className="text-xs text-slate-500 uppercase">Avg α</div>
                <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                  {ledgerEntries.length > 0
                    ? (ledgerEntries.reduce((sum, e) => sum + e.alpha, 0) / ledgerEntries.length).toFixed(2)
                    : "—"}
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                <div className="text-xs text-slate-500 uppercase">Avg Efficiency</div>
                <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                  {ledgerEntries.length > 0
                    ? (ledgerEntries.reduce((sum, e) => sum + e.efficiencyScore, 0) / ledgerEntries.length).toFixed(1)
                    : "—"}
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                <div className="text-xs text-slate-500 uppercase">Avg Equity Variance</div>
                <div className="text-2xl font-mono font-bold text-yellow-400 mt-1">
                  {ledgerEntries.length > 0
                    ? (ledgerEntries.reduce((sum, e) => sum + e.equityVariance, 0) / ledgerEntries.length).toFixed(2)
                    : "—"}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg">
              {filteredEntries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <FileText size={48} className="mb-3 opacity-50" />
                  <p className="text-sm">
                    {ledgerEntries.length === 0
                      ? "No ledger entries yet"
                      : "No entries match your search"}
                  </p>
                  <p className="text-xs mt-1 text-slate-600">
                    {ledgerEntries.length === 0
                      ? "Run an optimization from the Logistics page"
                      : "Try a different search term"}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
                    <tr className="text-left text-xs text-slate-400 uppercase">
                      <th className="px-4 py-3 font-bold">Timestamp</th>
                      <th className="px-4 py-3 font-bold">Scenario</th>
                      <th className="px-4 py-3 font-bold text-center">α</th>
                      <th className="px-4 py-3 font-bold text-right">Efficiency</th>
                      <th className="px-4 py-3 font-bold text-right">Equity Var</th>
                      <th className="px-4 py-3 font-bold text-right">Distance</th>
                      <th className="px-4 py-3 font-bold text-right">Δ Distance</th>
                      <th className="px-4 py-3 font-bold">Constraints</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredEntries.map((entry, idx) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">
                          {formatTimestamp(entry.ts)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <div className="text-xs truncate max-w-[200px]" title={entry.scenarioId}>
                            {entry.scenarioId}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                            {entry.alpha.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-cyan-400">
                          {entry.efficiencyScore.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-yellow-400">
                          {entry.equityVariance.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">
                          {entry.routeDistanceKm.toFixed(1)} km
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {getDeltaIcon(entry.deltaDistanceKm)}
                            <span className={`font-mono text-xs ${
                              entry.deltaDistanceKm > 0.5 ? "text-red-400" :
                              entry.deltaDistanceKm < -0.5 ? "text-emerald-400" :
                              "text-slate-500"
                            }`}>
                              {formatDelta(entry.deltaDistanceKm)} km
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {entry.triggeredConstraints.length === 0 ? (
                              <span className="text-xs text-slate-600">None</span>
                            ) : (
                              entry.triggeredConstraints.slice(0, 2).map((constraint, cidx) => (
                                <span
                                  key={cidx}
                                  className="inline-block px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-mono"
                                  title={constraint}
                                >
                                  {constraint}
                                </span>
                              ))
                            )}
                            {entry.triggeredConstraints.length > 2 && (
                              <span className="text-xs text-slate-600">
                                +{entry.triggeredConstraints.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Info */}
            {filteredEntries.length > 0 && (
              <div className="mt-4 text-xs text-slate-600 font-mono">
                Showing {filteredEntries.length} of {ledgerEntries.length} entries
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
