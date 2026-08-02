"use client";

import { AlertTriangle, Users, Package, Shield } from 'lucide-react';

interface ScenarioMetricsCardProps {
  incidentCount: number;
  criticalIncidents: number;
  resourceCount: number;
  shelterCount: number;
  shelterOccupancy: number; // percentage
}

export default function ScenarioMetricsCard({
  incidentCount,
  criticalIncidents,
  resourceCount,
  shelterCount,
  shelterOccupancy
}: ScenarioMetricsCardProps) {
  return (
    <div className="p-4 border-b border-white/10 bg-slate-950/40">
      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
        Scenario Metrics
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Incidents */}
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <div>
            <div className="text-xs text-slate-500">Incidents</div>
            <div className="text-lg font-mono font-bold text-slate-200">
              {incidentCount}
              {criticalIncidents > 0 && (
                <span className="ml-1 text-xs text-red-400">
                  ({criticalIncidents} critical)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="flex items-center gap-2">
          <Package size={16} className="text-emerald-400" />
          <div>
            <div className="text-xs text-slate-500">Assets</div>
            <div className="text-lg font-mono font-bold text-slate-200">
              {resourceCount}
            </div>
          </div>
        </div>

        {/* Shelters */}
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-blue-400" />
          <div>
            <div className="text-xs text-slate-500">Shelters</div>
            <div className="text-lg font-mono font-bold text-slate-200">
              {shelterCount}
            </div>
          </div>
        </div>

        {/* Occupancy */}
        <div className="flex items-center gap-2">
          <Users size={16} className="text-amber-400" />
          <div>
            <div className="text-xs text-slate-500">Occupancy</div>
            <div className="text-lg font-mono font-bold text-slate-200">
              {shelterOccupancy.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
