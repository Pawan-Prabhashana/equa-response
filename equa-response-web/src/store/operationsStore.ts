/**
 * Operations Store - Comprehensive DMC operational state management
 * Handles incidents, missions, plans, comms, assets, and resilience
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Incident, OptimizationResponse } from '@/lib/api';

// ============================================
// TYPES
// ============================================

// Incident Management
export type IncidentStatus = "NEW" | "VERIFIED" | "ASSIGNED" | "EN_ROUTE" | "RESOLVED";

export interface IncidentAssignment {
  missionId?: string;
  assignedTeam?: string;
  assignedAt?: number;
}

export interface EvidenceItem {
  id: string;
  source: string;
  ts: number;
  text: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  crossCheckNotes?: string;
}

// Mission Management
export type MissionStatus = "PLANNED" | "APPROVED" | "DISPATCHED" | "EN_ROUTE" | "COMPLETED" | "CANCELLED";

export interface MissionEvent {
  id: string;
  ts: number;
  type: "STATUS_CHANGE" | "ASSET_ASSIGNED" | "ETA_UPDATED" | "ESCALATION" | "NOTE";
  description: string;
  severity?: "INFO" | "WARN" | "CRITICAL";
}

export interface Mission {
  id: string;
  title: string;
  status: MissionStatus;
  incidentIds: string[];
  assetIds: string[];
  createdByRole: string;
  createdAt: number;
  etaISO?: string;
  timelineEvents: MissionEvent[];
  destination?: [number, number];
  notes?: string;
}

// Plan Management (Approvals/Governance)
export type PlanDecision = "APPROVED" | "REJECTED";

export interface Plan {
  id: string;
  ts: number;
  scenarioId: string;
  alpha: number;
  optimizedRoute: OptimizationResponse;
  metrics: {
    efficiencyScore: number;
    equityVariance: number;
    routeDistanceKm: number;
  };
  constraintsTriggered: string[];
}

export interface PlanReview {
  planId: string;
  decision: PlanDecision;
  rationale: string;
  reviewerRole: string;
  ts: number;
}

// Communications
export interface MessageTemplate {
  id: string;
  title: string;
  channels: Array<"SMS" | "WHATSAPP" | "EMAIL">;
  langs: Array<"EN" | "SI" | "TA" | "DE">;
  bodyByLang: Record<string, string>;
  variables: string[];
}

export type CommsAudience = "DISTRICT" | "SHELTER" | "TOURISTS" | "AGENCY";
export type CommsStatus = "SENT" | "FAILED" | "QUEUED";

export interface CommsLogEntry {
  id: string;
  ts: number;
  channel: "SMS" | "WHATSAPP" | "EMAIL";
  audience: CommsAudience;
  recipientsLabel: string;
  lang: "EN" | "SI" | "TA" | "DE";
  renderedMessage: string;
  status: CommsStatus;
  relatedIncidentId?: string;
  relatedMissionId?: string;
}

// Assets
export type AssetType = "TRUCK" | "BOAT" | "AMBULANCE" | "HELI";
export type AssetStatus = "READY" | "MAINT" | "DEPLOYED";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  capacity: number;
  status: AssetStatus;
  fuelPct: number;
  crewAvailable: boolean;
  notes?: string;
  lastCheckTs?: number;
}

export interface AssetConstraints {
  windMaxKmh: number;
  floodMaxDepthM: number;
  coastBlockWindKmh: number;
}

// Resilience
export interface Snapshot {
  ts: number;
  scenarioId: string;
  incidents: Incident[];
  missions: Mission[];
  approvedPlan: Plan | null;
}

// Filters
export type District = "KALUTARA" | "RATNAPURA" | "TRINCOMALEE" | "BATTICALOA" | "KANDY" | "ALL";
export type Agency = "DMC" | "POLICE" | "NAVY" | "REDCROSS" | "TOURISM" | "ALL";

// ============================================
// STORE STATE
// ============================================

interface OperationsState {
  // Incident Management
  incidentStatus: Record<string, IncidentStatus>;
  incidentAssignments: Record<string, IncidentAssignment>;
  incidentEvidence: Record<string, EvidenceItem[]>;

  // Mission Management
  missions: Mission[];

  // Plan Management
  proposedPlan: Plan | null;
  approvedPlan: Plan | null;
  approvalReview: PlanReview | null;
  rejectedPlans: PlanReview[];

  // Communications
  templates: MessageTemplate[];
  commsLog: CommsLogEntry[];

  // Assets
  assets: Asset[];
  assetConstraints: AssetConstraints;

  // Resilience
  lastGoodSnapshot: Snapshot | null;
  degradedMode: boolean;

  // Filters
  selectedDistrict: District;
  selectedAgency: Agency;

  // Actions - Incident
  updateIncidentStatus: (id: string, status: IncidentStatus) => void;
  verifyIncident: (id: string, evidence: Omit<EvidenceItem, 'id'>) => void;
  attachEvidence: (incidentId: string, evidence: Omit<EvidenceItem, 'id'>) => void;
  assignIncidentToMission: (incidentId: string, missionId: string, team?: string) => void;

  // Actions - Mission
  createMission: (params: {
    title: string;
    incidentIds: string[];
    assetIds: string[];
    destination?: [number, number];
    notes?: string;
    createdByRole: string;
  }) => Mission;
  updateMissionStatus: (missionId: string, status: MissionStatus) => void;
  setMissionETA: (missionId: string, etaISO: string) => void;
  addMissionEvent: (missionId: string, event: Omit<MissionEvent, 'id' | 'ts'>) => void;
  deleteMission: (missionId: string) => void;

  // Actions - Plan
  proposePlan: (plan: Omit<Plan, 'id' | 'ts'>) => void;
  approvePlan: (planId: string, rationale: string, reviewerRole: string) => void;
  rejectPlan: (planId: string, rationale: string, reviewerRole: string) => void;

  // Actions - Comms
  addTemplate: (template: MessageTemplate) => void;
  sendMessage: (entry: Omit<CommsLogEntry, 'id' | 'ts'>) => void;

  // Actions - Assets
  updateAsset: (assetId: string, updates: Partial<Asset>) => void;
  updateConstraints: (constraints: Partial<AssetConstraints>) => void;
  computeAssetReadiness: (asset: Asset) => number;

  // Actions - Resilience
  saveSnapshot: (scenarioId: string, incidents: Incident[]) => void;
  restoreSnapshot: () => void;
  setDegradedMode: (degraded: boolean) => void;

  // Actions - Filters
  setDistrict: (district: District) => void;
  setAgency: (agency: Agency) => void;

  // Utility
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialTemplates: MessageTemplate[] = [
  {
    id: "tmpl_evac_en",
    title: "Evacuation Alert",
    channels: ["SMS", "WHATSAPP", "EMAIL"],
    langs: ["EN", "SI", "TA", "DE"],
    bodyByLang: {
      EN: "URGENT: Evacuation order for {district}. Cyclone risk {risk}. Proceed to nearest shelter: {shelter}. Stay safe.",
      SI: "හදිසි: {district} ප්‍රදේශය ඉවත් කිරීමේ නියෝගය. සුළි කුණාටු අවදානම {risk}. ආසන්නතම රැකවරණය වෙත යන්න: {shelter}.",
      TA: "அவசரம்: {district} பகுதிக்கான வெளியேற்ற உத்தரவு. புயல் ஆபத்து {risk}. அருகிலுள்ள தங்குமிடத்திற்கு செல்லவும்: {shelter}.",
      DE: "DRINGEND: Evakuierungsbefehl für {district}. Zyklonrisiko {risk}. Begeben Sie sich zur nächsten Unterkunft: {shelter}."
    },
    variables: ["district", "risk", "shelter"]
  },
  {
    id: "tmpl_shelter_capacity",
    title: "Shelter Capacity Alert",
    channels: ["SMS", "WHATSAPP"],
    langs: ["EN", "SI"],
    bodyByLang: {
      EN: "ALERT: {shelter} is at {capacity}% capacity. Alternative shelter: {alternative}. Plan ahead.",
      SI: "අනතුරු ඇඟවීම: {shelter} {capacity}% ධාරිතාවේ පවතී. විකල්ප රැකවරණය: {alternative}. පූර්ව සැලසුම් කරන්න."
    },
    variables: ["shelter", "capacity", "alternative"]
  },
  {
    id: "tmpl_route_update",
    title: "Route Update",
    channels: ["SMS", "EMAIL"],
    langs: ["EN", "DE"],
    bodyByLang: {
      EN: "ROUTE UPDATE: {route_name} blocked due to {reason}. Alternative: {alternative}. ETA: {eta}.",
      DE: "ROUTENAKTUALISIERUNG: {route_name} gesperrt wegen {reason}. Alternative: {alternative}. Ankunft: {eta}."
    },
    variables: ["route_name", "reason", "alternative", "eta"]
  }
];

const initialAssets: Asset[] = [
  { id: "asset_truck_01", name: "Rescue Truck Alpha", type: "TRUCK", capacity: 12, status: "READY", fuelPct: 85, crewAvailable: true, lastCheckTs: Date.now() },
  { id: "asset_truck_02", name: "Rescue Truck Bravo", type: "TRUCK", capacity: 12, status: "READY", fuelPct: 70, crewAvailable: true, lastCheckTs: Date.now() },
  { id: "asset_boat_01", name: "Rescue Boat Delta", type: "BOAT", capacity: 8, status: "READY", fuelPct: 90, crewAvailable: true, lastCheckTs: Date.now() },
  { id: "asset_ambulance_01", name: "Ambulance Unit 1", type: "AMBULANCE", capacity: 4, status: "DEPLOYED", fuelPct: 60, crewAvailable: false, notes: "Currently at Kalutara Hospital" },
  { id: "asset_heli_01", name: "Heli Rescue 1", type: "HELI", capacity: 6, status: "MAINT", fuelPct: 100, crewAvailable: true, notes: "Scheduled maintenance, available in 2h" }
];

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useOperationsStore = create<OperationsState>()(
  persist(
    (set, get) => ({
      // Initial state
      incidentStatus: {},
      incidentAssignments: {},
      incidentEvidence: {},
      missions: [],
      proposedPlan: null,
      approvedPlan: null,
      approvalReview: null,
      rejectedPlans: [],
      templates: initialTemplates,
      commsLog: [],
      assets: initialAssets,
      assetConstraints: {
        windMaxKmh: 80,
        floodMaxDepthM: 1.5,
        coastBlockWindKmh: 100
      },
      lastGoodSnapshot: null,
      degradedMode: false,
      selectedDistrict: "ALL",
      selectedAgency: "ALL",

      // Incident actions
      updateIncidentStatus: (id, status) => {
        set(state => ({
          incidentStatus: { ...state.incidentStatus, [id]: status }
        }));
      },

      verifyIncident: (id, evidence) => {
        const evidenceItem: EvidenceItem = {
          ...evidence,
          id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        set(state => ({
          incidentStatus: { ...state.incidentStatus, [id]: "VERIFIED" },
          incidentEvidence: {
            ...state.incidentEvidence,
            [id]: [...(state.incidentEvidence[id] || []), evidenceItem]
          }
        }));
      },

      attachEvidence: (incidentId, evidence) => {
        const evidenceItem: EvidenceItem = {
          ...evidence,
          id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        set(state => ({
          incidentEvidence: {
            ...state.incidentEvidence,
            [incidentId]: [...(state.incidentEvidence[incidentId] || []), evidenceItem]
          }
        }));
      },

      assignIncidentToMission: (incidentId, missionId, team) => {
        set(state => ({
          incidentAssignments: {
            ...state.incidentAssignments,
            [incidentId]: { missionId, assignedTeam: team, assignedAt: Date.now() }
          },
          incidentStatus: { ...state.incidentStatus, [incidentId]: "ASSIGNED" }
        }));
      },

      // Mission actions
      createMission: (params) => {
        const mission: Mission = {
          id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: params.title,
          status: "PLANNED",
          incidentIds: params.incidentIds,
          assetIds: params.assetIds,
          createdByRole: params.createdByRole,
          createdAt: Date.now(),
          destination: params.destination,
          notes: params.notes,
          timelineEvents: [{
            id: `evt_${Date.now()}`,
            ts: Date.now(),
            type: "STATUS_CHANGE",
            description: "Mission created",
            severity: "INFO"
          }]
        };

        set(state => ({
          missions: [mission, ...state.missions]
        }));

        // Auto-assign incidents
        params.incidentIds.forEach(incId => {
          get().assignIncidentToMission(incId, mission.id);
        });

        return mission;
      },

      updateMissionStatus: (missionId, status) => {
        set(state => ({
          missions: state.missions.map(m =>
            m.id === missionId
              ? {
                  ...m,
                  status,
                  timelineEvents: [
                    ...m.timelineEvents,
                    {
                      id: `evt_${Date.now()}`,
                      ts: Date.now(),
                      type: "STATUS_CHANGE",
                      description: `Status changed to ${status}`,
                      severity: "INFO"
                    }
                  ]
                }
              : m
          )
        }));

        // Update incident statuses
        const mission = get().missions.find(m => m.id === missionId);
        if (mission) {
          if (status === "DISPATCHED" || status === "EN_ROUTE") {
            mission.incidentIds.forEach(incId => {
              get().updateIncidentStatus(incId, "EN_ROUTE");
            });
          } else if (status === "COMPLETED") {
            mission.incidentIds.forEach(incId => {
              get().updateIncidentStatus(incId, "RESOLVED");
            });
          }
        }
      },

      setMissionETA: (missionId, etaISO) => {
        set(state => ({
          missions: state.missions.map(m =>
            m.id === missionId
              ? {
                  ...m,
                  etaISO,
                  timelineEvents: [
                    ...m.timelineEvents,
                    {
                      id: `evt_${Date.now()}`,
                      ts: Date.now(),
                      type: "ETA_UPDATED",
                      description: `ETA updated to ${etaISO}`,
                      severity: "INFO"
                    }
                  ]
                }
              : m
          )
        }));
      },

      addMissionEvent: (missionId, event) => {
        const fullEvent: MissionEvent = {
          ...event,
          id: `evt_${Date.now()}`,
          ts: Date.now()
        };

        set(state => ({
          missions: state.missions.map(m =>
            m.id === missionId
              ? { ...m, timelineEvents: [...m.timelineEvents, fullEvent] }
              : m
          )
        }));
      },

      deleteMission: (missionId) => {
        set(state => ({
          missions: state.missions.filter(m => m.id !== missionId)
        }));
      },

      // Plan actions
      proposePlan: (plan) => {
        
        const fullPlan: Plan = {
          ...plan,
          id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ts: Date.now()
        };

        
        set({ proposedPlan: fullPlan });
        
      },

      approvePlan: (planId, rationale, reviewerRole) => {
        const { proposedPlan } = get();
        if (!proposedPlan || proposedPlan.id !== planId) return;

        const review: PlanReview = {
          planId,
          decision: "APPROVED",
          rationale,
          reviewerRole,
          ts: Date.now()
        };

        set({
          approvedPlan: proposedPlan,
          approvalReview: review,
          proposedPlan: null
        });
      },

      rejectPlan: (planId, rationale, reviewerRole) => {
        const { proposedPlan, rejectedPlans } = get();
        if (!proposedPlan || proposedPlan.id !== planId) return;

        const review: PlanReview = {
          planId,
          decision: "REJECTED",
          rationale,
          reviewerRole,
          ts: Date.now()
        };

        set({
          proposedPlan: null,
          rejectedPlans: [review, ...rejectedPlans]
        });
      },

      // Comms actions
      addTemplate: (template) => {
        set(state => ({
          templates: [template, ...state.templates]
        }));
      },

      sendMessage: (entry) => {
        const fullEntry: CommsLogEntry = {
          ...entry,
          id: `comms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ts: Date.now()
        };

        set(state => ({
          commsLog: [fullEntry, ...state.commsLog].slice(0, 100) // Keep last 100
        }));
      },

      // Asset actions
      updateAsset: (assetId, updates) => {
        set(state => ({
          assets: state.assets.map(a =>
            a.id === assetId ? { ...a, ...updates } : a
          )
        }));
      },

      updateConstraints: (constraints) => {
        set(state => ({
          assetConstraints: { ...state.assetConstraints, ...constraints }
        }));
      },

      computeAssetReadiness: (asset) => {
        let score = 100;
        
        // Deduct for low fuel
        if (asset.fuelPct < 30) score -= 40;
        else if (asset.fuelPct < 50) score -= 20;
        
        // Deduct for no crew
        if (!asset.crewAvailable) score -= 30;
        
        // Deduct for status
        if (asset.status === "MAINT") score -= 50;
        else if (asset.status === "DEPLOYED") score -= 20;
        
        return Math.max(0, score);
      },

      // Resilience actions
      saveSnapshot: (scenarioId, incidents) => {
        const { missions, approvedPlan } = get();
        
        const snapshot: Snapshot = {
          ts: Date.now(),
          scenarioId,
          incidents,
          missions,
          approvedPlan
        };

        set({ lastGoodSnapshot: snapshot });
      },

      restoreSnapshot: () => {
        const { lastGoodSnapshot } = get();
        if (!lastGoodSnapshot) return;

        set({
          missions: lastGoodSnapshot.missions,
          approvedPlan: lastGoodSnapshot.approvedPlan
        });
      },

      setDegradedMode: (degraded) => {
        set({ degradedMode: degraded });
      },

      // Filter actions
      setDistrict: (district) => set({ selectedDistrict: district }),
      setAgency: (agency) => set({ selectedAgency: agency }),

      // Reset
      reset: () => {
        set({
          incidentStatus: {},
          incidentAssignments: {},
          incidentEvidence: {},
          missions: [],
          proposedPlan: null,
          approvedPlan: null,
          approvalReview: null,
          rejectedPlans: [],
          commsLog: [],
          lastGoodSnapshot: null,
          degradedMode: false,
          selectedDistrict: "ALL",
          selectedAgency: "ALL"
        });
      }
    }),
    {
      name: 'equa-operations-store',
      partialize: (state) => ({
        incidentStatus: state.incidentStatus,
        incidentAssignments: state.incidentAssignments,
        missions: state.missions,
        commsLog: state.commsLog,
        assetConstraints: state.assetConstraints,
        lastGoodSnapshot: state.lastGoodSnapshot
      })
    }
  )
);
