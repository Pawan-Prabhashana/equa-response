# 🎯 Equa-Response - Current Status

## ✅ What's Running:

### 1. **Backend API** (Port 8000) ✓ RUNNING

- Location: `/equa-response-api/`
- Status: **OPERATIONAL**
- Test: http://localhost:8000/docs
- Endpoints working:
  - ✓ `GET /scenarios` returns 2 scenarios
  - ✓ `GET /scenarios/kalutara_flood_2017` returns full data
  - ✓ `GET /health` working

### 2. **Frontend** (Port 3001) ⚠️ NEEDS TESTING

- Location: `/equa-response-web/equa-response-api/equa-response-web/`
- Status: Server running (network warning is non-critical)
- URL: http://localhost:3001

---

## 🧪 Quick Test Steps:

### **Step 1: Verify API is Working**

Open this in your browser:

```
http://localhost:8000/scenarios
```

You should see JSON with 2 scenarios!

### **Step 2: Open the Dashboard**

Open this in your browser:

```
http://localhost:3001
```

### **Step 3: Check Browser Console**

Press `F12` to open Developer Tools, go to **Console** tab.

Look for:

- ✅ "Loaded scenarios: 2" (or similar) = API working!
- ❌ "Failed to fetch" or CORS error = API connection issue
- ❌ Network errors = API not accessible

### **Step 4: Hard Refresh**

Press `Cmd + Shift + R` (Mac) or `Ctrl + F5` (Windows)

---

## 🐛 If Scenarios Still Don't Load:

### **Test 1: API Accessibility from Browser**

Open browser console (F12) and run:

```javascript
fetch("http://localhost:8000/scenarios")
  .then((r) => r.json())
  .then((d) => console.log("API Response:", d))
  .catch((e) => console.error("API Error:", e));
```

### **Test 2: Check Environment Variable**

In browser console:

```javascript
console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
```

Should show: `http://localhost:8000`

If undefined, the `.env.local` didn't load. Restart the dev server.

### **Test 3: CORS Issue?**

If console shows:

```
Access-Control-Allow-Origin error
```

The API's CORS settings need adjustment (but they should be correct).

---

## 📋 Current File Locations:

```
API Client: /equa-response-web/equa-response-api/equa-response-web/src/lib/api.ts ✓
API Backend: /equa-response-api/main.py ✓
Scenarios Data: /equa-response-api/data/scenarios.json ✓
Environment: /equa-response-web/equa-response-api/equa-response-web/.env.local ✓
```

---

## 🎯 Expected Result:

When everything works, you should see:

1. **Scenario dropdown** shows 2 options:

   - SIMULATION: 2017 FLOOD (KALUTARA) - 4 incidents • 2 resources
   - SIMULATION: 2024 CYCLONE (TRINCO) - 2 incidents • 0 resources

2. **Map displays markers** at real locations from API

3. **Clicking markers** shows incident details

---

## 💡 Quick Fix if Nothing Works:

**In your terminal, kill everything and restart clean:**

```bash
# Kill all Node/Python processes
pkill -f "next dev"
pkill -f "python main.py"

# Terminal 1: Start API
cd /Users/s.a.pawanprabhashana/equa-response/equa-response-api
python main.py

# Terminal 2: Start Frontend (wait for API to start first!)
cd /Users/s.a.pawanprabhashana/equa-response/equa-response-web/equa-response-api/equa-response-web
npm run dev
```

Then open: http://localhost:3001
