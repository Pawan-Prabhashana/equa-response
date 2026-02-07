# 🎯 Optimization Engine UI - User Guide

## Overview

The Equa-Response Optimization Engine is now fully integrated into the frontend dashboard! You can now visually optimize disaster response routes using an interactive alpha slider.

## 🚀 Features Implemented

### 1. **Alpha Slider Control** (Bottom Right Panel)

- **Visual Gradient:** Cyan → Purple → Red (representing Efficiency → Balanced → Equity)
- **Real-time Value Display:** Shows current α value (0.00 to 1.00)
- **Mode Indicators:**
  - `α < 0.3`: ⚡ Efficiency Mode (Nearest Neighbor)
  - `0.3 ≤ α ≤ 0.7`: 🎯 Balanced Mode (Hybrid)
  - `α > 0.7`: ⚖️ Equity Mode (Severity Priority)

### 2. **Optimize Button**

- **States:**
  - Default: "Calculate Optimal Route" (Cyan)
  - Loading: "Optimizing..." with spinner
  - After Optimization: "Re-Optimize Route" (Purple)
  - Disabled: When no incidents loaded (Gray)

### 3. **Route Visualization on Map**

- **Purple Dashed Polyline:** Animated route path
- **Glowing Effect:** Semi-transparent layer underneath for emphasis
- **START Marker:** Purple circle at depot/starting point
- **Numbered Waypoints:** White-bordered circles (1, 2, 3, ...) showing visit order
- **Interactive Popups:** Click waypoints to see incident details

### 4. **Route Metrics Display**

- **Route Distance:** Total kilometers for the optimized path
- **Algorithm Used:** Shows which mode was applied
- **Incident/Resource Counts:** Live updates from scenario

### 5. **Clear Route Button**

- **X Icon:** Top-right of optimization panel
- Removes route visualization from map
- Allows recalculation with different parameters

---

## 📋 How to Use

### Step 1: Load a Scenario

1. Use the **"Active Scenario"** dropdown (top-right)
2. Select a scenario (e.g., "Kalutara Flood 2017")
3. Wait for incidents and resources to load on the map

### Step 2: Adjust Optimization Strategy

1. Locate the **"Route Optimizer"** panel (bottom-right)
2. Drag the **alpha slider** to choose your strategy:

   | Slider Position  | Strategy   | When to Use                                  |
   | ---------------- | ---------- | -------------------------------------------- |
   | **Left (0.0)**   | Efficiency | Minimize fuel/time, standard operations      |
   | **Center (0.5)** | Balanced   | **Recommended** - Best overall approach      |
   | **Right (1.0)**  | Equity     | Life-threatening situations, ignore distance |

3. Read the description below the slider for guidance

### Step 3: Calculate Route

1. Click **"Calculate Optimal Route"** button
2. Wait 1-2 seconds for optimization (shows "Optimizing..." spinner)
3. Watch the purple route appear on the map!

### Step 4: Analyze Results

1. **Check Metrics:**

   - Route Distance (km)
   - Algorithm Mode
   - Number of stops

2. **Inspect Route:**

   - Purple line shows the path
   - START marker = Depot
   - Numbers (1, 2, 3...) = Visit order
   - Click any waypoint for incident details

3. **Compare Strategies:**
   - Adjust alpha slider
   - Click "Re-Optimize Route"
   - See how distance and order change!

### Step 5: Clear and Restart

- Click the **X** button (top-right of optimizer panel) to remove the route
- Try different scenarios or alpha values

---

## 🎨 Visual Guide

### Alpha Slider

```
[←────────────────────────→]
CYAN          PURPLE          RED
(Efficiency)  (Balanced)    (Equity)

α = 0.0                    α = 1.0
Nearest first          Critical first
```

### Route Appearance

```
START (Purple circle)
   ↓
   1️⃣ First incident (numbered)
   ↓
   2️⃣ Second incident
   ↓
   3️⃣ Third incident
   ...
Purple dashed line connects all points
```

---

## 🔬 Understanding the Results

### Efficiency Mode (α = 0.0)

**Example Output:**

- **Route Distance:** 568.17 km
- **Visit Order:** By proximity (nearest first)
- **Pros:** Saves fuel, minimizes travel time
- **Cons:** Critical incidents may wait

### Balanced Mode (α = 0.5) ⭐ RECOMMENDED

**Example Output:**

- **Route Distance:** 500.87 km ← SHORTEST!
- **Visit Order:** Critical incidents first, then optimized
- **Pros:** Best of both worlds
- **Cons:** None - this is usually optimal

### Equity Mode (α = 1.0)

**Example Output:**

- **Route Distance:** 634.8 km
- **Visit Order:** By severity (highest first)
- **Pros:** Saves most lives
- **Cons:** Longer route, more fuel

---

## 🐛 Troubleshooting

### "⚠️ Load a scenario with incidents first"

- **Solution:** Select a scenario from the dropdown (top-right)
- Wait for incidents to appear on the map

### Route Not Appearing

- **Check:** Is the optimize button showing "Re-Optimize Route"?
- **Try:** Click the X to clear, then re-optimize
- **Verify:** Browser console shows "✅ Route optimized" message

### Slider Not Responding

- **Reload:** Refresh the page (Ctrl+Shift+R / Cmd+Shift+R)
- **Check:** Look for any error messages in browser console

### Map Not Updating

- **Ensure:** Both frontend (port 3000) and API (port 8000) are running
- **Test API:** Visit http://localhost:8000/docs to verify backend

---

## 💡 Pro Tips

### 1. **Compare All Three Modes**

Try α = 0.0, 0.5, and 1.0 with the same scenario to see the differences!

### 2. **Watch the Distance**

Balanced mode (α = 0.5) often produces the **shortest route** while still prioritizing critical incidents.

### 3. **Use Waypoint Numbers**

The numbered markers show the exact visit order. Click them to verify the algorithm's choices.

### 4. **Experiment with Different Scenarios**

Each scenario has different incident distributions. Some benefit more from efficiency, others from equity.

### 5. **Check Algorithm Name**

The metrics panel shows which algorithm was used (e.g., "Balanced Mode (Hybrid)"). This confirms your slider position.

---

## 🔧 Technical Details

### API Endpoint

```
POST http://localhost:8000/optimize
```

### Request Format

```json
{
  "incidents": [...],
  "resources": [...],
  "alpha": 0.5,
  "depot": [7.8731, 80.7718]
}
```

### Response Format

```json
{
  "path": [[lat, lon], ...],
  "ordered_incidents": [...],
  "total_distance_km": 500.87,
  "algorithm": "Balanced Mode (Hybrid)",
  "alpha_used": 0.5
}
```

---

## 🎯 Next Steps (Future Enhancements)

### Planned Features

- [ ] **Live Route Animation:** Watch the route "draw" in real-time
- [ ] **ETA Calculation:** Estimate time to complete route
- [ ] **Multi-Resource Support:** Assign different routes to boats vs trucks
- [ ] **Route Export:** Download optimized route as GPX/KML
- [ ] **Historical Comparison:** Compare current route vs previous attempts
- [ ] **Weather Integration:** Adjust routes based on real-time weather

---

## 📞 Need Help?

1. **Check Browser Console:** Press F12 → Console tab
2. **Verify API Status:** Visit http://localhost:8000/health
3. **Restart Services:**

   ```bash
   # Frontend
   cd equa-response-web
   npm run dev

   # Backend
   cd equa-response-api
   python main.py
   ```

---

**Equa-Response** - _Making disaster response data-driven, one optimized route at a time._ 🚁🗺️
