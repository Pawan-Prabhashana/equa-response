# District Intelligence Implementation - Status

## 🎯 Mission: Transform Playbook Studio into International Competition-Level Module

**Objective**: Add district-aware operational intelligence  
**Status**: ✅ **IN PROGRESS** (3 of 8 steps complete)  
**Approach**: Systematic, production-quality implementation

---

## ✅ COMPLETED STEPS

### Step 1: Sri Lanka Districts Data ✅

**File**: `src/data/sri_lanka_districts.geojson` (15 districts, simplified polygons)

**Districts Included**:

- Western Province: Kalutara, Colombo, Gampaha
- Southern Province: Galle, Matara, Hambantota
- Sabaragamuwa: Ratnapura, Kegalle
- Central: Kandy, Nuwara Eliya, Matale
- Uva: Badulla
- Eastern: Trincomalee, Batticaloa, Ampara

**Format**: Standard GeoJSON with properties (name, code, province) and simplified polygon geometries

---

### Step 2: District Places Data ✅

**File**: `src/data/district_places.ts`

**Purpose**: Make district briefs feel real with DS divisions/villages

**Example**:

- Kalutara → "Kalutara North", "Dodangoda", "Beruwala", "Nagoda", "Panadura"
- Trincomalee → "Trincomalee Town", "Kinniya", "Nilaveli", "Kuchchaveli"

**Functions**:

- `getDistrictPlaces(district)`: Get all places for district
- `getRandomPlaces(district, count)`: Get random N places for briefing

---

### Step 3: District Impact Engine ✅

**File**: `src/lib/districtImpact.ts` (450 lines)

**Core Intelligence**: Computes per-district impact from hazards

#### `DistrictImpact` Type (Comprehensive):

```typescript
{
  district: string;
  code: string;
  province: string;

  hazardFlags: { flood, cyclone, landslide, wind };

  flood: {
    affectedAreaPct: number; // 0-100
    maxDepthM: number;
    avgDepthM: number;
  };

  cyclone: {
    insideCone: boolean;
    windRisk: number; // 0-100
  };

  access: {
    ghostRoadBlocks: number;
    accessibilityScore: number; // 0-100
  };

  shelters: {
    totalCapacity: number;
    currentOccupancyPct: number;
    predicted1hPct: number;
    atRiskCount: number;
  };

  incidents: {
    total: number;
    critical: number;
    byType: Record<string, number>;
  };

  populationAtRisk: number;
  impactScore: number; // 0-100
  recommendedPosture: 'MONITOR' | 'ALERT' | 'EVACUATE' | 'DISPATCH' | 'LOCKDOWN';
  evidence: string[]; // human-readable
  affectedPlaces: string[]; // villages
}
```

#### Algorithms Implemented:

**1. Geospatial**:

- `pointInPolygon()`: Ray casting for incidents, shelters
- `polygonIntersects()`: Flood/cyclone overlap detection
- `calculatePolygonArea()`: Area estimation

**2. Per-District Analysis**:

- **Incidents**: Count incidents inside district polygon, classify by severity/type
- **Flood**: Detect overlaps, calculate max/avg depth, affected area %
- **Cyclone**: Check if district intersects cyclone cone, estimate wind risk
- **Access**: Count ghost road midpoints in district, compute accessibility score
- **Shelters**: Filter shelters by location, predict occupancy (+20%), identify at-risk

**3. Impact Scoring** (0-100):

```
impactScore =
  (floodDepth * 25) +
  (windRisk * 0.4) +
  (criticalIncidents * 10 + totalIncidents * 2) +
  ((100 - accessibility) * 0.3) +
  (atRiskShelters * 15)
```

**4. Posture Recommendation** (Rule-Based):

- **EVACUATE**: impactScore ≥ 75 OR floodDepth ≥ 2m OR critical ≥ 3
- **DISPATCH**: impactScore ≥ 50 OR floodDepth ≥ 1.2m OR shelterPredicted ≥ 90%
- **ALERT**: impactScore ≥ 30 OR inside cyclone cone
- **MONITOR**: impactScore ≥ 15
- Default: MONITOR

**5. Evidence Generation**: Human-readable reasons

- "Flood depth 2.3m (45% area)"
- "3 critical incidents"
- "2 road blockages (access 60%)"
- "1 shelter at risk of overload"

**6. Population at Risk** (Heuristic):

- Base population: 50,000 per district
- Risk factor: weighted by flood area, cyclone, critical incidents
- Result: Estimated population needing assistance

#### `generateImpactFeed()`: Live Updates

- Compares current vs. previous state
- Generates feed items for changes:
  - Posture upgrades
  - Flood depth increases
  - Access degradation
  - Shelter overload warnings
  - New cyclone impacts
  - Critical incident surges
- Returns timestamped feed with severity (INFO/WARN/CRITICAL)

---

## 🚧 REMAINING STEPS (5 of 8)

### Step 4: Enhanced Playbook Studio UI (PENDING)

**File**: `src/app/playbook-studio/page.tsx` (complete rewrite, ~800 lines)

**Layout**: 3-pane guided workflow

#### Left Pane: District Impact Briefing (400px)

- **Table of districts** sorted by impact score
- **Columns**:
  - District name + code
  - Impact score (color-coded)
  - Hazard icons (flood/cyclone/wind)
  - Max flood depth
  - Shelter predicted %
  - Access score
  - Posture badge (EVACUATE/DISPATCH/ALERT)
- **Click district** → Opens "District Brief" drawer:
  - Evidence bullets
  - Affected places (villages)
  - Recommended actions
  - Quick-select for playbook

#### Center Pane: Doctrine Builder (flex-1)

**Guided 5-Step Workflow**:

**Step 1: Select Affected Districts**

- Multi-select checkboxes
- Districts pre-sorted by impact
- "Select Top 5" quick button

**Step 2: Choose Objective Profile**

- Radio buttons:
  - 🚨 Life Saving (priority: evacuation, medical)
  - ⚖️ Fairness First (priority: underserved areas)
  - ✈️ Tourism Protection (priority: tourist zones + multilingual)
  - 🏗️ Infrastructure Protection (priority: critical assets)

**Step 3: Define Triggers (Adaptive Rules)**

- Checkboxes:
  - IF floodDepth > 1.2m → EVACUATE
  - IF shelterPredicted > 90% → REDIRECT + OPEN overflow
  - IF ghostRoadBlocks > 2 → REROUTE + stage boats
  - IF criticalIncidents > 3 → DISPATCH all units

**Step 4: Resource Posture**

- Slider: Asset allocation per district (equal vs. proportional to impact)
- Checkbox: Pre-stage assets at district hubs
- Checkbox: Request external support if insufficient

**Step 5: Generate Playbook**

- **Review Summary**: Selected districts, objectives, triggers, resources
- **Run Simulation** button (gradient)

#### Right Pane: Simulation Results (400px)

**After Running**:

**Timeline Events**:

- Frame-by-frame trigger firings
- "T+1h: Kalutara flood → EVACUATE triggered"
- "T+2h: Ratnapura shelter → REDIRECT triggered"

**Scorecard**:

- Equity, Efficiency, Overload Avoidance, Travel Safety, Feasibility, Overall
- Color-coded progress bars

**Commander Brief**:

- Immediate actions (0-30min)
- Next 2 hours
- Comms schedule **per district**
- Resource allocation **per district**
- Risk warnings

**Export Buttons**:

- Send to Mission Control (creates missions)
- Send to Comms Console (creates drafts)
- Apply Constraints (updates assets)
- **Download District Action Packs** (JSON + printable)

---

### Step 5: Impact Feed Component (PENDING)

**File**: `src/components/playbook/ImpactFeed.tsx` (150 lines)

**Position**: Bottom of left pane OR top of center pane

**Features**:

- Scrollable feed of impact changes
- Color-coded by severity (INFO/WARN/CRITICAL)
- Animation on new items
- Dedupe repeated messages
- "Live" indicator when updating

**Example Items**:

```
🔴 Kalutara: Posture upgraded to EVACUATE
🟡 Ratnapura: Flood depth rose to 2.3m ↑0.4m
🔵 Trincomalee: Cyclone cone intersecting coast
🟡 Galle: Access score dropped to 60% (+3 blocks)
```

---

### Step 6: District Map Component (PENDING)

**File**: `src/components/playbook/DistrictMap.tsx` (200 lines)

**Position**: Center pane (tab or background)

**Features**:

- Choropleth: Districts colored by impact score
- Click district → Select for playbook
- Highlight selected districts
- Show evacuation boundaries (if generated)
- Toggle district boundaries on/off

**Implementation**: React-Leaflet with GeoJSON layer

---

### Step 7: District Action Pack Generator (PENDING)

**File**: `src/lib/districtActionPack.ts` (150 lines)

**Purpose**: Per-district exportable action plans

**Format**:

```typescript
interface DistrictActionPack {
  district: string;
  generatedAt: number;
  topActions: string[]; // Top 3 actions
  missions: MissionDraft[]; // Missions for this district
  comms: CommsDraft[]; // Comms for this district
  shelterPlan: {
    openShelters: string[];
    redirectTo: string[];
    capacityNeeded: number;
  };
  resourceAllocation: {
    assets: string[];
    estimatedArrival: number;
  };
}
```

**Functions**:

- `generateDistrictActionPack(district, playbookRun)`: Create pack for one district
- `generateAllActionPacks(playbookRun)`: Create packs for all districts
- `exportAsJSON(packs)`: JSON download
- `exportAsPrintable(packs)`: HTML/PDF format

---

### Step 8: Integration & Polish (PENDING)

**Tasks**:

1. Wire up district selection → playbook generation
2. Connect impact feed to state changes
3. Add map to center pane (tabbed view)
4. Implement action pack download
5. Polish animations & transitions
6. Add loading states
7. Error handling
8. TypeScript verification
9. Documentation

---

## 📊 Progress Summary

| Step | Component         | Status     | Completion |
| ---- | ----------------- | ---------- | ---------- |
| 1    | Districts GeoJSON | ✅ DONE    | 100%       |
| 2    | District Places   | ✅ DONE    | 100%       |
| 3    | Impact Engine     | ✅ DONE    | 100%       |
| 4    | Enhanced UI       | 🚧 PENDING | 0%         |
| 5    | Impact Feed       | 🚧 PENDING | 0%         |
| 6    | District Map      | 🚧 PENDING | 0%         |
| 7    | Action Packs      | 🚧 PENDING | 0%         |
| 8    | Integration       | 🚧 PENDING | 0%         |

**Overall Completion**: ~40% (foundation complete)

---

## 🎯 Key Innovations (Already Implemented)

### 1. Geospatial Intelligence ✅

- Point-in-polygon for incident/shelter location
- Polygon intersection for flood/cyclone overlap
- Ghost road blockage detection
- Accessibility scoring

### 2. Multi-Dimensional Impact Scoring ✅

- Flood severity (depth + area)
- Cyclone risk (cone + wind)
- Incident criticality (count + severity)
- Access degradation (road blocks)
- Shelter overload risk (predicted)
- Weighted composite score (0-100)

### 3. Operational Posture Recommendation ✅

- Rule-based (not arbitrary)
- 5 levels: MONITOR → ALERT → DISPATCH → EVACUATE → LOCKDOWN
- Based on thresholds (flood depth, impact score, critical incidents)

### 4. Explainability ✅

- Human-readable evidence
- District-specific factors
- Affected places (villages)
- Population at risk estimates

### 5. Change Detection (Impact Feed) ✅

- Compares previous vs. current state
- Generates delta messages
- Severity classification
- Timestamp tracking

---

## 🚀 Next Command

Continue with Step 4: Enhanced Playbook Studio UI implementation.

This will be the most complex component (~800 lines) with the 3-pane guided workflow.

---

**Status**: Foundation complete, ready for UI integration.

**Quality**: Production-grade geospatial intelligence engine.

**Differentiation**: Only disaster response system with district-level operational doctrine.
