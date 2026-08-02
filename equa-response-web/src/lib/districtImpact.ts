/**
 * District Impact Engine - Geospatial Intelligence
 * Computes per-district impact scores and recommended operational posture
 */

import type { Incident, FloodPolygon, CycloneCone, GhostRoad, Shelter } from './api';
import districtsGeoJSON from '@/data/sri_lanka_districts';
import { getRandomPlaces } from '@/data/district_places';

// ============================================
// TYPES
// ============================================

export type DistrictPosture = 'MONITOR' | 'ALERT' | 'EVACUATE' | 'DISPATCH' | 'LOCKDOWN';

export interface DistrictImpact {
  district: string;
  code: string;
  province: string;
  
  // Hazard flags
  hazardFlags: {
    flood: boolean;
    cyclone: boolean;
    landslide: boolean;
    wind: boolean;
  };
  
  // Flood analysis
  flood: {
    affectedAreaPct: number; // 0-100
    maxDepthM: number;
    avgDepthM: number;
  };
  
  // Cyclone analysis
  cyclone: {
    insideCone: boolean;
    windRisk: number; // 0-100
  };
  
  // Access analysis
  access: {
    ghostRoadBlocks: number;
    accessibilityScore: number; // 0-100 (100 = no blockage)
  };
  
  // Shelter analysis
  shelters: {
    totalCapacity: number;
    currentOccupancyPct: number;
    predicted1hPct: number;
    atRiskCount: number; // shelters >= 80%
  };
  
  // Incident analysis
  incidents: {
    total: number;
    critical: number; // severity >= 8
    byType: Record<string, number>;
  };
  
  // Overall metrics
  populationAtRisk: number; // mock heuristic
  impactScore: number; // 0-100 (higher = more severe)
  recommendedPosture: DistrictPosture;
  evidence: string[]; // human-readable reasons
  affectedPlaces: string[]; // key villages/DS divisions
}

export interface ImpactFeedItem {
  id: string;
  timestamp: number;
  district: string;
  message: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  delta?: string; // e.g., "↑0.4m" or "+3 blocks"
}

// ============================================
// GEOSPATIAL HELPERS
// ============================================

/**
 * Point in polygon (ray casting algorithm)
 */
function pointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  // Handle MultiPolygon (use first polygon)
  const coords = polygon[0];
  const [lon, lat] = point;
  
  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[j];
    
    const intersect = ((lat1 > lat) !== (lat2 > lat)) &&
      (lon < ((lon2 - lon1) * (lat - lat1)) / (lat2 - lat1) + lon1);
    
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Polygon intersection (simplified: check if any flood polygon point is inside district)
 */
function polygonIntersects(poly1: number[][][], poly2: Array<[number, number]>): boolean {
  // Check if any point of poly2 is inside poly1
  for (const point of poly2) {
    if (pointInPolygon([point[1], point[0]], poly1)) {
      return true;
    }
  }
  return false;
}

// ============================================
// DISTRICT IMPACT COMPUTATION
// ============================================

export function computeDistrictImpacts(
  incidents: Incident[],
  floodPolygons: FloodPolygon[],
  cycloneCone: CycloneCone | null,
  ghostRoads: GhostRoad[],
  shelters: Shelter[]
): DistrictImpact[] {
  const impacts: DistrictImpact[] = [];

  for (const feature of districtsGeoJSON.features) {
    const districtName = feature.properties.name;
    const districtCode = feature.properties.code;
    const province = feature.properties.province;
    const geometry = feature.geometry.coordinates;

    // Initialize impact
    const impact: DistrictImpact = {
      district: districtName,
      code: districtCode,
      province,
      hazardFlags: { flood: false, cyclone: false, landslide: false, wind: false },
      flood: { affectedAreaPct: 0, maxDepthM: 0, avgDepthM: 0 },
      cyclone: { insideCone: false, windRisk: 0 },
      access: { ghostRoadBlocks: 0, accessibilityScore: 100 },
      shelters: { totalCapacity: 0, currentOccupancyPct: 0, predicted1hPct: 0, atRiskCount: 0 },
      incidents: { total: 0, critical: 0, byType: {} },
      populationAtRisk: 0,
      impactScore: 0,
      recommendedPosture: 'MONITOR',
      evidence: [],
      affectedPlaces: []
    };

    // 1. INCIDENTS ANALYSIS
    for (const inc of incidents) {
      if (pointInPolygon([inc.lon, inc.lat], geometry)) {
        impact.incidents.total++;
        if (inc.severity >= 8) impact.incidents.critical++;
        impact.incidents.byType[inc.type] = (impact.incidents.byType[inc.type] || 0) + 1;
        impact.hazardFlags[inc.type.toLowerCase() as keyof typeof impact.hazardFlags] = true;
      }
    }

    // 2. FLOOD ANALYSIS
    const floodDepths: number[] = [];
    for (const flood of floodPolygons) {
      if (polygonIntersects(geometry, flood.polygon)) {
        impact.hazardFlags.flood = true;
        floodDepths.push(flood.depth_m);
      }
    }
    
    if (floodDepths.length > 0) {
      impact.flood.maxDepthM = Math.max(...floodDepths);
      impact.flood.avgDepthM = floodDepths.reduce((a, b) => a + b, 0) / floodDepths.length;
      impact.flood.affectedAreaPct = Math.min(100, floodDepths.length * 15); // heuristic
    }

    // 3. CYCLONE ANALYSIS
    if (cycloneCone) {
      const coneIntersects = polygonIntersects(geometry, cycloneCone.polygon);
      if (coneIntersects) {
        impact.hazardFlags.cyclone = true;
        impact.hazardFlags.wind = true;
        impact.cyclone.insideCone = true;
        impact.cyclone.windRisk = 75; // heuristic
      }
    }

    // 4. ACCESS ANALYSIS
    for (const road of ghostRoads) {
      const midpoint = road.coords[Math.floor(road.coords.length / 2)];
      if (pointInPolygon([midpoint[1], midpoint[0]], geometry)) {
        impact.access.ghostRoadBlocks++;
      }
    }
    impact.access.accessibilityScore = Math.max(0, 100 - (impact.access.ghostRoadBlocks * 20));

    // 5. SHELTER ANALYSIS
    const districtShelters = shelters.filter(s => 
      pointInPolygon([s.location[1], s.location[0]], geometry)
    );
    
    if (districtShelters.length > 0) {
      impact.shelters.totalCapacity = districtShelters.reduce((sum, s) => sum + s.capacity, 0);
      const totalOccupancy = districtShelters.reduce((sum, s) => sum + s.current_occupancy, 0);
      impact.shelters.currentOccupancyPct = (totalOccupancy / impact.shelters.totalCapacity) * 100;
      
      // Predict +20% increase
      const predicted = totalOccupancy * 1.2;
      impact.shelters.predicted1hPct = (predicted / impact.shelters.totalCapacity) * 100;
      
      impact.shelters.atRiskCount = districtShelters.filter(s => 
        (s.current_occupancy / s.capacity) >= 0.8
      ).length;
    }

    // 6. POPULATION AT RISK (heuristic)
    const basePopulation = 50000; // mock district population
    const riskFactor = 
      (impact.flood.affectedAreaPct / 100) * 0.4 +
      (impact.cyclone.insideCone ? 0.3 : 0) +
      (impact.incidents.critical / Math.max(impact.incidents.total, 1)) * 0.3;
    impact.populationAtRisk = Math.round(basePopulation * riskFactor);

    // 7. IMPACT SCORE (0-100)
    const floodScore = impact.flood.maxDepthM * 25; // depth * weight
    const cycloneScore = impact.cyclone.windRisk * 0.4;
    const incidentScore = (impact.incidents.critical * 10) + (impact.incidents.total * 2);
    const accessScore = (100 - impact.access.accessibilityScore) * 0.3;
    const shelterScore = (impact.shelters.atRiskCount * 15);
    
    impact.impactScore = Math.min(100, Math.round(
      floodScore + cycloneScore + incidentScore + accessScore + shelterScore
    ));

    // 8. RECOMMENDED POSTURE
    if (impact.impactScore >= 75 || impact.flood.maxDepthM >= 2.0 || impact.incidents.critical >= 3) {
      impact.recommendedPosture = 'EVACUATE';
    } else if (impact.impactScore >= 50 || impact.flood.maxDepthM >= 1.2 || impact.shelters.predicted1hPct >= 90) {
      impact.recommendedPosture = 'DISPATCH';
    } else if (impact.impactScore >= 30 || impact.cyclone.insideCone) {
      impact.recommendedPosture = 'ALERT';
    } else if (impact.impactScore >= 15) {
      impact.recommendedPosture = 'MONITOR';
    } else {
      impact.recommendedPosture = 'MONITOR';
    }

    // 9. EVIDENCE (human-readable)
    if (impact.flood.maxDepthM > 0) {
      impact.evidence.push(`Flood depth ${impact.flood.maxDepthM.toFixed(1)}m (${impact.flood.affectedAreaPct.toFixed(0)}% area)`);
    }
    if (impact.cyclone.insideCone) {
      impact.evidence.push(`Inside cyclone cone (wind risk ${impact.cyclone.windRisk}%)`);
    }
    if (impact.incidents.critical > 0) {
      impact.evidence.push(`${impact.incidents.critical} critical incidents`);
    }
    if (impact.access.ghostRoadBlocks > 0) {
      impact.evidence.push(`${impact.access.ghostRoadBlocks} road blockages (access ${impact.access.accessibilityScore}%)`);
    }
    if (impact.shelters.atRiskCount > 0) {
      impact.evidence.push(`${impact.shelters.atRiskCount} shelters at risk of overload`);
    }
    if (impact.evidence.length === 0) {
      impact.evidence.push('No significant hazards detected');
    }

    // 10. AFFECTED PLACES
    if (impact.impactScore > 20) {
      impact.affectedPlaces = getRandomPlaces(districtName, 3);
    }

    impacts.push(impact);
  }

  // Sort by impact score (descending)
  return impacts.sort((a, b) => b.impactScore - a.impactScore);
}

// ============================================
// IMPACT FEED GENERATION
// ============================================

let previousImpacts: DistrictImpact[] = [];

// Define neighboring districts for contextual feed generation
const DISTRICT_NEIGHBORS: Record<string, string[]> = {
  'Kalutara': ['Colombo', 'Gampaha', 'Ratnapura', 'Galle'],
  'Colombo': ['Kalutara', 'Gampaha'],
  'Gampaha': ['Colombo', 'Kalutara', 'Kegalle'],
  'Ratnapura': ['Kalutara', 'Kegalle', 'Galle', 'Hambantota'],
  'Galle': ['Kalutara', 'Ratnapura', 'Matara', 'Hambantota'],
  'Matara': ['Galle', 'Hambantota'],
  'Hambantota': ['Ratnapura', 'Galle', 'Matara'],
  'Kandy': ['Kegalle', 'Matale', 'Nuwara Eliya'],
  'Kegalle': ['Gampaha', 'Ratnapura', 'Kandy'],
  'Matale': ['Kandy', 'Nuwara Eliya'],
  'Nuwara Eliya': ['Kandy', 'Matale', 'Badulla'],
  'Badulla': ['Nuwara Eliya', 'Ampara'],
  'Trincomalee': ['Batticaloa'],
  'Batticaloa': ['Trincomalee', 'Ampara'],
  'Ampara': ['Batticaloa', 'Badulla', 'Hambantota']
};

export function generateImpactFeed(
  currentImpacts: DistrictImpact[],
  frameLabel?: string
): ImpactFeedItem[] {
  const feed: ImpactFeedItem[] = [];
  const now = Date.now();

  // Track which districts have changes to show neighbors
  const districtsWithChanges = new Set<string>();
  
  // If this is the first run (no previous state), generate initial status for high-impact districts
  const isInitialLoad = previousImpacts.length === 0;

  for (const current of currentImpacts) {
    const previous = previousImpacts.find(p => p.district === current.district);
    
    // Skip low-impact districts (unless initial load and score is significant)
    if (current.impactScore < 15 && !(isInitialLoad && current.impactScore >= 30)) continue;
    
    // On initial load, generate status reports for high-impact districts
    if (isInitialLoad && current.impactScore >= 30) {
      districtsWithChanges.add(current.district);
      
      // Initial status report
      feed.push({
        id: `init_${current.district}_${now}`,
        timestamp: now,
        district: current.district,
        message: `${current.recommendedPosture} posture (impact: ${current.impactScore})`,
        severity: current.impactScore >= 75 ? 'CRITICAL' : current.impactScore >= 50 ? 'WARN' : 'INFO'
      });
      
      // Add key hazards
      if (current.flood.maxDepthM > 0) {
        feed.push({
          id: `init_flood_${current.district}_${now}`,
          timestamp: now,
          district: current.district,
          message: `Flood depth ${current.flood.maxDepthM.toFixed(1)}m detected`,
          severity: current.flood.maxDepthM >= 2.0 ? 'CRITICAL' : 'WARN'
        });
      }
      
      if (current.incidents.critical > 0) {
        feed.push({
          id: `init_incidents_${current.district}_${now}`,
          timestamp: now,
          district: current.district,
          message: `${current.incidents.critical} critical incidents active`,
          severity: 'CRITICAL'
        });
      }
      
      if (current.shelters.predicted1hPct >= 80) {
        feed.push({
          id: `init_shelter_${current.district}_${now}`,
          timestamp: now,
          district: current.district,
          message: `Shelter load predicted ${current.shelters.predicted1hPct.toFixed(0)}%`,
          severity: current.shelters.predicted1hPct >= 90 ? 'WARN' : 'INFO'
        });
      }
      
      continue; // Skip change detection for initial load
    }

    // Posture change
    if (previous && previous.recommendedPosture !== current.recommendedPosture) {
      districtsWithChanges.add(current.district);
      feed.push({
        id: `posture_${current.district}_${now}`,
        timestamp: now,
        district: current.district,
        message: `Posture upgraded to ${current.recommendedPosture}`,
        severity: current.recommendedPosture === 'EVACUATE' ? 'CRITICAL' : 'WARN'
      });
    }

    // Flood depth change
    if (previous && current.flood.maxDepthM > previous.flood.maxDepthM + 0.2) {
      districtsWithChanges.add(current.district);
      const delta = current.flood.maxDepthM - previous.flood.maxDepthM;
      feed.push({
        id: `flood_${current.district}_${now}`,
        timestamp: now,
        district: current.district,
        message: `Flood max depth rose to ${current.flood.maxDepthM.toFixed(1)}m`,
        severity: current.flood.maxDepthM >= 2.0 ? 'CRITICAL' : 'WARN',
        delta: `↑${delta.toFixed(1)}m`
      });
    }

    // Access degradation
    if (previous && current.access.ghostRoadBlocks > previous.access.ghostRoadBlocks) {
      districtsWithChanges.add(current.district);
      const delta = current.access.ghostRoadBlocks - previous.access.ghostRoadBlocks;
      feed.push({
        id: `access_${current.district}_${now}`,
        timestamp: now,
        district: current.district,
        message: `Access score dropped to ${current.access.accessibilityScore}%`,
        severity: 'WARN',
        delta: `+${delta} blocks`
      });
    }

    // Shelter overload risk
    if (current.shelters.predicted1hPct >= 90 && (!previous || previous.shelters.predicted1hPct < 90)) {
      districtsWithChanges.add(current.district);
      feed.push({
        id: `shelter_${current.district}_${now}`,
        timestamp: now,
        district: current.district,
        message: `Shelter overload predicted (${current.shelters.predicted1hPct.toFixed(0)}%)`,
        severity: 'WARN'
      });
    }

    // New cyclone impact
    if (current.cyclone.insideCone && (!previous || !previous.cyclone.insideCone)) {
      districtsWithChanges.add(current.district);
      feed.push({
        id: `cyclone_${current.district}_${now}`,
        timestamp: now,
        district: current.district,
        message: `Cyclone cone intersecting district`,
        severity: 'CRITICAL'
      });
    }

    // Critical incidents
    if (current.incidents.critical > 0 && (!previous || current.incidents.critical > previous.incidents.critical)) {
      districtsWithChanges.add(current.district);
      feed.push({
        id: `incident_${current.district}_${now}`,
        timestamp: now,
        district: current.district,
        message: `${current.incidents.critical} critical incidents reported`,
        severity: 'CRITICAL'
      });
    }
  }

  // Add neighboring district context (if a district has changes, show its neighbors' status)
  if (districtsWithChanges.size > 0) {
    const neighboringDistricts = new Set<string>();
    
    // Find all neighbors of districts with changes
    for (const district of districtsWithChanges) {
      const neighbors = DISTRICT_NEIGHBORS[district] || [];
      neighbors.forEach(n => neighboringDistricts.add(n));
    }
    
    // Add info about high-impact neighbors (only if they're not already in the feed)
    for (const neighborDistrict of neighboringDistricts) {
      // Skip if this district already has updates in the feed
      if (districtsWithChanges.has(neighborDistrict)) continue;
      
      const neighbor = currentImpacts.find(d => d.district === neighborDistrict);
      if (!neighbor) continue;
      
      // Only add if neighbor has significant impact (>50) and a concerning posture
      if (neighbor.impactScore >= 50 && 
          (neighbor.recommendedPosture === 'EVACUATE' || 
           neighbor.recommendedPosture === 'DISPATCH' ||
           neighbor.recommendedPosture === 'ALERT')) {
        feed.push({
          id: `neighbor_${neighbor.district}_${now}`,
          timestamp: now,
          district: neighbor.district,
          message: `Neighbor district at ${neighbor.recommendedPosture} posture (impact: ${neighbor.impactScore})`,
          severity: neighbor.recommendedPosture === 'EVACUATE' ? 'CRITICAL' : 'WARN'
        });
      }
    }
  }

  // Update previous state
  previousImpacts = currentImpacts;

  // Add frame context if provided
  if (frameLabel && feed.length > 0) {
    feed.unshift({
      id: `frame_${now}`,
      timestamp: now,
      district: 'SYSTEM',
      message: `Timeline: ${frameLabel}`,
      severity: 'INFO'
    });
  }

  // Sort feed items to prioritize showing multiple districts
  // Priority: CRITICAL first, then WARN, then INFO
  // Within each severity, show different districts before repeating districts
  const sortedFeed = [...feed].sort((a, b) => {
    // First, sort by severity (CRITICAL > WARN > INFO)
    const severityOrder = { 'CRITICAL': 0, 'WARN': 1, 'INFO': 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // Then by timestamp (newer first)
    return b.timestamp - a.timestamp;
  });

  // Deduplicate to show at most 2 events per district in the top results
  const districtCounts = new Map<string, number>();
  const diverseFeed: ImpactFeedItem[] = [];
  
  for (const item of sortedFeed) {
    const count = districtCounts.get(item.district) || 0;
    if (count < 2 || item.district === 'SYSTEM') {
      diverseFeed.push(item);
      districtCounts.set(item.district, count + 1);
    }
  }

  return diverseFeed;
}

// ============================================
// POSTURE COLORS
// ============================================

export function getPostureColor(posture: DistrictPosture): string {
  switch (posture) {
    case 'EVACUATE': return 'text-red-400 bg-red-500/20 border-red-500/50';
    case 'DISPATCH': return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
    case 'ALERT': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
    case 'LOCKDOWN': return 'text-purple-400 bg-purple-500/20 border-purple-500/50';
    case 'MONITOR': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
  }
}

export function getImpactScoreColor(score: number): string {
  if (score >= 75) return 'text-red-400';
  if (score >= 50) return 'text-amber-400';
  if (score >= 30) return 'text-yellow-400';
  return 'text-slate-400';
}
