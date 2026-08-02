/**
 * EquaPulse - Fairness Heatmap + Evacuation Boundary
 * Flagship feature: Computes live risk/fairness surfaces and evacuation zones
 */

import type { Incident, FloodPolygon, CycloneCone, GhostRoad, Shelter } from './api';
import type { Asset } from '@/store/operationsStore';

// ============================================
// TYPES
// ============================================

export interface GridCell {
  lat: number;
  lon: number;
  riskScore: number;        // 0-1 (hazards + incidents)
  fairnessScore: number;    // 0-1 (wait + accessibility + shelter)
  equaPulse: number;        // composite
  underservedIndex: number; // fairness - risk
}

export interface EquaPulseGrid {
  cells: GridCell[][];
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  resolution: number;
}

export interface EvacuationZone {
  boundary: Array<[number, number]>;
  populationEstimate: number;
  incidentCount: number;
  avgRisk: number;
  avgFairness: number;
}

// ============================================
// GEOSPATIAL HELPERS
// ============================================

/**
 * Haversine distance in km
 */
export function haversineDistance(
  p1: { lat: number; lon: number } | [number, number],
  p2: { lat: number; lon: number } | [number, number]
): number {
  const lat1 = Array.isArray(p1) ? p1[0] : p1.lat;
  const lon1 = Array.isArray(p1) ? p1[1] : p1.lon;
  const lat2 = Array.isArray(p2) ? p2[0] : p2.lat;
  const lon2 = Array.isArray(p2) ? p2[1] : p2.lon;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Point in polygon (ray casting)
 */
export function pointInPolygon(
  point: { lat: number; lon: number } | [number, number],
  polygon: Array<[number, number]>
): boolean {
  const lat = Array.isArray(point) ? point[0] : point.lat;
  const lon = Array.isArray(point) ? point[1] : point.lon;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lon1] = polygon[i];
    const [lat2, lon2] = polygon[j];
    
    const intersect = ((lon1 > lon) !== (lon2 > lon)) &&
      (lat < ((lat2 - lat1) * (lon - lon1)) / (lon2 - lon1) + lat1);
    
    if (intersect) inside = !inside;
  }
  return inside;
}

// ============================================
// RISK COMPUTATION
// ============================================

function computeRiskScore(
  cell: { lat: number; lon: number },
  incidents: Incident[],
  floodPolygons: FloodPolygon[],
  cycloneCone: CycloneCone | null
): number {
  let score = 0;

  // Flood contribution (0-0.4)
  for (const flood of floodPolygons) {
    if (pointInPolygon(cell, flood.polygon)) {
      const depthContribution = Math.min(flood.depth_m / 3.0, 1.0) * 0.4;
      score += depthContribution;
    }
  }

  // Cyclone contribution (0-0.3)
  if (cycloneCone && pointInPolygon(cell, cycloneCone.polygon)) {
    score += 0.3;
  }

  // Incident influence with Gaussian decay (0-0.3)
  for (const inc of incidents) {
    const dist = haversineDistance(cell, { lat: inc.lat, lon: inc.lon });
    const sigma = 5.0; // km
    const influence = (inc.severity / 10) * Math.exp(-(dist * dist) / (2 * sigma * sigma));
    score += influence * 0.3;
  }

  return Math.min(score, 1.0);
}

// ============================================
// FAIRNESS COMPUTATION
// ============================================

function computeFairnessScore(
  cell: { lat: number; lon: number },
  ghostRoads: GhostRoad[],
  shelters: Shelter[],
  assets: Asset[]
): number {
  let score = 0;

  // Wait penalty - distance to nearest ready asset (0-0.4)
  const readyAssets = assets.filter(a => a.status === 'READY');
  if (readyAssets.length > 0) {
    let minDist = Infinity;
    readyAssets.forEach(() => {
      // Mock: assets don't have location, use depot approximation
      // In real system, assets would have current location
      const assetDist = Math.random() * 20; // Mock 0-20km
      minDist = Math.min(minDist, assetDist);
    });
    const waitMinutes = minDist / 0.5; // Assume 30 km/h = 0.5 km/min
    score += Math.min(waitMinutes / 60, 1.0) * 0.4;
  } else {
    score += 0.4; // No assets = max wait penalty
  }

  // Accessibility penalty - near ghost road (0-0.3)
  for (const road of ghostRoads) {
    const roadStart = road.coords[0];
    const roadEnd = road.coords[road.coords.length - 1];
    const distToStart = haversineDistance(cell, roadStart);
    const distToEnd = haversineDistance(cell, roadEnd);
    const minRoadDist = Math.min(distToStart, distToEnd);
    
    if (minRoadDist < 2.0) { // Within 2km of blocked road
      const penalty = (2.0 - minRoadDist) / 2.0;
      score += penalty * 0.3;
    }
  }

  // Shelter pressure - nearest shelters saturated (0-0.3)
  if (shelters.length > 0) {
    let nearestShelter: Shelter | null = null;
    let minDist = Infinity;
    
    for (const shelter of shelters) {
      const dist = haversineDistance(cell, shelter.location);
      if (dist < minDist) {
        minDist = dist;
        nearestShelter = shelter;
      }
    }
    
    if (nearestShelter) {
      const occupancyPct = nearestShelter.current_occupancy / nearestShelter.capacity;
      if (occupancyPct >= 0.8) {
        const pressure = (occupancyPct - 0.8) * 1.5;
        score += Math.min(pressure, 1.0) * 0.3;
      }
    }
  }

  return Math.min(score, 1.0);
}

// ============================================
// MAIN GRID COMPUTATION
// ============================================

export function computeEquaPulseGrid(
  center: [number, number],
  radiusKm: number,
  resolution: number,
  alpha: number,
  incidents: Incident[],
  floodPolygons: FloodPolygon[],
  cycloneCone: CycloneCone | null,
  ghostRoads: GhostRoad[],
  shelters: Shelter[],
  assets: Asset[]
): EquaPulseGrid {
  // Convert radius to lat/lon degrees (rough approximation)
  const latDegPerKm = 1 / 111.0;
  const lonDegPerKm = 1 / (111.0 * Math.cos((center[0] * Math.PI) / 180));
  
  const deltaLat = radiusKm * latDegPerKm;
  const deltaLon = radiusKm * lonDegPerKm;

  const bounds = {
    minLat: center[0] - deltaLat,
    maxLat: center[0] + deltaLat,
    minLon: center[1] - deltaLon,
    maxLon: center[1] + deltaLon
  };

  const cells: GridCell[][] = [];
  const stepLat = (bounds.maxLat - bounds.minLat) / resolution;
  const stepLon = (bounds.maxLon - bounds.minLon) / resolution;

  for (let i = 0; i < resolution; i++) {
    const row: GridCell[] = [];
    for (let j = 0; j < resolution; j++) {
      const lat = bounds.minLat + i * stepLat;
      const lon = bounds.minLon + j * stepLon;
      const cellCenter = { lat, lon };

      const riskScore = computeRiskScore(cellCenter, incidents, floodPolygons, cycloneCone);
      const fairnessScore = computeFairnessScore(cellCenter, ghostRoads, shelters, assets);
      const equaPulse = (1 - alpha) * riskScore + alpha * fairnessScore;
      const underservedIndex = fairnessScore - riskScore;

      row.push({
        lat,
        lon,
        riskScore,
        fairnessScore,
        equaPulse,
        underservedIndex
      });
    }
    cells.push(row);
  }

  return { cells, bounds, resolution };
}

// ============================================
// EVACUATION BOUNDARY (Convex Hull)
// ============================================

/**
 * Andrew's Monotone Chain Convex Hull
 */
function cross(
  o: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function convexHull(points: Array<[number, number]>): Array<[number, number]> {
  if (points.length < 3) return points;

  // Sort points lexicographically
  const sorted = points.slice().sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);

  // Build lower hull
  const lower: Array<[number, number]> = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  // Build upper hull
  const upper: Array<[number, number]> = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove last point of each half (duplicate)
  lower.pop();
  upper.pop();

  return lower.concat(upper);
}

export function computeEvacuationBoundary(
  grid: EquaPulseGrid,
  threshold: number = 0.65
): EvacuationZone {
  // Collect cells above threshold
  const aboveThreshold: Array<[number, number]> = [];
  let totalRisk = 0;
  let totalFairness = 0;
  let count = 0;

  for (const row of grid.cells) {
    for (const cell of row) {
      if (cell.equaPulse >= threshold) {
        aboveThreshold.push([cell.lat, cell.lon]);
        totalRisk += cell.riskScore;
        totalFairness += cell.fairnessScore;
        count++;
      }
    }
  }

  if (aboveThreshold.length === 0) {
    return {
      boundary: [],
      populationEstimate: 0,
      incidentCount: 0,
      avgRisk: 0,
      avgFairness: 0
    };
  }

  // Compute convex hull for boundary
  const boundary = convexHull(aboveThreshold);

  // Estimate population (mock: 200 per cell)
  const populationEstimate = count * 200;

  return {
    boundary,
    populationEstimate,
    incidentCount: count,
    avgRisk: totalRisk / count,
    avgFairness: totalFairness / count
  };
}

// ============================================
// COLOR MAPPING
// ============================================

export function getRiskColor(score: number): string {
  // Blue (low) → Red (high)
  if (score < 0.2) return 'rgba(59, 130, 246, 0.3)'; // blue-500
  if (score < 0.4) return 'rgba(34, 211, 238, 0.4)'; // cyan-400
  if (score < 0.6) return 'rgba(251, 191, 36, 0.5)'; // amber-400
  if (score < 0.8) return 'rgba(251, 146, 60, 0.6)'; // orange-400
  return 'rgba(239, 68, 68, 0.7)'; // red-500
}

export function getFairnessColor(score: number): string {
  // Cyan (low) → Magenta (high)
  if (score < 0.2) return 'rgba(6, 182, 212, 0.3)'; // cyan-500
  if (score < 0.4) return 'rgba(139, 92, 246, 0.4)'; // violet-500
  if (score < 0.6) return 'rgba(168, 85, 247, 0.5)'; // purple-500
  if (score < 0.8) return 'rgba(217, 70, 239, 0.6)'; // fuchsia-500
  return 'rgba(236, 72, 153, 0.7)'; // pink-500
}

export function getEquaPulseColor(score: number): string {
  // Yellow (low) → Amber/Orange (high)
  if (score < 0.2) return 'rgba(250, 204, 21, 0.2)'; // yellow-400
  if (score < 0.4) return 'rgba(251, 191, 36, 0.3)'; // amber-400
  if (score < 0.6) return 'rgba(251, 146, 60, 0.4)'; // orange-400
  if (score < 0.8) return 'rgba(249, 115, 22, 0.5)'; // orange-500
  return 'rgba(234, 88, 12, 0.6)'; // orange-600
}

// ============================================
// EXPLAIN CELL
// ============================================

export interface CellExplanation {
  cell: GridCell;
  riskFactors: string[];
  fairnessFactors: string[];
  nearestIncidents: Array<{ id: string; type: string; distance: number }>;
  nearestShelter: { name: string; occupancy: number; distance: number } | null;
  recommendation: string;
}

export function explainCell(
  cell: GridCell,
  incidents: Incident[],
  shelters: Shelter[],
  floodPolygons: FloodPolygon[],
  cycloneCone: CycloneCone | null,
  ghostRoads: GhostRoad[]
): CellExplanation {
  const riskFactors: string[] = [];
  const fairnessFactors: string[] = [];

  // Risk factors
  for (const flood of floodPolygons) {
    if (pointInPolygon(cell, flood.polygon)) {
      riskFactors.push(`Flood depth: ${flood.depth_m}m (${flood.risk} risk)`);
    }
  }

  if (cycloneCone && pointInPolygon(cell, cycloneCone.polygon)) {
    riskFactors.push(`Inside cyclone cone (${cycloneCone.hours}h forecast)`);
  }

  const nearbyIncidents = incidents
    .map(inc => ({
      incident: inc,
      distance: haversineDistance(cell, { lat: inc.lat, lon: inc.lon })
    }))
    .filter(item => item.distance < 10)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  if (nearbyIncidents.length > 0) {
    riskFactors.push(`${nearbyIncidents.length} incidents within 10km`);
  }

  // Fairness factors
  for (const road of ghostRoads) {
    const roadStart = road.coords[0];
    const distToRoad = haversineDistance(cell, roadStart);
    if (distToRoad < 2.0) {
      fairnessFactors.push(`${distToRoad.toFixed(1)}km from blocked road`);
    }
  }

  let nearestShelter: { name: string; occupancy: number; distance: number } | null = null;
  if (shelters.length > 0) {
    const sorted = shelters
      .map(sh => ({
        shelter: sh,
        distance: haversineDistance(cell, sh.location)
      }))
      .sort((a, b) => a.distance - b.distance);

    const nearest = sorted[0];
    const occupancyPct = (nearest.shelter.current_occupancy / nearest.shelter.capacity) * 100;
    nearestShelter = {
      name: nearest.shelter.name,
      occupancy: occupancyPct,
      distance: nearest.distance
    };

    if (occupancyPct >= 80) {
      fairnessFactors.push(`Nearest shelter ${occupancyPct.toFixed(0)}% full`);
    }
  }

  // Recommendation
  let recommendation = '';
  if (cell.equaPulse >= 0.65) {
    recommendation = 'EVACUATE NOW - High priority evacuation zone';
  } else if (cell.equaPulse >= 0.5) {
    recommendation = 'MONITOR CLOSELY - Prepare for possible evacuation';
  } else {
    recommendation = 'SAFE - No immediate action required';
  }

  return {
    cell,
    riskFactors: riskFactors.length > 0 ? riskFactors : ['No significant risk factors'],
    fairnessFactors: fairnessFactors.length > 0 ? fairnessFactors : ['No accessibility issues'],
    nearestIncidents: nearbyIncidents.map(item => ({
      id: item.incident.id,
      type: item.incident.type,
      distance: item.distance
    })),
    nearestShelter,
    recommendation
  };
}
