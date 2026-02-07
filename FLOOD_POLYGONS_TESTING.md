# Flood Risk Polygons - Visual Testing Guide

## Current Status

✅ **Frontend**: Running on http://localhost:3000  
✅ **Backend**: Running on http://localhost:8000  
✅ **TypeScript**: Compilation passing  
✅ **Implementation**: Complete

---

## Quick Test Steps

### 1. Open the Application

```
Browser: http://localhost:3000
```

### 2. Load Kalutara Flood Scenario

**Action**: Select "SIMULATION: 2017 FLOOD (KALUTARA)" from scenario dropdown in HUD

**Expected Result**:

- Map auto-zooms to Kalutara region
- **3 blue semi-transparent polygons appear**
- Each polygon pulses with different animation speed
- Existing features still visible (incidents, resources, ghost roads)

---

## What You Should See

### Visual Appearance

```
┌─────────────────────────────────────────┐
│  KALUTARA FLOOD SCENARIO MAP            │
├─────────────────────────────────────────┤
│                                          │
│    🟦 (pulsing blue - MODERATE)         │
│         0.8m depth                       │
│                                          │
│         🟦 (pulsing faster - HIGH)      │
│              1.6m depth                  │
│                                          │
│              🟦 (fastest pulse - EXTREME)│
│                   2.4m depth             │
│                                          │
│    🔴 Ghost Roads (dashed red lines)    │
│    🔵 Incidents (colored markers)        │
│    🟢 Resources (small markers)          │
│                                          │
└─────────────────────────────────────────┘
```

### Polygon #1: MODERATE Risk

- **Location**: Southern part of map (around lat 6.585)
- **Color**: Blue (`#3b82f6`)
- **Opacity**: ~16% fill, semi-transparent
- **Animation**: Slow pulse (2.6 second cycle)
- **Tooltip**: "FLOOD DEPTH: 0.8m | RISK: MODERATE"

### Polygon #2: HIGH Risk

- **Location**: Central area (around lat 6.605)
- **Color**: Blue (same as above)
- **Opacity**: ~22% fill, slightly more visible
- **Animation**: Medium pulse (2.4 second cycle)
- **Tooltip**: "FLOOD DEPTH: 1.6m | RISK: HIGH"

### Polygon #3: EXTREME Risk

- **Location**: Northern zone (around lat 6.625)
- **Color**: Blue (same as above)
- **Opacity**: ~28% fill, most visible
- **Animation**: Fast pulse (2.2 second cycle)
- **Tooltip**: "FLOOD DEPTH: 2.4m | RISK: EXTREME"

---

## Detailed Checks

### ✓ Polygon Rendering

- [ ] 3 blue polygons visible
- [ ] Polygons are semi-transparent (can see map underneath)
- [ ] Each polygon has a subtle blue glow effect
- [ ] Polygons have clean borders (2px stroke)

### ✓ Pulse Animation

- [ ] All polygons pulse (opacity changes)
- [ ] EXTREME polygon pulses fastest
- [ ] MODERATE polygon pulses slowest
- [ ] Animation is smooth (no jank)
- [ ] Pulse is subtle, not jarring

### ✓ Tooltips

- [ ] Hover over polygon → tooltip appears
- [ ] Tooltip shows: "FLOOD DEPTH: X.Xm"
- [ ] Tooltip shows: "RISK: [MODERATE/HIGH/EXTREME]"
- [ ] Tooltip shows: "Kalutara Basin Model"
- [ ] Tooltip has dark background with blue border

### ✓ Integration

- [ ] Existing ghost roads still visible (2 red dashed lines)
- [ ] Existing incidents still visible (4 markers)
- [ ] Existing resources still visible (5 markers)
- [ ] Map auto-zooms to fit all features
- [ ] Sidebar navigation unchanged

### ✓ Scenario Switching

- [ ] Switch to Trinco scenario → no flood polygons (expected)
- [ ] Switch back to Kalutara → flood polygons reappear
- [ ] Trinco still has cyclone cone (yellow polygon)

---

## Performance Checks

### Browser DevTools (F12)

#### Console Tab

Should show:

```
✓ No red errors
✓ No warnings (except Fast Refresh during development)
✓ API calls successful (200 status)
```

#### Performance Tab

- [ ] Page load < 3 seconds
- [ ] Smooth animations (60 FPS target)
- [ ] No memory leaks
- [ ] CPU usage reasonable

#### Network Tab

- [ ] Scenario API call includes flood_polygons
- [ ] Response size reasonable (~10-20KB for scenario)
- [ ] Tiles loading efficiently

---

## API Verification

### Check Raw Data

```bash
curl -s http://localhost:8000/scenarios/kalutara_flood_2017 | \
  python -m json.tool | \
  grep -A 25 "flood_polygons"
```

**Expected Output**:

```json
"flood_polygons": [
  {
    "id": "kalutara_depth_01",
    "depth_m": 0.8,
    "risk": "MODERATE",
    "polygon": [[6.585, 79.96], ...]
  },
  ...
]
```

---

## Visual Comparison

### Before (Part 1)

- Ghost Roads: ✓
- Cyclone Cone: ✓
- Flood Polygons: ✗

### After (Part 2)

- Ghost Roads: ✓ (unchanged)
- Cyclone Cone: ✓ (unchanged)
- **Flood Polygons: ✓ (NEW)**

---

## Troubleshooting

### Polygons Don't Appear

1. Check browser console for errors
2. Verify scenario is Kalutara (not Trinco)
3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. Check Network tab → scenario response includes flood_polygons
5. Check if map auto-zoomed correctly

### Animations Not Working

1. Check if CSS loaded (DevTools → Styles → search "floodPulse")
2. Verify browser supports CSS animations
3. Check if hardware acceleration enabled
4. Try different browser

### Tooltips Don't Show

1. Hover directly over polygon (not edge)
2. Check if Leaflet tooltip CSS loaded
3. Wait 1-2 seconds (tooltip delay)
4. Try clicking instead of hovering

### Performance Issues

1. Check CPU usage (DevTools → Performance)
2. Disable browser extensions
3. Close other tabs
4. Check if too many other markers rendering

---

## Expected Behavior Summary

| Feature        | Kalutara Scenario | Trinco Scenario |
| -------------- | ----------------- | --------------- |
| Flood Polygons | ✓ (3 zones)       | ✗ (none)        |
| Ghost Roads    | ✓ (2 roads)       | ✓ (1 road)      |
| Cyclone Cone   | ✗ (none)          | ✓ (1 cone)      |
| Incidents      | ✓ (4)             | ✓ (2)           |
| Resources      | ✓ (5)             | ✓ (2)           |

---

## Screenshot Checklist

Capture these views for documentation:

1. **Full Kalutara map** with all 3 flood polygons visible
2. **Close-up of EXTREME polygon** showing deep blue + pulse
3. **Tooltip hover** showing depth + risk + model name
4. **Multi-layer view** showing flood polygons + ghost roads + incidents together
5. **Trinco scenario** showing no flood polygons (expected)

---

## Success Criteria

Before marking as complete, verify ALL of these:

- [ ] ✓ 3 flood polygons render for Kalutara scenario
- [ ] ✓ Polygons are blue with correct opacity levels
- [ ] ✓ Pulse animations work (different speeds per risk)
- [ ] ✓ Tooltips show depth + risk on hover
- [ ] ✓ Map auto-zooms to include flood zones
- [ ] ✓ No console errors
- [ ] ✓ TypeScript compilation passes
- [ ] ✓ No breaking changes to existing features
- [ ] ✓ Sidebar navigation intact
- [ ] ✓ Backend serves correct data
- [ ] ✓ Frontend receives and renders data
- [ ] ✓ Performance acceptable (smooth 60fps)

---

## Demo Script

_For showing to stakeholders:_

1. **Open Kalutara scenario**  
   "This is the 2017 Kalutara flood. Notice the blue zones appearing on the map."

2. **Point out depth zones**  
   "We have three flood risk zones. The lightest blue is 0.8 meters - hazardous for vehicles. The medium blue is 1.6 meters - evacuation recommended. The darkest blue is 2.4 meters - life-threatening."

3. **Show pulse animation**  
   "Notice how the most dangerous zone pulses faster? Visual urgency cues help responders prioritize."

4. **Hover for details**  
   "Each zone shows precise depth from our basin model. Hover anywhere to see exact measurements."

5. **Show integration**  
   "These flood zones work alongside blocked roads, incidents, and resources. Responders see the complete picture: where water is deepest, which roads are cut off, where people need help."

6. **Switch scenarios**  
   "Watch what happens when we switch to the Trinco cyclone... no flood zones appear because this is a wind event, not a flood. The system only shows relevant data."

7. **Command center aesthetic**  
   "Semi-transparent blue with subtle pulse - professional NASA-style visualization. This is a tactical tool, not a consumer weather app."

---

## Next Actions

After successful testing:

1. **Document Issues**: Note any bugs or visual glitches
2. **Gather Feedback**: Show to team, get input
3. **Performance Baseline**: Record FPS and load times
4. **Prepare Demo**: Practice demo script above
5. **Plan Part 3**: Discuss next geospatial layer (evacuation zones? wind fields?)

---

**Implementation Complete** ✓  
**Ready for Manual Testing** ✓  
**All Servers Running** ✓

Open http://localhost:3000 and explore! 🚀
