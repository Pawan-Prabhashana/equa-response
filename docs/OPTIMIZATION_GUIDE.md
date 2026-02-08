# 🚀 Equa-Response Optimization Engine - User Guide

## ✅ Status: FULLY OPERATIONAL

Both your **backend API** and **frontend application** are now equipped with the optimization engine!

---

## 🎯 How to See the Optimization in Action

### On Your Frontend (localhost:3000)

1. **Open your browser** and navigate to: `http://localhost:3000`

2. **Load a scenario** (should already be loaded by default: "Kalutara Flood 2017")

3. **Look at the bottom-right panel** - you'll see the "Route Optimizer" section with:

   - An alpha slider (α)
   - A blue/purple button saying "Calculate Optimal Route"

4. **Adjust the Alpha slider** to choose your optimization strategy:

   - **α = 0.0** → ⚡ **Efficiency Mode** (prioritizes nearest neighbors, minimum distance)
   - **α = 0.5** → 🎯 **Balanced Mode** (mix of distance and severity)
   - **α = 1.0** → ⚖️ **Equity Mode** (prioritizes high-severity incidents first)

5. **Click "Calculate Optimal Route"**

6. **Watch the magic happen!**
   - A **purple route line** will appear on the map
   - **Numbered waypoints** (1, 2, 3...) show the optimized visit order
   - **Route metrics** appear in the panel (distance, algorithm used)

---

## 🧪 Testing Page

I've created a standalone test page for you at:

```
file:///Users/s.a.pawanprabhashana/equa-response/test_frontend_backend.html
```

**To use it:**

1. Open this file in your browser
2. Click the buttons in order:
   - "Check Backend Health"
   - "Load Kalutara Flood 2017"
   - "Optimize with Current Alpha" (try different alpha values)

This page demonstrates the optimization API working independently.

---

## 🧠 The Secret Sauce Algorithm

The optimization engine uses this formula for each incident:

```
Score = (Distance_km × (1 - α)) - (Severity × α × 10)
```

**Lower score = Higher priority**

### Examples:

#### Alpha = 0.0 (Efficiency Mode)

```
Score = Distance_km × 1.0 - Severity × 0 × 10
Score = Distance_km only
```

→ Only distance matters. Visit nearest incidents first.

#### Alpha = 1.0 (Equity Mode)

```
Score = Distance_km × 0 - Severity × 1.0 × 10
Score = -Severity × 10
```

→ Only severity matters. Visit critical incidents first.
→ Higher severity = Lower score (higher priority)

#### Alpha = 0.5 (Balanced)

```
Score = Distance_km × 0.5 - Severity × 0.5 × 10
```

→ Both distance and severity matter equally

---

## 📊 Real Results

Here's what you'll see with the Kalutara Flood 2017 scenario:

### Efficiency Mode (α = 0.0)

- **Algorithm**: Nearest Neighbor
- **Total Distance**: ~66.64 km
- **Strategy**: Minimize travel time
- **Route**: Depot → Closest incident → Next closest → ...

### Equity Mode (α = 1.0)

- **Algorithm**: Severity Priority
- **Total Distance**: ~90.94 km (longer!)
- **Strategy**: Save critical lives first
- **Route**: Depot → Highest severity → Next highest → ...

---

## 🔧 Backend API Endpoints

All endpoints are working at `http://localhost:8000`

### Check Health

```bash
curl http://localhost:8000/health
```

### Get Scenarios

```bash
curl http://localhost:8000/scenarios
```

### Optimize Route

```bash
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "incidents": [...],
    "resources": [...],
    "alpha": 0.5,
    "depot": [7.8731, 80.7718]
  }'
```

### Interactive API Documentation

Visit: `http://localhost:8000/docs`

---

## 🎨 What You Should See on the Map

When you click "Calculate Optimal Route":

1. **Purple polyline** with a glowing effect showing the route
2. **"START" marker** at the depot (purple circle)
3. **Numbered waypoints** (1, 2, 3...) showing visit order
4. **Original incident markers** (colored by type)
5. **Route metrics** in the bottom-right panel:
   - Total distance in km
   - Algorithm name
   - Alpha value used

---

## 🐛 Troubleshooting

### "Can't see the route on localhost:3000"

1. **Make sure the backend is running:**
   ```bash
   # Should return: 54780, 56478, etc.
   lsof -ti:8000
   ```
2. **Make sure the frontend is running:**

   ```bash
   # Should return process IDs
   lsof -ti:3000
   ```

3. **Click the "Calculate Optimal Route" button** in the bottom-right panel

   - Don't just adjust the slider; you must click the button!

4. **Check browser console** for errors (F12 → Console tab)

5. **Verify API connection:**
   - Open `http://localhost:8000/health` in a new tab
   - Should show: `{"status":"healthy",...}`

### "Optimization button is disabled"

- Make sure a scenario is loaded
- Check that there are incidents in the scenario
- Look for the green "SCENARIO LOADED" indicator in the top-right

---

## 🎓 Why This Matters (Data Science Context)

This is a classic **Multi-Objective Optimization** problem:

- **Objective 1**: Minimize total travel distance (efficiency)
- **Objective 2**: Maximize lives saved (equity via severity prioritization)

These objectives often **conflict**:

- Visiting nearest incidents first (efficient) may ignore critical distant cases
- Visiting critical cases first (equitable) increases travel time

The **alpha slider** lets you explore the **Pareto frontier** between these objectives!

---

## 📝 Next Steps

1. ✅ Try different alpha values and observe the route changes
2. ✅ Compare the total distance between efficiency and equity modes
3. ✅ Notice how the visit order changes with the slider
4. ✅ Try the standalone test page for API-level testing
5. ✅ Check the API documentation at `http://localhost:8000/docs`

---

## 🚀 The Backend is Smart. Have Fun Optimizing!

Your disaster response optimization engine is now fully operational. The algorithm dynamically balances efficiency and equity based on your alpha parameter.

**Remember**: There's no "perfect" alpha value - it depends on your priorities in the disaster scenario!
