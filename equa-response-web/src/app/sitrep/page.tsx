"use client";

import { FileSpreadsheet, Download, Printer } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useOperationsStore } from "@/store/operationsStore";
import { useScenarioHydration } from "@/hooks/useScenarioHydration";

export default function SITREPPage() {
  const { missions, approvedPlan, commsLog } = useOperationsStore();
  const { incidents, scenarioId } = useScenarioHydration();

  const criticalIncidents = incidents.filter(i => i.severity >= 7);
  const activeMissions = missions.filter(m => ["DISPATCHED", "EN_ROUTE"].includes(m.status));

  const handleExport = () => {
    const sitrep = {
      ts: new Date().toISOString(),
      scenarioId: scenarioId || "unknown",
      summary: {
        totalIncidents: incidents.length,
        criticalIncidents: criticalIncidents.length,
        activeMissions: activeMissions.length,
        messagesInLast24h: commsLog.length
      },
      incidents: incidents.slice(0, 5),
      missions: missions.slice(0, 5),
      approvedPlan: approvedPlan ? {
        alpha: approvedPlan.alpha,
        efficiency: approvedPlan.metrics.efficiencyScore,
        distance: approvedPlan.metrics.routeDistanceKm
      } : null
    };

    const blob = new Blob([JSON.stringify(sitrep, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sitrep-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex h-full w-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="relative min-w-0 flex-1 overflow-y-auto px-8 py-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-3">
                  <FileSpreadsheet size={32} />
                  SITREP GENERATOR
                </h1>
                <p className="mt-2 text-sm text-slate-400 font-mono">
                  Situation Report · Interoperability · Export
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 font-bold text-sm"
                >
                  <Download size={16} />
                  Export JSON
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 font-bold text-sm"
                >
                  <Printer size={16} />
                  Print/PDF
                </button>
              </div>
            </div>

            {/* SITREP Content */}
            <div className="max-w-4xl space-y-6 print:text-black print:bg-white">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                <h2 className="text-lg font-bold text-cyan-400 mb-4">SITUATION REPORT</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-slate-500">Scenario</div>
                    <div className="text-sm text-slate-200 font-mono">{scenarioId || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Timestamp</div>
                    <div className="text-sm text-slate-200 font-mono">{new Date().toLocaleString()}</div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded bg-slate-950/50">
                    <div className="text-xs text-slate-500">Total Incidents</div>
                    <div className="text-2xl font-mono font-bold text-cyan-400">{incidents.length}</div>
                  </div>
                  <div className="p-4 rounded bg-slate-950/50">
                    <div className="text-xs text-slate-500">Critical</div>
                    <div className="text-2xl font-mono font-bold text-red-400">{criticalIncidents.length}</div>
                  </div>
                  <div className="p-4 rounded bg-slate-950/50">
                    <div className="text-xs text-slate-500">Active Missions</div>
                    <div className="text-2xl font-mono font-bold text-yellow-400">{activeMissions.length}</div>
                  </div>
                  <div className="p-4 rounded bg-slate-950/50">
                    <div className="text-xs text-slate-500">Messages (24h)</div>
                    <div className="text-2xl font-mono font-bold text-emerald-400">{commsLog.length}</div>
                  </div>
                </div>

                {/* Top Incidents */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-300 mb-3">Top 5 Incidents</h3>
                  <div className="space-y-2">
                    {incidents.slice(0, 5).map((inc, idx) => (
                      <div key={inc.id} className="p-3 rounded bg-slate-800/50 border border-slate-700/50">
                        <div className="text-xs text-slate-300">
                          {idx + 1}. {inc.type} (Severity: {inc.severity})
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{inc.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Approved Plan Summary */}
                {approvedPlan && (
                  <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/30">
                    <h3 className="text-sm font-bold text-emerald-400 mb-2">Approved Plan</h3>
                    <div className="text-xs text-slate-300">
                      Alpha: {approvedPlan.alpha.toFixed(2)} | Efficiency: {approvedPlan.metrics.efficiencyScore.toFixed(1)} | Distance: {approvedPlan.metrics.routeDistanceKm.toFixed(1)} km
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
