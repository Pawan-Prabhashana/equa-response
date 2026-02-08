# Digital Twin Simulator - Quick Testing Guide

## Current Status

✅ **TypeScript**: Compilation passing  
✅ **Data**: 8 frames added to Trinco scenario  
✅ **Store**: Extended with twin state  
✅ **Page**: Digital Twin simulator created  
✅ **Frontend**: Running on http://localhost:3000  
✅ **Backend**: Running on http://localhost:8000

---

## Quick 5-Minute Test

### Test 1: Navigate to Digital Twin (1 min)

```
1. Open: http://localhost:3000/
2. Look at sidebar (left)
3. Find "Digital Twin" with Layers icon
4. Should be between "Shelters" and "Travel-Guard"
5. Click "Digital Twin"
6. URL changes to: /digital-twin
7. Page loads with map and timeline scrubber
```

**Expected**: Page loads independently (no God-View visit needed)

---

### Test 2: Verify Scenario Auto-Selection (30 sec)

```
Check top-right dropdown:
- Should show "SIMULATION: 2024 CYCLONE (TRINCO)" selected
- Other scenarios should say "(No Digital Twin)"

Check header info:
- Frame: 1 / 8
- Time: T-3h
- Sim Time: 00:00 + 0min
```

**Expected**: Trinco selected, starting at frame 0

---

### Test 3: Verify Initial Map State (1 min)

```
At T-3h, map should show:
✓ 1 incident marker (early warning)
✓ Cyclone cone (yellow polygon) offshore to north
✓ 0 ghost roads (no closures yet)
✓ 2 shelter pins (green, low occupancy)

Frame summary panel (top-right):
✓ Incidents: 1 (0 critical)
✓ Shelters at Risk: 0
✓ Roads Blocked: 0
✓ Hazard Status: ⚠️ APPROACHING
```

**Expected**: Early warning state, minimal hazards

---

### Test 4: Timeline Scrubbing (2 min)

**Manual Scrub to Landfall**:

```
1. Look at bottom timeline scrubber
2. See frame labels: T-3h, T-2.5h, T-2h, T-1h, T-0, T+30m, T+1h, T+2h
3. Drag slider to middle (frame 4 = T-0 LANDFALL)
4. Map updates instantly
```

**At T-0 (LANDFALL), verify**:

```
✓ 5 incident markers (wind, flood, landslide, tourist, need)
✓ Cyclone cone moved inland (over Trincomalee)
✓ 3 ghost roads (red dashed lines - blocked)
✓ 1 flood polygon (blue, pulsing - storm surge)
✓ 2 shelter pins (red/yellow - high occupancy)

Frame summary:
✓ Incidents: 5 (3 critical)
✓ Shelters at Risk: 2
✓ Roads Blocked: 3
✓ Hazard Status: 🔴 CYCLONE LANDFALL
```

**Expected**: Peak impact state, maximum hazards

---

### Test 5: Playback Controls (2 min)

**Play Button**:

```
1. Reset to frame 0 (drag slider all the way left)
2. Click Play button (▶)
3. Watch frames advance automatically
4. Each frame changes every 1 second
5. Observe:
   - Cyclone cone moving inland
   - Incidents appearing
   - Ghost roads appearing
   - Flood zones expanding
   - Shelters filling up
6. At frame 7, loops back to frame 0
```

**Pause Button**:

```
1. While playing, click Pause (⏸)
2. Playback stops
3. Current frame frozen
```

**Step Controls**:

```
1. Click ◀ Previous
   - Goes back one frame
   - Disabled at frame 0
2. Click ▶ Next
   - Goes forward one frame
   - Disabled at frame 7
```

**Expected**: Smooth playback, all controls work

---

### Test 6: Speed Control (30 sec)

```
1. Set to frame 0
2. Select "0.5×" speed
3. Click Play
4. Frames advance every 2 seconds (slower)

5. Select "2.0×" speed
6. Frames advance every 0.5 seconds (faster)

7. Select "1.0×" speed (default)
8. Frames advance every 1 second (normal)
```

**Expected**: Speed control affects playback rate

---

## Detailed Frame Verification

### Frame 0: T-3h (Early Warning)

```
Incidents: 1
- "Tropical depression forming offshore. Wind speed 55km/h."

Cyclone Cone: Large, offshore (north)
Ghost Roads: 0
Flood Polygons: 0
Shelters:
- Trinco Sports Complex: 120 / 800 (15%)
- Nilaveli Hall: 80 / 300 (27%)
```

### Frame 2: T-2h (Warning Issued)

```
Incidents: 3
- Cyclone warning
- Pigeon Island tourists rescue
- 200+ families need evacuation

Cyclone Cone: Moving closer
Ghost Roads: 1 (coastal A9 high winds)
Flood Polygons: 0
Shelters: 380/800, 230/300 (filling)
```

### Frame 4: T-0 (LANDFALL) ⚠️

```
Incidents: 5 ← CRITICAL FRAME
- Category 1 landfall 120km/h
- Power grid offline
- Pigeon Island boat CAPSIZED
- MAJOR LANDSLIDE (5 houses buried)
- Storm surge flooding

Cyclone Cone: Directly over Trincomalee
Ghost Roads: 3 (impassable)
Flood Polygons: 1 (1.2m depth HIGH risk)
Shelters: 750/800 (94%), 300/300 (100% FULL)

Hazard Status: 🔴 CYCLONE LANDFALL
```

### Frame 7: T+2h (Recovery)

```
Incidents: 5
- Wind dissipating 55km/h
- Damage: 100+ buildings
- Medical teams needed
- Landslide 50% cleared
- Flood receded

Cyclone Cone: Small, moving away
Ghost Roads: 2 (partial access)
Flood Polygons: 1 (0.5m, receding)
Shelters: 780/800, 285/300 (people leaving)

Hazard Status: ✓ POST-IMPACT RECOVERY
```

---

## Visual Quality Checks

### Timeline Scrubber

- [ ] Gradient background: yellow → red → green
- [ ] Cyan thumb marker (5px circle)
- [ ] Frame labels below (9px font)
- [ ] Active frame in cyan (bright)
- [ ] Inactive frames in slate-600 (dim)

### Playback Controls

- [ ] Previous/Next buttons slate-800
- [ ] Play/Pause button cyan glow
- [ ] Disabled buttons 30% opacity
- [ ] Smooth hover effects

### Map Updates

- [ ] Instant (no lag) on scrub
- [ ] Smooth transitions during playback
- [ ] Cyclone cone moves progressively
- [ ] Flood zones pulse
- [ ] Ghost roads dashed red
- [ ] Shelters color-coded

### Frame Summary Panel

- [ ] Glassmorphism background
- [ ] Real-time stat updates
- [ ] Color-coded status
- [ ] Hazard status emoji

---

## Edge Cases to Test

### No Digital Twin Scenario

```
1. Select "SIMULATION: 2017 FLOOD (KALUTARA)" from dropdown
2. Expected: Map shows message "No digital twin data available"
3. Timeline scrubber should be hidden
```

### Rapid Scrubbing

```
1. Drag slider back and forth rapidly 10 times
2. Expected: Map keeps up, no crashes
3. Frame summary updates correctly
```

### Loop Behavior

```
1. Let playback reach frame 7 (last frame)
2. Expected: Auto-loops back to frame 0
3. Continues playing seamlessly
```

---

## Browser DevTools Checks

### Console (F12 → Console)

```
✓ No red errors
✓ No React warnings
✓ Optional: Frame switch logs
```

### Network (F12 → Network)

```
✓ GET /scenarios (list)
✓ GET /scenarios/trinco_cyclone_2024
✓ 200 status on all requests
✓ digital_twin object in response
```

### Performance

```
✓ Frame switch < 50ms
✓ Playback smooth 60fps
✓ No memory leaks during extended play
```

---

## Comparison Test: God-View vs Digital Twin

**God-View (/)**:

```
- Shows CURRENT state only
- Static snapshot
- Includes resources + route optimization
- HUD controls for scenario selection
```

**Digital Twin (/digital-twin)**:

```
- Shows TIME SERIES (8 frames)
- Dynamic playback
- No resources (focus on hazard evolution)
- Timeline scrubber + playback controls
```

**Expected**: Two distinct experiences, no overlap

---

## Known Issues / Expected Behavior

### Expected (Not Bugs)

- ✓ Only Trinco has digital twin (Kalutara shows "No Digital Twin")
- ✓ Auto-loops after last frame (intentional)
- ✓ No resources shown (twin focuses on hazards)
- ✓ Frame labels slightly cramped (8 frames in small space)

### Should NOT Happen (Report if Seen)

- ❌ Timeline scrubber not visible
- ❌ Map doesn't update on frame change
- ❌ Play button doesn't advance frames
- ❌ Console errors about frame data
- ❌ Cyclone cone doesn't move

---

## Success Indicators

**If working correctly**:

- ✅ Timeline scrubber visible at bottom
- ✅ Dragging slider updates map instantly
- ✅ Play button advances frames automatically
- ✅ Cyclone cone moves across map
- ✅ Incidents appear and change
- ✅ Shelters fill up from green → yellow → red
- ✅ Frame summary updates with each frame
- ✅ No console errors

**If NOT working**:

- ❌ No timeline visible
- ❌ Map static when scrubbing
- ❌ Play button doesn't work
- ❌ Cyclone cone doesn't move
- ❌ Console errors

---

## Demo Flow (for Stakeholders)

### 1. Introduction

**Say**: "This is our Digital Twin - a time machine that lets us replay disaster scenarios frame by frame."

**Show**: Digital Twin page with T-3h frame

### 2. Show Timeline

**Say**: "We have 8 snapshots from 3 hours before landfall to 2 hours after. Each shows how the disaster evolved."

**Action**: Point to frame labels: T-3h through T+2h

### 3. Manual Scrubbing

**Say**: "We can jump to any moment. Let's go to landfall..."

**Action**: Drag slider to T-0

**Say**: "Look - Category 1 cyclone, 5 major incidents, 3 roads blocked, storm surge flooding, shelters nearly full."

### 4. Playback

**Say**: "Or we can watch it unfold in real-time..."

**Action**: Reset to T-3h, click Play

**Say**: "Watch the cyclone move inland. See the cone tracking westward. Incidents appearing. Roads closing. Flood zones expanding. Shelters filling up."

**Action**: Let play through to T+2h

### 5. Analysis

**Say**: "After landfall, we enter recovery. The cyclone dissipates, floods recede, but damage is extensive."

**Action**: Point to frame summary at T+2h

**Say**: "100+ buildings damaged, medical teams needed, cleanup underway. The twin helps us understand the complete disaster lifecycle."

---

## Troubleshooting

### Timeline Not Visible

```
Problem: Bottom scrubber missing
Check:
1. Is scenario selected?
2. Does it have digital_twin?
3. Console shows frames loaded?

Debug:
console.log(useOptimizationStore.getState().digitalTwin)
// Should show object with 8 frames
```

### Map Not Updating

```
Problem: Scrubbing doesn't change map
Check:
1. Is activeFrame calculating correctly?
2. Is MainMap receiving frame data?

Debug:
console.log(activeFrame)
// Should show current frame object
```

### Play Not Working

```
Problem: Play button doesn't advance
Check:
1. Is isPlaying true?
2. Is interval running?

Debug:
console.log('Playing:', isPlaying)
// Should toggle on Play/Pause
```

---

## Test Results Template

```
Date: ___________
Tester: ___________

[ ] Basic navigation to /digital-twin works
[ ] Scenario auto-selected (Trinco)
[ ] 8 frames loaded
[ ] Initial map state correct (T-3h)
[ ] Scrubbing to T-0 shows landfall
[ ] Play button advances frames
[ ] Pause stops playback
[ ] Previous/Next buttons work
[ ] Speed control (0.5x, 1x, 2x) works
[ ] Frame summary updates correctly
[ ] Cyclone cone moves across map
[ ] No console errors

Issues found:
_________________________________
_________________________________

Overall: ☐ Pass  ☐ Fail  ☐ Needs Review
```

---

**Status**: READY FOR TESTING 🕐  
**Build**: PASSING ✅  
**Servers**: RUNNING ✅

**Open http://localhost:3000/digital-twin to test time-travel simulation!**
