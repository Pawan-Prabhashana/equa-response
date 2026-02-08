# 🏆 PLAYBOOK STUDIO - DOCTRINE LABORATORY UPGRADE

## 🎯 Vision

Transform Playbook Studio from a "plan generator" into an **International Winner-Level Doctrine Laboratory** where disaster management commanders can:

- Design operational doctrines
- Battle-test multiple approaches
- Assess robustness under uncertainty
- Version and approve strategies
- Generate military-grade operational orders

---

## 📋 IMPLEMENTATION ROADMAP

### Phase 1: Enhanced Type System ✅

**Files to Update**:

- `src/lib/playbooks.ts` - Add version, status, hotspots, robustness
- `src/lib/playbookEngine.ts` - Add battle mode, Monte Carlo

**New Types**:

```typescript
export type PlaybookStatus =
  | "DRAFT"
  | "REVIEWED"
  | "APPROVED"
  | "ACTIVE"
  | "ARCHIVED";
export type RobustnessGrade = "A" | "B" | "C" | "D" | "F";

export interface PlaybookVersion {
  version: string;
  createdAt: number;
  createdBy: string;
  changelog: string[];
}

export interface Hotspot {
  id: string;
  priority: "P1" | "P2" | "P3";
  name: string;
  district: string;
  score: number;
  reasons: string[];
  location: [number, number];
}

export interface RobustnessTestConfig {
  floodDepthVariability: number; // 0-30%
  roadFailureProbability: number; // 0-30%
  shelterIntakeVariability: number; // 0-30%
  sensorDegradation: number; // 0-100%
}

export interface RobustnessTestResult {
  successRate: number; // 0-100%
  worstCaseScores: PlaybookScores;
  bestCaseScores: PlaybookScores;
  averageScores: PlaybookScores;
  grade: RobustnessGrade;
  failurePoints: string[];
  runs: Array<{
    seed: number;
    scores: PlaybookScores;
    passed: boolean;
  }>;
}

export interface BattleModeResult {
  playbooks: Playbook[];
  runs: PlaybookRun[];
  winner: string; // playbookId
  comparison: {
    scores: Record<string, PlaybookScores>;
    failurePoints: Record<string, string[]>;
    resourceUsage: Record<
      string,
      {
        assetsUsed: number;
        standbyReserves: number;
      }
    >;
  };
}

export interface CommsScheduleEntry {
  time: string; // "T+0", "T+20", "T+45"
  messages: CommsDraft[];
  coverageDistricts: string[];
  languages: string[];
}

export interface EnhancedCommanderBrief {
  planId: string;
  version: string;
  situationSummary: string;
  intent: string;
  conceptOfOperations: string;
  tasksToUnits: Array<{
    unit: string;
    missions: MissionDraft[];
    responsibility: string;
  }>;
  coordinatingInstructions: string[];
  communicationsPlan: CommsScheduleEntry[];
  riskMatrix: Array<{
    risk: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    mitigation: string;
  }>;
  hotspots: Hotspot[];
}
```

---

### Phase 2: Battle Mode Engine ✅

**New File**: `src/lib/battleMode.ts`

**Function**: `runBattleMode(playbooks, operationalState, ...)`

**Algorithm**:

```typescript
1. For each playbook (A, B, C, D):
   - Run generatePlaybookRun()
   - Collect scores
   - Track failure points (shelter overload, infeasible missions)
   - Calculate resource usage

2. Compare all runs:
   - Identify winner (highest overall score)
   - List where each playbook failed
   - Show resource efficiency

3. Return structured comparison
```

---

### Phase 3: Monte Carlo Robustness Test ✅

**New File**: `src/lib/robustnessTest.ts`

**Function**: `runRobustnessTest(playbook, config, operationalState, ...)`

**Algorithm**:

```typescript
1. Initialize seeded RNG (deterministic per seed)

2. For i = 0 to 29 (30 runs):
   seed = baseS

eed + i

   // Apply variability
   - Flood depths *= (1 + random(-config.floodVar, +config.floodVar))
   - Ghost roads += random(0, config.roadFailureProb * 10) new blocks
   - Shelter capacities *= (1 + random(-config.shelterVar, +config.shelterVar))
   - Sensor confidence *= (1 - config.sensorDegradation / 100)

   // Run simulation
   run = generatePlaybookRun(playbook, perturbedState)

   // Check success criteria
   passed = (
     run.scores.overloadAvoidance > 70 &&
     run.scores.executionFeasibility > 70
   )

   results.push({ seed, scores: run.scores, passed })

3. Analyze results:
   - successRate = (passed / total) * 100
   - worstCase = min(scores) across all runs
   - bestCase = max(scores) across all runs
   - averageScores = mean(scores)

   // Grade assignment
   if (successRate >= 90) grade = 'A'
   else if (successRate >= 75) grade = 'B'
   else if (successRate >= 60) grade = 'C'
   else if (successRate >= 45) grade = 'D'
   else grade = 'F'

4. Return RobustnessTestResult
```

**Seeded RNG**:

```typescript
class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Linear Congruential Generator
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}
```

---

### Phase 4: Sub-District Hotspot Detection ✅

**New File**: `src/lib/hotspotDetection.ts`

**Function**: `detectHotspots(district, incidents, hazards, shelters, ...)`

**Algorithm**:

```typescript
1. Get district places from district_places.ts

2. For each place in district:
   score = 0
   reasons = []

   // Hazard intensity
   if (place near flood polygon):
     score += floodDepth * 30
     reasons.push(`Flood depth ${depth}m`)

   if (place in cyclone cone):
     score += 25
     reasons.push(`Cyclone direct hit risk`)

   // Incident severity
   nearbyIncidents = incidents within 2km of place
   criticalIncidents = nearbyIncidents.filter(i => i.severity >= 7)
   score += criticalIncidents.length * 15
   if (criticalIncidents.length > 0):
     reasons.push(`${criticalIncidents.length} critical incidents`)

   // Shelter overload
   nearestShelter = findNearest(place, shelters)
   if (nearestShelter.predictedPct > 85):
     score += (nearestShelter.predictedPct - 85) * 2
     reasons.push(`Shelter ${nearestShelter.name} at ${nearestShelter.predictedPct}%`)

   // Access loss
   blockedRoads = countGhostRoadsNear(place, 3km)
   score += blockedRoads * 10
   if (blockedRoads > 0):
     reasons.push(`${blockedRoads} roads blocked`)

   hotspots.push({ place, score, reasons })

3. Sort hotspots by score (descending)

4. Assign priority:
   Top 1: P1 (Priority 1 - Critical)
   Top 2-3: P2 (Priority 2 - High)
   Top 4-6: P3 (Priority 3 - Medium)

5. Return top 3 hotspots per district
```

---

### Phase 5: Enhanced Commander Brief ✅

**Function**: `generateEnhancedCommanderBrief(playbookRun, hotspots, ...)`

**Format** (Military OPORD style):

```
═══════════════════════════════════════════════════════
OPERATIONAL ORDER
═══════════════════════════════════════════════════════
Plan ID: PLAY-2026-02-07-001
Version: 1.0
Classification: UNCLASSIFIED
DTG: 070645Z FEB 2026

1. SITUATION SUMMARY
   Current hazards affecting 3 districts (Kalutara, Ratnapura, Galle).
   Flood depths 1.5-2.1m, 8 critical incidents, 3 shelters at risk.
   Population at risk: ~2,400 (estimate).

2. INTENT
   Commander's Intent: Save lives, prevent shelter overload, maintain
   equity in response. Prioritize P1 hotspots in Kalutara and Ratnapura.
   End State: All critical incidents addressed, shelters < 90%, zero
   casualties from delayed response.

3. CONCEPT OF OPERATIONS
   Phase 1 (T+0 to T+30): Evacuate P1 hotspots, deploy rescue assets
   Phase 2 (T+30 to T+120): Complete missions, redirect shelter overflow
   Phase 3 (T+120+): Recovery operations, assess damage

4. TASKS TO UNITS
   A. Rescue Team Alpha (Boat Delta, Truck Alpha)
      1. Mission M-001: Evacuate Kalutara North P1 hotspot
         - Incident IDs: inc_001, inc_002
         - Estimated duration: 45 min
         - Responsibility: Primary rescue, medical triage
      2. Mission M-002: Medical response to P2 hotspot
         - Incident IDs: inc_003
         - Estimated duration: 30 min

   B. Rescue Team Bravo (Truck Bravo)
      1. Mission M-003: Supply mission to Ratnapura shelters
         - Target: Shelter S-002, S-003
         - Estimated duration: 60 min
         - Responsibility: Deliver supplies, assess capacity

5. COORDINATING INSTRUCTIONS
   A. Timeline
      - H-Hour: 0645 local time
      - All units check-in at H+0
      - Phase 1 complete by H+30

   B. Constraints
      - Do NOT enter flood zones > 1.5m depth without boat support
      - Avoid ghost roads: GR-01, GR-02, GR-03
      - Maintain 30% asset reserve for emergencies

   C. Priorities
      1. P1 hotspots (Kalutara North, Dodangoda)
      2. Critical medical incidents
      3. Shelter overflow prevention

6. COMMUNICATIONS PLAN
   Schedule:
     T+0:    Evacuation alerts (EN, SI, TA, DE) → Kalutara residents
     T+20:   Shelter capacity warnings → Ratnapura
     T+45:   Road closure notifications → All districts
     T+90:   Status update → DMC HQ

   Coverage:
     Kalutara: 5 messages (3 SMS, 2 WhatsApp)
     Ratnapura: 2 messages (1 SMS, 1 WhatsApp)
     Galle: 1 message (1 SMS)

   Languages: EN (primary), SI, TA, DE (tourists)

7. RISK MATRIX
   Risk                              | Severity  | Mitigation
   ──────────────────────────────────────────────────────────────
   Shelter overload (Kalutara)       | CRITICAL  | Open overflow shelters, redirect
   Road cut by landslide (Ratnapura) | HIGH      | Stage boats, alternative routes
   Cyclone wind increase             | MEDIUM    | Monitor, activate coast closure
   Asset fuel shortage               | MEDIUM    | Refuel at T+60, stage reserves
   Comms failure in rural areas      | LOW       | Use loudspeaker vehicles

8. HOTSPOTS (Priority Locations)
   P1: Kalutara North (score: 95)
       - Flood 2.1m, 3 critical incidents, shelter 88%
   P1: Dodangoda (score: 87)
       - Flood 1.8m, 2 critical incidents, 2 roads blocked
   P2: Ratnapura Central (score: 72)
       - Landslide risk, 1 critical incident, shelter 85%

9. SCORES (Doctrine Performance)
   Equity: 100 | Efficiency: 100 | Overload Avoidance: 100
   Safety: 100 | Feasibility: 100 | Overall: 100

═══════════════════════════════════════════════════════
END OF OPERATIONAL ORDER
═══════════════════════════════════════════════════════
```

---

### Phase 6: UI Tabbed Architecture ✅

**File**: `src/app/playbook-studio/page.tsx`

**Tab Structure**:

```typescript
type TabId = "builder" | "simulation" | "battle" | "brief";

const tabs = [
  { id: "builder", label: "Doctrine Builder", icon: <BookOpen /> },
  { id: "simulation", label: "Simulation", icon: <Play /> },
  { id: "battle", label: "Battle Mode", icon: <Swords /> },
  { id: "brief", label: "Commander Brief", icon: <FileText /> },
];
```

**Layout** (No Overlap):

```
┌──────────────────────────────────────────────────────────────┐
│ PLAYBOOK STUDIO - DOCTRINE LABORATORY                        │
├──────────────────────────────────────────────────────────────┤
│ [Builder] [Simulation] [Battle Mode] [Commander Brief]       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  TAB CONTENT (Each tab is self-contained, no overlap)        │
│                                                               │
│  • Builder: 5-step wizard (existing + version control)       │
│  • Simulation: Run + Robustness Test panel                   │
│  • Battle: Select 2-4 playbooks, compare side-by-side        │
│  • Brief: Enhanced OPORD format, export buttons              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTATION PRIORITY

### Must-Have (MVP):

1. ✅ Enhanced types (version, status, hotspots)
2. ✅ Battle Mode comparison
3. ✅ Monte Carlo robustness test
4. ✅ Sub-district hotspot detection
5. ✅ Enhanced Commander Brief
6. ✅ Tabbed UI

### Nice-to-Have (Post-MVP):

1. Interactive score distribution charts
2. Printable PDF export
3. Real-time collaboration
4. Playbook templates library

---

## 📊 PERFORMANCE TARGETS

- Battle Mode (4 playbooks): < 2 seconds
- Robustness Test (30 runs): < 3 seconds
- Hotspot Detection (15 districts): < 500ms
- Commander Brief generation: < 200ms
- UI tab switching: Instant (< 100ms)

---

## ✅ TESTING CHECKLIST

### Battle Mode:

- [ ] Can select 2-4 playbooks
- [ ] Runs simulations in parallel (or fast sequential)
- [ ] Shows scoreboard table clearly
- [ ] Identifies winner correctly
- [ ] Lists failure points for each playbook
- [ ] "Promote Winner" updates playbook status to ACTIVE

### Robustness Test:

- [ ] Sliders adjust variability (0-30%)
- [ ] 30 runs complete in < 3s
- [ ] Success rate calculated correctly
- [ ] Worst/best/average scores shown
- [ ] Grade (A/B/C/D/F) assigned properly
- [ ] Seeded RNG is deterministic (same seed = same results)

### Hotspots:

- [ ] Detects P1/P2/P3 for each district
- [ ] Scores based on hazards + incidents + shelters + access
- [ ] Shows in district briefs
- [ ] Shows in Commander Brief

### Commander Brief:

- [ ] All 9 sections present
- [ ] Military format (clear, professional)
- [ ] Hotspots listed
- [ ] Risk matrix included
- [ ] Comms schedule timeline
- [ ] Export JSON works
- [ ] Printable view renders correctly

### UI:

- [ ] Tabs don't overlap
- [ ] Each tab is self-contained
- [ ] Tab switching is instant
- [ ] Mobile responsive (bonus)
- [ ] No visual glitches

---

## 🎯 SUCCESS CRITERIA

**This upgrade is successful if**:

1. ✅ Judges can compare 3 playbooks side-by-side in < 5 clicks
2. ✅ Robustness test runs 30 scenarios in < 3 seconds
3. ✅ Commander Brief looks like a real military OPORD
4. ✅ Hotspots are clearly identified (P1/P2/P3) with evidence
5. ✅ UI feels guided and professional, not cluttered
6. ✅ Export functions work (JSON, Mission Control, Comms)
7. ✅ Version control and approval workflow is clear
8. ✅ System handles 10+ playbooks without slowdown

---

## 📦 DELIVERABLES

### New Files:

1. `src/lib/battleMode.ts` - Battle Mode comparison engine
2. `src/lib/robustnessTest.ts` - Monte Carlo simulation
3. `src/lib/hotspotDetection.ts` - Sub-district priority ranking
4. `src/lib/enhancedBrief.ts` - Military-style OPORD generator

### Updated Files:

1. `src/lib/playbooks.ts` - Enhanced types
2. `src/lib/playbookEngine.ts` - Integration points
3. `src/app/playbook-studio/page.tsx` - Tabbed UI

### Documentation:

1. This implementation guide
2. User guide for Battle Mode
3. Technical notes on Monte Carlo RNG

---

_Playbook Studio Doctrine Laboratory Upgrade - Implementation Plan_  
_Estimated Implementation Time: 4-6 hours_  
_Complexity: High_  
_Impact: Competition-Winning_
