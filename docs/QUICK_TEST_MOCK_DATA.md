# 🚀 QUICK TEST: Mock Data Integration

## ✅ What Was Fixed

**Problem**: Impact Feed showed "0 districts with significant impact detected"  
**Cause**: No mock hazard data (empty arrays for floods, cyclone, ghost roads)  
**Solution**: Created comprehensive mock hazard data covering 9 districts

---

## 🧪 60-Second Test

### Step 1: Start Dev Server (10s)

```bash
cd equa-response-web
npm run dev
```

### Step 2: Open Playbook Studio (5s)

Navigate to: **http://localhost:3000/playbook-studio**

### Step 3: Check Impact Feed (15s)

**Location**: Right column, top section

**Expected Output**:

```
⚡ IMPACT FEED (12+ updates)          🟢 LIVE

🔴 Kalutara: EVACUATE posture (impact: 85)
🔴 Kalutara: Flood depth 2.1m detected
🔴 Kalutara: 3 critical incidents active
🟡 Kalutara: Shelter load predicted 88%

🔴 Ratnapura: EVACUATE posture (impact: 78)
🔴 Ratnapura: Flood depth 1.8m detected

🟡 Galle: DISPATCH posture (impact: 68)
🔴 Galle: Flood depth 1.3m detected

🟡 Colombo: ALERT posture (impact: 52)

🟡 Matara: DISPATCH posture (impact: 72)

🔵 Gampaha: MONITOR posture (impact: 42)

... (8-12 districts total)
```

**✅ Success Criteria**:

- [ ] Shows 8-12 items (not 0!)
- [ ] Multiple districts visible
- [ ] Green "LIVE" indicator
- [ ] Update counter shows "12+ updates"

### Step 4: Check District Intelligence (15s)

**Location**: Left column, district table

**Expected Output**:

```
District Intelligence
8 districts impacted

District    | Impact | Posture
------------|--------|----------
Kalutara    | 85     | EVACUATE
Ratnapura   | 78     | EVACUATE
Matara      | 72     | DISPATCH
Galle       | 68     | DISPATCH
Colombo     | 52     | ALERT
Hambantota  | 55     | ALERT
Kandy       | 48     | ALERT
Gampaha     | 42     | MONITOR
Nuwara Eliya| 38     | MONITOR
```

**✅ Success Criteria**:

- [ ] Shows 8-10 districts (not 0!)
- [ ] Impact scores range from 35-90
- [ ] Multiple postures (EVACUATE, DISPATCH, ALERT, MONITOR)

### Step 5: Click District Brief (15s)

**Action**: Click "View Brief" on Kalutara

**Expected Output**:

```
Kalutara District Brief

WHY IMPACTED:
• Flood depth 2.1m in district center (EXTREME risk)
• 3 critical incidents requiring immediate response
• Shelter predicted 88% occupancy (overload risk)
• 2 access routes blocked by flooding

AFFECTED PLACES:
• Kalutara North
• Dodangoda
• Beruwala
• Nagoda

RECOMMENDED POSTURE: EVACUATE

TOP ACTIONS:
1. Evacuate high-risk zones immediately
2. Stage boats for flood rescue
3. Open overflow shelters
```

**✅ Success Criteria**:

- [ ] Shows specific hazards (flood depth, incidents)
- [ ] Shows affected places
- [ ] Shows recommended actions
- [ ] Evidence is detailed and actionable

---

## 🐛 Troubleshooting

### Still Shows "0 districts"

**Check 1**: Dev server restarted?

```bash
# Stop server (Ctrl+C)
npm run dev
```

**Check 2**: Browser cache cleared?

- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**Check 3**: TypeScript compiled successfully?

```bash
npx tsc --noEmit
# Should show: Exit code: 0
```

**Check 4**: Console errors?

- Open browser console (F12)
- Look for errors related to mock_hazards or districtImpact

### Shows Errors in Console

**Common Error**: Module not found  
**Fix**: Check that `src/data/mock_hazards.ts` exists

**Common Error**: Type mismatch  
**Fix**: Run TypeScript check:

```bash
npx tsc --noEmit
```

---

## 📊 What to Expect

### Immediate Changes

1. **Impact Feed**: 8-12 district updates (not empty)
2. **District Intelligence**: 8-10 districts with scores (not 0)
3. **District Briefs**: Rich evidence (not generic)

### Hazard Coverage

- **7 flood polygons** (Kalutara, Ratnapura, Galle, Colombo, Matara, Gampaha)
- **1 cyclone cone** (80km radius, southern coast)
- **8 ghost roads** (various districts, various hazards)

### Impact Distribution

- **2 districts**: EVACUATE (score 75-90)
- **2 districts**: DISPATCH (score 65-75)
- **3 districts**: ALERT (score 50-65)
- **2 districts**: MONITOR (score 35-50)

---

## 🎯 Key Files Modified

### Created

- `src/data/mock_hazards.ts` - Comprehensive mock hazard data

### Modified

- `src/app/playbook-studio/page.tsx` - Integrated mock data into district impact computation

### TypeScript Status

```bash
$ npx tsc --noEmit
Exit code: 0 ✅
```

---

## 🚀 Next Steps

After confirming the mock data works:

1. **Generate Playbook**:

   - Select Top 5 districts (Kalutara, Ratnapura, Matara, Galle, Colombo)
   - Choose "Life Saving" objective
   - Generate playbook

2. **Verify Missions**:

   - Missions should mention specific hazards
   - Missions should target correct districts
   - Missions should include evacuation zones

3. **Send to Mission Control**:
   - Click "Send to Mission Control"
   - Verify missions appear
   - Check mission notes reference hazards

---

## ✅ Success!

If you see **8-12 districts** in the Impact Feed with **detailed hazard evidence**, the mock data is working perfectly! 🎉

The system now has:

- ✅ Realistic flood data
- ✅ Cyclone simulation
- ✅ Blocked road segments
- ✅ Shelter load predictions
- ✅ Multi-district coverage
- ✅ Rich, actionable intelligence

**The Impact Feed is no longer empty!** 🚀

---

_Quick Test Guide - Created: 2026-02-07_
