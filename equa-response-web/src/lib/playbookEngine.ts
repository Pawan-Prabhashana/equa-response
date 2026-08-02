/**
 * Playbook Engine - Generates operational plans from playbooks
 * Simplified version: Static generation from current state (no timeline simulation)
 */

import type { Incident, Shelter, GhostRoad } from './api';
import type { Asset } from '@/store/operationsStore';
import type { OperationalState, AreaRisk } from './dataPipeline';
import { detectAllHotspots } from './hotspotDetection';
import type {
  Playbook,
  PlaybookRun,
  MissionDraft,
  CommsDraft,
  PlaybookScores
} from './playbooks';
import { getObjectiveWeight, CONSTRAINT_PRESETS, COMMS_PRESETS } from './playbooks';

/** Predicted shelter load produced during plan generation. */
interface ShelterPrediction {
  shelterId: string;
  shelterName: string;
  currentOccupancy: number;
  predictedOccupancy: number;
  capacityPercent: number;
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export function generatePlaybookRun(
  playbook: Playbook,
  scenarioId: string,
  opState: OperationalState,
  incidents: Incident[],
  shelters: Shelter[],
  assets: Asset[],
  ghostRoads: GhostRoad[]
): PlaybookRun {
  // 1. Identify high-risk areas and critical incidents
  const criticalIncidents = incidents.filter(inc => inc.severity >= 8);
  const highRiskAreas = opState.areaRisks.filter(ar => ar.riskScore > playbook.evacuationThreshold);

  // 2. Generate missions
  const missions = generateMissions(
    playbook,
    criticalIncidents,
    incidents,
    highRiskAreas,
    assets,
    ghostRoads
  );

  // 3. Generate communications
  const comms = generateCommunications(
    playbook,
    criticalIncidents,
    highRiskAreas,
    shelters
  );

  // 4. Predict shelter loads (simple: +20% over 2 hours)
  const shelterPredictions = shelters.map(shelter => {
    const predictedOccupancy = Math.min(
      shelter.current_occupancy + (shelter.capacity * 0.2),
      shelter.capacity
    );
    const predictedPct = (predictedOccupancy / shelter.capacity) * 100;

    return {
      shelterId: shelter.id,
      shelterName: shelter.name,
      currentOccupancy: shelter.current_occupancy,
      predictedOccupancy: Math.round(predictedOccupancy),
      capacityPercent: predictedPct
    };
  });

  // 5. Score the plan
  const scores = scorePlan(
    playbook,
    missions,
    comms,
    shelterPredictions,
    assets,
    incidents,
    ghostRoads
  );

  // 6. Detect sub-district hotspots
  const impactedDistricts = playbook.targetArea.split(',').map(d => d.trim());
  
  const districtHotspots = detectAllHotspots(
    impactedDistricts,
    opState.floodPolygons,
    opState.cycloneCone,
    ghostRoads,
    incidents,
    shelters
  );

  // 7. Generate Commander Brief
  const commanderBrief = generateCommanderBrief(
    playbook,
    missions,
    comms,
    shelterPredictions,
    scores
  );

  return {
    id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    playbookId: playbook.id,
    scenarioId,
    generatedAt: Date.now(),
    generatedMissions: missions,
    generatedComms: comms,
    predictedShelterLoads: shelterPredictions,
    districtHotspots: districtHotspots.map(dh => ({
      district: dh.district,
      hotspots: dh.hotspots.map(h => ({
        placeName: h.placeName,
        priority: h.priority,
        score: h.score,
        reasons: h.reasons
      }))
    })),
    scores,
    commanderBrief
  };
}

// ============================================
// MISSION GENERATION
// ============================================

function generateMissions(
  playbook: Playbook,
  criticalIncidents: Incident[],
  allIncidents: Incident[],
  highRiskAreas: AreaRisk[],
  assets: Asset[],
  ghostRoads: GhostRoad[]
): MissionDraft[] {
  const missions: MissionDraft[] = [];
  const constraints = CONSTRAINT_PRESETS[playbook.constraintsPreset as keyof typeof CONSTRAINT_PRESETS];
  const weights = getObjectiveWeight(playbook.objectives);

  // Mission 1: Evacuate high-risk areas with critical incidents
  if (criticalIncidents.length > 0 && highRiskAreas.length > 0) {
    for (let i = 0; i < Math.min(criticalIncidents.length, 3); i++) {
      const incident = criticalIncidents[i];
      const nearRoads = ghostRoads.filter(road => {
        const dist = Math.abs(road.coords[0][0] - incident.lat) + Math.abs(road.coords[0][1] - incident.lon);
        return dist < 0.05; // ~5km
      });

      const needsBoat = nearRoads.length > 0 || incident.type === 'FLOOD';

      missions.push({
        id: `mission_evac_${i}`,
        title: `Evacuate: ${incident.description.slice(0, 40)}`,
        type: 'EVACUATION',
        priority: 10 - i,
        incidentIds: [incident.id],
        targetArea: highRiskAreas[0]?.areaName || 'High Risk Zone',
        targetLocation: [incident.lat, incident.lon],
        suggestedAssets: needsBoat ? ['BOAT', 'TRUCK'] : ['TRUCK', 'AMBULANCE'],
        estimatedDuration: 90 + (i * 15),
        rationale: `Critical severity ${incident.severity} incident in high-risk area. ${nearRoads.length > 0 ? 'Road access limited.' : ''}`
      });
    }
  }

  // Mission 2: Medical support for injured
  const medicalIncidents = allIncidents.filter(inc => 
    inc.type === 'FIRE' || inc.description.toLowerCase().includes('medical') || inc.description.toLowerCase().includes('injured')
  );
  
  if (medicalIncidents.length > 0 && missions.length < constraints.maxMissions) {
    missions.push({
      id: `mission_medical`,
      title: `Medical Support: ${medicalIncidents.length} incidents`,
      type: 'MEDICAL',
      priority: 8,
      incidentIds: medicalIncidents.slice(0, 3).map(inc => inc.id),
      targetArea: 'Multiple Locations',
      suggestedAssets: ['AMBULANCE', 'HELI'],
      estimatedDuration: 120,
      rationale: `${medicalIncidents.length} medical-related incidents requiring immediate attention.`
    });
  }

  // Mission 3: Supply delivery to shelters
  if (missions.length < constraints.maxMissions && weights.fairness > 0) {
    missions.push({
      id: `mission_supply`,
      title: `Supply Delivery: Shelters + Remote Areas`,
      type: 'SUPPLY',
      priority: 6,
      incidentIds: [],
      targetArea: 'Shelter Network',
      suggestedAssets: ['TRUCK'],
      estimatedDuration: 180,
      rationale: `Fairness objective: Ensure all shelters receive supplies regardless of distance.`
    });
  }

  // Mission 4: Reconnaissance for blocked roads
  if (ghostRoads.length > 0 && missions.length < constraints.maxMissions) {
    missions.push({
      id: `mission_recon`,
      title: `Recon: ${ghostRoads.length} Blocked Roads`,
      type: 'RECON',
      priority: 5,
      incidentIds: [],
      targetArea: 'Road Network',
      suggestedAssets: ['HELI', 'TRUCK'],
      estimatedDuration: 60,
      rationale: `${ghostRoads.length} roads reported blocked. Recon needed to confirm status and plan alternate routes.`
    });
  }

  return missions.slice(0, constraints.maxMissions);
}

// ============================================
// COMMUNICATIONS GENERATION
// ============================================

function generateCommunications(
  playbook: Playbook,
  criticalIncidents: Incident[],
  highRiskAreas: AreaRisk[],
  shelters: Shelter[]
): CommsDraft[] {
  const comms: CommsDraft[] = [];
  const preset = COMMS_PRESETS[playbook.commsPreset as keyof typeof COMMS_PRESETS];

  // Comms 1: Emergency evacuation alert (immediate)
  if (criticalIncidents.length > 0) {
    preset.languages.forEach(lang => {
      const messages = {
        EN: `EMERGENCY: Evacuate immediately. ${criticalIncidents.length} critical incidents reported. Move to designated shelters. Follow official instructions.`,
        SI: `හදිසි: වහා ඉවත් වන්න. බරපතල සිදුවීම් ${criticalIncidents.length}ක් වාර්තා වී ඇත. නම් කරන ලද නවාතැන් වෙත යන්න.`,
        TA: `அவசரம்: உடனடியாக வெளியேறவும். ${criticalIncidents.length} முக்கியமான சம்பவங்கள் பதிவாகியுள்ளன.`,
        DE: `NOTFALL: Sofort evakuieren. ${criticalIncidents.length} kritische Vorfälle gemeldet. Zu Notunterkünften bewegen.`
      };

      comms.push({
        id: `comms_evac_${lang}`,
        audience: 'PUBLIC',
        channel: 'SMS',
        lang: lang as CommsDraft['lang'],
        subject: 'EMERGENCY EVACUATION',
        body: messages[lang as keyof typeof messages],
        urgency: 'HIGH',
        timing: 'Immediate',
        rationale: `Critical incidents require immediate public alert in ${lang}`
      });
    });
  }

  // Comms 2: Shelter capacity update (T+30min)
  const fullShelters = shelters.filter(s => (s.current_occupancy / s.capacity) >= 0.9);
  if (fullShelters.length > 0) {
    comms.push({
      id: `comms_shelter_capacity`,
      audience: 'DISTRICT',
      channel: 'WHATSAPP',
      lang: 'EN',
      subject: 'Shelter Capacity Alert',
      body: `${fullShelters.length} shelter(s) near capacity. Redirect incoming evacuees to alternate locations. List: ${fullShelters.map(s => s.name).join(', ')}`,
      urgency: 'MEDIUM',
      timing: 'T+30min',
      rationale: `Prevent shelter overload by alerting district coordinators`
    });
  }

  // Comms 3: Tourism advisory (if tourism objective)
  if (playbook.objectives.protectTourism && preset.languages.includes('DE')) {
    comms.push({
      id: `comms_tourism`,
      audience: 'TOURISTS',
      channel: 'EMAIL',
      lang: 'DE',
      subject: 'Reisewarnung / Travel Advisory',
      body: `Reisewarnung: Naturkatastrophe in der Region. Bitte folgen Sie lokalen Behörden. Evakuierung zu sicheren Zonen organisiert. / Travel Advisory: Natural disaster in region. Follow local authorities. Evacuation to safe zones arranged.`,
      urgency: 'MEDIUM',
      timing: 'T+15min',
      rationale: `Tourism protection objective: Alert international visitors in native language`
    });
  }

  // Comms 4: Agency coordination (T+60min)
  comms.push({
    id: `comms_agency`,
    audience: 'AGENCY',
    channel: 'EMAIL',
    lang: 'EN',
    subject: 'Inter-Agency Coordination Brief',
    body: `Playbook "${playbook.name}" activated. ${criticalIncidents.length} critical incidents. Missions deployed: evacuation, medical, supply. Request additional support if available.`,
    urgency: 'LOW',
    timing: 'T+60min',
    rationale: `Keep partner agencies informed for coordinated response`
  });

  return comms;
}

// ============================================
// SCORING
// ============================================

function scorePlan(
  playbook: Playbook,
  missions: MissionDraft[],
  comms: CommsDraft[],
  shelterPredictions: ShelterPrediction[],
  assets: Asset[],
  incidents: Incident[],
  ghostRoads: GhostRoad[]
): PlaybookScores {
  // Equity: Lower variance in priority distribution
  const priorityVariance = missions.length > 0
    ? missions.reduce((sum, m) => sum + Math.pow(m.priority - 7, 2), 0) / missions.length
    : 10;
  const equity = Math.max(0, 100 - (priorityVariance * 10));

  // Efficiency: High-priority missions exist for critical incidents
  const criticalCovered = incidents.filter(inc => inc.severity >= 8).length;
  const missionsCovering = missions.filter(m => m.priority >= 8).length;
  const efficiency = criticalCovered > 0 
    ? Math.min(100, (missionsCovering / criticalCovered) * 100)
    : 100;

  // Overload Avoidance: Shelters stay under 95%
  const overloaded = shelterPredictions.filter(sp => sp.capacityPercent >= 95).length;
  const overloadAvoidance = shelterPredictions.length > 0
    ? Math.max(0, 100 - (overloaded / shelterPredictions.length) * 100)
    : 100;

  // Travel Safety: Missions avoid blocked roads
  const missionsNearBlocked = missions.filter(m => {
    if (!m.targetLocation) return false;
    return ghostRoads.some(road => {
      const dist = Math.abs(road.coords[0][0] - m.targetLocation![0]) + 
                   Math.abs(road.coords[0][1] - m.targetLocation![1]);
      return dist < 0.05;
    });
  }).length;
  const travelSafety = missions.length > 0
    ? Math.max(0, 100 - (missionsNearBlocked / missions.length) * 100)
    : 100;

  // Execution Feasibility: Enough ready assets for missions
  const readyAssets = assets.filter(a => a.status === 'READY').length;
  const neededAssets = missions.reduce((sum, m) => sum + m.suggestedAssets.length, 0);
  const feasibility = neededAssets > 0
    ? Math.min(100, (readyAssets / neededAssets) * 100)
    : 100;

  // Overall: Weighted average based on objectives (ensure weights sum to 1.0)
  const overall = 
    equity * 0.30 +          // 30% equity
    efficiency * 0.25 +      // 25% efficiency
    overloadAvoidance * 0.20 + // 20% overload avoidance
    travelSafety * 0.15 +    // 15% safety
    feasibility * 0.10;      // 10% feasibility
  // Total = 1.0 (100%)

  return {
    equity: Math.min(100, Math.max(0, Math.round(equity))),
    efficiency: Math.min(100, Math.max(0, Math.round(efficiency))),
    overloadAvoidance: Math.min(100, Math.max(0, Math.round(overloadAvoidance))),
    travelSafety: Math.min(100, Math.max(0, Math.round(travelSafety))),
    executionFeasibility: Math.min(100, Math.max(0, Math.round(feasibility))),
    overall: Math.min(100, Math.max(0, Math.round(overall)))
  };
}

// ============================================
// COMMANDER BRIEF
// ============================================

function generateCommanderBrief(
  playbook: Playbook,
  missions: MissionDraft[],
  comms: CommsDraft[],
  shelterPredictions: ShelterPrediction[],
  scores: PlaybookScores
): PlaybookRun['commanderBrief'] {
  // Immediate actions (0-30min)
  const immediate = [
    `Execute ${missions.filter(m => m.priority >= 8).length} high-priority missions`,
    `Send emergency alerts (${comms.filter(c => c.timing === 'Immediate').length} messages)`,
    missions.find(m => m.type === 'EVACUATION')
      ? `Begin evacuation of high-risk zones`
      : 'Monitor for evacuation triggers'
  ];

  // Next 2 hours
  const nextTwoHours = [
    `Complete all ${missions.length} planned missions`,
    `Monitor shelter capacity (${shelterPredictions.filter(sp => sp.capacityPercent >= 80).length} approaching capacity)`,
    missions.find(m => m.type === 'RECON')
      ? `Recon results will inform route adjustments`
      : 'Continue with planned routes'
  ];

  // Comms schedule
  const commsSchedule = comms.map(c => 
    `${c.timing}: ${c.subject} (${c.audience}, ${c.lang})`
  );

  // Resource allocation
  const assetTypes = [...new Set(missions.flatMap(m => m.suggestedAssets))];
  const resourceAllocation = assetTypes.map(type => {
    const count = missions.filter(m => m.suggestedAssets.includes(type)).length;
    return `${type}: ${count} mission(s)`;
  });

  // Risk warnings
  const riskWarnings = [];
  if (scores.overloadAvoidance < 70) {
    riskWarnings.push('⚠️ Shelter overload risk - prepare alternate sites');
  }
  if (scores.travelSafety < 70) {
    riskWarnings.push('⚠️ Multiple missions near blocked roads - expect delays');
  }
  if (scores.executionFeasibility < 70) {
    riskWarnings.push('⚠️ Insufficient ready assets - request external support');
  }
  if (riskWarnings.length === 0) {
    riskWarnings.push('✓ No critical risk factors identified');
  }

  return {
    immediate,
    nextTwoHours,
    commsSchedule,
    resourceAllocation,
    riskWarnings
  };
}
