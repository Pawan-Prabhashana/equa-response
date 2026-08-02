/**
 * Data Pipeline - Credible data ingestion, validation, and fusion
 * Transforms raw inputs into actionable Operational State
 */

import type { Incident, Shelter, FloodPolygon, CycloneCone, GhostRoad } from './api';
import type { TruthReport } from './truthEngine';

// ============================================
// DATA SOURCES (Mock simulation of real feeds)
// ============================================

export interface SensorReading {
  id: string;
  type: 'RIVER_GAUGE' | 'WIND_SPEED' | 'RAIN_RATE' | 'TIDE_LEVEL';
  location: [number, number];
  value: number;
  unit: string;
  ts: number;
  station: string;
}

export interface ExternalFeed {
  id: string;
  source: 'GDACS' | 'SATELLITE' | 'POLICE' | 'NAVY' | 'AIRPORT';
  type: 'ALERT' | 'IMAGE' | 'STATUS';
  severity?: 'INFO' | 'WARN' | 'CRITICAL';
  message: string;
  location?: [number, number];
  ts: number;
}

export interface DataSources {
  sensors: SensorReading[];
  crowdReports: TruthReport[];
  externalFeeds: ExternalFeed[];
  policeUpdates: number; // count
  shelterReports: number; // count
}

// ============================================
// OPERATIONAL STATE (Fused, validated data)
// ============================================

export interface AreaRisk {
  areaId: string;
  areaName: string;
  center: [number, number];
  riskScore: number; // 0-100
  factors: string[]; // ["FLOOD_DEPTH_HIGH", "SHELTER_SATURATED", etc]
  population: number; // estimated
  criticalIncidents: number;
}

export interface OperationalState {
  ts: number;
  scenarioId: string;
  
  // Core data (validated)
  incidents: Incident[];
  verifiedCount: number;
  unverifiedCount: number;
  
  // Hazards
  floodPolygons: FloodPolygon[];
  cycloneCone: CycloneCone | null;
  ghostRoads: GhostRoad[];
  
  // Resources
  shelters: Shelter[];
  sheltersAtRisk: number; // count >= 80% predicted
  assetsReady: number;
  assetsTotal: number;
  
  // Risk index by area
  areaRisks: AreaRisk[];
  
  // Data provenance
  sources: DataSources;
  validationStats: {
    rawReports: number;
    verified: number;
    rumorsFiltered: number;
    lastFusionTs: number;
  };
}

// ============================================
// RISK CALCULATION (Deterministic scoring)
// ============================================

export function computeRiskIndexByArea(
  incidents: Incident[],
  floodPolygons: FloodPolygon[],
  cycloneCone: CycloneCone | null,
  shelters: Shelter[]
): AreaRisk[] {
  // Simple area segmentation by incident clustering
  const areas: AreaRisk[] = [];
  
  // Define mock areas (in real system, use district boundaries or grid)
  const mockAreas = [
    { id: 'kalutara_north', name: 'Kalutara North', center: [6.6100, 79.9650] as [number, number], radius: 0.05 },
    { id: 'kalutara_south', name: 'Kalutara South', center: [6.5700, 79.9500] as [number, number], radius: 0.05 },
    { id: 'trinco_coast', name: 'Trincomalee Coast', center: [8.5800, 81.2200] as [number, number], radius: 0.1 },
  ];
  
  for (const area of mockAreas) {
    let riskScore = 0;
    const factors: string[] = [];
    
    // Count incidents in area
    const areaIncidents = incidents.filter(inc => {
      const dist = Math.sqrt(
        Math.pow(inc.lat - area.center[0], 2) +
        Math.pow(inc.lon - area.center[1], 2)
      );
      return dist < area.radius;
    });
    
    const criticalIncidents = areaIncidents.filter(inc => inc.severity >= 7).length;
    
    if (criticalIncidents > 0) {
      riskScore += criticalIncidents * 15;
      factors.push(`CRITICAL_INCIDENTS_${criticalIncidents}`);
    }
    
    // Check flood depth in area
    const floodInArea = floodPolygons.filter(poly => {
      const avgLat = poly.polygon.reduce((sum, p) => sum + p[0], 0) / poly.polygon.length;
      const avgLon = poly.polygon.reduce((sum, p) => sum + p[1], 0) / poly.polygon.length;
      const dist = Math.sqrt(
        Math.pow(avgLat - area.center[0], 2) +
        Math.pow(avgLon - area.center[1], 2)
      );
      return dist < area.radius;
    });
    
    if (floodInArea.length > 0) {
      const maxDepth = Math.max(...floodInArea.map(f => f.depth_m));
      if (maxDepth >= 1.5) {
        riskScore += 30;
        factors.push(`FLOOD_DEPTH_${maxDepth.toFixed(1)}M`);
      } else if (maxDepth >= 0.8) {
        riskScore += 15;
        factors.push(`FLOOD_DEPTH_${maxDepth.toFixed(1)}M`);
      }
    }
    
    // Check cyclone proximity
    if (cycloneCone) {
      const inCone = cycloneCone.polygon.some(p => {
        const dist = Math.sqrt(
          Math.pow(p[0] - area.center[0], 2) +
          Math.pow(p[1] - area.center[1], 2)
        );
        return dist < area.radius * 2;
      });
      
      if (inCone) {
        riskScore += 25;
        factors.push('CYCLONE_CONE');
      }
    }
    
    // Check shelter saturation in area
    const areaShelters = shelters.filter(sh => {
      const dist = Math.sqrt(
        Math.pow(sh.location[0] - area.center[0], 2) +
        Math.pow(sh.location[1] - area.center[1], 2)
      );
      return dist < area.radius;
    });
    
    const saturatedShelters = areaShelters.filter(sh => {
      const pct = (sh.current_occupancy / sh.capacity) * 100;
      return pct >= 85;
    });
    
    if (saturatedShelters.length > 0) {
      riskScore += 20;
      factors.push(`SHELTER_SATURATED_${saturatedShelters.length}`);
    }
    
    // Cap at 100
    riskScore = Math.min(100, riskScore);
    
    areas.push({
      areaId: area.id,
      areaName: area.name,
      center: area.center,
      riskScore,
      factors,
      population: 5000 + Math.floor(Math.random() * 10000), // mock
      criticalIncidents: criticalIncidents
    });
  }
  
  return areas.sort((a, b) => b.riskScore - a.riskScore);
}

// ============================================
// MOCK SENSOR DATA GENERATION
// ============================================

export function generateMockSensors(scenarioId: string): SensorReading[] {
  const sensors: SensorReading[] = [];
  
  if (scenarioId.includes('flood')) {
    sensors.push({
      id: 'rg_001',
      type: 'RIVER_GAUGE',
      location: [6.5855, 79.9605],
      value: 4.8,
      unit: 'm',
      ts: Date.now() - 120000,
      station: 'Kalu River Bridge'
    });
    sensors.push({
      id: 'rain_001',
      type: 'RAIN_RATE',
      location: [6.6000, 79.9700],
      value: 32,
      unit: 'mm/h',
      ts: Date.now() - 60000,
      station: 'Kalutara Met Station'
    });
  }
  
  if (scenarioId.includes('cyclone')) {
    sensors.push({
      id: 'wind_001',
      type: 'WIND_SPEED',
      location: [8.5800, 81.2200],
      value: 95,
      unit: 'km/h',
      ts: Date.now() - 180000,
      station: 'Trinco Harbor'
    });
    sensors.push({
      id: 'tide_001',
      type: 'TIDE_LEVEL',
      location: [8.5650, 81.2150],
      value: 2.3,
      unit: 'm',
      ts: Date.now() - 90000,
      station: 'Trinco Coast Guard'
    });
  }
  
  return sensors;
}

export function generateMockExternalFeeds(scenarioId: string): ExternalFeed[] {
  const feeds: ExternalFeed[] = [];
  
  feeds.push({
    id: 'gdacs_001',
    source: 'GDACS',
    type: 'ALERT',
    severity: 'CRITICAL',
    message: scenarioId.includes('cyclone') 
      ? 'Tropical Cyclone EYE 120km E of Trincomalee, moving W at 25km/h'
      : 'Heavy rainfall alert - 200mm expected in 24h',
    ts: Date.now() - 300000
  });
  
  feeds.push({
    id: 'police_001',
    source: 'POLICE',
    type: 'STATUS',
    severity: 'WARN',
    message: 'Road closures: A2 highway flooded at KM 52',
    location: [6.5950, 79.9750],
    ts: Date.now() - 240000
  });
  
  return feeds;
}

// ============================================
// PRODUCE OPERATIONAL STATE (Main fusion)
// ============================================

export function produceOperationalState(
  scenarioId: string,
  incidents: Incident[],
  floodPolygons: FloodPolygon[],
  cycloneCone: CycloneCone | null,
  ghostRoads: GhostRoad[],
  shelters: Shelter[],
  truthReports: TruthReport[],
  assetsReady: number,
  assetsTotal: number
): OperationalState {
  const verifiedIncidents = incidents.filter(i => i.verified);
  const unverifiedIncidents = incidents.filter(i => !i.verified);
  
  const verifiedReports = truthReports.filter(r => r.status === 'VERIFIED');
  const rumorReports = truthReports.filter(r => r.status === 'RUMOR');
  
  const areaRisks = computeRiskIndexByArea(incidents, floodPolygons, cycloneCone, shelters);
  
  const sheltersAtRisk = shelters.filter(sh => {
    const pct = (sh.current_occupancy / sh.capacity) * 100;
    return pct >= 80;
  }).length;
  
  const sensors = generateMockSensors(scenarioId);
  const externalFeeds = generateMockExternalFeeds(scenarioId);
  
  return {
    ts: Date.now(),
    scenarioId,
    
    incidents: verifiedIncidents,
    verifiedCount: verifiedIncidents.length,
    unverifiedCount: unverifiedIncidents.length,
    
    floodPolygons,
    cycloneCone,
    ghostRoads,
    
    shelters,
    sheltersAtRisk,
    assetsReady,
    assetsTotal,
    
    areaRisks,
    
    sources: {
      sensors,
      crowdReports: truthReports,
      externalFeeds,
      policeUpdates: 2,
      shelterReports: shelters.length
    },
    
    validationStats: {
      rawReports: truthReports.length,
      verified: verifiedReports.length,
      rumorsFiltered: rumorReports.length,
      lastFusionTs: Date.now()
    }
  };
}

// ============================================
// DATA PROVENANCE DISPLAY HELPERS
// ============================================

export function getDataProvenanceSummary(state: OperationalState): string {
  const { sources, validationStats } = state;
  
  return `Sources: Sensors(${sources.sensors.length}) • Crowd(${sources.crowdReports.length}) • External(${sources.externalFeeds.length}) • Police(${sources.policeUpdates}) | Validated: ${validationStats.verified} | Filtered: ${validationStats.rumorsFiltered}`;
}

export function getLastFusionAge(state: OperationalState): string {
  const ageSec = Math.floor((Date.now() - state.validationStats.lastFusionTs) / 1000);
  if (ageSec < 60) return `${ageSec}s ago`;
  const ageMin = Math.floor(ageSec / 60);
  return `${ageMin}m ago`;
}
