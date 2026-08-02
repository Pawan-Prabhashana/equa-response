/**
 * SUB-DISTRICT HOTSPOT DETECTION
 * 
 * For each impacted district, identifies top 3 priority hotspots (P1/P2/P3).
 * Hotspot ranking driven by:
 * - Hazard intensity (flood depth, cyclone proximity)
 * - Incident severity (count + severity)
 * - Shelter overload (capacity stress)
 * - Access loss (ghost road proximity)
 */

import type { FloodPolygon, CycloneCone, GhostRoad, Incident, Shelter } from './api';
import { getDistrictPlaces } from '@/data/district_places';
import districtsGeoJSON from '@/data/sri_lanka_districts';
import type { DistrictFeature } from '@/data/sri_lanka_districts';

// ============================================================================
// TYPES
// ============================================================================

export interface Hotspot {
  placeName: string;
  priority: 'P1' | 'P2' | 'P3';
  score: number; // 0-100 (higher = more critical)
  reasons: string[]; // Human-readable reasons for prioritization
  coords: [number, number]; // Approximate center
  
  // Contributing factors (for detailed analysis)
  hazardScore: number;
  incidentScore: number;
  shelterScore: number;
  accessScore: number;
}

export interface DistrictHotspots {
  district: string;
  hotspots: Hotspot[]; // Top 3, sorted by priority
  totalPlacesAnalyzed: number;
}

// ============================================================================
// HOTSPOT DETECTION ENGINE
// ============================================================================

/**
 * Detect top 3 hotspots per district
 */
export function detectHotspotsForDistrict(
  districtName: string,
  floods: FloodPolygon[],
  cyclone: CycloneCone | null,
  ghostRoads: GhostRoad[],
  incidents: Incident[],
  shelters: Shelter[]
): DistrictHotspots {
  const places = getDistrictPlaces(districtName);
  if (places.length === 0) {
    return {
      district: districtName,
      hotspots: [],
      totalPlacesAnalyzed: 0
    };
  }
  
  // Get district boundary
  const districtFeature = districtsGeoJSON.features.find(
    (f: DistrictFeature) => f.properties.name === districtName
  );
  if (!districtFeature) {
    return {
      district: districtName,
      hotspots: [],
      totalPlacesAnalyzed: 0
    };
  }
  
  // Compute hotspot score for each place
  const hotspots: Hotspot[] = places.map(placeName => {
    const coords = estimatePlaceCoords(placeName, districtName, districtFeature);
    
    const hazardScore = computeHazardScore(coords, floods, cyclone);
    const incidentScore = computeIncidentScore(coords, incidents);
    const shelterScore = computeShelterScore(coords, shelters);
    const accessScore = computeAccessScore(coords, ghostRoads);
    
    // Overall score (weighted)
    const score = (
      hazardScore * 0.35 +    // Hazard intensity (35%)
      incidentScore * 0.30 +   // Incident severity (30%)
      shelterScore * 0.20 +    // Shelter overload (20%)
      accessScore * 0.15       // Access loss (15%)
    );
    
    const reasons = buildReasons(hazardScore, incidentScore, shelterScore, accessScore);
    
    return {
      placeName,
      priority: 'P3', // Will be assigned based on rank
      score,
      reasons,
      coords,
      hazardScore,
      incidentScore,
      shelterScore,
      accessScore
    };
  });
  
  // Sort by score (highest first)
  hotspots.sort((a, b) => b.score - a.score);
  
  // Assign priorities (P1/P2/P3)
  const top3 = hotspots.slice(0, 3);
  if (top3.length >= 1) top3[0].priority = 'P1';
  if (top3.length >= 2) top3[1].priority = 'P2';
  if (top3.length >= 3) top3[2].priority = 'P3';
  
  return {
    district: districtName,
    hotspots: top3,
    totalPlacesAnalyzed: places.length
  };
}

/**
 * Detect hotspots for all impacted districts
 */
export function detectAllHotspots(
  impactedDistricts: string[],
  floods: FloodPolygon[],
  cyclone: CycloneCone | null,
  ghostRoads: GhostRoad[],
  incidents: Incident[],
  shelters: Shelter[]
): DistrictHotspots[] {
  return impactedDistricts.map(district =>
    detectHotspotsForDistrict(district, floods, cyclone, ghostRoads, incidents, shelters)
  );
}

// ============================================================================
// SCORE COMPUTATION
// ============================================================================

/**
 * Compute hazard intensity score (0-100)
 */
function computeHazardScore(
  coords: [number, number],
  floods: FloodPolygon[],
  cyclone: CycloneCone | null
): number {
  let score = 0;
  
  // Flood contribution
  for (const flood of floods) {
    if (isPointNearPolygon(coords, flood.polygon, 0.05)) { // Within ~5km
      score += flood.depth_m * 15; // 2m flood = 30 points
    }
  }
  
  // Cyclone contribution
  if (cyclone && isPointNearPolygon(coords, cyclone.polygon, 0.1)) {
    score += 40; // Cyclone presence = 40 points
  }
  
  return Math.min(score, 100);
}

/**
 * Compute incident severity score (0-100)
 */
function computeIncidentScore(coords: [number, number], incidents: Incident[]): number {
  let score = 0;
  
  for (const incident of incidents) {
    const distance = haversineDistance(coords, [incident.lat, incident.lon]);
    if (distance < 10) { // Within 10km
      const proximity = 1 - (distance / 10); // 0 = far, 1 = close
      score += incident.severity * proximity * 2; // severity-8 at 0km = 16 points
    }
  }
  
  return Math.min(score, 100);
}

/**
 * Compute shelter overload score (0-100)
 */
function computeShelterScore(coords: [number, number], shelters: Shelter[]): number {
  let score = 0;
  let nearbyCount = 0;
  
  for (const shelter of shelters) {
    const distance = haversineDistance(coords, shelter.location);
    if (distance < 15) { // Within 15km
      nearbyCount++;
      const occupancyPct = (shelter.current_occupancy / shelter.capacity) * 100;
      if (occupancyPct >= 80) {
        score += (occupancyPct - 70); // 90% occupancy = 20 points
      }
    }
  }
  
  if (nearbyCount === 0) score += 30; // No nearby shelters = problem
  
  return Math.min(score, 100);
}

/**
 * Compute access loss score (0-100)
 */
function computeAccessScore(coords: [number, number], ghostRoads: GhostRoad[]): number {
  let score = 0;
  
  for (const road of ghostRoads) {
    const minDist = Math.min(
      haversineDistance(coords, road.coords[0]),
      haversineDistance(coords, road.coords[1])
    );
    
    if (minDist < 5) { // Within 5km of blocked road
      score += 25; // Each nearby blockage = 25 points
    }
  }
  
  return Math.min(score, 100);
}

// ============================================================================
// REASON GENERATION
// ============================================================================

function buildReasons(
  hazardScore: number,
  incidentScore: number,
  shelterScore: number,
  accessScore: number
): string[] {
  const reasons: string[] = [];
  
  if (hazardScore >= 40) {
    if (hazardScore >= 70) reasons.push('Extreme hazard exposure (flood/cyclone)');
    else if (hazardScore >= 40) reasons.push('High hazard exposure');
  }
  
  if (incidentScore >= 30) {
    if (incidentScore >= 60) reasons.push('Multiple critical incidents clustered');
    else reasons.push('Critical incidents nearby');
  }
  
  if (shelterScore >= 30) {
    if (shelterScore >= 60) reasons.push('Shelters critically overloaded or absent');
    else reasons.push('Shelter capacity strained');
  }
  
  if (accessScore >= 25) {
    if (accessScore >= 50) reasons.push('Multiple road blockages isolating area');
    else reasons.push('Road access compromised');
  }
  
  if (reasons.length === 0) {
    reasons.push('Elevated risk from combined factors');
  }
  
  return reasons;
}

// ============================================================================
// GEOSPATIAL UTILITIES
// ============================================================================

/**
 * Estimate coords for a place within a district (simplified)
 */
function estimatePlaceCoords(
  placeName: string,
  districtName: string,
  districtFeature: { geometry: { coordinates: number[][][] } }
): [number, number] {
  // Get district centroid as base
  const bounds = getPolygonBounds(districtFeature.geometry.coordinates[0]);
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  
  // Add small offset based on place name (deterministic but varied)
  const hash = placeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const offsetLat = ((hash % 20) - 10) * 0.01; // ±0.1 degrees
  const offsetLon = ((hash % 30) - 15) * 0.01; // ±0.15 degrees
  
  return [centerLat + offsetLat, centerLon + offsetLon];
}

function getPolygonBounds(coords: number[][]): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;
  
  for (const [lat, lon] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  
  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Check if point is near a polygon
 */
function isPointNearPolygon(
  point: [number, number],
  polygon: number[][],
  thresholdDegrees: number
): boolean {
  // Simple approach: check if point is within threshold of any polygon vertex
  for (const vertex of polygon) {
    const distance = haversineDistance(point, [vertex[0], vertex[1]]);
    if (distance < thresholdDegrees * 111) { // Convert degrees to km (approx)
      return true;
    }
  }
  return false;
}

/**
 * Haversine distance (km)
 */
function haversineDistance(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371; // Earth radius in km
  const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
  const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

export function getPriorityColor(priority: 'P1' | 'P2' | 'P3'): string {
  switch (priority) {
    case 'P1': return 'text-red-400';
    case 'P2': return 'text-orange-400';
    case 'P3': return 'text-yellow-400';
  }
}

export function getPriorityBgColor(priority: 'P1' | 'P2' | 'P3'): string {
  switch (priority) {
    case 'P1': return 'bg-red-500/20 border-red-500/50';
    case 'P2': return 'bg-orange-500/20 border-orange-500/50';
    case 'P3': return 'bg-yellow-500/20 border-yellow-500/50';
  }
}

export function getPriorityLabel(priority: 'P1' | 'P2' | 'P3'): string {
  switch (priority) {
    case 'P1': return 'CRITICAL';
    case 'P2': return 'HIGH';
    case 'P3': return 'ELEVATED';
  }
}
