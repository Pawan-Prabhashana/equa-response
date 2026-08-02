"use client";

import { useState } from "react";
import IntelHUD from "@/components/hud/IntelHUD";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import type { TruthReport } from "@/lib/truthEngine";

export default function TruthEnginePage() {
  const [selectedReport, setSelectedReport] = useState<TruthReport | null>(null);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex h-full w-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="relative min-w-0 flex-1 overflow-hidden">
            {/* Header Section */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent px-8 py-6 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-cyan-400 tracking-wider uppercase">
                  Truth Engine
                </h1>
                <p className="mt-2 text-sm text-slate-400 font-mono">
                  Verified vs Rumor Classification · Front-End Singlish NLP Mock
                </p>
              </div>
            </div>

            {/* Main Content - Split Layout */}
            <div className="absolute inset-0 pt-28 px-8 pb-8">
              <div className="h-full max-w-7xl mx-auto">
                <div className="flex gap-6 h-full">
                  {/* Left: Truth Feed (IntelHUD) */}
                  <div className="flex-1 min-w-0">
                    <IntelHUD onReportClick={setSelectedReport} />
                  </div>

                  {/* Right: Parsed Facts Inspector */}
                  <div className="w-96 flex-shrink-0">
                    <div className="h-full flex flex-col bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
                      {/* Inspector Header */}
                      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
                        <h2 className="text-sm font-bold text-cyan-400 tracking-wider">
                          PARSED FACTS INSPECTOR
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          Click report to inspect NLP output
                        </p>
                      </div>

                      {/* Inspector Content */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {selectedReport ? (
                          <div className="space-y-4">
                            {/* Original Text */}
                            <div>
                              <div className="text-xs font-bold text-slate-400 mb-1">
                                ORIGINAL TEXT
                              </div>
                              <div className="text-sm text-slate-200 bg-slate-950/50 p-3 rounded border border-white/5">
                                {selectedReport.text}
                              </div>
                            </div>

                            {/* Status */}
                            <div>
                              <div className="text-xs font-bold text-slate-400 mb-1">
                                TRUTH STATUS
                              </div>
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold ${
                                selectedReport.status === "VERIFIED" ? "bg-emerald-500/20 text-emerald-400" :
                                selectedReport.status === "RUMOR" ? "bg-red-500/20 text-red-400" :
                                "bg-cyan-500/20 text-cyan-400"
                              }`}>
                                {selectedReport.status === "VERIFIED" && "✓ "}
                                {selectedReport.status === "RUMOR" && "✕ "}
                                {selectedReport.status === "UNVERIFIED" && "○ "}
                                {selectedReport.status}
                              </div>
                            </div>

                            {/* Parsed Fields */}
                            <div className="space-y-3">
                              <div className="text-xs font-bold text-slate-400">
                                NLP EXTRACTION
                              </div>

                              {/* Hazard */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Hazard</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  selectedReport.parsed.hazard === "FLOOD" ? "bg-blue-500/20 text-blue-300" :
                                  selectedReport.parsed.hazard === "LANDSLIDE" ? "bg-orange-500/20 text-orange-300" :
                                  selectedReport.parsed.hazard === "CYCLONE" ? "bg-yellow-500/20 text-yellow-300" :
                                  "bg-gray-500/20 text-gray-400"
                                }`}>
                                  {selectedReport.parsed.hazard}
                                </span>
                              </div>

                              {/* Severity */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Severity</span>
                                <span className={`text-xs font-bold ${
                                  selectedReport.parsed.severity === "CRITICAL" ? "text-red-400" :
                                  selectedReport.parsed.severity === "HIGH" ? "text-orange-400" :
                                  selectedReport.parsed.severity === "MEDIUM" ? "text-yellow-400" :
                                  "text-green-400"
                                }`}>
                                  {selectedReport.parsed.severity}
                                </span>
                              </div>

                              {/* Trend */}
                              {selectedReport.parsed.trend && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-500">Trend</span>
                                  <span className={`text-xs font-bold flex items-center gap-1 ${
                                    selectedReport.parsed.trend === "INCREASING" ? "text-red-400" :
                                    selectedReport.parsed.trend === "DECREASING" ? "text-green-400" :
                                    "text-slate-400"
                                  }`}>
                                    {selectedReport.parsed.trend === "INCREASING" && "↗"}
                                    {selectedReport.parsed.trend === "DECREASING" && "↘"}
                                    {selectedReport.parsed.trend}
                                  </span>
                                </div>
                              )}

                              {/* Confidence */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Confidence</span>
                                <span className={`text-xs font-mono font-bold ${
                                  selectedReport.parsed.confidence === "HIGH" ? "text-emerald-400" :
                                  selectedReport.parsed.confidence === "MEDIUM" ? "text-yellow-400" :
                                  "text-red-400"
                                }`}>
                                  {selectedReport.parsed.confidence}
                                </span>
                              </div>

                              {/* Location */}
                              {selectedReport.parsed.locationHint && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-500">Location</span>
                                  <span className="text-xs text-cyan-400 font-mono">
                                    {selectedReport.parsed.locationHint}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Keywords */}
                            <div>
                              <div className="text-xs font-bold text-slate-400 mb-2">
                                MATCHED KEYWORDS
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {selectedReport.parsed.keywords.map((kw, idx) => (
                                  <span 
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800/50 text-slate-300 border border-white/5"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Metadata */}
                            <div className="space-y-2 pt-3 border-t border-white/5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500">Source</span>
                                <span className="text-slate-300 font-mono">{selectedReport.source}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500">Timestamp</span>
                                <span className="text-slate-300 font-mono">
                                  {new Date(selectedReport.ts).toLocaleString()}
                                </span>
                              </div>
                              {selectedReport.geo && (
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500">Coordinates</span>
                                  <span className="text-cyan-400 font-mono">
                                    [{selectedReport.geo[0].toFixed(4)}, {selectedReport.geo[1].toFixed(4)}]
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-center">
                            <div className="space-y-2">
                              <div className="text-slate-600 text-sm">
                                No report selected
                              </div>
                              <div className="text-slate-500 text-xs">
                                Click on any report from the feed
                                <br />
                                to inspect parsed NLP data
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
