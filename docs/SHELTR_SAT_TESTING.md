# SHELTR-SAT Testing Guide - Quick Start

## Current Status

✅ **TypeScript**: Compilation passing  
✅ **Backend Data**: 6 shelters in scenarios.json  
✅ **Prediction Model**: sheltrSat.ts implemented  
✅ **Store**: Extended with shelter state  
✅ **Map Pins**: Shelter rendering complete  
✅ **Shelters Page**: Full dashboard created  
✅ **Sidebar**: Navigation link exists

---

## Quick 5-Minute Test

### Test 1: God-View Map Pins (2 min)

```
1. Open: http://localhost:3000/
2. Wait for map to load
3. See 4 shelter pins (circles) on map
   - Should be different colors (green/yellow/red)
   - Larger circles = higher capacity
4. Hover over a shelter pin
   → Tooltip appears: "Shelter Name | X% → Y%"
5. Click a shelter pin
   → Popup opens with:
      - Current occupancy (X / capacity)
      - Predicted occupancy in 1h
      - Status badges
```

**Expected Colors**:

- **Matugama Camp**: Green (38% → 56%)
- **Kalutara Town Hall**: Yellow (42% → 72%)
- **Nagoda School**: Yellow (77% → 87%)
- **Bombuwala CC**: Red (95% → 99%)

---

### Test 2: Navigate to Shelters Page (3 min)

```
1. Click "Shelters" in left sidebar
2. URL changes to /shelters
3. Page loads with:

   TOP: Stats bar
   - Total Capacity: 2250
   - Current Occupancy: 1400 (62%)
   - At Risk: 2
   - Full: 0

   LEFT: Shelter table (4 rows visible)
   - All shelters from Kalutara scenario

   RIGHT: Empty state
   - "No shelter selected"
   - "Click on a shelter to view details"

4. Click on "Bombuwala Community Center" row
   → Row highlights purple
   → Right panel shows:
      - Current bar: 95% (red)
      - Predicted bar: 99% (red)
      - Suggested action: "⚠️ Redirect intake..."

5. Click "AT_RISK" filter button
   → Table shows only 2 shelters:
      - Nagoda School (77%)
      - Bombuwala CC (95%)

6. Type "Kalutara" in search box
   → Table filters to 1 result
   → "Kalutara Town Hall"
```

---

## Detailed Test Flows

### Flow 1: Color Coding Verification

**Objective**: Verify shelter pins use correct colors

```
Shelter: Matugama Camp
- Capacity: 400
- Occupancy: 150 (38%)
- Expected Color: GREEN
- Map Pin: Should be green circle
- Hover Tooltip: "Matugama Relief Camp | 38% → 56%"

Shelter: Nagoda School
- Capacity: 350
- Occupancy: 270 (77%)
- Expected Color: YELLOW
- Map Pin: Should be yellow circle

Shelter: Bombuwala CC
- Capacity: 200
- Occupancy: 190 (95%)
- Expected Color: RED
- Map Pin: Should be red circle
```

**Test Steps**:

1. Load Kalutara flood scenario
2. Find each shelter on map
3. Verify color matches occupancy %
4. Check tooltip shows correct percentages

---

### Flow 2: Prediction Accuracy

**Objective**: Verify prediction model calculates correctly

**Example: Kalutara Town Hall**

```
Input:
- Capacity: 500
- Current: 210 (42%)
- Intake rate: 2.5 ppl/min
- Base increase: 2.5 × 60 = 150 ppl/hr
- Predicted: 210 + 150 = 360 ppl
- Predicted %: 360 / 500 = 72%
- Status: OK (< 80%)

Verification:
1. Open Shelters page
2. Find "Kalutara Town Hall" row
3. Current %: Should show ~42%
4. Predicted %: Should show ~72%
5. Predicted should have ↑ arrow (increasing)
```

**Test Cases**:

| Shelter       | Current | Intake | Predicted | Status  |
| ------------- | ------- | ------ | --------- | ------- |
| Kalutara TH   | 42%     | 2.5    | ~72%      | OK      |
| Nagoda School | 77%     | 1.2    | ~87%      | WARNING |
| Bombuwala CC  | 95%     | 0.8    | ~99%      | FULL    |
| Matugama Camp | 38%     | 3.0    | ~56%      | OK      |

---

### Flow 3: Filter Functionality

**Test ALL Filter**:

```
1. Click "ALL" button
2. Should show: 4 shelters (Kalutara scenario)
3. Verify all visible
```

**Test AT_RISK Filter**:

```
1. Click "AT_RISK" button
2. Should show: 2 shelters
   - Nagoda School (77% → 87%)
   - Bombuwala CC (95% → 99%)
3. Others hidden
```

**Test FULL Filter**:

```
1. Click "FULL" button
2. Should show: 0 shelters (none at 99%+ yet)
3. Empty state if no results
```

**Test OPEN Filter**:

```
1. Click "OPEN" button
2. Should show: 2 shelters
   - Kalutara Town Hall (42%)
   - Matugama Camp (38%)
3. High-occupancy shelters hidden
```

---

### Flow 4: Search Functionality

**Test Case 1: Exact Match**

```
Input: "Kalutara"
Expected: 1 result - "Kalutara Town Hall"
```

**Test Case 2: Partial Match**

```
Input: "school"
Expected: 1 result - "Nagoda School Shelter"
```

**Test Case 3: No Match**

```
Input: "xyz"
Expected: 0 results, empty state
```

**Test Case 4: Case Insensitive**

```
Input: "BOMBUWALA"
Expected: 1 result - "Bombuwala Community Center"
```

---

### Flow 5: Selection & Detail Panel

**Test Selection**:

```
1. Click on "Kalutara Town Hall" row
2. Verify:
   - Row background changes to purple
   - Right panel shows shelter details
   - Current bar displays (green)
   - Predicted bar displays
   - Suggested action shows

3. Click same row again
4. Verify:
   - Selection clears
   - Row returns to normal
   - Right panel shows "No shelter selected"
```

**Test Detail Panel Content**:

```
Selected: Bombuwala Community Center

Header:
- Name: "Bombuwala Community Center"
- ID: "shelter_kalutara_03"

Current Occupancy:
- Text: "190 / 200 (95%)"
- Bar: Red, 95% filled
- Numeric: "95.0%"

Predicted Occupancy:
- Text: "198 / 200 (99%)"
- Bar: Red, 99% filled
- Numeric: "99.0%"

Suggested Action:
- Purple card with border
- Text: "⚠️ Redirect intake to nearest low-load shelter."

Metrics:
- Intake Rate: "0.8 ppl/min"
- Projected Fill Time: "0.2h" (calculated)
- Location: "6.620°, 79.980°"
```

---

### Flow 6: Map-Table Sync (Selection Persistence)

**Objective**: Verify selected shelter highlights on map

```
1. Start on Shelters page
2. Click "Kalutara Town Hall" row
   → Row highlights purple

3. Navigate to God-View (/)
   → Map loads
   → Find Kalutara Town Hall pin
   → Should have cyan dashed pulse ring around it
   → Ring animates (pulsing)

4. Navigate back to Shelters (/shelters)
   → "Kalutara Town Hall" still selected (purple)

5. Click another shelter or click again to deselect
6. Navigate back to God-View
   → Pulse ring moves or disappears
```

---

### Flow 7: Scenario Change

**Test Scenario Switch**:

```
1. Start on God-View, Kalutara flood loaded
   → 4 shelter pins visible

2. Change scenario to "Trinco Cyclone" (God-View HUD)
   → Map moves to Trincomalee
   → Now see 2 shelter pins:
      - Trincomalee Sports Complex
      - Nilaveli Community Hall

3. Navigate to Shelters page
   → Table shows 2 shelters (Trinco)
   → Stats bar updates:
      - Total Capacity: 1100
      - Current Occupancy: 600 (55%)
```

---

## Visual Verification Checklist

### Map Pins

- [ ] Circles visible (not default markers)
- [ ] Colors: green/yellow/red based on occupancy
- [ ] Size: larger shelters have bigger circles
- [ ] Glow effect: translucent halo around pins
- [ ] Hover: tooltip appears
- [ ] Click: popup opens
- [ ] Selected: cyan dashed ring pulses

### Shelters Page - Header

- [ ] Title: "SHELTR-SAT" in purple
- [ ] Subtitle visible
- [ ] 4 stat cards in grid
- [ ] Stats update on scenario change

### Shelters Page - Table

- [ ] Clean glassmorphism style
- [ ] Filter buttons clickable
- [ ] Active filter highlighted (purple)
- [ ] Search input visible
- [ ] Table headers: Name, Status, Current %, Predicted %, Capacity
- [ ] Rows: hover effect (lighter background)
- [ ] Selected row: purple glow

### Shelters Page - Detail Panel

- [ ] Empty state when no selection
- [ ] When selected:
  - Shelter name large and bold
  - Current bar fills based on %
  - Predicted bar fills based on %
  - Bar colors change: green/yellow/red
  - Suggested action card visible
  - Metrics card at bottom

---

## Performance Checks

### Page Load

- [ ] God-View loads < 2s
- [ ] Shelters page loads < 2s
- [ ] No console errors
- [ ] No React warnings

### Interactions

- [ ] Shelter selection < 100ms
- [ ] Filter change < 100ms
- [ ] Search typing real-time (< 50ms)
- [ ] Table sorting/filtering smooth

### Animations

- [ ] Shelter pulse on map: smooth 3s loop
- [ ] Selection ring: smooth 2s pulse
- [ ] Table row hover: smooth transition
- [ ] Bar fill: smooth width transition

---

## Browser DevTools Checks

### Console (F12 → Console)

```
✓ No red errors
✓ No React warnings
✓ Optional: Store actions logging
✓ Prediction calculations complete
```

### Network (F12 → Network)

```
✓ GET /scenarios.json (includes shelters)
✓ 200 status on API calls
✓ No 404 errors
```

### React DevTools

```
✓ useOptimizationStore shows shelters array
✓ selectedShelterId updates on click
✓ Store state consistent across pages
```

---

## Edge Cases to Test

### No Shelters Scenario

```
1. Create scenario with no shelters (future)
2. Expected:
   - Map: No shelter pins
   - Shelters page: Empty state
   - Stats: All zeros
```

### All Shelters Full

```
1. Mock data: all shelters at 100%
2. Expected:
   - All pins red
   - "FULL" filter shows all
   - "OPEN" filter shows none
```

### Single Shelter

```
1. Mock data: only 1 shelter
2. Expected:
   - Stats show 1 shelter
   - Filters work
   - Selection works
```

---

## Known Issues / Expected Behavior

### Expected (Not Bugs)

- ✓ Predictions deterministic (same input → same output)
- ✓ Store resets on page refresh
- ✓ Multi-tab requires refresh to sync
- ✓ Predicted % can exceed 100% in calculations (clamped to capacity)

### Should NOT Happen (Report if Seen)

- ❌ Shelter pins not visible
- ❌ Wrong colors (green when should be red)
- ❌ Predictions not calculating
- ❌ Table not filtering
- ❌ Selection not working
- ❌ Console errors

---

## Comparison: Before vs After PART 5

### Before (PART 4)

```
Features:
- Map with incidents/resources
- Route optimization
- Logistics control
- Truth Engine feed

Shelters: None
```

### After (PART 5)

```
NEW Features:
+ Shelter pins on map (color-coded)
+ Predictive occupancy model
+ Shelters control dashboard
+ Filter/search shelters
+ Detail panel with bars
+ Suggested actions
+ Selection highlighting

Total Pages: 4
- God-View (map)
- Logistics (α control)
- Truth Engine (intel)
- Shelters (capacity mgmt)
```

---

## Demo Script (For Stakeholders)

### 1. Show Problem

**Say**: "During disasters, shelter capacity fills quickly. We need to predict which shelters will be full soon and redirect people accordingly."

### 2. Show Map View

**Action**: Open God-View, point to shelter pins

**Say**: "See these colored circles? Green means plenty of space, yellow means moderate, red means almost full. The system predicts occupancy 1 hour ahead."

**Action**: Hover over red pin

**Say**: "This shelter is at 95% now and will be 99% full in an hour. We should stop routing people there."

### 3. Show Control Dashboard

**Action**: Navigate to Shelters page

**Say**: "This is our control center. We can see all shelters at once, filter by risk level, and get suggested actions."

**Action**: Click "AT_RISK" filter

**Say**: "Two shelters are at risk of filling up. Let's check one."

**Action**: Click Bombuwala row

**Say**: "The system recommends: 'Redirect intake to nearest low-load shelter.' This prevents overflow and ensures even distribution."

### 4. Show Prediction Model

**Action**: Point to predicted bar

**Say**: "The model considers intake rate, current disaster load, and our fairness policy. Higher fairness means we try to balance load across shelters instead of filling one at a time."

### 5. Show Sync

**Action**: Navigate back to God-View

**Say**: "The selected shelter now has a pulsing ring. Everything syncs across pages - map, table, and controls."

---

## Success Criteria

**Before marking PART 5 complete**:

### God-View

- [ ] ✓ Shelter pins render
- [ ] ✓ Color coding correct
- [ ] ✓ Tooltips show predictions
- [ ] ✓ Popups detailed
- [ ] ✓ Selection pulse ring works
- [ ] ✓ No performance issues

### Shelters Page

- [ ] ✓ Page loads at /shelters
- [ ] ✓ Stats bar displays 4 metrics
- [ ] ✓ Table shows all shelters
- [ ] ✓ Filters work (ALL/AT_RISK/FULL/OPEN)
- [ ] ✓ Search filters results
- [ ] ✓ Row selection highlights
- [ ] ✓ Detail panel shows selected shelter
- [ ] ✓ Occupancy bars render correctly
- [ ] ✓ Suggested actions display
- [ ] ✓ Metrics card shows data
- [ ] ✓ No console errors

### Predictions

- [ ] ✓ Calculations accurate
- [ ] ✓ Context-aware (alpha, incidents)
- [ ] ✓ Status labels correct (OK/WARNING/FULL)
- [ ] ✓ Suggested actions relevant

### Store Sync

- [ ] ✓ Selection persists across pages
- [ ] ✓ Shelters load from scenarios
- [ ] ✓ Alpha affects predictions
- [ ] ✓ Incident count affects predictions

---

## Troubleshooting

### Shelters Not Visible on Map

```
Problem: No shelter pins showing
Debug:
1. Check store: console.log(useOptimizationStore.getState().shelters)
2. Should show array of 4-6 shelters
3. If empty: scenario not loaded or missing shelter data
4. Check scenarios.json has shelters field
```

### Wrong Colors

```
Problem: All shelters showing same color
Debug:
1. Check getCurrentPercent() function
2. Verify getShelterColor() thresholds
3. Log: console.log(getCurrentPercent(shelter))
4. Should return 0-100 range
```

### Predictions Not Updating

```
Problem: Predicted % same as current %
Debug:
1. Check predictOccupancy1h() called
2. Verify intake_rate_per_min exists in data
3. Log: console.log(predictOccupancy1h(shelter, context))
4. Should return object with predicted_occupancy_1h
```

### Selection Not Working

```
Problem: Clicking row doesn't highlight
Debug:
1. Check selectShelter() action
2. Verify selectedShelterId in store
3. Log: console.log(useOptimizationStore.getState().selectedShelterId)
4. Should change on row click
```

---

## Next Steps After Testing

1. **Gather Feedback**: Test with users
2. **Validate Predictions**: Compare with real-world data (if available)
3. **Tune Model**: Adjust alpha/load effects based on feedback
4. **Backend Integration**: Connect to real prediction API
5. **Real-time Updates**: Add WebSocket for live occupancy
6. **Mobile Design**: Optimize for smaller screens
7. **Historical Tracking**: Store prediction accuracy over time

---

**Status**: READY FOR USER TESTING 🏠  
**Build**: PASSING ✅  
**Servers**: RUNNING ✅  
**Documentation**: COMPLETE ✅

**Open http://localhost:3000/shelters to test SHELTR-SAT!**
