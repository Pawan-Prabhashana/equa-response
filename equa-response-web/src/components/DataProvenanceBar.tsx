"use client";

import { Database, Radio, Satellite, Shield, Clock } from 'lucide-react';
import type { OperationalState } from '@/lib/dataPipeline';
import { getLastFusionAge } from '@/lib/dataPipeline';

interface DataProvenanceBarProps {
  opState: OperationalState;
}

export default function DataProvenanceBar({ opState }: DataProvenanceBarProps) {
  const { sources, validationStats } = opState;

  return (
    <div className="h-full flex items-center justify-center">
      <div className="bg-slate-950/60 border border-cyan-500/30 rounded-lg p-3 max-w-4xl">
        <div className="flex items-center justify-between gap-6">
          {/* Left: Sources */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Radio size={14} className="text-cyan-400" />
              <span className="text-slate-400">Sensors</span>
              <span className="font-mono font-bold text-cyan-400">{sources.sensors.length}</span>
            </div>
            
            <div className="h-3 w-px bg-slate-700" />
            
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-emerald-400" />
              <span className="text-slate-400">Crowd</span>
              <span className="font-mono font-bold text-emerald-400">{sources.crowdReports.length}</span>
            </div>
            
            <div className="h-3 w-px bg-slate-700" />
            
            <div className="flex items-center gap-1.5">
              <Satellite size={14} className="text-purple-400" />
              <span className="text-slate-400">External</span>
              <span className="font-mono font-bold text-purple-400">{sources.externalFeeds.length}</span>
            </div>
            
            <div className="h-3 w-px bg-slate-700" />
            
            <div className="flex items-center gap-1.5">
              <Database size={14} className="text-blue-400" />
              <span className="text-slate-400">Police</span>
              <span className="font-mono font-bold text-blue-400">{sources.policeUpdates}</span>
            </div>
          </div>

          {/* Center: Validation */}
          <div className="flex items-center gap-4 text-xs px-4 border-l border-r border-slate-700">
            <div>
              <span className="text-slate-500">Validated:</span>
              <span className="ml-1.5 font-mono font-bold text-emerald-400">{validationStats.verified}</span>
            </div>
            <div>
              <span className="text-slate-500">Filtered:</span>
              <span className="ml-1.5 font-mono font-bold text-red-400">{validationStats.rumorsFiltered}</span>
            </div>
          </div>

          {/* Right: Last Fusion */}
          <div className="flex items-center gap-2 text-xs">
            <Clock size={14} className="text-slate-500" />
            <span className="text-slate-400">Last fusion:</span>
            <span className="font-mono font-bold text-slate-300">{getLastFusionAge(opState)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
