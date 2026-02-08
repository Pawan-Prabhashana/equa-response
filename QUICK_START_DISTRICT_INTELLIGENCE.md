# 🚀 QUICK START: District Intelligence + Playbook Studio

## 1. START THE SYSTEM (2 commands)

### Terminal 1: Backend API

```bash
cd equa-response-api
uvicorn main:app --reload --port 8000
```

### Terminal 2: Frontend

```bash
cd equa-response-web
npm run dev
```

**Open Browser**: http://localhost:3000

---

## 2. NAVIGATE TO PLAYBOOK STUDIO

**From God-View Dashboard**:

- Click sidebar item: **"Playbook Studio"** (📖 BookOpen icon)

**Direct URL**: http://localhost:3000/playbook-studio

---

## 3. 60-SECOND DEMO

### Step 1: Observe District Intelligence (Left Panel)

- **15 districts** ranked by impact score
- Top districts (Kalutara, Ratnapura) have high scores (70-80+)
- Click **"View Brief"** on any district to see:
  - Evidence (flood depth, critical incidents)
  - Affected places (villages)
  - Population at risk

### Step 2: Select Districts

- Click **"Select Top 5"** button
- See 5 districts highlighted in cyan
- Click **"Continue to Objectives →"**

### Step 3: Choose Objective

- Select **"🚨 Life Saving"**
- Click **"Continue to Triggers →"**

### Step 4: Define Triggers

- Check **"💧 IF flood depth > 1.2m → EVACUATE"**
- Check **"🏠 IF shelter predicted > 90% → REDIRECT"**
- Click **"Continue to Resources →"**

### Step 5: Resource Posture

- Select **"Impact-Proportional"**
- Click **"Continue to Review →"**

### Step 6: Generate Plan

- Review summary
- Click **"Generate Playbook"** (large button)
- Wait 1.2 seconds for simulation

### Step 7: View Results (Right Panel)

- **Scores**: Equity 92, Efficiency 85, Overall 87
- **Commander Brief**: Immediate actions, next 2 hours, resources
- **Missions**: 4 missions generated

### Step 8: Export

- Click **"Send to Mission Control"**
- Alert: "✓ 4 missions sent"
- Navigate to **Mission Control** in sidebar
- Verify missions appear in queue

---

## 4. FEATURES TO SHOWCASE

### A. Impact Feed (Top of Left Panel)

- Shows live updates: "🔴 Kalutara: Posture upgraded to EVACUATE"
- Changes as scenario/frame updates

### B. District Brief Drawer (Left Panel)

- Click "View Brief" on any district
- Shows:
  - **Evidence**: "Flood depth 2.1m (40% area)"
  - **Affected Places**: "Dodangoda, Beruwala, Nagoda"
  - **Population at Risk**: 28,000

### C. 5-Step Workflow (Center Panel)

- Progressive disclosure
- Visual step indicator (1-5 bubbles)
- Back/Forward navigation

### D. Multi-Dimensional Scoring (Right Panel)

- 6 metrics: Equity, Efficiency, Overload, Safety, Feasibility, Overall
- Color-coded (green ≥80, yellow ≥60, red <60)

### E. Commander Brief (Right Panel)

- Immediate actions (red, 0-30min)
- Next 2 hours (amber)
- Resource allocation (green)
- Risk warnings (purple)

---

## 5. SCENARIOS TO DEMO

### Scenario A: High-Risk Flood Response

**Districts**: Kalutara, Ratnapura, Galle  
**Objective**: Life Saving  
**Triggers**: Flood Evac, Critical Dispatch  
**Resources**: Aggressive

**Expected Result**:

- 6 missions (evacuation focus)
- Efficiency 95, Equity 72
- Immediate: "Execute 3 high-priority missions"

### Scenario B: Fairness-First

**Districts**: Select Top 5  
**Objective**: Fairness First  
**Resources**: Equal Distribution

**Expected Result**:

- Supply missions to remote areas
- Equity 94, Efficiency 68
- Next 2h: "Deliver supplies to underserved"

### Scenario C: Tourism Protection

**Districts**: Galle, Trincomalee (coastal)  
**Objective**: Tourism Protection  
**Triggers**: Cyclone Lock

**Expected Result**:

- German-language comms
- Tourist corridor alerts
- Tourism score 88

---

## 6. JUDGE TALKING POINTS

### Innovation 1: District-Level Intelligence

**Show**: Left panel, district list  
**Say**: "This is the only system that operates at **administrative district level** with automated impact intelligence. Real DMCs operate by districts, not arbitrary grid cells."

### Innovation 2: Guided Doctrine Creation

**Show**: 5-step workflow  
**Say**: "We simplified complex operational planning into a **2-minute guided workflow**. Step 1: Where to respond. Step 2: Why. Step 3: When. Step 4: How. Step 5: Generate."

### Innovation 3: Explainable AI

**Show**: District brief evidence  
**Say**: "Every recommendation has **human-readable evidence**: 'Flood depth 2.1m, 3 critical incidents, 2 road blockages'. This is not a black box."

### Innovation 4: Multi-Dimensional Scoring

**Show**: Scorecard (6 metrics)  
**Say**: "We make **tradeoffs explicit**: Equity vs. Efficiency. This plan scores 92 on equity but 68 on efficiency. You choose the policy."

### Innovation 5: Operational Integration

**Show**: Export buttons → Mission Control  
**Say**: "This is not a standalone tool. **One-click export** to Mission Control, Comms Console, Assets. The plan becomes operations immediately."

---

## 7. TECHNICAL DEEP DIVE (If Asked)

### Geospatial Intelligence

**Algorithm**: Point-in-polygon (ray casting) + polygon intersection  
**Data**: 15 district boundaries, flood polygons, incidents, shelters  
**Output**: Impact score (0-100), posture (EVACUATE/DISPATCH/ALERT/MONITOR)

**Code**: `src/lib/districtImpact.ts` (450 lines)

### Impact Scoring

**Formula**:

```
impactScore =
  (floodDepth * 25) +
  (windRisk * 0.4) +
  (criticalIncidents * 10 + totalIncidents * 2) +
  ((100 - accessibility) * 0.3) +
  (atRiskShelters * 15)
```

**Result**: 0-100 (higher = more severe)

### Posture Recommendation

**Rules**:

- **EVACUATE**: score ≥75 OR floodDepth ≥2m OR critical ≥3
- **DISPATCH**: score ≥50 OR floodDepth ≥1.2m OR shelterPredicted ≥90%
- **ALERT**: score ≥30 OR inside cyclone cone
- **MONITOR**: score ≥15

**Code**: `src/lib/districtImpact.ts:computeDistrictImpacts()`

### Change Detection

**Method**: Compare current vs. previous state, compute deltas  
**Output**: Feed items ("Flood depth rose to 2.3m ↑0.4m")

**Code**: `src/lib/districtImpact.ts:generateImpactFeed()`

### Playbook Generation

**Engine**: Rule-based deterministic AI  
**Inputs**: Districts, objectives, triggers, resources, operational state  
**Outputs**: Missions, comms, scores, commander brief

**Code**: `src/lib/playbookEngine.ts:generatePlaybookRun()`

### Multi-Dimensional Scoring

**Metrics**:

1. **Equity**: Variance in response priorities (lower variance = higher equity)
2. **Efficiency**: % critical incidents covered
3. **Overload Avoidance**: Shelters stay <95% (100 - max occupancy)
4. **Travel Safety**: % missions on safe routes
5. **Execution Feasibility**: % missions with ready assets

**Overall**: Weighted average (equity 0.25, efficiency 0.30, others 0.15 each)

**Code**: `src/lib/playbookEngine.ts:scorePlan()`

---

## 8. TROUBLESHOOTING

### Issue: Districts show 0 impact

**Cause**: No incidents loaded  
**Fix**: Navigate to Truth Engine → Verify some incidents, then return to Playbook Studio

### Issue: "No districts selected" error

**Cause**: Forgot to select districts in Step 1  
**Fix**: Go back to Step 1, click "Select Top 5" or manually select

### Issue: Build errors

**Cause**: Missing dependencies  
**Fix**:

```bash
cd equa-response-web
npm install
```

### Issue: TypeScript errors

**Fix**:

```bash
npx tsc --noEmit
# Should show 0 errors
```

---

## 9. CODE QUALITY VERIFICATION

### TypeScript Compilation

```bash
cd equa-response-web
npx tsc --noEmit
# Expected: Exit code 0 (no errors)
```

### Production Build

```bash
cd equa-response-web
npm run build
# Expected: Success, 19 pages including /playbook-studio
```

### Dev Server

```bash
npm run dev
# Expected: Ready on http://localhost:3000
```

---

## 10. FILE STRUCTURE

### New Files (District Intelligence)

```
equa-response-web/src/
├── data/
│   ├── sri_lanka_districts.ts        (350 lines) - District GeoJSON
│   └── district_places.ts            (80 lines)  - Villages/places
├── lib/
│   └── districtImpact.ts             (450 lines) - Impact engine
└── app/
    └── playbook-studio/
        └── page.tsx                   (600 lines) - Main UI
```

### Modified Files

```
src/components/Sidebar.tsx            - Added Playbook Studio link
```

### Total

- **New**: ~1,500 lines (district intelligence)
- **Modified**: Minimal
- **Quality**: Production-ready, 0 TypeScript errors

---

## 11. DEPLOYMENT

### Development

```bash
# Terminal 1
cd equa-response-api && uvicorn main:app --reload

# Terminal 2
cd equa-response-web && npm run dev
```

### Production

```bash
cd equa-response-web
npm run build
npm run start
```

### Cloud (Vercel)

```bash
# Push to GitHub
git add .
git commit -m "District intelligence + Playbook Studio"
git push

# Vercel auto-deploys
# → https://your-app.vercel.app/playbook-studio
```

---

## 12. SUCCESS CRITERIA ✅

- [x] Playbook Studio page loads without errors
- [x] 15 districts appear in left panel
- [x] Districts sorted by impact score
- [x] "Select Top 5" button works
- [x] 5-step workflow navigates correctly
- [x] "Generate Playbook" button runs simulation
- [x] Scorecard populates with 6 metrics
- [x] Commander brief appears
- [x] "Send to Mission Control" creates missions
- [x] TypeScript: 0 errors
- [x] Build: Success

**Status**: ✅ **ALL CRITERIA MET**

---

## 🎉 READY FOR DEMO

**The system is production-ready.**

**Playbook Studio is the flagship differentiator.**

**International competition level achieved.** 🏆

---

_Quick Start Guide - Last Updated: 2026-02-07_
