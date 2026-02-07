# Logistics Control Page - Visual Testing Guide

## Current Status

✅ **Zustand**: Installed and configured  
✅ **TypeScript**: Compilation passing  
✅ **Store**: Optimization state shared  
✅ **Frontend**: Running on http://localhost:3000  
✅ **Backend**: Running on http://localhost:8000

---

## Quick Test Flow

### Test 1: God-View (Clean Map)

```
1. Open: http://localhost:3000/
2. Verify: Map loads full-screen
3. Verify: Left HUD visible
4. Verify: NO right panel (IntelHUD removed)
5. Verify: NO fairness slider on map
6. Select scenario: "Kalutara Flood"
7. Click "Optimize" in HUD
8. Verify: Cyan route line appears on map
```

**Expected Result**: Clean map focused on visualization only.

---

### Test 2: Navigate to Logistics

```
1. Look at left sidebar
2. Find "Logistics" (Truck icon)
3. Should be between "Truth Engine" and "Shelters"
4. Click "Logistics"
5. Route changes to /logistics
6. Page loads with new layout
```

**Expected Layout**:

```
┌───────────────────────────────────────────┐
│ LOGISTICS CONTROL          [READY]        │
│ Dynamic Route Optimization                │
├──────────────────────────────────────────┤
│ [Efficiency] [Equity Var] [Distance]     │
│ [Δ Distance] [Δ ETA]                      │
├────────────────────────┬─────────────────┤
│                        │                  │
│  RANKED INCIDENTS      │  FAIRNESS SLIDER│
│  #1  FLOOD  9/10       │      0.50        │
│  #2  LANDSLIDE 10/10   │  ════○═══       │
│  #3  TOURIST  8/10     │                  │
│  #4  NEED  6/10        │  [Efficiency]    │
│                        │  [  Equity  ]    │
│                        │                  │
│                        │  [RE-OPTIMIZE]   │
└────────────────────────┴─────────────────┘
```

---

### Test 3: Fairness Slider Interaction

**Initial State**:

- α = 0.50 (middle of slider)
- 4 incidents ranked
- Metrics displayed

**Move Slider Left (α → 0.00)**:

```
Immediate Effects:
- α display updates: 0.00
- Mode label: "Efficiency Focus"
- Table re-ranks (high severity incidents rise)
- Scores recalculate

After 450ms:
- "OPTIMIZING" status appears (top-right)
- Backend API called
- Route updates on map (if God-View open in another tab)
- Metrics update
- Δ Distance shows change
```

**Move Slider Right (α → 1.00)**:

```
Immediate Effects:
- α display updates: 1.00
- Mode label: "Equity Focus"
- Table re-ranks (long wait-time incidents rise)
- Scores recalculate

After 450ms:
- Optimization runs
- Route may get longer (prioritizing fairness)
- Δ Distance likely positive (red ↑)
- Equity variance decreases
```

---

### Test 4: Ranked Incidents Table

**Check Columns**:

- [ ] **Rank**: Sequential #1, #2, #3, #4
- [ ] **Type**: Color badges (blue/orange/red)
- [ ] **Severity**: X/10 with color (red=9+, orange=7+, yellow=5+)
- [ ] **Description**: Truncated text, readable
- [ ] **Wait (min)**: Numeric, monospace
- [ ] **Score**: 3 decimals, purple text

**Test Ranking Logic**:

At **α = 0.0 (Efficiency)**:

- Expect: inc_01 (FLOOD, severity 9) near top
- Expect: inc_02 (LANDSLIDE, severity 10) at #1 or #2
- Expect: inc_03 (NEED, severity 6) lower rank

At **α = 1.0 (Equity)**:

- Expect: Incidents with farthest resources ranked higher
- Expect: Incidents near resources ranked lower
- Severity still matters but less weight

**Verify Hover Effect**:

- [ ] Hover over row → background lightens
- [ ] Smooth transition
- [ ] No layout shift

---

### Test 5: Metrics Display

**Top Metrics Bar**:

1. **Efficiency Score** (cyan)

   - Should be positive number (1-10 range typically)
   - Higher α → may decrease
   - Example: 4.25

2. **Equity Variance** (purple)

   - Should be positive number
   - Higher α → should decrease (more fair)
   - Lower variance = better equity
   - Example: 12.3

3. **Route Distance** (blue)

   - Shows after first optimization
   - Example: 45.2 km
   - Should match God-View route

4. **Δ Distance** (green ↓ or red ↑)

   - Shows "—" on first optimization
   - Shows change after 2nd optimization
   - Green with ↓ = shorter route (good)
   - Red with ↑ = longer route
   - Example: -2.1 km (shorter)

5. **Δ ETA** (green ↓ or red ↑)
   - Shows "—" on first optimization
   - Estimated time change in minutes
   - Based on 35 km/h average speed
   - Example: -3 min (faster)

---

### Test 6: Force Re-Optimize Button

**Button States**:

- [ ] Enabled: Cyan glow, cursor pointer
- [ ] Disabled (no data): Grayed out, no cursor
- [ ] Optimizing: Spinner icon, "OPTIMIZING..." text

**Test Click**:

```
1. Click "FORCE RE-OPTIMIZE"
2. Button becomes disabled
3. Icon spins (RefreshCw animation)
4. "OPTIMIZING" status at top-right
5. After ~500ms: Optimization completes
6. Metrics update
7. Button re-enables
```

---

### Test 7: Store Synchronization (Advanced)

**Two-Tab Test**:

```
Tab 1: Open http://localhost:3000/ (God-View)
Tab 2: Open http://localhost:3000/logistics (Logistics)

Action on Tab 2: Move slider to α = 0.2
Wait 450ms for optimization
Switch to Tab 1: Route on map should update (if React state syncs)

Note: Zustand may require page refresh to sync across tabs
      unless using persistence middleware (not implemented)
```

**Single-Tab Test** (Reliable):

```
1. Start on God-View
2. Select Kalutara scenario
3. Click "Optimize" → route appears
4. Navigate to Logistics (sidebar)
5. See incidents ranked
6. See metrics populated
7. Move slider
8. Navigate back to God-View (/)
9. Route should be updated
```

---

### Test 8: Edge Cases

**No Incidents Scenario**:

- [ ] Table shows empty state
- [ ] Message: "No incidents loaded"
- [ ] Optimize button disabled
- [ ] Metrics show zeros

**All Resources Busy**:

- [ ] Wait times higher (90 min penalty)
- [ ] Still ranks correctly
- [ ] No crashes

**Single Incident**:

- [ ] Ranks as #1
- [ ] Variance = 0 (only one point)
- [ ] Optimization still works

**Rapid Slider Changes**:

- [ ] Move slider quickly 10 times
- [ ] Only triggers 1-2 optimizations (debounced)
- [ ] No API spam
- [ ] Smooth UI updates

---

## Browser DevTools Verification

### Console (F12 → Console)

```
✓ No red errors
✓ No React warnings
✓ Store actions logging (optional debug)
✓ Optimization success messages
```

### Network (F12 → Network)

```
✓ POST /optimize calls (after debounce)
✓ 200 status responses
✓ Request includes alpha parameter
✓ Response includes total_distance_km
```

### React DevTools

```
✓ useOptimizationStore hook visible
✓ State updates on slider move
✓ No unnecessary re-renders
✓ Components properly memoized
```

---

## Visual Quality Checks

### Glassmorphism

- [ ] Panels have blur backdrop
- [ ] Semi-transparent backgrounds
- [ ] Subtle borders (white/10)
- [ ] Smooth transitions

### Color Scheme

- [ ] Cyan accents (efficiency, headers)
- [ ] Purple accents (equity, scores)
- [ ] Blue for distance metrics
- [ ] Red for increases (bad)
- [ ] Green for decreases (good)
- [ ] Dark slate backgrounds

### Typography

- [ ] Headers: Bold, uppercase, cyan
- [ ] Numbers: Monospace, large
- [ ] Metadata: Small (10px), monospace
- [ ] Table text: Readable (12px)

### Animations

- [ ] Panel entrance: Smooth fade + slide
- [ ] Table rows: Staggered entry
- [ ] Slider: Smooth thumb movement
- [ ] Hover: Gentle background change
- [ ] Spinner: Clean rotation

---

## Comparison: Old vs New

### Before (PART 3)

```
God-View: Map + Left HUD + Right IntelHUD
Problem: Cluttered, optimization scattered
```

### After (PART 4)

```
God-View: Map + Left HUD (clean visualization)
Logistics: Dedicated control page (α + ranking + metrics)
Truth Engine: Dedicated intel page (NLP feed)

Result: Clear separation of concerns
```

---

## Smoke Test Script

### Complete Test (5 minutes)

**Minute 1: God-View**

```
1. Open http://localhost:3000/
2. Verify map loads
3. Select "Kalutara Flood" scenario
4. Click "Optimize" in HUD
5. Verify cyan route appears
```

**Minute 2: Logistics Page**

```
6. Click "Logistics" in sidebar
7. Verify page loads with table + slider
8. Verify 4 incidents ranked
9. Verify metrics populated
```

**Minute 3: Slider Interaction**

```
10. Move slider to α = 0.0
11. Watch table re-rank immediately
12. Wait 1 second
13. Verify "OPTIMIZING" status
14. Verify metrics update
```

**Minute 4: Compare Optimizations**

```
15. Note current metrics (write down)
16. Move slider to α = 1.0
17. Wait for optimization
18. Compare new metrics vs old
19. Verify Δ Distance shows
20. Verify Δ ETA shows
```

**Minute 5: Cross-Page Sync**

```
21. Stay on Logistics, move slider to α = 0.5
22. Wait for optimization
23. Navigate back to God-View (/)
24. Verify route on map updated
25. Navigate to Truth Engine (/truth-engine)
26. Verify page still works
27. Navigate back to Logistics
28. Verify state persisted
```

---

## Expected Performance

| Action                  | Expected Time | Acceptable |
| ----------------------- | ------------- | ---------- |
| Page load               | < 1s          | < 2s       |
| Slider move (UI update) | < 50ms        | < 100ms    |
| Ranking recalc          | < 10ms        | < 50ms     |
| Optimization API call   | 200-500ms     | < 1s       |
| Table re-render         | < 100ms       | < 200ms    |
| Route update on map     | < 200ms       | < 500ms    |

---

## Known Issues / Limitations

### Current Implementation

- Multi-tab sync: Requires manual refresh
- Mobile responsive: Not optimized yet
- Large datasets: No virtualization (fine for <100 incidents)
- Historical comparison: Only tracks last optimization

### These are EXPECTED:

- Δ metrics show "—" on first optimization
- Debounce causes 450ms delay (intentional)
- Store persists during session only (no localStorage)

---

## Debug Tips

### Slider Not Working

```typescript
// Check store value
console.log(useOptimizationStore.getState().alpha);

// Check debounce
console.log("Local alpha:", localAlpha);
console.log("Debounced alpha:", debouncedAlpha);
```

### Ranking Not Updating

```typescript
// Check ranked incidents
console.log(useOptimizationStore.getState().rankedIncidents);

// Force ranking
useOptimizationStore.getState().rankIncidents();
```

### Optimization Not Running

```typescript
// Check if data loaded
const { incidents, resources } = useOptimizationStore.getState();
console.log(`Incidents: ${incidents.length}, Resources: ${resources.length}`);

// Force optimization
useOptimizationStore.getState().runOptimization();
```

---

## Success Criteria Checklist

**Before marking PART 4 complete**:

### God-View

- [ ] ✓ Map renders clean
- [ ] ✓ NO fairness slider visible
- [ ] ✓ NO IntelHUD visible
- [ ] ✓ HUD controls functional
- [ ] ✓ Optimization triggers from HUD
- [ ] ✓ Route displays from store
- [ ] ✓ No console errors

### Logistics Page

- [ ] ✓ Page loads at /logistics
- [ ] ✓ Metrics bar displays 5 metrics
- [ ] ✓ Ranked incidents table populated
- [ ] ✓ Fairness slider renders
- [ ] ✓ α value displays (large purple)
- [ ] ✓ Slider moves smoothly
- [ ] ✓ Table re-ranks on slider move
- [ ] ✓ Debounced optimization works
- [ ] ✓ "OPTIMIZING" status appears
- [ ] ✓ Δ metrics show after 2nd run
- [ ] ✓ Force button works
- [ ] ✓ Glassmorphism styling applied
- [ ] ✓ No console errors

### Sidebar

- [ ] ✓ "Logistics" item visible
- [ ] ✓ Truck icon displays
- [ ] ✓ Active state highlights
- [ ] ✓ Navigation works
- [ ] ✓ Other routes intact

### Store Synchronization

- [ ] ✓ God-View → Logistics: Data syncs
- [ ] ✓ Logistics → God-View: Route syncs
- [ ] ✓ Alpha changes propagate
- [ ] ✓ Metrics stay consistent

---

## Demo Script

_For stakeholders:_

### 1. Show Clean God-View

**Say**: "This is our command center God-View. Notice it's clean and focused - just the map with incident overlays. No clutter."

### 2. Navigate to Logistics

**Say**: "When we need to control route optimization, we go to the dedicated Logistics page."

**Show**: Click "Logistics" in sidebar

### 3. Explain Fairness Slider

**Say**: "This is the fairness slider - alpha. At 0, we optimize pure efficiency: shortest route, fastest response. At 1, we optimize equity: everyone gets fair wait times."

**Show**: Point to large 0.50 value

### 4. Demonstrate Efficiency (α = 0.0)

**Action**: Move slider all the way left

**Say**: "Watch the table re-rank immediately. High severity incidents jump to the top. The system prioritizes saving the most lives with least travel time."

**Wait 1 second**

**Say**: "Now the backend is re-optimizing the route with efficiency focus. See the 'OPTIMIZING' indicator?"

**Show**: Top-right status changes

### 5. Demonstrate Equity (α = 1.0)

**Action**: Move slider all the way right

**Say**: "Now we're prioritizing equity. Incidents that would wait longest get priority, even if they're lower severity. This reduces wait disparity."

**Show**: Table re-ranks, different incidents at top

**Point out**: "See the Δ Distance? The route got 3.2 km longer - that's the cost of fairness. But look at Equity Variance - it dropped significantly."

### 6. Show Balanced (α = 0.5)

**Action**: Move slider to middle

**Say**: "In real operations, we typically run balanced mode. It's a practical compromise between speed and fairness."

### 7. Explain Metrics

**Point to top bar**:

- "Efficiency Score: How well we're using resources"
- "Equity Variance: Fairness measure - lower is better"
- "Distance: Total route length"
- "Δ Distance: How much changed vs previous - helps evaluate trade-offs"

### 8. Navigate Back to God-View

**Action**: Click "Dashboard" in sidebar

**Say**: "The optimized route persists across pages. Whatever we set in Logistics, the map displays. Single source of truth via our state store."

**Show**: Route still visible on map

---

## Formula Reference

### Priority Score

```
score = (1 - α) × efficiency + α × equity

where:
  efficiency = normalize(severity / wait_time)
  equity = normalize(wait_time)
  normalize = min-max scaling to [0, 1]
```

### Wait Time Proxy

```
waitProxy = (distance_to_nearest_idle_resource × 111km) / 40km/h × 60
          + (10 - severity) × 2

Units: minutes
```

### Delta ETA

```
deltaETA = (newDistance / 35) × 60 - (oldDistance / 35) × 60

Units: minutes
Assumption: 35 km/h average speed
```

---

## Troubleshooting

### Slider Moves But Table Doesn't Update

```
Problem: Store not triggering ranking
Fix: Check rankIncidents() is called in setAlpha
Debug: console.log(useOptimizationStore.getState().rankedIncidents)
```

### Optimization Doesn't Run

```
Problem: Debounce not working or no data
Fix: Check incidents/resources loaded
Debug: Check isOptimizing flag in store
```

### Metrics Show "—"

```
Problem: No optimization run yet
Expected: First load shows "—" for route/delta
Solution: Click "Force Re-Optimize" or move slider
```

### Deltas Always "—"

```
Problem: No previous route to compare
Expected: Shows "—" until 2nd optimization
Solution: Change α, wait for optimization, change again
```

### God-View Route Not Updating

```
Problem: Store not read correctly
Fix: Verify useOptimizationStore() in page.tsx
Debug: Check optimizedRoute value in store
```

---

## Performance Expectations

### Initial Page Load

```
Logistics page load: ~1-2 seconds
- Fetch scenario: ~200ms
- Rank incidents: <10ms
- Initial render: ~500ms
- Total: <2s
```

### Slider Interaction

```
Move slider: Immediate (0ms perceived)
UI update: <50ms
Debounce wait: 450ms
API call: ~300ms
Total: ~800ms from slider release
```

### Table Re-ranking

```
Score calculation: <10ms
Sort operation: <5ms
React re-render: <50ms
Animation: 300ms (staggered)
Total: ~365ms perceived
```

---

## Routes Summary

| URL             | Page               | Purpose            |
| --------------- | ------------------ | ------------------ |
| `/`             | God-View           | Map visualization  |
| `/truth-engine` | Truth Engine       | Intel feed + NLP   |
| `/logistics`    | Logistics Control  | α slider + ranking |
| `/shelters`     | Shelters (TBD)     | Future feature     |
| `/travel-guard` | Travel Guard (TBD) | Future feature     |
| `/settings`     | Settings (TBD)     | Future feature     |

---

## Next Steps After Testing

1. **Gather Feedback**: Test with stakeholders
2. **Performance Profile**: Measure FPS and latency
3. **Mobile Design**: Plan responsive layout
4. **Backend Enhancement**: Add α-aware routing algorithm
5. **Historical Tracking**: Store optimization history
6. **Export Feature**: CSV download for ranked incidents
7. **Visualization**: Chart showing efficiency vs equity curve

---

## Success Indicators

**If working correctly**:

- ✅ Moving slider left → high severity incidents rise
- ✅ Moving slider right → long-wait incidents rise
- ✅ Metrics update after each optimization
- ✅ Δ values show on second optimization
- ✅ Route appears on God-View map
- ✅ No console errors
- ✅ Smooth 60fps animations

**If NOT working**:

- ❌ Table doesn't re-rank
- ❌ Optimization never completes
- ❌ Metrics stuck at 0
- ❌ Console errors about store
- ❌ Route doesn't appear

---

**Open http://localhost:3000/logistics and test the fairness slider!** 🎛️

The Logistics Control page should provide full control over route optimization with visual feedback on efficiency vs equity trade-offs.
