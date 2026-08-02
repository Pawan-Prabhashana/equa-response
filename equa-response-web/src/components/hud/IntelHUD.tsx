"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  makeMockTruthReports,
  generateRandomReport,
  type TruthReport,
  type TruthStatus
} from "@/lib/truthEngine";

// ============================================
// TYPES
// ============================================

interface IntelHUDProps {
  scenarioId?: string;
  isOptimizing?: boolean;
  onReportClick?: (report: TruthReport) => void;
}

// ============================================
// STATUS ICON COMPONENT
// ============================================

function StatusIcon({ status }: { status: TruthStatus }) {
  if (status === "VERIFIED") {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
        ✓
      </span>
    );
  }
  
  if (status === "RUMOR") {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
        ✕
      </span>
    );
  }
  
  return (
    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30">
      ○
    </span>
  );
}

// ============================================
// HAZARD BADGE COMPONENT
// ============================================

function HazardBadge({ hazard }: { hazard: string }) {
  const colors: Record<string, string> = {
    FLOOD: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    LANDSLIDE: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    CYCLONE: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    UNKNOWN: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${colors[hazard] || colors.UNKNOWN}`}>
      {hazard}
    </span>
  );
}

// ============================================
// CONFIDENCE BADGE
// ============================================

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const colors: Record<string, string> = {
    HIGH: "text-emerald-400",
    MEDIUM: "text-yellow-400",
    LOW: "text-red-400"
  };
  
  return (
    <span className={`font-mono text-[10px] ${colors[confidence] || colors.MEDIUM}`}>
      {confidence}
    </span>
  );
}

// ============================================
// REPORT ROW COMPONENT
// ============================================

function ReportRow({ report, onClick }: { report: TruthReport; onClick: () => void }) {
  const time = new Date(report.ts);
  const timeStr = time.toLocaleTimeString("en-US", { 
    hour12: false, 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit" 
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="group relative flex gap-2 p-2.5 rounded-lg border border-white/5 
                 bg-slate-900/40 backdrop-blur-sm cursor-pointer
                 hover:bg-slate-800/50 hover:border-cyan-500/20 transition-all"
    >
      {/* Status Icon */}
      <div className="flex-shrink-0 pt-0.5">
        <StatusIcon status={report.status} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Message Text */}
        <p className="text-slate-200 text-xs leading-relaxed line-clamp-2 group-hover:text-white transition-colors">
          {report.text}
        </p>
        
        {/* Metadata Row */}
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
          <span className="font-mono text-cyan-400">{timeStr}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span className="uppercase">{report.source}</span>
          {report.parsed.locationHint && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-cyan-400">{report.parsed.locationHint}</span>
            </>
          )}
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span className={`font-semibold ${
            report.parsed.severity === "CRITICAL" ? "text-red-400" :
            report.parsed.severity === "HIGH" ? "text-orange-400" :
            report.parsed.severity === "MEDIUM" ? "text-yellow-400" :
            "text-green-400"
          }`}>
            {report.parsed.severity}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <ConfidenceBadge confidence={report.parsed.confidence} />
        </div>
      </div>
      
      {/* Hazard Badge */}
      <div className="flex-shrink-0">
        <HazardBadge hazard={report.parsed.hazard} />
      </div>
      
      {/* Trend Indicator (optional) */}
      {report.parsed.trend && (
        <div className="absolute top-2 right-2 text-[10px]">
          {report.parsed.trend === "INCREASING" && <span className="text-red-400">↗</span>}
          {report.parsed.trend === "DECREASING" && <span className="text-green-400">↘</span>}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// INTEL HUD MAIN COMPONENT
// ============================================

export default function IntelHUD({ isOptimizing, onReportClick }: IntelHUDProps) {
  const [reports, setReports] = useState<TruthReport[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Count statistics
  const verifiedCount = reports.filter(r => r.status === "VERIFIED").length;
  const rumorCount = reports.filter(r => r.status === "RUMOR").length;
  
  // Load initial reports on the client only. makeMockTruthReports() uses
  // Math.random(), so seeding this via a useState initializer would produce an
  // SSR/client hydration mismatch — populating it in a mount effect is intentional.
  useEffect(() => {
    const initial = makeMockTruthReports();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReports(initial);
  }, []);
  
  // Stream new reports
  useEffect(() => {
    const interval = setInterval(() => {
      const newReport = generateRandomReport();
      setReports(prev => {
        const updated = [newReport, ...prev];
        // Keep max 30 reports
        return updated.slice(0, 30);
      });
    }, 2500 + Math.random() * 2000); // 2.5-4.5s jitter
    
    return () => clearInterval(interval);
  }, []);
  
  // Auto-scroll to top when new report arrives (if already at top)
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [reports, isAtBottom]);
  
  // Track if user is at bottom
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop } = scrollRef.current;
    setIsAtBottom(scrollTop < 50);
  };
  
  return (
    <div className="flex flex-col h-full bg-slate-950/60 backdrop-blur-xl border-l border-white/10">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-cyan-400 tracking-wider">
              TRUTH ENGINE FEED
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
              LIVE INTEL STREAM
            </p>
          </div>
          
          {/* Mini Stats */}
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-400">{verifiedCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-400">{rumorCount}</span>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <span className="text-emerald-400">✓</span>
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-400">✕</span>
            <span>Rumor</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-cyan-400">○</span>
            <span>Unverified</span>
          </div>
        </div>
      </div>
      
      {/* Feed List */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        <AnimatePresence mode="popLayout">
          {reports.map(report => (
            <ReportRow
              key={report.id}
              report={report}
              onClick={() => {
                setExpandedId(expandedId === report.id ? null : report.id);
                if (onReportClick) {
                  onReportClick(report);
                }
              }}
            />
          ))}
        </AnimatePresence>
      </div>
      
      {/* Status Bar */}
      {isOptimizing && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-white/10 bg-purple-500/10">
          <div className="flex items-center gap-2 text-[10px] text-purple-300">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="font-mono">ROUTE OPTIMIZATION IN PROGRESS</span>
          </div>
        </div>
      )}
    </div>
  );
}
