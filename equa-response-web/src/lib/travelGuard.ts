/**
 * TRAVEL-GUARD: Tourist Safety & Evacuation Route Generator
 * Mock logic for risk assessment and safe corridor generation
 */

import type {
  TouristZone,
  SafeDestination,
  GreenCorridor,
  TravelGuardConfig,
  CycloneCone,
  FloodPolygon,
  GhostRoad
} from './api';

// ============================================
// TYPES
// ============================================

export type TouristRequest = {
  query: string;                // place name or "lat,lon"
  language: "EN" | "DE" | "SI";
  headcount?: number;
};

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskAssessment = {
  level: RiskLevel;
  reasons: string[];
};

export type AlertCard = {
  lang: string;
  title: string;
  body: string;
  severity: "INFO" | "WARN" | "ALERT";
};

export type TravelGuardResult = {
  resolvedLocation: [number, number];
  resolvedName: string;
  matchedZone?: TouristZone;
  risk: RiskAssessment;
  destination: SafeDestination;
  corridor: GreenCorridor | { id: string; path: Array<[number, number]>; avoid: string[] };
  alerts: AlertCard[];
  distanceKm?: number;
  estimatedTimeHours?: number;
};

// ============================================
// GEOMETRY UTILITIES
// ============================================

/**
 * Point-in-polygon test using ray casting algorithm
 * Works with [lat, lon] format
 */
export function pointInPolygon(point: [number, number], polygon: Array<[number, number]>): boolean {
  const [lat, lon] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lon1] = polygon[i];
    const [lat2, lon2] = polygon[j];
    
    const intersect = ((lon1 > lon) !== (lon2 > lon)) &&
                     (lat < (lat2 - lat1) * (lon - lon1) / (lon2 - lon1) + lat1);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

// ============================================
// LOCATION RESOLUTION
// ============================================

/**
 * Resolve tourist location from query string
 * Supports: zone names (fuzzy match), "lat,lon" coordinates
 */
export function resolveTouristLocation(
  query: string,
  config: TravelGuardConfig
): { location: [number, number]; name: string; matchedZone?: TouristZone } {
  const trimmedQuery = query.trim();
  
  // Try parsing as "lat,lon"
  if (trimmedQuery.includes(',')) {
    const parts = trimmedQuery.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return {
        location: [parts[0], parts[1]],
        name: `Custom Location (${parts[0].toFixed(3)}, ${parts[1].toFixed(3)})`
      };
    }
  }
  
  // Try fuzzy matching zone names
  const queryLower = trimmedQuery.toLowerCase();
  for (const zone of config.tourist_zones) {
    const nameLower = zone.name.toLowerCase();
    if (nameLower.includes(queryLower) || queryLower.includes(nameLower)) {
      return {
        location: zone.center,
        name: zone.name,
        matchedZone: zone
      };
    }
  }
  
  // Fallback: use first zone with approximate match note
  if (config.tourist_zones.length > 0) {
    const fallbackZone = config.tourist_zones[0];
    return {
      location: fallbackZone.center,
      name: `${fallbackZone.name} (Approximate match)`,
      matchedZone: fallbackZone
    };
  }
  
  // Ultimate fallback
  return {
    location: [8.5711, 81.2335],
    name: "Unknown Location"
  };
}

// ============================================
// RISK ASSESSMENT
// ============================================

/**
 * Assess risk level for tourist location based on hazard layers
 */
export function assessRisk(
  location: [number, number],
  layers: {
    cycloneCone?: CycloneCone | null;
    floodPolygons?: FloodPolygon[];
    ghostRoads?: GhostRoad[];
  },
  matchedZone?: TouristZone
): RiskAssessment {
  const reasons: string[] = [];
  let level: RiskLevel = "LOW";
  
  // Check if inside cyclone cone
  let inCycloneCone = false;
  if (layers.cycloneCone?.polygon && layers.cycloneCone.polygon.length > 0) {
    inCycloneCone = pointInPolygon(location, layers.cycloneCone.polygon);
    if (inCycloneCone) {
      reasons.push("Inside Cyclone Cone of Uncertainty");
      level = "HIGH";
    }
  }
  
  // Check flood zones
  let floodDepth = 0;
  if (layers.floodPolygons && layers.floodPolygons.length > 0) {
    for (const flood of layers.floodPolygons) {
      if (pointInPolygon(location, flood.polygon)) {
        floodDepth = Math.max(floodDepth, flood.depth_m);
        reasons.push(`Flood Zone: ${flood.depth_m.toFixed(1)}m depth (${flood.risk} risk)`);
        
        if (flood.depth_m >= 1.6) {
          level = "CRITICAL";
        } else if (flood.depth_m >= 1.0 && level !== "CRITICAL") {
          level = "HIGH";
        }
      }
    }
  }
  
  // Check if beach/coastal zone
  const isBeachZone = matchedZone?.category === "BEACH";
  if (isBeachZone) {
    reasons.push("Storm Surge Zone (Coastal Area)");
    if (level === "LOW") level = "MEDIUM";
  }
  
  // Compound risk: cyclone + beach = CRITICAL
  if (inCycloneCone && isBeachZone) {
    reasons.push("COMPOUND RISK: Cyclone + Coastal Location");
    level = "CRITICAL";
  }
  
  // Compound risk: cyclone + deep flood = CRITICAL
  if (inCycloneCone && floodDepth >= 1.6) {
    reasons.push("COMPOUND RISK: Cyclone + Deep Flooding");
    level = "CRITICAL";
  }
  
  // If no hazards found
  if (reasons.length === 0) {
    reasons.push("No immediate hazards detected");
    level = "LOW";
  }
  
  return { level, reasons };
}

// ============================================
// DESTINATION & CORRIDOR SELECTION
// ============================================

/**
 * Choose best safe destination based on risk level
 */
export function chooseDestination(
  risk: RiskAssessment,
  config: TravelGuardConfig
): SafeDestination {
  const { level } = risk;
  
  // For CRITICAL/HIGH risk, prefer airport (fastest exit)
  if (level === "CRITICAL" || level === "HIGH") {
    const airport = config.safe_destinations.find(d => d.type === "AIRPORT");
    if (airport) return airport;
  }
  
  // For MEDIUM risk, prefer inland shelter
  if (level === "MEDIUM") {
    const inland = config.safe_destinations.find(d => d.type === "INLAND");
    if (inland) return inland;
  }
  
  // For LOW risk or fallback, use first available or CITY
  const city = config.safe_destinations.find(d => d.type === "CITY");
  if (city) return city;
  
  // Ultimate fallback
  return config.safe_destinations[0] || {
    id: "dest_fallback",
    name: "Safe Hub",
    location: [6.9271, 79.8612],
    type: "CITY"
  };
}

/**
 * Choose or generate corridor route
 */
export function chooseCorridor(
  fromLocation: [number, number],
  matchedZone: TouristZone | undefined,
  destination: SafeDestination,
  config: TravelGuardConfig,
  risk: RiskAssessment
): GreenCorridor | { id: string; path: Array<[number, number]>; avoid: string[] } {
  // Try to find pre-defined corridor
  if (matchedZone) {
    const corridor = config.green_corridors.find(
      c => c.from_zone_id === matchedZone.id && c.to_dest_id === destination.id
    );
    if (corridor) return corridor;
    
    // Try any corridor from this zone
    const anyFromZone = config.green_corridors.find(c => c.from_zone_id === matchedZone.id);
    if (anyFromZone) return anyFromZone;
  }
  
  // Generate simple corridor (straight-ish with inland bend)
  const destLat = destination.location[0];
  const destLon = destination.location[1];
  const startLat = fromLocation[0];
  const startLon = fromLocation[1];
  
  // Create waypoint that bends inland (away from coast, toward west)
  const midLat = (startLat + destLat) / 2;
  const midLon = Math.min(startLon, destLon) - 0.3; // Bend west (inland)
  
  const generatedPath: Array<[number, number]> = [
    fromLocation,
    [midLat, midLon],
    destination.location
  ];
  
  // Determine avoid reasons from risk
  const avoidList: string[] = [];
  if (risk.level === "CRITICAL" || risk.level === "HIGH") {
    avoidList.push("COAST");
    avoidList.push("CYCLONE_ZONE");
  }
  if (risk.reasons.some(r => r.includes("Flood"))) {
    avoidList.push("FLOOD_DEPTH>1.0");
  }
  
  return {
    id: "generated_corridor",
    path: generatedPath,
    avoid: avoidList.length > 0 ? avoidList : ["HAZARDS"]
  };
}

// ============================================
// MULTILINGUAL ALERTS
// ============================================

/**
 * Generate multilingual alert cards
 */
export function buildAlerts(
  result: TravelGuardResult,
  language: "EN" | "DE" | "SI"
): AlertCard[] {
  const alerts: AlertCard[] = [];
  const { risk, destination, corridor, resolvedName, matchedZone } = result;
  
  // Main warning alert
  if (language === "EN") {
    alerts.push({
      lang: "EN",
      title: risk.level === "CRITICAL" ? "⚠️ CRITICAL WARNING: Immediate Evacuation Required" :
             risk.level === "HIGH" ? "⚠️ HIGH ALERT: Cyclone Warning" :
             risk.level === "MEDIUM" ? "⚠️ CAUTION: Weather Advisory" :
             "✓ LOW RISK: Stay Informed",
      body: `Your location (${resolvedName}) has been assessed as ${risk.level} RISK.\n\n` +
            `Hazards detected:\n${risk.reasons.map(r => `• ${r}`).join('\n')}\n\n` +
            `RECOMMENDED ACTION: Evacuate to ${destination.name} via designated safe corridor.`,
      severity: risk.level === "CRITICAL" ? "ALERT" :
                risk.level === "HIGH" ? "WARN" : "INFO"
    });
    
    // Corridor instructions
    const avoidText = 'avoid' in corridor ? corridor.avoid.join(', ') : 'hazards';
    alerts.push({
      lang: "EN",
      title: "🛣️ Safe Corridor Route",
      body: `Proceed to ${destination.name} (${destination.type}).\n\n` +
            `Route avoids: ${avoidText}\n\n` +
            `Distance: ~${result.distanceKm?.toFixed(0) || '?'} km\n` +
            `Estimated time: ${result.estimatedTimeHours?.toFixed(1) || '?'} hours\n\n` +
            `Follow evacuation signs. Do NOT deviate from route.`,
      severity: "INFO"
    });
  } else if (language === "DE") {
    alerts.push({
      lang: "DE",
      title: risk.level === "CRITICAL" ? "⚠️ KRITISCHE WARNUNG: Sofortige Evakuierung Erforderlich" :
             risk.level === "HIGH" ? "⚠️ HOHE WARNUNG: Zyklon-Warnung" :
             risk.level === "MEDIUM" ? "⚠️ VORSICHT: Wetterwarnung" :
             "✓ GERINGES RISIKO: Bleiben Sie Informiert",
      body: `Ihr Standort (${resolvedName}) wurde als ${risk.level} RISIKO bewertet.\n\n` +
            `Erkannte Gefahren:\n${risk.reasons.map(r => `• ${r}`).join('\n')}\n\n` +
            `EMPFOHLENE MASSNAHME: Evakuieren Sie nach ${destination.name} über den ausgewiesenen sicheren Korridor.`,
      severity: risk.level === "CRITICAL" ? "ALERT" :
                risk.level === "HIGH" ? "WARN" : "INFO"
    });
    
    const avoidText = 'avoid' in corridor ? corridor.avoid.join(', ') : 'Gefahren';
    alerts.push({
      lang: "DE",
      title: "🛣️ Sichere Korridor-Route",
      body: `Fahren Sie nach ${destination.name} (${destination.type}).\n\n` +
            `Route vermeidet: ${avoidText}\n\n` +
            `Entfernung: ~${result.distanceKm?.toFixed(0) || '?'} km\n` +
            `Geschätzte Zeit: ${result.estimatedTimeHours?.toFixed(1) || '?'} Stunden\n\n` +
            `Folgen Sie den Evakuierungsschildern. NICHT von der Route abweichen.`,
      severity: "INFO"
    });
  } else if (language === "SI") {
    alerts.push({
      lang: "SI",
      title: risk.level === "CRITICAL" ? "⚠️ තීරණාත්මක අනතුර: වහාම ඉවත්වන්න" :
             risk.level === "HIGH" ? "⚠️ ඉහළ අනතුර: සුළි කුණාටු අනතුරු ඇඟවීම" :
             risk.level === "MEDIUM" ? "⚠️ සැලකිල්ල: කාලගුණ නිවේදනය" :
             "✓ අඩු අවදානම: තොරතුරු දැනගන්න",
      body: `ඔබේ ස්ථානය (${resolvedName}) ${risk.level} අවදානම ලෙස තක්සේරු කර ඇත.\n\n` +
            `හදුනාගත් අනතුරු:\n${risk.reasons.map(r => `• ${r}`).join('\n')}\n\n` +
            `නිර්දේශිත ක්‍රියාමාර්ගය: ආරක්ෂිත කොරිඩෝව හරහා ${destination.name} වෙත යන්න.`,
      severity: risk.level === "CRITICAL" ? "ALERT" :
                risk.level === "HIGH" ? "WARN" : "INFO"
    });
    
    alerts.push({
      lang: "SI",
      title: "🛣️ ආරක්ෂිත මාර්ගය",
      body: `${destination.name} වෙත යන්න.\n\n` +
            `දුර: ~${result.distanceKm?.toFixed(0) || '?'} km\n` +
            `ඇස්තමේන්තුගත වේලාව: ${result.estimatedTimeHours?.toFixed(1) || '?'} පැය\n\n` +
            `ඉවත් කිරීමේ සලකුණු අනුගමනය කරන්න.`,
      severity: "INFO"
    });
  }
  
  // Add hotel zone advisory if matched zone exists
  if (matchedZone && language === "EN") {
    alerts.push({
      lang: "EN",
      title: "🏨 Hotel Zone Advisory",
      body: `${matchedZone.name} (${matchedZone.category} zone) is within ${matchedZone.radius_km}km radius.\n\n` +
            `If staying at a hotel in this zone, consult hotel management for evacuation procedures. ` +
            `Most hotels have designated shelters and transport.`,
      severity: "INFO"
    });
  }
  
  return alerts;
}

// ============================================
// MAIN TRAVEL-GUARD FUNCTION
// ============================================

/**
 * Process tourist request and generate safe corridor with alerts
 */
export function processTravelGuardRequest(
  request: TouristRequest,
  config: TravelGuardConfig,
  scenarioLayers: {
    cycloneCone?: CycloneCone | null;
    floodPolygons?: FloodPolygon[];
    ghostRoads?: GhostRoad[];
  }
): TravelGuardResult {
  // 1. Resolve location
  const { location, name, matchedZone } = resolveTouristLocation(request.query, config);
  
  // 2. Assess risk
  const risk = assessRisk(location, scenarioLayers, matchedZone);
  
  // 3. Choose destination
  const destination = chooseDestination(risk, config);
  
  // 4. Choose/generate corridor
  const corridor = chooseCorridor(location, matchedZone, destination, config, risk);
  
  // 5. Calculate distance and time
  const corridorPath = corridor.path;
  let totalDistance = 0;
  for (let i = 0; i < corridorPath.length - 1; i++) {
    totalDistance += calculateDistance(corridorPath[i], corridorPath[i + 1]);
  }
  const estimatedTimeHours = totalDistance / 60; // Assume 60 km/h average
  
  // 6. Build result
  const result: TravelGuardResult = {
    resolvedLocation: location,
    resolvedName: name,
    matchedZone,
    risk,
    destination,
    corridor,
    alerts: [],
    distanceKm: totalDistance,
    estimatedTimeHours
  };
  
  // 7. Generate alerts
  result.alerts = buildAlerts(result, request.language);
  
  return result;
}

// ============================================
// HELPER UTILITIES
// ============================================

/**
 * Get risk color for UI styling
 */
export function getRiskColor(level: RiskLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case "CRITICAL":
      return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/50" };
    case "HIGH":
      return { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/50" };
    case "MEDIUM":
      return { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/50" };
    case "LOW":
      return { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/50" };
  }
}

/**
 * Get alert severity color
 */
export function getAlertColor(severity: "INFO" | "WARN" | "ALERT"): { bg: string; border: string } {
  switch (severity) {
    case "ALERT":
      return { bg: "bg-red-900/40", border: "border-red-500/50" };
    case "WARN":
      return { bg: "bg-yellow-900/40", border: "border-yellow-500/50" };
    case "INFO":
      return { bg: "bg-cyan-900/40", border: "border-cyan-500/50" };
  }
}
