# 🚀 Equa-Response Setup Guide

Complete setup guide for running the disaster response dashboard.

## 📁 Project Structure

```
equa-response/
├── equa-response-api/          # Backend (FastAPI)
│   ├── main.py
│   ├── requirements.txt
│   └── data/
│       └── scenarios.json
└── equa-response-web/          # Frontend (Next.js)
    ├── src/
    ├── lib/
    │   └── api.ts              # API client
    └── .env.local
```

---

## 🏃‍♂️ Quick Start

### **Step 1: Start the Backend API**

Open Terminal 1:

```bash
# Navigate to API directory
cd /Users/s.a.pawanprabhashana/equa-response/equa-response-api

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the API server
python main.py
```

**Expected Output:**

```
============================================================
🚀 EQUA-RESPONSE API STARTING
============================================================
Version: 1.0
CORS Enabled for: http://localhost:3000, http://localhost:3001
✓ Data loaded successfully: 2 scenarios
============================================================
API Documentation: http://localhost:8000/docs
============================================================
INFO:     Uvicorn running on http://127.0.0.1:8000
```

✅ API is now running at: **http://localhost:8000**

---

### **Step 2: Start the Frontend**

Open Terminal 2:

```bash
# Navigate to web directory
cd /Users/s.a.pawanprabhashana/equa-response/equa-response-web

# Start the Next.js dev server
npm run dev
```

**Expected Output:**

```
✓ Ready in 1s
- Local:        http://localhost:3000
```

✅ Frontend is now running at: **http://localhost:3000** or **http://localhost:3001**

---

### **Step 3: Open the Dashboard**

1. Open your browser
2. Go to: **http://localhost:3001** (or 3000)
3. You should see:
   - ✅ Left sidebar with navigation
   - ✅ Top status bar
   - ✅ Interactive map with CartoDB Dark Matter tiles
   - ✅ **Top-right**: Scenario selector dropdown (fetching from API!)
   - ✅ **Bottom-right**: Live metrics panel
   - ✅ **Map markers**: Real incidents from the selected scenario

---

## 🎮 How to Use

### **Change Scenarios**

1. Click the **Scenario Loader** dropdown (top-right)
2. Select a scenario:
   - **2017 Flood (Kalutara)** - 4 incidents
   - **2024 Cyclone (Trinco)** - 2 incidents
3. Watch the map automatically:
   - Pan to the new location
   - Display new incident markers
   - Update zoom level

### **Interact with Incidents**

- **Click any marker** on the map to see:
  - Incident type and description
  - Severity level (1-10)
  - Verification status
  - Timestamp

---

## 🧪 Test the API

### **Option 1: Interactive Docs**

Visit: **http://localhost:8000/docs**

Try these endpoints:

- `GET /scenarios` - See available scenarios
- `GET /scenarios/kalutara_flood_2017` - Full scenario details
- `GET /health` - API health check

### **Option 2: Command Line**

```bash
# Get scenarios list
curl http://localhost:8000/scenarios

# Get specific scenario
curl http://localhost:8000/scenarios/kalutara_flood_2017

# Health check
curl http://localhost:8000/health
```

---

## 🔧 Troubleshooting

### **API won't start?**

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**

```bash
cd equa-response-api
pip install -r requirements.txt
```

---

### **Frontend can't connect to API?**

**Problem:** Console error: `Failed to fetch`

**Solution:** Make sure `.env.local` exists:

```bash
cd equa-response-web
cat .env.local
# Should show: NEXT_PUBLIC_API_URL=http://localhost:8000
```

If missing, create it:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

Then restart the frontend server.

---

### **Map not loading?**

**Problem:** Blank screen or loading forever

**Solution:**

1. Check browser console (F12) for errors
2. Make sure API is running on port 8000
3. Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + F5` (Windows)

---

### **Scenarios not appearing?**

**Problem:** Dropdown shows "Loading..." forever

**Solution:**

1. Check API is running: `curl http://localhost:8000/health`
2. Check browser console for CORS errors
3. Verify `.env.local` has correct API URL
4. Restart both servers

---

## 📊 What's Connected?

| Component             | Data Source                             |
| --------------------- | --------------------------------------- |
| **Scenario Dropdown** | `GET /scenarios`                        |
| **Map Center/Zoom**   | Scenario details                        |
| **Incident Markers**  | `GET /scenarios/{id}` → incidents array |
| **Popup Details**     | Individual incident data                |

---

## 🎯 Next Steps

### **Add More Scenarios**

Edit `equa-response-api/data/scenarios.json`:

```json
{
  "scenarios": [
    {
      "id": "new_scenario_2026",
      "name": "Your New Scenario",
      "center": [7.0, 80.0],
      "zoom": 10,
      "description": "...",
      "incidents": [...],
      "resources": [...]
    }
  ]
}
```

Restart the API and it will appear in the dropdown!

### **Add Real-Time Updates**

In `HUD.tsx`, add polling:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (selectedScenario) {
      fetchScenarioDetails(selectedScenario.id).then((data) => {
        // Update incidents
      });
    }
  }, 5000); // Poll every 5 seconds

  return () => clearInterval(interval);
}, [selectedScenario]);
```

---

## ✅ You're All Set!

Both servers should now be running and connected:

- **Backend (API):** http://localhost:8000
- **Frontend (Dashboard):** http://localhost:3001
- **API Docs:** http://localhost:8000/docs

The dashboard is now fetching **real data** from the API! 🎉
