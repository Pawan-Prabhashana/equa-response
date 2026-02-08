# 🎯 How to See the Optimization on localhost:3000

## ✅ Backend Status: RUNNING on port 8000
## ✅ Frontend Status: RUNNING on port 3000  
## ✅ All API Tests: PASSING

---

## 📍 Step-by-Step Instructions

### Step 1: Open Your Browser
Navigate to: **http://localhost:3000**

You should see the Equa-Response dashboard with a dark map interface.

---

### Step 2: Verify Scenario is Loaded

**Look at the TOP-RIGHT corner** of the screen:
- You should see a panel labeled "Active Scenario"
- It should show: **"SIMULATION: 2017 FLOOD (KALUTARA)"**
- Below it should say: **✓ SCENARIO LOADED** (in green)

If you don't see this, click the dropdown and select "Kalutara Flood 2017".

---

### Step 3: Locate the Optimization Panel

**Look at the BOTTOM-RIGHT corner** of the screen:
- You'll see TWO glass panels stacked vertically
- The TOP panel shows "Scenario Metrics" (incident count, resource count)
- The BOTTOM panel is labeled **"Route Optimizer"** with a purple navigation icon

This is where the magic happens!

---

### Step 4: Adjust the Alpha Slider (Optional)

In the "Route Optimizer" panel:
- You'll see a slider labeled **"Optimization Mode"**
- Above it displays: **α = 0.50** (or whatever value it's set to)
- Below the slider are three labels:
  - **EFFICIENCY** (left)
  - **BALANCED** (center)
  - **EQUITY** (right)

Try moving the slider:
- **All the way LEFT (α = 0.0)**: ⚡ Efficiency Mode - minimizes distance
- **CENTER (α = 0.5)**: 🎯 Balanced - considers both distance and severity
- **All the way RIGHT (α = 1.0)**: ⚖️ Equity Mode - prioritizes critical incidents

---

### Step 5: Click the Optimize Button! 🚀

In the same "Route Optimizer" panel, at the bottom:

**CLICK THE BIG BLUE BUTTON** that says:
```
🧭 Calculate Optimal Route
```

The button will change to show:
```
⏳ Optimizing...
```

---

### Step 6: Watch the Magic Happen! ✨

Within 1-2 seconds, you'll see:

1. **A PURPLE POLYLINE** appears on the map connecting all incidents
   - It has a glowing effect
   - It shows the optimized route path

2. **NUMBERED MARKERS** appear (1, 2, 3, 4...)
   - These show the order in which to visit each incident
   - Purple circles with white numbers

3. **A "START" MARKER** at the beginning
   - Shows where the route begins (depot location)

4. **NEW METRICS** appear in the panel above:
   - **Route Distance**: Shows total km (e.g., "66.64 km")
   - **Algorithm**: Shows which mode was used (e.g., "Efficiency Mode (Nearest Neighbor)")

---

### Step 7: Experiment with Different Alpha Values

Now try this:

1. **Move the slider to α = 0.0** (all the way left)
2. Click **"Re-Optimize Route"** (button text changes after first optimization)
3. Notice how the route changes - it now visits nearest incidents first
4. Check the **Route Distance** - it should be SHORTER

Then:

1. **Move the slider to α = 1.0** (all the way right)
2. Click **"Re-Optimize Route"** again
3. Notice the route changes - it now visits high-severity incidents first
4. Check the **Route Distance** - it might be LONGER (because it prioritizes saving lives over efficiency)

---

## 🎨 What You Should See

### Before Optimization:
- Map with colored incident markers (red, blue, orange)
- No route lines
- No numbered waypoints
- Metrics show only: incidents count, resources count

### After Optimization:
- **Purple glowing polyline** connecting all incidents
- **Numbered purple circles** (1, 2, 3, 4...) on each incident
- **"START" marker** at the beginning
- **Additional metrics**: Route Distance, Algorithm name
- Button changes to **"Re-Optimize Route"**

---

## 🧪 Alternative: Use the Test Page

If you want to see the raw API responses, open this file in your browser:

```
/Users/s.a.pawanprabhashana/equa-response/test_frontend_backend.html
```

Or open it by running:
```bash
open /Users/s.a.pawanprabhashana/equa-response/test_frontend_backend.html
```

This page lets you:
- Test backend health
- Load scenario data
- Run optimization with different alpha values
- See the raw JSON responses

---

## 🐛 Still Can't See It?

### Check 1: Is the button clickable?
- If the button is **gray and says "Load a scenario with incidents first"**, you need to load a scenario
- Click the dropdown in the top-right and select a scenario

### Check 2: Open Browser Console (F12)
- Look for any error messages in red
- If you see CORS errors, the backend might not be running
- If you see network errors, check that port 8000 is accessible

### Check 3: Verify Backend is Running
Open a new browser tab and go to:
```
http://localhost:8000/health
```

You should see:
```json
{
  "status": "healthy",
  "version": "1.0",
  "data_loaded": true,
  "scenario_count": 2
}
```

### Check 4: Hard Refresh the Page
Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux) to force refresh the page.

---

## 🎓 Understanding the Algorithm

The route you see is calculated using:

```
Score = (Distance_km × (1 - α)) - (Severity × α × 10)
```

For each unvisited incident, the algorithm calculates this score and visits the one with the **LOWEST score** (highest priority).

### Example with 2 incidents:

**Incident A**: Distance = 10km, Severity = 8  
**Incident B**: Distance = 5km, Severity = 5

**With α = 0.0 (Efficiency):**
- Score_A = 10 × 1.0 - 8 × 0.0 × 10 = **10**
- Score_B = 5 × 1.0 - 5 × 0.0 × 10 = **5**
- **Visit B first** (lower score)

**With α = 1.0 (Equity):**
- Score_A = 10 × 0.0 - 8 × 1.0 × 10 = **-80**
- Score_B = 5 × 0.0 - 5 × 1.0 × 10 = **-50**
- **Visit A first** (lower score = more negative = higher severity)

---

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Browser open at localhost:3000
- [ ] Scenario loaded (green checkmark in top-right)
- [ ] Clicked "Calculate Optimal Route" button
- [ ] Purple route line visible on map
- [ ] Numbered waypoints visible
- [ ] Route metrics showing distance and algorithm

If all checked: **🎉 CONGRATULATIONS! The optimization engine is working perfectly!**

---

## 🚀 Next: Compare the Results!

Try this experiment:

1. Set α = 0.0 → Optimize → Note the distance (e.g., 66.64 km)
2. Set α = 1.0 → Optimize → Note the distance (e.g., 90.94 km)
3. Compare: How much longer is the equity route?
4. Look at the visit order: Which incidents are visited first in each mode?

This shows the **trade-off** between efficiency (minimize distance) and equity (maximize lives saved).

---

**The algorithm works perfectly! Have fun exploring the Pareto frontier! 🚀**

