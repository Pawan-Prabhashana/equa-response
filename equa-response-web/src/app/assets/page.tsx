"use client";

import { Package, CheckCircle, AlertTriangle, Settings } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useOperationsStore, type AssetStatus } from "@/store/operationsStore";

export default function AssetsPage() {
  const { assets, assetConstraints, updateAsset, updateConstraints, computeAssetReadiness } = useOperationsStore();

  const handleStatusChange = (assetId: string, newStatus: AssetStatus) => {
    updateAsset(assetId, { status: newStatus });
  };

  const getStatusColor = (status: AssetStatus): string => {
    switch (status) {
      case "READY": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      case "DEPLOYED": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "MAINT": return "bg-red-500/20 text-red-400 border-red-500/50";
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
                <Package size={32} />
                ASSETS & READINESS
              </h1>
              <p className="mt-2 text-sm text-slate-400 font-mono">
                Fleet Management · Capacity · Constraints · Readiness Score
              </p>
            </div>

            <div className="max-w-6xl space-y-6">
              {/* Constraints Editor */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                <h2 className="text-sm font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
                  <Settings size={18} />
                  Operational Constraints
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Max Wind Speed (km/h)</label>
                    <input
                      type="number"
                      value={assetConstraints.windMaxKmh}
                      onChange={(e) => updateConstraints({ windMaxKmh: parseInt(e.target.value) })}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Max Flood Depth (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={assetConstraints.floodMaxDepthM}
                      onChange={(e) => updateConstraints({ floodMaxDepthM: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Coast Block Wind (km/h)</label>
                    <input
                      type="number"
                      value={assetConstraints.coastBlockWindKmh}
                      onChange={(e) => updateConstraints({ coastBlockWindKmh: parseInt(e.target.value) })}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Assets Table */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                  <h2 className="text-sm font-bold text-slate-300 uppercase">Fleet Assets ({assets.length})</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-950/50 border-b border-slate-800">
                      <tr className="text-left text-xs text-slate-400 uppercase">
                        <th className="px-6 py-3 font-bold">Asset</th>
                        <th className="px-6 py-3 font-bold">Type</th>
                        <th className="px-6 py-3 font-bold text-center">Status</th>
                        <th className="px-6 py-3 font-bold text-right">Fuel</th>
                        <th className="px-6 py-3 font-bold text-center">Crew</th>
                        <th className="px-6 py-3 font-bold text-right">Capacity</th>
                        <th className="px-6 py-3 font-bold text-right">Readiness</th>
                        <th className="px-6 py-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => {
                        const readiness = computeAssetReadiness(asset);
                        return (
                          <tr key={asset.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-200">{asset.name}</div>
                              {asset.notes && (
                                <div className="text-xs text-slate-500 mt-1">{asset.notes}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">{asset.type}</td>
                            <td className="px-6 py-4 text-center">
                              <select
                                value={asset.status}
                                onChange={(e) => handleStatusChange(asset.id, e.target.value as AssetStatus)}
                                className={`px-2 py-1 rounded border text-xs font-bold ${getStatusColor(asset.status)}`}
                              >
                                <option value="READY">READY</option>
                                <option value="DEPLOYED">DEPLOYED</option>
                                <option value="MAINT">MAINT</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`font-mono text-sm ${
                                asset.fuelPct >= 70 ? "text-emerald-400" :
                                asset.fuelPct >= 40 ? "text-yellow-400" :
                                "text-red-400"
                              }`}>
                                {asset.fuelPct}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {asset.crewAvailable ? (
                                <CheckCircle size={16} className="text-emerald-400 mx-auto" />
                              ) : (
                                <AlertTriangle size={16} className="text-red-400 mx-auto" />
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-slate-300">{asset.capacity}</td>
                            <td className="px-6 py-4 text-right">
                              <span className={`font-mono font-bold ${
                                readiness >= 80 ? "text-emerald-400" :
                                readiness >= 50 ? "text-yellow-400" :
                                "text-red-400"
                              }`}>
                                {readiness}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button className="text-xs text-cyan-400 hover:text-cyan-300">
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
