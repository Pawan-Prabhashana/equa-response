/**
 * Truth Engine - Singlish NLP + Report Classification
 * Parses local language disaster reports and classifies truth status
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type TruthStatus = "VERIFIED" | "RUMOR" | "UNVERIFIED";

export type ParsedTruth = {
  hazard: "FLOOD" | "LANDSLIDE" | "CYCLONE" | "UNKNOWN";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  trend?: "INCREASING" | "DECREASING" | "STEADY";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  locationHint?: string;
  keywords: string[];
};

export type TruthReport = {
  id: string;
  ts: number; // epoch ms
  source: "SMS" | "TWITTER" | "SENSOR" | "CALLCENTER";
  text: string;
  geo?: [number, number];
  parsed: ParsedTruth;
  status: TruthStatus;
};

// ============================================
// NORMALIZATION
// ============================================

/**
 * Normalize text for Singlish parsing
 */
export function normalizeText(s: string): string {
  let text = s.toLowerCase().trim();
  
  // Collapse multiple spaces
  text = text.replace(/\s+/g, " ");
  
  // Common Sinhala transliteration variants
  text = text.replace(/wathura/g, "watura");
  text = text.replace(/water/g, "watura");
  text = text.replace(/hulang/g, "hulanga");
  text = text.replace(/kanda/g, "kandu");
  text = text.replace(/kallu/g, "gal");
  text = text.replace(/wadi venawa/g, "wadi wenawa");
  text = text.replace(/ado/g, "adoo");
  
  return text;
}

// ============================================
// SINGLISH PARSING
// ============================================

const FLOOD_TOKENS = [
  "watura", "water", "flood", "ganga", "wela", 
  "rain", "wessai", "wessa", "river", "overflow"
];

const LANDSLIDE_TOKENS = [
  "kandu", "landslide", "mud", "slope", "pasa", 
  "gal", "rocks", "bim", "mountain", "collapse"
];

const CYCLONE_TOKENS = [
  "hulanga", "wind", "cyclone", "storm", "surge", 
  "rel", "gale", "tornado"
];

const TREND_INCREASING = [
  "wadi wenawa", "wadi", "increase", "rising", 
  "ena wadi", "going up", "getting worse"
];

const TREND_DECREASING = [
  "adu wenawa", "adu", "decrease", "lowering", 
  "going down", "getting better"
];

const SEVERITY_CRITICAL = [
  "godak", "maha", "danger", "critical", "kapala", 
  "gamana ba", "bridge gone", "evac", "emergency", 
  "life threat", "disaster"
];

const SEVERITY_HIGH = [
  "high", "big", "fast", "strong", "blocked", 
  "overflow", "severe", "bad"
];

const SEVERITY_LOW = [
  "low", "small", "minor", "drizzle", "light"
];

const CONFIDENCE_HIGH_MARKERS = [
  "sensor", "gauge", "mm", "km/h", "meter", 
  "reading", "station", "official"
];

const CONFIDENCE_LOW_MARKERS = [
  "heard", "rumor", "maybe", "kiala", "lu", 
  "apparently", "not sure", "think", "probably"
];

/**
 * Parse Singlish report into structured truth
 */
export function parseSinglishReport(text: string): ParsedTruth {
  const normalized = normalizeText(text);
  const keywords: string[] = [];
  
  // Count hazard keyword matches
  const floodCount = FLOOD_TOKENS.filter(tok => {
    if (normalized.includes(tok)) {
      keywords.push(tok);
      return true;
    }
    return false;
  }).length;
  
  const landslideCount = LANDSLIDE_TOKENS.filter(tok => {
    if (normalized.includes(tok)) {
      keywords.push(tok);
      return true;
    }
    return false;
  }).length;
  
  const cycloneCount = CYCLONE_TOKENS.filter(tok => {
    if (normalized.includes(tok)) {
      keywords.push(tok);
      return true;
    }
    return false;
  }).length;
  
  // Determine hazard (tie-break: FLOOD > LANDSLIDE > CYCLONE)
  let hazard: ParsedTruth["hazard"] = "UNKNOWN";
  const maxCount = Math.max(floodCount, landslideCount, cycloneCount);
  
  if (maxCount > 0) {
    if (floodCount === maxCount) hazard = "FLOOD";
    else if (landslideCount === maxCount) hazard = "LANDSLIDE";
    else if (cycloneCount === maxCount) hazard = "CYCLONE";
  }
  
  // Determine trend
  let trend: ParsedTruth["trend"] = undefined;
  if (TREND_INCREASING.some(tok => normalized.includes(tok))) {
    trend = "INCREASING";
  } else if (TREND_DECREASING.some(tok => normalized.includes(tok))) {
    trend = "DECREASING";
  }
  
  // Determine severity
  let severity: ParsedTruth["severity"] = "MEDIUM";
  if (SEVERITY_CRITICAL.some(tok => normalized.includes(tok))) {
    severity = "CRITICAL";
  } else if (SEVERITY_HIGH.some(tok => normalized.includes(tok))) {
    severity = "HIGH";
  } else if (SEVERITY_LOW.some(tok => normalized.includes(tok))) {
    severity = "LOW";
  }
  
  // Determine confidence
  let confidence: ParsedTruth["confidence"] = "MEDIUM";
  if (CONFIDENCE_HIGH_MARKERS.some(tok => normalized.includes(tok))) {
    confidence = "HIGH";
  } else if (CONFIDENCE_LOW_MARKERS.some(tok => normalized.includes(tok))) {
    confidence = "LOW";
  }
  
  // Lower confidence if hazard unknown
  if (hazard === "UNKNOWN") {
    confidence = "LOW";
  }
  
  // Extract location hint (basic pattern matching)
  const locationPatterns = [
    /near ([a-z]+)/i,
    /at ([a-z]+)/i,
    /in ([a-z]+)/i,
    /([a-z]+) side/i,
    /([a-z]+) area/i,
    /([a-z]+) district/i
  ];
  
  let locationHint: string | undefined;
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      locationHint = match[1];
      break;
    }
  }
  
  return {
    hazard,
    severity,
    trend,
    confidence,
    locationHint,
    keywords
  };
}

// ============================================
// TRUTH STATUS CLASSIFICATION
// ============================================

/**
 * Classify truth status based on parsed content and source
 */
export function classifyTruthStatus(
  parsed: ParsedTruth,
  source: TruthReport["source"],
  text: string
): TruthStatus {
  const normalized = normalizeText(text);
  
  // SENSOR sources are always verified
  if (source === "SENSOR") {
    return "VERIFIED";
  }
  
  // Low confidence + rumor markers = RUMOR
  if (
    parsed.confidence === "LOW" &&
    CONFIDENCE_LOW_MARKERS.some(marker => normalized.includes(marker))
  ) {
    return "RUMOR";
  }
  
  // High confidence = VERIFIED
  if (parsed.confidence === "HIGH") {
    return "VERIFIED";
  }
  
  // Default: UNVERIFIED
  return "UNVERIFIED";
}

// ============================================
// MOCK DATA GENERATION
// ============================================

/**
 * Generate realistic mock truth reports with Singlish
 */
export function makeMockTruthReports(): TruthReport[] {
  const now = Date.now();
  
  const mockMessages = [
    // FLOOD reports
    {
      source: "SMS" as const,
      text: "Ado, water level wadi wenawa machan. Kalutara side godak danger.",
      geo: [6.5854, 79.9607] as [number, number]
    },
    {
      source: "TWITTER" as const,
      text: "Ganga wela overflow! Bulathsinhala main road blocked. Emergency!",
      geo: [6.6345, 80.0567] as [number, number]
    },
    {
      source: "SENSOR" as const,
      text: "Gauge reading: 1.8m rising (Kalutara Station). High alert.",
      geo: [6.5854, 79.9607] as [number, number]
    },
    {
      source: "CALLCENTER" as const,
      text: "Resident reports: Wessai wadi, bridge submerged near Palindanuwara.",
      geo: [6.589, 79.9822] as [number, number]
    },
    {
      source: "SMS" as const,
      text: "Watura adu wenawa slowly. Situation getting better.",
    },
    {
      source: "TWITTER" as const,
      text: "Heard bridge gone kiala. Not sure machan, just lu.",
    },
    
    // LANDSLIDE reports
    {
      source: "SMS" as const,
      text: "Kandu passa enawa wage! Road blocked near Ella. Mud everywhere.",
      geo: [6.6345, 80.0567] as [number, number]
    },
    {
      source: "CALLCENTER" as const,
      text: "Landslide at Bulathsinhala slope. 3 houses buried. Critical!",
      geo: [6.6345, 80.0567] as [number, number]
    },
    {
      source: "TWITTER" as const,
      text: "Big rocks falling from mountain. Gamana ba. Road cut.",
    },
    {
      source: "SMS" as const,
      text: "Minor mud slide near tea estate. Small damage only.",
    },
    
    // CYCLONE reports
    {
      source: "TWITTER" as const,
      text: "Hulanga godak maha! Trinco beach eke rel wadi. Trees falling.",
      geo: [8.5711, 81.2335] as [number, number]
    },
    {
      source: "SENSOR" as const,
      text: "Wind speed: 85 km/h gusts recorded. Cyclone approaching Nilaveli.",
      geo: [8.7, 81.18] as [number, number]
    },
    {
      source: "CALLCENTER" as const,
      text: "Storm surge reports from Trinco coast. High waves, strong wind.",
      geo: [8.5711, 81.2335] as [number, number]
    },
    {
      source: "SMS" as const,
      text: "Hulanga adu wenawa. Wind decreasing now.",
    },
    
    // MIXED / UNCLEAR
    {
      source: "TWITTER" as const,
      text: "Situation bad in Kalutara. Maybe flood maybe landslide. Not clear.",
    },
    {
      source: "SMS" as const,
      text: "Heard danger coming kiala. Evacuate apparently.",
    },
    {
      source: "CALLCENTER" as const,
      text: "Tourist van stuck. Need boat rescue. Water rising fast.",
      geo: [6.57, 79.99] as [number, number]
    },
    {
      source: "SENSOR" as const,
      text: "Rain gauge: 85mm in last hour. Moderate to heavy rainfall.",
    },
    {
      source: "TWITTER" as const,
      text: "Power outage Nilaveli area. Hulanga damage electricity poles.",
      geo: [8.6, 81.2] as [number, number]
    },
    {
      source: "SMS" as const,
      text: "School shelter needs water packs. 500L urgent.",
      geo: [6.589, 79.9822] as [number, number]
    }
  ];
  
  // Generate reports with timestamps spread over last 10 minutes
  const reports: TruthReport[] = mockMessages.map((msg, idx) => {
    const timeDelta = Math.random() * 10 * 60 * 1000; // random within 10 min
    const ts = now - timeDelta;
    
    const parsed = parseSinglishReport(msg.text);
    const status = classifyTruthStatus(parsed, msg.source, msg.text);
    
    return {
      id: `truth_${Date.now()}_${idx}`,
      ts,
      source: msg.source,
      text: msg.text,
      geo: msg.geo,
      parsed,
      status
    };
  });
  
  // Sort by timestamp (newest first)
  return reports.sort((a, b) => b.ts - a.ts);
}

/**
 * Generate a single new random report (for streaming)
 */
export function generateRandomReport(): TruthReport {
  const templates = [
    { source: "SMS" as const, text: "Watura level wadi wenawa. High alert area." },
    { source: "TWITTER" as const, text: "Flood situation getting worse machan." },
    { source: "SENSOR" as const, text: "Gauge reading: [X]m rising." },
    { source: "CALLCENTER" as const, text: "Reports of kandu passa near slopes." },
    { source: "SMS" as const, text: "Hulanga strong. Secure loose items." },
    { source: "TWITTER" as const, text: "Heard rumor about bridge. Not confirmed kiala." },
  ];
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  const parsed = parseSinglishReport(template.text);
  const status = classifyTruthStatus(parsed, template.source, template.text);
  
  return {
    id: `truth_${Date.now()}_${Math.random()}`,
    ts: Date.now(),
    source: template.source,
    text: template.text,
    parsed,
    status
  };
}
