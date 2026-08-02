"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Radio,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import {
  useOperationsStore,
  type Mission,
  type IncidentStatus,
  type MissionStatus,
} from "@/store/operationsStore";
import { fetchScenarios, fetchScenarioDetails, type Incident } from "@/lib/api";

export default function MissionControlPage() {
  const {
    incidentStatus,
    incidentAssignments,
    missions,
    assets,
    createMission,
    updateMissionStatus,
    setMissionETA,
    addMissionEvent,
    deleteMission,
  } = useOperationsStore();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidents, setSelectedIncidents] = useState<Set<string>>(new Set());
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showCreateMission, setShowCreateMission] = useState(false);

  // Mission creation form
  const [missionTitle, setMissionTitle] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [missionNotes, setMissionNotes] = useState("");

  // Load incidents
  useEffect(() => {
    async function load() {
      try {
        const scenarios = await fetchScenarios();
        if (scenarios.length > 0) {
          const details = await fetchScenarioDetails(scenarios[0].id);
          setIncidents(details.incidents || []);
        } else {
          console.warn("⚠️ No scenarios available from API");
        }
      } catch (error) {
        console.error("❌ Failed to load incidents from API:", error);
        
        // Fallback: Load mock incidents
        const mockIncidents: Incident[] = [
          {
            id: "inc_001",
            type: "FLOOD",
            severity: 8,
            lat: 6.56,
            lon: 80.00,
            description: "Severe flooding in Kalutara North - multiple families trapped",
            verified: true,
            timestamp: new Date(Date.now() - 15 * 60000).toISOString()
          },
          {
            id: "inc_002",
            type: "FLOOD",
            severity: 9,
            lat: 6.54,
            lon: 80.02,
            description: "Emergency rescue needed - water level rising rapidly",
            verified: true,
            timestamp: new Date(Date.now() - 10 * 60000).toISOString()
          },
          {
            id: "inc_003",
            type: "LANDSLIDE",
            severity: 7,
            lat: 6.68,
            lon: 80.42,
            description: "Landslide blocking main road in Ratnapura",
            verified: true,
            timestamp: new Date(Date.now() - 20 * 60000).toISOString()
          },
          {
            id: "inc_004",
            type: "NEED",
            severity: 6,
            lat: 6.03,
            lon: 80.20,
            description: "Medical supplies urgently needed at Galle shelter",
            verified: true,
            timestamp: new Date(Date.now() - 25 * 60000).toISOString()
          },
          {
            id: "inc_005",
            type: "WIND",
            severity: 7,
            lat: 5.93,
            lon: 80.54,
            description: "Strong winds damaging structures in Matara",
            verified: false,
            timestamp: new Date(Date.now() - 5 * 60000).toISOString()
          },
          {
            id: "inc_006",
            type: "FLOOD",
            severity: 5,
            lat: 6.90,
            lon: 79.88,
            description: "Minor flooding reported in Colombo suburbs",
            verified: true,
            timestamp: new Date(Date.now() - 30 * 60000).toISOString()
          },
          {
            id: "inc_007",
            type: "TOURIST",
            severity: 4,
            lat: 6.05,
            lon: 80.22,
            description: "Tourist group stranded near coastal area",
            verified: false,
            timestamp: new Date(Date.now() - 12 * 60000).toISOString()
          },
          {
            id: "inc_008",
            type: "LANDSLIDE",
            severity: 8,
            lat: 6.65,
            lon: 80.45,
            description: "Multiple landslides in Ratnapura district",
            verified: true,
            timestamp: new Date(Date.now() - 18 * 60000).toISOString()
          }
        ];
        
        setIncidents(mockIncidents);
      }
    }
    load();
  }, []);

  // Group incidents by status
  const incidentsByStatus = useMemo(() => {
    const groups: Record<IncidentStatus | "UNASSIGNED", Incident[]> = {
      NEW: [],
      VERIFIED: [],
      ASSIGNED: [],
      EN_ROUTE: [],
      RESOLVED: [],
      UNASSIGNED: []
    };

    incidents.forEach(inc => {
      const status = incidentStatus[inc.id];
      const assignment = incidentAssignments[inc.id];
      
      
      // If no assignment, it's unassigned (regardless of status)
      if (!assignment) {
        groups["UNASSIGNED"].push(inc);
      } else {
        // If assigned, use the status
        groups[status || "ASSIGNED"].push(inc);
      }
    });


    return groups;
  }, [incidents, incidentStatus, incidentAssignments]);

  const handleCreateMission = () => {
    // Validation
    if (selectedIncidents.size === 0) {
      alert("⚠️ Please select at least one incident\n\nGo back and click on incidents in the Incident Queue to select them.");
      return;
    }
    
    if (selectedAssets.size === 0) {
      alert("⚠️ Please select at least one asset\n\nAssets are required to execute the mission.");
      return;
    }

    // Create mission
    const mission = createMission({
      title: missionTitle || `Mission ${missions.length + 1}`,
      incidentIds: Array.from(selectedIncidents),
      assetIds: Array.from(selectedAssets),
      notes: missionNotes,
      createdByRole: "OPERATOR"
    });

    // Reset form
    setSelectedIncidents(new Set());
    setSelectedAssets(new Set());
    setMissionTitle("");
    setMissionNotes("");
    setShowCreateMission(false);
    setSelectedMission(mission);
    
    // Success feedback
    alert(`✓ Mission Created!\n\n"${mission.title}"\n\nIncidents: ${selectedIncidents.size}\nAssets: ${selectedAssets.size}`);
  };

  const handleStatusChange = (missionId: string, newStatus: MissionStatus) => {
    updateMissionStatus(missionId, newStatus);
    
    // Check for escalations
    const mission = missions.find(m => m.id === missionId);
    if (mission?.etaISO && newStatus !== "COMPLETED") {
      const eta = new Date(mission.etaISO).getTime();
      const now = Date.now();
      if (now > eta) {
        addMissionEvent(missionId, {
          type: "ESCALATION",
          description: "ETA exceeded - mission overdue",
          severity: "CRITICAL"
        });
      }
    }
  };

  const getStatusColor = (status: IncidentStatus | MissionStatus): string => {
    switch (status) {
      case "NEW": return "bg-slate-500/20 text-slate-400 border-slate-500/50";
      case "VERIFIED": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      case "ASSIGNED": case "PLANNED": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "EN_ROUTE": case "DISPATCHED": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "RESOLVED": case "COMPLETED": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      case "APPROVED": return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "CANCELLED": return "bg-red-500/20 text-red-400 border-red-500/50";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex h-full w-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="relative min-w-0 flex-1 overflow-hidden px-8 py-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-3">
                    <Radio size={32} />
                    MISSION CONTROL
                  </h1>
                  <p className="mt-2 text-sm text-slate-400 font-mono">
                    Incident Lifecycle · Mission Dispatch · Asset Coordination
                  </p>
                </div>
                {/* Debug Info */}
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-mono">
                    Total Incidents: <span className="text-cyan-400 font-bold">{incidents.length}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Unassigned: <span className="text-orange-400 font-bold">{incidentsByStatus.UNASSIGNED.length}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Active Missions: <span className="text-emerald-400 font-bold">{missions.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 h-[calc(100vh-200px)]">
                {/* Left: Incident Queue */}
                <div className="w-80 flex flex-col gap-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-300 uppercase">
                    Incident Queue ({incidents.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    {incidentsByStatus.UNASSIGNED.length > 0 && selectedIncidents.size === 0 && (
                      <button
                        onClick={() => {
                          const unassignedIds = new Set(incidentsByStatus.UNASSIGNED.map(inc => inc.id));
                          setSelectedIncidents(unassignedIds);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700/50 border border-slate-600/50 text-slate-300 text-xs font-bold hover:bg-slate-600/50 transition-all"
                      >
                        Select All
                      </button>
                    )}
                    {selectedIncidents.size > 0 && (
                      <button
                        onClick={() => setSelectedIncidents(new Set())}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-all"
                      >
                        Clear ({selectedIncidents.size})
                      </button>
                    )}
                    <button
                      onClick={() => setShowCreateMission(true)}
                      className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/30 transition-all"
                    >
                      <Plus size={14} />
                      Create Mission
                    </button>
                  </div>
                </div>

                {/* Debug Panel */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-blue-400">🐛 DEBUG INFO</div>
                    <button
                      onClick={() => {
                        // Clear local storage to reset store
                        localStorage.clear();
                        window.location.reload();
                      }}
                      className="px-2 py-1 text-xs bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:bg-red-500/30"
                    >
                      Reset Store
                    </button>
                  </div>
                  <div className="space-y-1 text-xs text-slate-400 font-mono">
                    <div>Total loaded: <span className="text-white font-bold">{incidents.length}</span></div>
                    <div>Unassigned: <span className="text-orange-400 font-bold">{incidentsByStatus.UNASSIGNED.length}</span></div>
                    <div>Selected: <span className="text-cyan-400 font-bold">{selectedIncidents.size}</span></div>
                    <div>Assignments in store: <span className="text-purple-400 font-bold">{Object.keys(incidentAssignments).length}</span></div>
                    <div className="pt-2 border-t border-blue-500/20">
                      {incidentsByStatus.UNASSIGNED.length > 0 ? (
                        <div className="text-emerald-400">✅ Incidents visible below</div>
                      ) : incidents.length > 0 ? (
                        <div className="text-red-400">
                          ⚠️ Incidents loaded but not showing!
                          <br />
                          <span className="text-xs">Try “Reset Store” button above</span>
                        </div>
                      ) : (
                        <div className="text-amber-400">⏳ Loading incidents...</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Empty State or Unassigned Incidents */}
                {incidents.length === 0 ? (
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-8 text-center">
                    <AlertTriangle size={40} className="mx-auto mb-3 text-slate-700" />
                    <p className="text-slate-500 text-sm">No incidents loaded</p>
                    <p className="text-xs text-slate-600 mt-2">
                      Check browser console (F12) for errors
                    </p>
                  </div>
                ) : incidentsByStatus.UNASSIGNED.length > 0 ? (
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                    <div className="text-xs font-bold text-orange-400 mb-3 flex items-center justify-between">
                      <span>UNASSIGNED ({incidentsByStatus.UNASSIGNED.length})</span>
                      {selectedIncidents.size > 0 && (
                        <span className="text-cyan-400">
                          {selectedIncidents.size} selected
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {incidentsByStatus.UNASSIGNED.map(inc => (
                        <div
                          key={inc.id}
                          className={`p-3 rounded border cursor-pointer transition-all ${
                            selectedIncidents.has(inc.id)
                              ? "bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                              : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"
                          }`}
                          onClick={() => {
                            const newSet = new Set(selectedIncidents);
                            if (newSet.has(inc.id)) {
                              newSet.delete(inc.id);
                            } else {
                              newSet.add(inc.id);
                            }
                            setSelectedIncidents(newSet);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-200">{inc.type}</div>
                            {selectedIncidents.has(inc.id) && (
                              <CheckCircle size={14} className="text-cyan-400" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Severity: {inc.severity} | {inc.verified ? "✓ Verified" : "Unverified"}
                          </div>
                          <div className="text-[10px] text-slate-600 mt-1">
                            Location: {inc.lat.toFixed(3)}, {inc.lon.toFixed(3)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6 text-center">
                    <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500" />
                    <p className="text-slate-500 text-sm">All incidents assigned</p>
                  </div>
                )}

                {/* Other Status Groups */}
                {(["VERIFIED", "ASSIGNED", "EN_ROUTE"] as const).map(status => (
                  incidentsByStatus[status].length > 0 && (
                    <div key={status} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                      <div className={`text-xs font-bold mb-3 ${getStatusColor(status).split(' ')[1]}`}>
                        {status} ({incidentsByStatus[status].length})
                      </div>
                      <div className="space-y-2">
                        {incidentsByStatus[status].slice(0, 3).map(inc => (
                          <div key={inc.id} className="p-2 rounded bg-slate-800/50 border border-slate-700/50">
                            <div className="text-xs text-slate-300">{inc.type}</div>
                            <div className="text-[10px] text-slate-600 mt-1">
                              Mission: {incidentAssignments[inc.id]?.missionId?.slice(0, 12)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Center: Mission List */}
              <div className="flex-1 overflow-y-auto space-y-4">
                <h2 className="text-sm font-bold text-slate-300 uppercase mb-4">
                  Active Missions ({missions.length})
                </h2>

                {missions.length === 0 ? (
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-12 text-center">
                    <Radio size={48} className="mx-auto mb-4 text-slate-700" />
                    <p className="text-slate-500">No missions yet</p>
                    <p className="text-xs text-slate-600 mt-2">
                      Select incidents and create a mission
                    </p>
                  </div>
                ) : (
                  missions.map(mission => (
                    <motion.div
                      key={mission.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-slate-900/60 backdrop-blur-xl border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedMission?.id === mission.id
                          ? "border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                          : "border-white/10 hover:border-white/20"
                      }`}
                      onClick={() => setSelectedMission(mission)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-200">{mission.title}</h3>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(mission.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded border text-xs font-bold ${getStatusColor(mission.status)}`}>
                          {mission.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-slate-500">Incidents</div>
                          <div className="text-slate-200 font-bold">{mission.incidentIds.length}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Assets</div>
                          <div className="text-slate-200 font-bold">{mission.assetIds.length}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Events</div>
                          <div className="text-slate-200 font-bold">{mission.timelineEvents.length}</div>
                        </div>
                      </div>

                      {/* Has escalations? */}
                      {mission.timelineEvents.some(e => e.type === "ESCALATION") && (
                        <div className="mt-3 px-3 py-2 rounded bg-red-500/20 border border-red-500/50 flex items-center gap-2">
                          <AlertTriangle size={14} className="text-red-400" />
                          <span className="text-xs text-red-400 font-bold">ESCALATION</span>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              {/* Right: Mission Detail */}
              <div className="w-96 overflow-y-auto">
                {selectedMission ? (
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                    <h2 className="text-sm font-bold text-cyan-400 uppercase mb-4">Mission Detail</h2>

                    <div className="space-y-4">
                      {/* Status Controls */}
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">Status</label>
                        <select
                          value={selectedMission.status}
                          onChange={(e) => handleStatusChange(selectedMission.id, e.target.value as MissionStatus)}
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200"
                        >
                          <option value="PLANNED">Planned</option>
                          <option value="APPROVED">Approved</option>
                          <option value="DISPATCHED">Dispatched</option>
                          <option value="EN_ROUTE">En Route</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>

                      {/* ETA */}
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">ETA</label>
                        <input
                          type="datetime-local"
                          value={selectedMission.etaISO ? selectedMission.etaISO.slice(0, 16) : ""}
                          onChange={(e) => {
                            const isoString = new Date(e.target.value).toISOString();
                            setMissionETA(selectedMission.id, isoString);
                          }}
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200"
                        />
                      </div>

                      {/* Timeline */}
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">Timeline</label>
                        <div className="space-y-2">
                          {selectedMission.timelineEvents.map((event) => (
                            <div key={event.id} className={`p-3 rounded border ${
                              event.severity === "CRITICAL" ? "bg-red-500/10 border-red-500/30" :
                              event.severity === "WARN" ? "bg-yellow-500/10 border-yellow-500/30" :
                              "bg-slate-800/50 border-slate-700/50"
                            }`}>
                              <div className="flex items-start gap-2">
                                {event.type === "ESCALATION" && <AlertTriangle size={14} className="text-red-400 mt-0.5" />}
                                {event.type === "STATUS_CHANGE" && <CheckCircle size={14} className="text-cyan-400 mt-0.5" />}
                                {event.type === "ETA_UPDATED" && <Clock size={14} className="text-yellow-400 mt-0.5" />}
                                <div className="flex-1">
                                  <div className="text-xs text-slate-200">{event.description}</div>
                                  <div className="text-[10px] text-slate-600 mt-1">
                                    {new Date(event.ts).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delete Mission */}
                      <button
                        onClick={() => {
                          if (confirm("Delete this mission?")) {
                            deleteMission(selectedMission.id);
                            setSelectedMission(null);
                          }
                        }}
                        className="w-full px-4 py-2 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/30"
                      >
                        Delete Mission
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-12 text-center">
                    <MapPin size={48} className="mx-auto mb-4 text-slate-700" />
                    <p className="text-slate-500">Select a mission</p>
                  </div>
                )}
              </div>
            </div>

            {/* Create Mission Modal */}
            {showCreateMission && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900 border border-white/10 rounded-lg p-6 w-full max-w-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-cyan-400">Create Mission</h2>
                    <div className="text-xs text-slate-500">
                      Step-by-step mission builder
                    </div>
                  </div>

                  {/* Helper Alert */}
                  {selectedIncidents.size === 0 && (
                    <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-bold text-amber-400 mb-1">
                            How to Create a Mission
                          </div>
                          <ol className="text-xs text-amber-300/80 space-y-1 list-decimal list-inside">
                            <li>Close this modal</li>
                            <li>Click on incidents in the “Incident Queue” (left panel)</li>
                            <li>They will turn cyan when selected</li>
                            <li>Come back and select assets below</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Mission Title (Optional)</label>
                      <input
                        type="text"
                        value={missionTitle}
                        onChange={(e) => setMissionTitle(e.target.value)}
                        placeholder="e.g., Rescue Operation Alpha"
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2 flex items-center justify-between">
                        <span>Selected Incidents</span>
                        <span className={`font-bold ${selectedIncidents.size > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                          {selectedIncidents.size} selected
                        </span>
                      </label>
                      {selectedIncidents.size === 0 ? (
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs text-red-400">
                          ⚠️ No incidents selected. Close this modal and click on incidents in the queue to select them.
                        </div>
                      ) : (
                        <div className="bg-slate-950/50 border border-slate-700/50 rounded p-3 text-xs text-slate-400">
                          {Array.from(selectedIncidents).map((id, i) => (
                            <span key={id}>
                              {id.slice(0, 12)}...{i < selectedIncidents.size - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2 flex items-center justify-between">
                        <span>Assign Assets (Click to select)</span>
                        <span className={`font-bold ${selectedAssets.size > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                          {selectedAssets.size} selected
                        </span>
                      </label>
                      {assets.filter(a => a.status === "READY").length === 0 ? (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3 text-xs text-orange-400">
                          ⚠️ No assets available. All assets are busy or offline.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                          {assets.filter(a => a.status === "READY").map(asset => (
                            <div
                              key={asset.id}
                              onClick={() => {
                                const newSet = new Set(selectedAssets);
                                if (newSet.has(asset.id)) {
                                  newSet.delete(asset.id);
                                } else {
                                  newSet.add(asset.id);
                                }
                                setSelectedAssets(newSet);
                              }}
                              className={`p-3 rounded border cursor-pointer transition-all ${
                                selectedAssets.has(asset.id)
                                  ? "bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                                  : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-bold text-slate-200">{asset.name}</div>
                                {selectedAssets.has(asset.id) && (
                                  <CheckCircle size={12} className="text-cyan-400" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                {asset.type} · {asset.fuelPct}% fuel
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Notes (Optional)</label>
                      <textarea
                        value={missionNotes}
                        onChange={(e) => setMissionNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded px-3 py-2 text-sm text-slate-200"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleCreateMission}
                        className={`flex-1 px-4 py-3 rounded font-bold transition-all flex items-center justify-center gap-2 ${
                          selectedIncidents.size > 0 && selectedAssets.size > 0
                            ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/20"
                            : "bg-slate-800/50 border border-slate-700/50 text-slate-600 cursor-not-allowed"
                        }`}
                      >
                        <CheckCircle size={16} />
                        Create Mission
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateMission(false);
                          setMissionTitle("");
                          setMissionNotes("");
                        }}
                        className="px-4 py-3 rounded bg-slate-800 border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
