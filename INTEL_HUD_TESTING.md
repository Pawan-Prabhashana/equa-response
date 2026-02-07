# Intel HUD - Quick Testing Guide

## Current Status

✅ **Frontend**: Should be running on http://localhost:3000  
✅ **TypeScript**: Compilation passing (exit code 0)  
✅ **Implementation**: Complete  
✅ **Dependencies**: Framer Motion installed

---

## Quick Visual Test

### 1. Open Application

```
Browser: http://localhost:3000
```

### 2. Locate Intel HUD

**Position**: Right side of screen (fixed panel)  
**Width**: 420px  
**Style**: Dark translucent glass with blue accents

---

## What You Should See

### Panel Header

```
┌─────────────────────────────────┐
│ TRUTH ENGINE FEED        3   2  │
│ LIVE INTEL STREAM               │
│ ✓ Verified  ✕ Rumor  ○ Unverified │
├─────────────────────────────────┤
```

### Feed Entries (streaming)

```
│ ✓  Gauge reading: 1.8m rising   │
│    (Kalutara Station).           │ [FLOOD]
│    23:45:12 · SENSOR · Kalutara  │
│    · CRITICAL · HIGH              │
├─────────────────────────────────┤
│ ○  Ado, water level wadi wenawa │
│    machan. Kalutara side godak...│ [FLOOD]
│    23:44:58 · SMS · Kalutara     │
│    · CRITICAL · MEDIUM            │
├─────────────────────────────────┤
│ ✕  Heard bridge gone kiala.     │
│    Not sure.                     │ [UNKNOWN]
│    23:44:23 · TWITTER · · MEDIUM │
│    · LOW                          │
└─────────────────────────────────┘
```

---

## Feature Checklist

### ✓ Visual Appearance

- [ ] Right panel visible with glass effect
- [ ] Dark translucent background
- [ ] Cyan neon accents
- [ ] Clean borders
- [ ] Header shows "TRUTH ENGINE FEED"
- [ ] Legend shows 3 status types
- [ ] Mini stats (verified/rumor counts)

### ✓ Live Streaming

- [ ] New reports appear every 2-4 seconds
- [ ] Smooth slide-in animation (from right)
- [ ] Feed auto-scrolls to top
- [ ] Maximum ~30 reports visible

### ✓ Status Icons

- [ ] ✓ Green circle for VERIFIED
- [ ] ✕ Red circle for RUMOR
- [ ] ○ Cyan circle for UNVERIFIED
- [ ] Icons clearly visible

### ✓ Report Cards

- [ ] Message text (2 lines max)
- [ ] Time stamp (HH:MM:SS format, monospace)
- [ ] Source (SMS/TWITTER/SENSOR/CALLCENTER)
- [ ] Location hint when available
- [ ] Severity (color-coded)
- [ ] Confidence level
- [ ] Hazard badge (right side)
- [ ] Trend arrow (↗ or ↘) when applicable

### ✓ Interactions

- [ ] Hover over card → background lightens
- [ ] Hover over card → border highlights
- [ ] Click card → expands/collapses (future)
- [ ] Smooth transitions

### ✓ Scrolling

- [ ] Auto-scrolls to top when new report arrives
- [ ] User can scroll up
- [ ] Doesn't auto-snap when user scrolling
- [ ] Custom scrollbar (thin, translucent)

### ✓ Singlish Parsing

Look for these specific messages:

1. **"Ado, water level wadi wenawa machan"**

   - Should detect: FLOOD
   - Trend: INCREASING
   - Confidence: MEDIUM

2. **"Hulanga godak maha! Trinco beach eke rel wadi"**

   - Should detect: CYCLONE
   - Severity: CRITICAL
   - Trend: INCREASING

3. **"Kandu passa enawa wage! Road blocked"**

   - Should detect: LANDSLIDE
   - Severity: HIGH

4. **"Gauge reading: X.Xm rising"**

   - Should be: VERIFIED (sensor source)
   - Confidence: HIGH

5. **"Heard bridge gone kiala. Not sure"**
   - Should be: RUMOR
   - Confidence: LOW

---

## Browser DevTools Checks

### Console (F12 → Console)

Should show:

```
✓ No red errors
✓ No React warnings
✓ Framer Motion loaded
✓ Reports streaming
```

### Network (F12 → Network)

Should show:

```
✓ No failed requests
✓ Map tiles loading
✓ API calls successful (if applicable)
```

### Performance (F12 → Performance)

Should show:

```
✓ Smooth 60 FPS
✓ No layout thrashing
✓ Animations GPU-accelerated
```

---

## Test Scenarios

### Scenario 1: Initial Load

1. Open page
2. Intel HUD should immediately populate with ~20 reports
3. Reports should be sorted by time (newest first)
4. Various status types should be visible

### Scenario 2: Live Streaming

1. Watch for 30 seconds
2. Should see 6-12 new reports appear
3. Each entry slides in smoothly
4. Old reports stay in place

### Scenario 3: Scroll Behavior

1. Scroll down to middle of feed
2. New reports arrive at top
3. Feed should NOT auto-scroll (you're not at top)
4. Scroll back to top
5. Next report should auto-scroll

### Scenario 4: Optimization Status

1. Click "OPTIMIZE" in left HUD
2. Bottom status bar should appear
3. Shows "ROUTE OPTIMIZATION IN PROGRESS"
4. Purple accent with pulse dot
5. Disappears when optimization completes

---

## Singlish Keywords to Look For

### Flood Terms

- watura, water, flood, ganga, wela, wessai, rain

### Landslide Terms

- kandu, landslide, mud, slope, pasa, gal, rocks

### Cyclone Terms

- hulanga, wind, cyclone, storm, surge, rel

### Trend Terms

- wadi wenawa (increasing)
- adu wenawa (decreasing)

### Severity Terms

- godak (critical)
- maha (major)
- kapala (danger)
- gamana ba (impassable)

### Confidence Terms

- **High**: sensor, gauge, mm, km/h, meter, official
- **Low**: heard, rumor, maybe, kiala, lu, not sure

---

## Color Reference

| Element           | Color   | Hex                     |
| ----------------- | ------- | ----------------------- |
| Verified Icon     | Emerald | `#10b981`               |
| Rumor Icon        | Red     | `#ef4444`               |
| Unverified Icon   | Cyan    | `#06b6d4`               |
| CRITICAL Severity | Red     | `#ef4444`               |
| HIGH Severity     | Orange  | `#fb923c`               |
| MEDIUM Severity   | Yellow  | `#fbbf24`               |
| LOW Severity      | Green   | `#10b981`               |
| Panel Background  | Slate   | `rgba(2,6,23,0.6)`      |
| Border            | White   | `rgba(255,255,255,0.1)` |
| Accent            | Cyan    | `#22d3ee`               |

---

## Expected Report Examples

### Example 1: SENSOR (Verified)

```
✓  Gauge reading: 1.8m rising (Kalutara Station). High alert.
   14:23:45 · SENSOR · Kalutara · CRITICAL · HIGH    [FLOOD]
```

### Example 2: SMS (Unverified)

```
○  Ado, water level wadi wenawa machan. Kalutara side godak danger.
   14:22:18 · SMS · Kalutara · CRITICAL · MEDIUM    [FLOOD]
```

### Example 3: TWITTER (Rumor)

```
✕  Heard bridge gone kiala. Not sure machan, just lu.
   14:21:03 · TWITTER · · MEDIUM · LOW    [UNKNOWN]
```

### Example 4: CALLCENTER (Verified)

```
✓  Landslide at Bulathsinhala slope. 3 houses buried. Critical!
   14:20:47 · CALLCENTER · Bulathsinhala · CRITICAL · HIGH    [LANDSLIDE]
```

---

## Troubleshooting

### Intel HUD Doesn't Appear

1. Check browser console for errors
2. Verify Framer Motion installed: `npm list framer-motion`
3. Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
4. Check if right panel div exists in DOM

### No Reports Streaming

1. Check console for interval errors
2. Verify `truthEngine.ts` is imported correctly
3. Check if `generateRandomReport()` function works

### Animations Not Smooth

1. Check if GPU acceleration enabled in browser
2. Verify Framer Motion version compatible
3. Check CPU usage (should be low)
4. Test in different browser

### Scrollbar Not Visible

1. Check if CSS classes applied: `scrollbar-thin`
2. Verify globals.css loaded
3. Try scrolling to see if it appears

### Singlish Not Parsing

1. Check `normalizeText()` function
2. Verify keyword arrays in truthEngine.ts
3. Test with simple example: `parseSinglishReport("water level rising")`

---

## Performance Targets

| Metric                 | Target  | Acceptable |
| ---------------------- | ------- | ---------- |
| Frame Rate             | 60 FPS  | 45+ FPS    |
| Load Time              | < 2s    | < 3s       |
| Report Entry Animation | 300ms   | 500ms      |
| Scroll Smoothness      | Buttery | Smooth     |
| Memory Usage           | < 100MB | < 150MB    |
| CPU Usage (idle)       | < 5%    | < 10%      |

---

## Integration Checks

### ✓ No Breaking Changes

- [ ] Sidebar still works
- [ ] Map still renders
- [ ] Left HUD controls functional
- [ ] Scenario switching works
- [ ] Optimization still works
- [ ] No layout conflicts

### ✓ Responsive Behavior

- [ ] Desktop (1920x1080): Panel visible, proper size
- [ ] Laptop (1366x768): Panel visible, might be tight
- [ ] Tablet: May need adjustments (future)
- [ ] Mobile: Hidden or collapsible (future)

---

## Success Criteria

Before marking complete:

- [ ] ✓ Intel HUD visible on right side
- [ ] ✓ Reports streaming every 2-4 seconds
- [ ] ✓ Status icons correct (✓ ✕ ○)
- [ ] ✓ Singlish parsing works
- [ ] ✓ Metadata displays correctly
- [ ] ✓ Animations smooth (60 FPS)
- [ ] ✓ Glassmorphism style applied
- [ ] ✓ No console errors
- [ ] ✓ Scrolling behavior correct
- [ ] ✓ No breaking changes to existing features

---

## Next Steps

After successful testing:

1. **Take Screenshots**: Capture Intel HUD in action
2. **Performance Profile**: Record FPS and memory
3. **Gather Feedback**: Show to team
4. **Plan Backend**: Design WebSocket integration
5. **Consider Mobile**: Collapsible panel design

---

**Open http://localhost:3000 and look for the right panel!** 🚀

The Intel HUD should be streaming live intelligence in Singlish with smooth animations and command-center styling.
