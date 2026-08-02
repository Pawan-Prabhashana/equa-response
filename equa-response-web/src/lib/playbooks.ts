/**
 * Playbook Studio - Operational Doctrine System
 * Defines playbooks and generated operational plans
 */


// ============================================
// TYPES
// ============================================

export type HazardType = 'FLOOD' | 'CYCLONE' | 'MULTI' | 'LANDSLIDE';
export type AlphaStrategy = 'FIXED' | 'ADAPTIVE';
export type PlaybookStatus = 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED';

export interface PlaybookObjectives {
  saveLives: boolean;
  fairness: boolean;
  protectTourism: boolean;
  minimizeCost: boolean;
}

export interface PlaybookVersion {
  version: string; // e.g., "1.0", "1.1"
  createdAt: number;
  createdBy: string;
  changelog: string[];
}

/**
 * Playbook - Operational policy definition
 */
export interface Playbook {
  id: string;
  name: string;
  version: string;
  status: PlaybookStatus;
  hazardType: HazardType;
  targetArea: string;
  objectives: PlaybookObjectives;
  constraintsPreset: string;
  commsPreset: string;
  evacuationThreshold: number; // 0-1
  alphaStrategy: AlphaStrategy;
  fixedAlpha?: number; // if strategy is FIXED
  createdAt: number;
  updatedAt: number;
  versionHistory: PlaybookVersion[];
  approvedBy?: string;
  approvedAt?: number;
}

/**
 * Mission Draft - Generated mission from playbook
 */
export interface MissionDraft {
  id: string;
  title: string;
  type: 'EVACUATION' | 'RESCUE' | 'SUPPLY' | 'MEDICAL' | 'RECON';
  priority: number; // 1-10
  incidentIds: string[];
  targetArea: string;
  targetLocation?: [number, number];
  suggestedAssets: string[]; // asset types (BOAT, TRUCK, etc.)
  estimatedDuration: number; // minutes
  rationale: string;
}

/**
 * Comms Draft - Generated communication from playbook
 */
export interface CommsDraft {
  id: string;
  audience: 'PUBLIC' | 'DISTRICT' | 'SHELTER' | 'TOURISTS' | 'AGENCY';
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'LOUDSPEAKER';
  lang: 'EN' | 'SI' | 'TA' | 'DE';
  subject: string;
  body: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  timing: string; // e.g., "Immediate", "T+30min"
  rationale: string;
}

/**
 * Playbook Scores - Outcome metrics
 */
export interface PlaybookScores {
  equity: number; // 0-100 (lower variance in response)
  efficiency: number; // 0-100 (critical incidents prioritized)
  overloadAvoidance: number; // 0-100 (shelters stay < 95%)
  travelSafety: number; // 0-100 (avoid blocked roads)
  executionFeasibility: number; // 0-100 (missions are achievable)
  overall: number; // 0-100 (weighted average)
}

/**
 * Playbook Run - Generated operational plan
 */
export interface PlaybookRun {
  id: string;
  playbookId: string;
  scenarioId: string;
  generatedAt: number;
  generatedMissions: MissionDraft[];
  generatedComms: CommsDraft[];
  predictedShelterLoads: Array<{
    shelterId: string;
    shelterName: string;
    currentOccupancy: number;
    predictedOccupancy: number; // at T+2h
    capacityPercent: number;
  }>;
  districtHotspots: Array<{
    district: string;
    hotspots: Array<{
      placeName: string;
      priority: 'P1' | 'P2' | 'P3';
      score: number;
      reasons: string[];
    }>;
  }>; // NEW: Sub-district priority areas
  scores: PlaybookScores;
  commanderBrief: {
    immediate: string[]; // 0-30min actions
    nextTwoHours: string[]; // 30-120min actions
    commsSchedule: string[]; // When to send what
    resourceAllocation: string[]; // Asset assignments
    riskWarnings: string[]; // Critical risks
  };
}

// ============================================
// PRESETS
// ============================================

export const CONSTRAINT_PRESETS = {
  STANDARD: {
    name: 'Standard Operations',
    description: 'Normal operational constraints',
    maxMissions: 10,
    minAssetReadiness: 0.7,
    allowNightOps: true
  },
  AGGRESSIVE: {
    name: 'Aggressive Response',
    description: 'Push all resources, accept higher risk',
    maxMissions: 20,
    minAssetReadiness: 0.5,
    allowNightOps: true
  },
  CONSERVATIVE: {
    name: 'Conservative/Safe',
    description: 'Prioritize safety over speed',
    maxMissions: 5,
    minAssetReadiness: 0.9,
    allowNightOps: false
  }
};

export const COMMS_PRESETS = {
  STANDARD: {
    name: 'Standard Messaging',
    description: 'English + Sinhala',
    languages: ['EN', 'SI'],
    channels: ['SMS', 'WHATSAPP']
  },
  TOURISM: {
    name: 'Tourism-Aware',
    description: 'Include German, focus on tourist zones',
    languages: ['EN', 'SI', 'DE'],
    channels: ['SMS', 'WHATSAPP', 'EMAIL']
  },
  EMERGENCY: {
    name: 'Emergency Broadcast',
    description: 'All channels, all languages',
    languages: ['EN', 'SI', 'TA', 'DE'],
    channels: ['SMS', 'WHATSAPP', 'EMAIL', 'LOUDSPEAKER']
  }
};

// ============================================
// HELPERS
// ============================================

export function createDefaultPlaybook(): Playbook {
  const now = Date.now();
  return {
    id: `playbook_${now}`,
    name: 'New Playbook',
    version: '1.0',
    status: 'DRAFT',
    hazardType: 'FLOOD',
    targetArea: 'All Districts',
    objectives: {
      saveLives: true,
      fairness: true,
      protectTourism: false,
      minimizeCost: false
    },
    constraintsPreset: 'STANDARD',
    commsPreset: 'STANDARD',
    evacuationThreshold: 0.65,
    alphaStrategy: 'FIXED',
    fixedAlpha: 0.5,
    createdAt: now,
    updatedAt: now,
    versionHistory: [
      {
        version: '1.0',
        createdAt: now,
        createdBy: 'OPERATOR',
        changelog: ['Initial creation']
      }
    ]
  };
}

export function getObjectiveWeight(objectives: PlaybookObjectives): {
  lives: number;
  fairness: number;
  tourism: number;
  cost: number;
} {
  const total = Object.values(objectives).filter(Boolean).length;
  if (total === 0) return { lives: 1, fairness: 0, tourism: 0, cost: 0 };

  return {
    lives: objectives.saveLives ? 1 / total : 0,
    fairness: objectives.fairness ? 1 / total : 0,
    tourism: objectives.protectTourism ? 1 / total : 0,
    cost: objectives.minimizeCost ? 1 / total : 0
  };
}

// ============================================
// BATTLE MODE TYPES
// ============================================

/**
 * Battle Mode - Compare multiple playbooks side-by-side
 */
export interface BattleModeComparison {
  playbooks: Playbook[];
  runs: PlaybookRun[];
  winner: string | null; // playbookId of winner
  scoreboard: Array<{
    playbookId: string;
    playbookName: string;
    scores: PlaybookScores;
    rank: number;
  }>;
  failurePoints: Record<string, string[]>; // playbookId -> failure messages
  resourceUsage: Record<string, {
    assetsDeployed: number;
    assetsStandby: number;
    totalAssets: number;
    utilizationPercent: number;
  }>;
}

export interface BattleModeCriteria {
  metric: keyof PlaybookScores; // Which metric to use for winner determination
  weight: 'equal' | 'overall'; // Equal weight all metrics, or use overall score
}
