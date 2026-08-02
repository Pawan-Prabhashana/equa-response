"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Wifi, Zap, ShieldAlert } from "lucide-react";
import { useSystemSettings } from "@/store/systemSettings";
import { useOperationsStore } from "@/store/operationsStore";

export default function TopBar() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const { demoMode, dataMode, role } = useSystemSettings();
  const { degradedMode } = useOperationsStore();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZoneName: "short",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Degraded Mode Banner */}
      {degradedMode && (
        <div className="relative z-50 bg-red-500/20 border-b border-red-500/50 px-6 py-2 flex items-center gap-3 animate-pulse">
          <ShieldAlert size={18} className="text-red-400" />
          <span className="text-xs font-mono-data text-red-400 font-bold">
            DEGRADED MODE: Operating with cached data. Real-time comms disabled.
          </span>
        </div>
      )}

      <header className="relative z-40 h-16 border-b border-primary glass-panel">
        <div className="flex h-full items-center justify-between px-6">
        {/* Left: Status Indicators */}
        <div className="flex items-center gap-6">
          {/* Demo Mode Badge */}
          {demoMode && (
            <>
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-yellow-500/20 border border-yellow-500/50 animate-pulse">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-xs font-mono-data text-yellow-400 font-bold">
                  DEMO MODE
                </span>
              </div>
              <div className="h-4 w-px bg-[var(--border)]" />
            </>
          )}

          {/* Role Badge */}
          {role !== "OPERATOR" && (
            <>
              <div className={`flex items-center gap-2 px-3 py-1 rounded ${
                role === "ANALYST" ? "bg-blue-500/20 border border-blue-500/50" : "bg-slate-500/20 border border-slate-500/50"
              }`}>
                <span className={`text-xs font-mono-data font-bold ${
                  role === "ANALYST" ? "text-blue-400" : "text-muted"
                }`}>
                  {role === "ANALYST" ? "📊 ANALYST" : "👥 PUBLIC"}
                </span>
              </div>
              <div className="h-4 w-px bg-[var(--border)]" />
            </>
          )}
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-emerald-400" />
            <span className="text-xs font-mono-data text-emerald-400">
              LIVE CONNECTION: ESTABLISHED
            </span>
          </div>

          <div className="h-4 w-px bg-[var(--border)]" />

          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500 animate-pulse" />
            <span className="text-xs font-mono-data text-red-500">
              WEATHER: CYCLONE WARNING
            </span>
          </div>

          <div className="h-4 w-px bg-[var(--border)]" />

          <div className="flex items-center gap-2">
            <Activity size={16} className="text-accent" />
            <span className="text-xs font-mono-data text-accent">
              TRACKING: <span className="text-primary font-bold">247</span> EVENTS
            </span>
          </div>
        </div>

        {/* Right: Time Display + Data Mode */}
        <div className="flex items-center gap-4">
          {/* Data Mode Indicator */}
          <div className={`px-3 py-1 rounded border ${
            dataMode === "LIVE"
              ? "bg-emerald-500/20 border-emerald-500/50"
              : "bg-orange-500/20 border-orange-500/50"
          }`}>
            <span className={`text-xs font-mono-data font-bold ${
              dataMode === "LIVE" ? "text-emerald-400" : "text-orange-400"
            }`}>
              {dataMode === "LIVE" ? "🟢 LIVE" : "📦 CACHED"}
            </span>
          </div>

          <div className="h-4 w-px bg-[var(--border)]" />

          <div className="text-xs text-muted uppercase tracking-wider">
            System Time
          </div>
          <div className="rounded border border-primary bg-panel px-3 py-1">
            <span className="font-mono-data text-sm text-accent">
              {currentTime || "00:00:00"}
            </span>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
