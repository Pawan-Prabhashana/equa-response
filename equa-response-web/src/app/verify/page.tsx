"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle, XCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useOperationsStore } from "@/store/operationsStore";
import { useScenarioHydration } from "@/hooks/useScenarioHydration";
import { makeMockTruthReports, type TruthReport } from "@/lib/truthEngine";

export default function VerifyPage() {
  const { verifyIncident } = useOperationsStore();
  const { isLoading } = useScenarioHydration();

  const [truthReports] = useState<TruthReport[]>(() => makeMockTruthReports());

  const handleVerify = (report: TruthReport) => {
    verifyIncident(report.id, {
      source: report.source,
      ts: report.ts,
      text: report.text,
      confidence: report.parsed.confidence,
      crossCheckNotes: `Verified via ${report.source} at ${new Date(report.ts).toLocaleString()}`
    });
    alert(`Report verified: ${report.text.slice(0, 50)}...`);
  };

  const handleDebunk = (report: TruthReport) => {
    alert(`Report marked as RUMOR: ${report.text.slice(0, 50)}...`);
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
                <ShieldCheck size={32} />
                VERIFICATION WORKFLOW
              </h1>
              <p className="mt-2 text-sm text-slate-400 font-mono">
                Truth Engine Integration · Evidence Attachment · Incident Validation
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-slate-500">Loading...</div>
              </div>
            ) : (
              <div className="max-w-6xl space-y-4">
                {truthReports.slice(0, 10).map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`px-2 py-1 rounded text-xs font-bold ${
                            report.status === "VERIFIED" ? "bg-emerald-500/20 text-emerald-400" :
                            report.status === "RUMOR" ? "bg-red-500/20 text-red-400" :
                            "bg-cyan-500/20 text-cyan-400"
                          }`}>
                            {report.status}
                          </div>
                          <div className="text-xs text-slate-500">{report.source}</div>
                        </div>
                        <p className="text-sm text-slate-200 mb-3">{report.text}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Hazard: {report.parsed.hazard}</span>
                          <span>Severity: {report.parsed.severity}</span>
                          <span>Confidence: {report.parsed.confidence}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerify(report)}
                          className="flex items-center gap-1 px-3 py-2 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30"
                        >
                          <CheckCircle size={14} />
                          Verify
                        </button>
                        <button
                          onClick={() => handleDebunk(report)}
                          className="flex items-center gap-1 px-3 py-2 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/30"
                        >
                          <XCircle size={14} />
                          Debunk
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
