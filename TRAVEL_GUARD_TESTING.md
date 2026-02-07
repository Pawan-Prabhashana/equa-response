# Travel-Guard Testing Guide

## Quick Start

**URL**: http://localhost:3000/travel-guard

**Prerequisites**:

- Frontend running on port 3000
- Backend running on port 8000
- Scenario: "Trinco Cyclone 2024"

---

## Test Cases

### TEST 1: Basic Location Resolution (Zone Name)

**Steps**:

1. Open Travel-Guard page
2. Type "Nilaveli" in location input
3. Keep language as EN (English)
4. Click "GENERATE SAFE CORRIDOR"

**Expected Results**:

- ✓ Resolved location: `8.6850, 81.1900`
- ✓ Resolved name: "Nilaveli Beach"
- ✓ Risk level: **CRITICAL** (red card)
- ✓ Risk reasons include:
  - "Inside Cyclone Cone of Uncertainty"
  - "Storm Surge Zone (Coastal Area)"
  - "COMPOUND RISK: Cyclone + Coastal Location"
- ✓ Destination: "Bandaranaike Airport (CMB)"
- ✓ Distance: ~245 km
- ✓ Time: ~4.1 hours
- ✓ Map shows:
  - Green pulsing circle at Nilaveli
  - Cyan circle at CMB Airport
  - Green dashed corridor connecting them
  - Yellow cyclone cone overlay
- ✓ 3 alert cards appear (Main warning, Corridor route, Hotel advisory)

**Screenshot Checkpoints**:

- [ ] Tourist marker visible
- [ ] Corridor line visible
- [ ] Alerts are red/yellow themed (CRITICAL)

---

### TEST 2: Coordinate Input

**Steps**:

1. Clear location input
2. Type `8.57,81.23` (Trincomalee town coordinates)
3. Click "GENERATE SAFE CORRIDOR"

**Expected Results**:

- ✓ Resolved location: `8.5700, 81.2300`
- ✓ Resolved name: "Custom Location (8.570, 81.230)"
- ✓ Risk level: **HIGH** (orange card)
- ✓ Risk reasons: "Inside Cyclone Cone of Uncertainty"
- ✓ Corridor: Generated (3 waypoints, inland bend)
- ✓ No hotel advisory (not a known zone)

**Edge Cases to Test**:

- [ ] Input `8.68,81.19` → Should parse correctly
- [ ] Input `8.68, 81.19` (with space) → Should parse correctly
- [ ] Input `invalid` → Should fallback to first zone

---

### TEST 3: Language Switching (English → German)

**Steps**:

1. Input "Nilaveli Beach"
2. Select **DE (Deutsch)**
3. Click "GENERATE SAFE CORRIDOR"

**Expected Results**:

- ✓ Alert 1 title: "⚠️ KRITISCHE WARNUNG: Sofortige Evakuierung Erforderlich"
- ✓ Alert 1 body: German translation
  - "Ihr Standort (Nilaveli Beach) wurde als CRITICAL RISIKO bewertet."
  - "Erkannte Gefahren:"
  - "EMPFOHLENE MASSNAHME: Evakuieren Sie nach..."
- ✓ Alert 2 title: "🛣️ Sichere Korridor-Route"
- ✓ Alert 2 body: German translation
  - "Fahren Sie nach Bandaranaike Airport (CMB)"
  - "Route vermeidet:"
  - "Entfernung:", "Geschätzte Zeit:"

**Validation**:

- [ ] No English text in alerts
- [ ] German umlauts display correctly
- [ ] "MASSNAHME" (not "MASSNAHME") in text

---

### TEST 4: Language Switching (English → Sinhala)

**Steps**:

1. Input "Pigeon Island"
2. Select **SI (සිංහල)**
3. Click "GENERATE SAFE CORRIDOR"

**Expected Results**:

- ✓ Alert 1 title: "⚠️ තීරණාත්මක අනතුර: වහාම ඉවත්වන්න"
- ✓ Alert 1 body: Sinhala translation
  - "ඔබේ ස්ථානය (Pigeon Island) CRITICAL අවදානම ලෙස තක්සේරු කර ඇත."
  - "හදුනාගත් අනතුරු:"
  - "නිර්දේශිත ක්‍රියාමාර්ගය:"
- ✓ Alert 2 title: "🛣️ ආරක්ෂිත මාර්ගය"
- ✓ Sinhala characters render correctly

**Known Limitation**: Sinhala is basic, may include English keywords in hazard descriptions.

---

### TEST 5: Fuzzy Zone Matching

**Input Variations**:

| Input            | Expected Match    | Resolved Name    |
| ---------------- | ----------------- | ---------------- |
| `nilaveli`       | zone_nilaveli     | Nilaveli Beach   |
| `NILAVELI BEACH` | zone_nilaveli     | Nilaveli Beach   |
| `pigeon`         | zone_pigeonisland | Pigeon Island    |
| `trinco`         | zone_trinco_town  | Trincomalee Town |
| `uppuveli`       | zone_uppuveli     | Uppuveli Beach   |

**Steps**:

1. Try each input above
2. Verify resolved location matches expected zone center

**Validation**:

- [ ] Case-insensitive matching works
- [ ] Partial matches work
- [ ] No typos crash the system

---

### TEST 6: Risk Level Variations

Test different locations to verify risk levels:

| Location         | Expected Risk | Reason                 |
| ---------------- | ------------- | ---------------------- |
| Nilaveli Beach   | CRITICAL      | Cyclone cone + coastal |
| Trincomalee Town | HIGH          | Inside cyclone cone    |
| Uppuveli Beach   | CRITICAL      | Cyclone cone + coastal |
| Pigeon Island    | CRITICAL      | Cyclone cone + coastal |
| (Outside cone)   | LOW/MEDIUM    | No immediate hazards   |

**Steps**:

1. Input each location
2. Verify risk level color:
   - CRITICAL = red card
   - HIGH = orange card
   - MEDIUM = yellow card
   - LOW = green card

---

### TEST 7: Corridor Pre-Defined vs Generated

**Pre-defined Corridors** (from scenarios.json):

- Nilaveli → CMB Airport: Should have 7 waypoints
- Trincomalee → Kandy: Should have 6 waypoints
- Pigeon Island → Dambulla: Should have 5 waypoints

**Generated Corridors**:

- Any custom coordinates: Should have 3 waypoints (start, mid, end)
- Mid waypoint should be west of start (inland bend)

**Steps**:

1. Input "Nilaveli Beach" → Check if corridor follows pre-defined path
2. Input "8.70,81.20" (custom) → Check if corridor is simple 3-point

**Validation**:

- [ ] Pre-defined corridors show detailed paths
- [ ] Generated corridors have inland bend

---

### TEST 8: Map Visualization

**Layers to Verify**:

1. **Cyclone Cone**:

   - [ ] Yellow polygon visible
   - [ ] Covers Trincomalee/Nilaveli area
   - [ ] Centerline visible

2. **Tourist Marker**:

   - [ ] Green circle at resolved location
   - [ ] Pulsing animation
   - [ ] Popup shows "📍 YOUR LOCATION"

3. **Destination Marker**:

   - [ ] Cyan circle at destination
   - [ ] Popup shows "✈️ SAFE DESTINATION"

4. **Corridor Polyline**:

   - [ ] Green dashed line
   - [ ] Connects tourist to destination
   - [ ] Glow effect visible
   - [ ] Tooltip on hover: "SAFE CORRIDOR"

5. **Flood Polygons** (if present):

   - [ ] Blue pulsing polygons
   - [ ] Tooltip shows depth

6. **Ghost Roads** (if present):
   - [ ] Red dashed lines
   - [ ] Tooltip shows hazard

**Map Behavior**:

- [ ] Map centers on tourist location after generation
- [ ] Zoom fits full corridor
- [ ] Can pan/zoom map
- [ ] Coordinate display in bottom right

---

### TEST 9: Alert Card Styling

**Color Coding**:

| Severity | Background  | Border     | Expected Usage                 |
| -------- | ----------- | ---------- | ------------------------------ |
| ALERT    | Red dark    | Red 50%    | Main warning (CRITICAL/HIGH)   |
| WARN     | Yellow dark | Yellow 50% | Caution (MEDIUM)               |
| INFO     | Cyan dark   | Cyan 50%   | Corridor route, hotel advisory |

**Animation**:

- [ ] Cards fade in (opacity 0 → 1)
- [ ] Cards slide in from right (x: 20 → 0)
- [ ] Staggered delay (0.1s per card)

**Content**:

- [ ] Title uses emojis (⚠️, 🛣️, 🏨)
- [ ] Body text is pre-formatted (line breaks preserved)
- [ ] Footer shows language + severity

---

### TEST 10: Distance & Time Calculation

**Test Route**: Nilaveli Beach → CMB Airport

**Expected**:

- Distance: ~245 km (calculated via Haversine)
- Time: ~4.1 hours (@ 60 km/h average)

**Validation**:

1. Check "Route Info" card in left panel
2. Check "🛣️ Safe Corridor Route" alert card
3. Both should show same distance/time

**Math Check**:

```
Distance = sum(haversine(waypoint[i], waypoint[i+1]))
Time = distance / 60 km/h
```

---

### TEST 11: Empty State

**Steps**:

1. Open Travel-Guard page
2. Do NOT generate corridor

**Expected**:

- ✓ Right panel shows:
  - Shield icon (48px, gray)
  - "No alerts generated"
  - Instructions text

**Actions**:

- [ ] No errors in console
- [ ] No markers on map
- [ ] Left panel form is empty

---

### TEST 12: Processing State

**Steps**:

1. Input "Nilaveli Beach"
2. Click "GENERATE SAFE CORRIDOR"
3. Observe button during 400ms delay

**Expected**:

- ✓ Button text changes: "GENERATE..." → "PROCESSING..."
- ✓ Button disabled during processing
- ✓ Button returns to enabled after
- ✓ No double-click issues

---

### TEST 13: Scenario Switching

**Steps**:

1. Generate corridor for Nilaveli (Trinco scenario)
2. Change scenario dropdown to "Kalutara Flood 2017"
3. Try to generate corridor

**Expected**:

- ✓ Alert: "This scenario doesn't have Travel-Guard configuration"
- ✓ No crash
- ✓ Previous result clears

**Note**: Only Trinco scenario has travel_guard config.

---

### TEST 14: Headcount (Optional Field)

**Steps**:

1. Input location
2. Enter headcount: `12`
3. Generate corridor

**Expected**:

- ✓ No errors
- ✓ Headcount is informational only (doesn't affect route)
- ✓ Can leave blank

**Future Use**: Could affect destination capacity planning.

---

### TEST 15: Navigation & State Persistence

**Steps**:

1. Generate corridor for Nilaveli
2. Navigate to God-View (`/`)
3. Navigate back to Travel-Guard

**Expected**:

- ✓ Previous result is cleared (fresh state)
- ✓ Form is reset
- ✓ Map shows default scenario center

**No Global State**: Travel-Guard state is local to page.

---

## Edge Cases

### Edge Case 1: Invalid Coordinates

**Input**: `abc,def`
**Expected**: Fallback to first zone

### Edge Case 2: Empty Location

**Input**: (blank)
**Expected**: Button disabled

### Edge Case 3: Very Long Zone Name

**Input**: `supercalifragilisticexpialidociousbeachzone`
**Expected**: No match, fallback to first zone

### Edge Case 4: Coordinates Outside Map

**Input**: `0,0` (Gulf of Guinea)
**Expected**:

- No crash
- Risk: LOW (no hazards at that location)
- Corridor generates

### Edge Case 5: Negative Coordinates

**Input**: `-8.57,-81.23`
**Expected**: Valid coordinates (Southern Hemisphere, West of Prime Meridian)

---

## Performance Benchmarks

| Operation           | Target  | Measured |
| ------------------- | ------- | -------- |
| Page load           | < 2s    | ?        |
| Location resolution | < 10ms  | ?        |
| Risk assessment     | < 20ms  | ?        |
| Corridor generation | < 10ms  | ?        |
| Total processing    | < 500ms | ?        |
| Map render          | < 500ms | ?        |

**How to Measure**: Open DevTools → Performance tab → Record during corridor generation.

---

## Browser Compatibility

| Browser | Version | Status        |
| ------- | ------- | ------------- |
| Chrome  | 90+     | ✓ Primary     |
| Firefox | 88+     | ✓ Tested      |
| Safari  | 14+     | ? Check       |
| Edge    | 90+     | ✓ Should work |

**Known Issues**:

- Leaflet requires modern JS (ES6+)
- CSS animations use modern syntax

---

## Accessibility

### Keyboard Navigation

- [ ] Tab through form fields
- [ ] Enter key submits form
- [ ] Esc key closes popups

### Screen Reader

- [ ] Form labels are readable
- [ ] Alert cards are announced
- [ ] Map is navigable (Leaflet a11y)

### Color Blindness

- [ ] Risk levels use both color + text
- [ ] Corridor uses pattern (dashed) + color

---

## Mobile Testing

**Not Optimized Yet**: Layout is desktop-first.

**Expected Issues**:

- 3-column layout may overflow on mobile
- Map controls may be small
- Alert cards may stack

**Future Enhancement**: Responsive design needed.

---

## Console Checks

**No Errors Expected**:

- [ ] No TypeScript errors
- [ ] No Leaflet hydration warnings
- [ ] No 404s (API calls)
- [ ] No CORS errors

**Warning OK**:

- Leaflet attribution warnings (cosmetic)

---

## Regression Testing

Ensure PART 7 didn't break existing pages:

| Page         | URL             | Check                   |
| ------------ | --------------- | ----------------------- |
| God-View     | `/`             | Map + HUD loads         |
| Logistics    | `/logistics`    | Slider + table works    |
| Truth Engine | `/truth-engine` | Feed scrolls            |
| Shelters     | `/shelters`     | Table + filters work    |
| Digital Twin | `/digital-twin` | Timeline scrubber works |

**No Shared State**: Travel-Guard is isolated.

---

## API Testing

### GET /scenarios

**Expected**: Returns list including `trinco_cyclone_2024`

### GET /scenarios/trinco_cyclone_2024

**Expected**: Returns scenario with `travel_guard` object

**Verify travel_guard structure**:

```json
{
  "travel_guard": {
    "tourist_zones": [...]  // Array of 4 zones
    "safe_destinations": [...]  // Array of 4 destinations
    "green_corridors": [...]  // Array of 3 pre-defined routes
  }
}
```

---

## TypeScript Validation

```bash
cd equa-response-web
npx tsc --noEmit
```

**Expected**: Exit code 0 (no errors)

---

## Success Criteria Checklist

### Functionality

- [ ] Location input accepts zone names
- [ ] Location input accepts coordinates
- [ ] Language selector switches alerts
- [ ] Corridor generates correctly
- [ ] Map shows markers + polyline
- [ ] Risk assessment logic works
- [ ] Distance/time calculated

### UI/UX

- [ ] Glassmorphism styling consistent
- [ ] Animations smooth
- [ ] Color coding correct
- [ ] Responsive to interactions
- [ ] No layout shift

### Data

- [ ] travel_guard config loaded
- [ ] Zones resolve correctly
- [ ] Corridors match config
- [ ] Risk reasons accurate

### Performance

- [ ] Page loads < 2s
- [ ] Generation < 500ms
- [ ] No memory leaks
- [ ] Map renders smoothly

### Code Quality

- [ ] TypeScript passes
- [ ] No console errors
- [ ] No linter warnings
- [ ] Documentation complete

---

## Known Issues

### Issue 1: Simplified Sinhala

**Description**: Sinhala translations are basic, some English keywords remain.
**Severity**: Low
**Workaround**: Professional translation recommended for production.

### Issue 2: Generated Corridors Simple

**Description**: Auto-generated corridors only have 3 waypoints.
**Severity**: Low
**Workaround**: Add more pre-defined corridors to config.

### Issue 3: No Real-Time Traffic

**Description**: Time estimates don't consider traffic.
**Severity**: Medium
**Workaround**: Display as "estimated" time.

---

## Next Steps

If all tests pass:

1. ✓ Mark PART 7 as complete
2. ✓ Update README with new features
3. ✓ Plan PART 8 (if any)
4. ✓ Consider production deployment

If tests fail:

1. Document failure
2. Identify root cause
3. Fix and retest
4. Update documentation

---

**Testing Time Estimate**: 30-45 minutes for full suite

**Priority Tests**:

1. TEST 1: Basic location (zone name)
2. TEST 2: Coordinate input
3. TEST 3: Language switching
4. TEST 8: Map visualization

Run these 4 tests first for smoke test coverage.

---

**Ready to test? Open http://localhost:3000/travel-guard** 🛡️
