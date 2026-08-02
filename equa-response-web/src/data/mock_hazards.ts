/**
 * Mock Hazard Data for District Impact Simulation
 * Provides realistic flood polygons, cyclone cone, and ghost roads
 * that intersect with Sri Lankan districts
 */

import type { FloodPolygon, CycloneCone, GhostRoad, Shelter } from '@/lib/api';

// Re-export types for convenience
export type { FloodPolygon, CycloneCone, GhostRoad };

/**
 * Mock Flood Polygons
 * Covering areas in Kalutara, Ratnapura, Galle, Colombo
 */
export const MOCK_FLOOD_POLYGONS: FloodPolygon[] = [
  // Kalutara District - High flood depth
  {
    id: 'flood_kalutara_1',
    depth_m: 2.1,
    risk: 'EXTREME',
    polygon: [
      [6.58, 79.95],
      [6.58, 80.10],
      [6.50, 80.10],
      [6.50, 79.95],
      [6.58, 79.95]
    ]
  },
  // Kalutara District - Medium flood
  {
    id: 'flood_kalutara_2',
    depth_m: 1.5,
    risk: 'HIGH',
    polygon: [
      [6.50, 79.95],
      [6.50, 80.05],
      [6.45, 80.05],
      [6.45, 79.95],
      [6.50, 79.95]
    ]
  },
  // Ratnapura District - High flood depth
  {
    id: 'flood_ratnapura_1',
    depth_m: 1.8,
    risk: 'HIGH',
    polygon: [
      [6.70, 80.35],
      [6.70, 80.50],
      [6.60, 80.50],
      [6.60, 80.35],
      [6.70, 80.35]
    ]
  },
  // Galle District - Medium flood
  {
    id: 'flood_galle_1',
    depth_m: 1.3,
    risk: 'MODERATE',
    polygon: [
      [6.05, 80.15],
      [6.05, 80.25],
      [5.98, 80.25],
      [5.98, 80.15],
      [6.05, 80.15]
    ]
  },
  // Colombo District - Low flood
  {
    id: 'flood_colombo_1',
    depth_m: 0.8,
    risk: 'MODERATE',
    polygon: [
      [6.92, 79.85],
      [6.92, 79.92],
      [6.88, 79.92],
      [6.88, 79.85],
      [6.92, 79.85]
    ]
  },
  // Matara District - Medium flood
  {
    id: 'flood_matara_1',
    depth_m: 1.4,
    risk: 'HIGH',
    polygon: [
      [5.95, 80.50],
      [5.95, 80.60],
      [5.88, 80.60],
      [5.88, 80.50],
      [5.95, 80.50]
    ]
  },
  // Gampaha District - Low flood
  {
    id: 'flood_gampaha_1',
    depth_m: 0.9,
    risk: 'MODERATE',
    polygon: [
      [7.08, 79.95],
      [7.08, 80.05],
      [7.02, 80.05],
      [7.02, 79.95],
      [7.08, 79.95]
    ]
  }
];

/**
 * Mock Cyclone Cone
 * Centered near southern coast, affecting Galle, Matara, Hambantota
 */
export const MOCK_CYCLONE_CONE: CycloneCone = {
  hours: 12,
  polygon: generateCircleCoords(6.0, 80.5, 80), // 80km radius
  centerline: [
    [5.5, 79.5],
    [6.0, 80.5],
    [6.5, 81.5]
  ]
};

/**
 * Mock Ghost Roads (blocked/cut roads)
 * Affecting accessibility in various districts
 */
export const MOCK_GHOST_ROADS: GhostRoad[] = [
  // Kalutara - Road cut by flood
  {
    id: 'ghost_kalutara_1',
    hazard: 'FLOOD',
    reason: 'Flood damaged bridge',
    coords: [
      [6.55, 79.98],
      [6.52, 80.02]
    ]
  },
  {
    id: 'ghost_kalutara_2',
    hazard: 'FLOOD',
    reason: 'Road washed out',
    coords: [
      [6.48, 80.00],
      [6.45, 80.04]
    ]
  },
  // Ratnapura - Landslide blocking road
  {
    id: 'ghost_ratnapura_1',
    hazard: 'LANDSLIDE',
    reason: 'Landslide on hillside',
    coords: [
      [6.68, 80.40],
      [6.65, 80.44]
    ]
  },
  {
    id: 'ghost_ratnapura_2',
    hazard: 'LANDSLIDE',
    reason: 'Debris blocking highway',
    coords: [
      [6.72, 80.38],
      [6.70, 80.42]
    ]
  },
  // Galle - Coastal road damaged
  {
    id: 'ghost_galle_1',
    hazard: 'FLOOD',
    reason: 'Coastal erosion',
    coords: [
      [6.03, 80.20],
      [6.00, 80.22]
    ]
  },
  // Matara - Bridge damaged
  {
    id: 'ghost_matara_1',
    hazard: 'WIND',
    reason: 'Bridge structural damage',
    coords: [
      [5.93, 80.54],
      [5.90, 80.56]
    ]
  },
  // Kandy - Mountain road blocked
  {
    id: 'ghost_kandy_1',
    hazard: 'LANDSLIDE',
    reason: 'Rockfall on mountain road',
    coords: [
      [7.30, 80.65],
      [7.28, 80.68]
    ]
  },
  // Nuwara Eliya - Mountain pass blocked
  {
    id: 'ghost_nuwara_eliya_1',
    hazard: 'LANDSLIDE',
    reason: 'Landslide on pass',
    coords: [
      [6.95, 80.78],
      [6.93, 80.82]
    ]
  }
];

/**
 * Generate circle coordinates for cyclone cone
 */
function generateCircleCoords(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  points: number = 32
): [number, number][] {
  const coords: [number, number][] = [];
  const radiusDeg = radiusKm / 111; // Approximate: 1 degree ≈ 111 km
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const lat = centerLat + radiusDeg * Math.cos(angle);
    const lon = centerLon + radiusDeg * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180);
    coords.push([lat, lon]);
  }
  
  return coords;
}

/**
 * Helper: Get all mock hazards
 */
export function getAllMockHazards() {
  return {
    floods: MOCK_FLOOD_POLYGONS,
    cyclone: MOCK_CYCLONE_CONE,
    ghostRoads: MOCK_GHOST_ROADS
  };
}

/**
 * Generate mock incidents positioned in high-impact districts
 */
export function generateMockIncidentsForDistricts() {
  return [
    // Kalutara - High impact
    { lat: 6.56, lon: 80.00, severity: 0.9, type: 'FLOOD_RESCUE' },
    { lat: 6.54, lon: 80.02, severity: 0.85, type: 'MEDICAL_EMERGENCY' },
    { lat: 6.52, lon: 79.98, severity: 0.8, type: 'STRUCTURAL_DAMAGE' },
    { lat: 6.48, lon: 80.01, severity: 0.75, type: 'FLOOD_RESCUE' },
    
    // Ratnapura - High impact
    { lat: 6.68, lon: 80.42, severity: 0.88, type: 'LANDSLIDE' },
    { lat: 6.65, lon: 80.45, severity: 0.82, type: 'FLOOD_RESCUE' },
    { lat: 6.70, lon: 80.40, severity: 0.78, type: 'ROAD_BLOCKED' },
    
    // Galle - Medium impact
    { lat: 6.03, lon: 80.20, severity: 0.72, type: 'FLOOD_RESCUE' },
    { lat: 6.01, lon: 80.22, severity: 0.68, type: 'EVACUATION_REQUEST' },
    { lat: 6.00, lon: 80.18, severity: 0.65, type: 'MEDICAL_EMERGENCY' },
    
    // Colombo - Medium impact
    { lat: 6.90, lon: 79.88, severity: 0.65, type: 'FLOOD_RESCUE' },
    { lat: 6.92, lon: 79.90, severity: 0.60, type: 'POWER_OUTAGE' },
    
    // Matara - Medium impact
    { lat: 5.93, lon: 80.54, severity: 0.70, type: 'FLOOD_RESCUE' },
    { lat: 5.90, lon: 80.56, severity: 0.68, type: 'BRIDGE_DAMAGE' },
    
    // Gampaha - Low-Medium impact
    { lat: 7.06, lon: 80.00, severity: 0.55, type: 'FLOOD_WATCH' },
    { lat: 7.04, lon: 80.02, severity: 0.50, type: 'EVACUATION_REQUEST' },
    
    // Kandy - Low-Medium impact
    { lat: 7.30, lon: 80.66, severity: 0.58, type: 'LANDSLIDE' },
    { lat: 7.28, lon: 80.68, severity: 0.52, type: 'ROAD_BLOCKED' },
    
    // Hambantota - Medium impact (cyclone)
    { lat: 6.12, lon: 81.10, severity: 0.68, type: 'WIND_DAMAGE' },
    { lat: 6.10, lon: 81.12, severity: 0.62, type: 'EVACUATION_REQUEST' },
    
    // Trincomalee - Low-Medium impact (cyclone periphery)
    { lat: 8.58, lon: 81.20, severity: 0.55, type: 'WIND_WATCH' },
    { lat: 8.56, lon: 81.22, severity: 0.50, type: 'COASTAL_ALERT' }
  ];
}

/**
 * Update shelter predictions to show load
 */
export function updateShelterPredictions(shelters: Shelter[]) {
  return shelters.map(shelter => {
    const [lat, lon] = shelter.location;
    // Shelters in high-impact districts get higher predicted load
    const isHighImpactArea = (
      (lat >= 6.45 && lat <= 6.58 && lon >= 79.95 && lon <= 80.10) || // Kalutara
      (lat >= 6.60 && lat <= 6.70 && lon >= 80.35 && lon <= 80.50) || // Ratnapura
      (lat >= 5.98 && lat <= 6.05 && lon >= 80.15 && lon <= 80.25)    // Galle
    );
    
    return {
      ...shelter,
      currentOccupancy: isHighImpactArea 
        ? Math.floor(shelter.capacity * (0.65 + Math.random() * 0.25)) 
        : Math.floor(shelter.capacity * (0.30 + Math.random() * 0.30)),
      predictedPct: isHighImpactArea 
        ? 75 + Math.floor(Math.random() * 20)  // 75-95%
        : 40 + Math.floor(Math.random() * 30)  // 40-70%
    };
  });
}
