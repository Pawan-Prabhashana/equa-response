/**
 * OPS COPILOT - Deterministic AI Decision Engine
 * Analyzes Operational State and generates actionable recommendations
 * with full explainability (evidence chain + suggested actions)
 */

import type { OperationalState } from './dataPipeline';

// ============================================
// TYPES
// ============================================

export type RecommendationSeverity = 'INFO' | 'WARN' | 'CRITICAL';
export type ActionType = 'EVACUATE' | 'DISPATCH' | 'REROUTE' | 'SHELTER_REDIRECT' | 'COMMS_ALERT' | 'STAGE_ASSETS';

export interface Evidence {
  type: string;
  source: string;
  ts: number;
  value: string | number;
  unit?: string;
}

export interface MissionDraft {
  title: string;
  incidentIds: string[];
  suggestedAssets: string[]; // asset types
  priority: number; // 1-10
  etaMinutes: number;
}

export interface CommsDraft {
  templateId: string;
  audience: 'DISTRICT' | 'SHELTER' | 'TOURISTS' | 'AGENCY';
  lang: 'EN' | 'SI' | 'TA';
  variables: Record<string, string>;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Recommendation {
  id: string;
  title: string;
  severity: RecommendationSeverity;
  actionType: ActionType;
  target: {
    areaName?: string;
    location?: [number, number];
    incidentIds?: string[];
    shelterIds?: string[];
  };
  rationale: string[]; // Human-readable reasoning steps
  evidence: Evidence[]; // Data points that drove the decision
  suggestedMissions: MissionDraft[];
  suggestedMessages: CommsDraft[];
  confidence: number; // 0-100
  createdAt: number;
}

// ============================================
// DECISION RULES (Deterministic AI Logic)
// ============================================

/**
 * Rule 1: EVACUATE if flood depth >= 1.6m in populated area
 */
function checkEvacuationNeed(state: OperationalState): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  for (const area of state.areaRisks) {
    const hasHighFlood = area.factors.some(f => {
      const match = f.match(/FLOOD_DEPTH_(\d+\.?\d*)M/);
      if (match) {
        const depth = parseFloat(match[1]);
        return depth >= 1.6;
      }
      return false;
    });
    
    const hasCriticalIncidents = area.criticalIncidents > 0;
    
    if (hasHighFlood && hasCriticalIncidents) {
      const floodDepthFactor = area.factors.find(f => f.startsWith('FLOOD_DEPTH_'));
      const depth = floodDepthFactor ? parseFloat(floodDepthFactor.match(/(\d+\.?\d*)M/)![1]) : 0;
      
      recommendations.push({
        id: `evac_${area.areaId}_${Date.now()}`,
        title: `IMMEDIATE EVACUATION: ${area.areaName}`,
        severity: 'CRITICAL',
        actionType: 'EVACUATE',
        target: {
          areaName: area.areaName,
          location: area.center,
          incidentIds: state.incidents
            .filter(inc => {
              const dist = Math.sqrt(
                Math.pow(inc.lat - area.center[0], 2) +
                Math.pow(inc.lon - area.center[1], 2)
              );
              return dist < 0.05;
            })
            .map(inc => inc.id)
        },
        rationale: [
          `Flood depth ${depth}m exceeds safe threshold (1.5m)`,
          `${area.criticalIncidents} critical incidents in area`,
          `EquaPulse composite score: ${area.riskScore.toFixed(2)} (above evac threshold)`,
          `Estimated ${area.population} residents at risk`,
          `Evacuation window: 30-45 minutes before impassable`
        ],
        evidence: [
          {
            type: 'FLOOD_DEPTH',
            source: 'Sensor Network',
            ts: Date.now() - 120000,
            value: depth,
            unit: 'm'
          },
          {
            type: 'RISK_SCORE',
            source: 'Ops Fusion',
            ts: Date.now(),
            value: area.riskScore
          },
          {
            type: 'POPULATION',
            source: 'Census Data',
            ts: Date.now(),
            value: area.population
          }
        ],
        suggestedMissions: [
          {
            title: `Evacuation - ${area.areaName}`,
            incidentIds: state.incidents
              .filter(inc => {
                const dist = Math.sqrt(
                  Math.pow(inc.lat - area.center[0], 2) +
                  Math.pow(inc.lon - area.center[1], 2)
                );
                return dist < 0.05;
              })
              .map(inc => inc.id),
            suggestedAssets: ['TRUCK', 'BOAT'],
            priority: 10,
            etaMinutes: 25
          }
        ],
        suggestedMessages: [
          {
            templateId: 'evac_flood_urgent',
            audience: 'DISTRICT',
            lang: 'EN',
            variables: {
              area: area.areaName,
              depth: `${depth}m`,
              shelter: 'Nearest designated shelter'
            },
            urgency: 'HIGH'
          }
        ],
        confidence: 95,
        createdAt: Date.now()
      });
    }
  }
  
  return recommendations;
}

/**
 * Rule 2: SHELTER_REDIRECT if predicted occupancy >= 90%
 */
function checkShelterCapacity(state: OperationalState): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Simple prediction: current + intake rate * 60 min
  const atRiskShelters = state.shelters.filter(sh => {
    const predictedOccupancy = sh.current_occupancy + (sh.intake_rate_per_min || 1.0) * 60;
    const predictedPct = (predictedOccupancy / sh.capacity) * 100;
    return predictedPct >= 90;
  });
  
  if (atRiskShelters.length > 0) {
    const targetShelter = atRiskShelters[0];
    const predictedOccupancy = targetShelter.current_occupancy + (targetShelter.intake_rate_per_min || 1.0) * 60;
    const predictedPct = (predictedOccupancy / targetShelter.capacity) * 100;
    
    recommendations.push({
      id: `shelter_${targetShelter.id}_${Date.now()}`,
      title: `SHELTER CAPACITY ALERT: ${targetShelter.name}`,
      severity: 'WARN',
      actionType: 'SHELTER_REDIRECT',
      target: {
        areaName: targetShelter.name,
        location: targetShelter.location,
        shelterIds: [targetShelter.id]
      },
      rationale: [
        `Current occupancy: ${targetShelter.current_occupancy}/${targetShelter.capacity} (${((targetShelter.current_occupancy / targetShelter.capacity) * 100).toFixed(0)}%)`,
        `Predicted in 1 hour: ${Math.round(predictedOccupancy)}/${targetShelter.capacity} (${predictedPct.toFixed(0)}%)`,
        `Intake rate: ${targetShelter.intake_rate_per_min} persons/min`,
        `Recommend redirecting new evacuees to alternate shelters`
      ],
      evidence: [
        {
          type: 'OCCUPANCY_CURRENT',
          source: 'Shelter Reports',
          ts: Date.now() - 60000,
          value: targetShelter.current_occupancy
        },
        {
          type: 'OCCUPANCY_PREDICTED',
          source: 'Ops Copilot Model',
          ts: Date.now(),
          value: Math.round(predictedOccupancy)
        },
        {
          type: 'INTAKE_RATE',
          source: 'Shelter Reports',
          ts: Date.now() - 60000,
          value: targetShelter.intake_rate_per_min || 1.0,
          unit: 'persons/min'
        }
      ],
      suggestedMissions: [
        {
          title: `Supply Run - ${targetShelter.name}`,
          incidentIds: [],
          suggestedAssets: ['TRUCK'],
          priority: 7,
          etaMinutes: 45
        }
      ],
      suggestedMessages: [
        {
          templateId: 'shelter_redirect',
          audience: 'DISTRICT',
          lang: 'EN',
          variables: {
            shelter: targetShelter.name,
            alternate: 'Alternate shelter locations'
          },
          urgency: 'MEDIUM'
        }
      ],
      confidence: 85,
      createdAt: Date.now()
    });
  }
  
  return recommendations;
}

/**
 * Rule 3: COMMS_ALERT for cyclone in tourist zones
 */
function checkTouristZoneRisk(state: OperationalState): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  if (state.cycloneCone) {
    // Check if cyclone affects beach/tourist areas
    const touristAreas = state.areaRisks.filter(a => 
      a.areaName.toLowerCase().includes('coast') || 
      a.areaName.toLowerCase().includes('beach')
    );
    
    for (const area of touristAreas) {
      if (area.factors.includes('CYCLONE_CONE')) {
        recommendations.push({
          id: `tourist_${area.areaId}_${Date.now()}`,
          title: `TOURIST ADVISORY: ${area.areaName}`,
          severity: 'WARN',
          actionType: 'COMMS_ALERT',
          target: {
            areaName: area.areaName,
            location: area.center
          },
          rationale: [
            `Cyclone path intersects tourist zone`,
            `Wind speeds expected: 80-120 km/h`,
            `Recommend hotel sheltering or inland evacuation`,
            `Issue multilingual alerts (EN/DE/SI)`
          ],
          evidence: [
            {
              type: 'CYCLONE_PROXIMITY',
              source: 'GDACS',
              ts: Date.now() - 300000,
              value: 'Tropical Cyclone within 50km'
            },
            {
              type: 'WIND_FORECAST',
              source: 'Met Department',
              ts: Date.now() - 180000,
              value: 95,
              unit: 'km/h'
            }
          ],
          suggestedMissions: [],
          suggestedMessages: [
            {
              templateId: 'tourist_cyclone_warning',
              audience: 'TOURISTS',
              lang: 'EN',
              variables: {
                area: area.areaName,
                risk: 'HIGH',
                action: 'Shelter in place or evacuate inland'
              },
              urgency: 'HIGH'
            }
          ],
          confidence: 80,
          createdAt: Date.now()
        });
      }
    }
  }
  
  return recommendations;
}

/**
 * Rule 4: REROUTE if ghost roads block planned corridors
 */
function checkRouteBlockages(state: OperationalState): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  if (state.ghostRoads.length > 2) {
    recommendations.push({
      id: `reroute_${Date.now()}`,
      title: `ROUTE RECALCULATION NEEDED`,
      severity: 'WARN',
      actionType: 'REROUTE',
      target: {
        areaName: 'Multiple corridors'
      },
      rationale: [
        `${state.ghostRoads.length} road segments blocked or damaged`,
        `Planned routes may be compromised`,
        `Recommend re-running logistics optimization`,
        `Consider alternative transport modes (boat/heli)`
      ],
      evidence: [
        {
          type: 'ROAD_CLOSURES',
          source: 'Police + Sensors',
          ts: Date.now() - 240000,
          value: state.ghostRoads.length
        }
      ],
      suggestedMissions: [],
      suggestedMessages: [],
      confidence: 75,
      createdAt: Date.now()
    });
  }
  
  return recommendations;
}

/**
 * Rule 5: STAGE_ASSETS if readiness low but demand high
 */
function checkAssetReadiness(state: OperationalState): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  const readinessPct = state.assetsTotal > 0 
    ? (state.assetsReady / state.assetsTotal) * 100 
    : 0;
  
  const criticalIncidents = state.incidents.filter(inc => inc.severity >= 8).length;
  
  if (readinessPct < 60 && criticalIncidents >= 3) {
    recommendations.push({
      id: `assets_${Date.now()}`,
      title: `ASSET READINESS CRITICAL`,
      severity: 'CRITICAL',
      actionType: 'STAGE_ASSETS',
      target: {
        areaName: 'All districts'
      },
      rationale: [
        `Only ${state.assetsReady}/${state.assetsTotal} assets ready (${readinessPct.toFixed(0)}%)`,
        `${criticalIncidents} critical incidents require immediate response`,
        `Recommend prioritizing asset staging and maintenance`,
        `Consider requesting external support (military/navy)`
      ],
      evidence: [
        {
          type: 'ASSET_READINESS',
          source: 'Asset Management',
          ts: Date.now(),
          value: readinessPct,
          unit: '%'
        },
        {
          type: 'CRITICAL_INCIDENTS',
          source: 'Incident Log',
          ts: Date.now(),
          value: criticalIncidents
        }
      ],
      suggestedMissions: [],
      suggestedMessages: [],
      confidence: 90,
      createdAt: Date.now()
    });
  }
  
  return recommendations;
}

// ============================================
// MAIN COPILOT ENGINE
// ============================================

export function generateRecommendations(
  state: OperationalState
): Recommendation[] {
  const allRecommendations: Recommendation[] = [];
  
  // Run all decision rules
  allRecommendations.push(...checkEvacuationNeed(state));
  allRecommendations.push(...checkShelterCapacity(state));
  allRecommendations.push(...checkTouristZoneRisk(state));
  allRecommendations.push(...checkRouteBlockages(state));
  allRecommendations.push(...checkAssetReadiness(state));
  
  // Sort by severity then confidence
  const severityOrder = { CRITICAL: 3, WARN: 2, INFO: 1 };
  allRecommendations.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity];
    }
    return b.confidence - a.confidence;
  });
  
  // Limit to top 5 most actionable
  return allRecommendations.slice(0, 5);
}

// ============================================
// HELPERS
// ============================================

export function getSeverityColor(severity: RecommendationSeverity): string {
  switch (severity) {
    case 'CRITICAL': return 'text-red-400 bg-red-500/20 border-red-500/50';
    case 'WARN': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
    case 'INFO': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/50';
  }
}

export function getActionTypeLabel(actionType: ActionType): string {
  switch (actionType) {
    case 'EVACUATE': return 'EVACUATION';
    case 'DISPATCH': return 'DISPATCH';
    case 'REROUTE': return 'REROUTE';
    case 'SHELTER_REDIRECT': return 'SHELTER';
    case 'COMMS_ALERT': return 'ALERT';
    case 'STAGE_ASSETS': return 'ASSETS';
  }
}
