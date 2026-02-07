# Equa-Response API

Backend API for disaster response optimization engine.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at:

- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📋 API Endpoints

### Root

```http
GET /
```

Returns API status and available endpoints.

**Response:**

```json
{
  "status": "Equa-Response API Online",
  "version": "1.0",
  "endpoints": {...}
}
```

---

### Health Check

```http
GET /health
```

Detailed health status including data loading verification.

**Response:**

```json
{
  "status": "healthy",
  "version": "1.0",
  "data_loaded": true,
  "scenario_count": 2
}
```

---

### List Scenarios (Metadata Only)

```http
GET /scenarios
```

Returns scenario metadata without heavy incident details.

**Response:**

```json
{
  "count": 2,
  "scenarios": [
    {
      "id": "kalutara_flood_2017",
      "name": "SIMULATION: 2017 FLOOD (KALUTARA)",
      "description": "Rapid river overflow...",
      "center": [6.5854, 79.9607],
      "zoom": 12,
      "incident_count": 4,
      "resource_count": 2
    }
  ]
}
```

---

### Get Scenario Details

```http
GET /scenarios/{scenario_id}
```

Returns complete scenario data including all incidents and resources.

**Example:**

```http
GET /scenarios/kalutara_flood_2017
```

**Response:**

```json
{
  "scenario": {
    "id": "kalutara_flood_2017",
    "name": "SIMULATION: 2017 FLOOD (KALUTARA)",
    "incidents": [...],
    "resources": [...]
  }
}
```

---

### Optimize Incident Response

```http
POST /optimize
```

Optimize incident response order using fairness algorithm.

**Request Body:**

```json
{
  "incidents": [
    {
      "id": "inc_01",
      "type": "FLOOD",
      "severity": 9,
      "lat": 6.6111,
      "lon": 80.0123,
      "description": "Hospital entrance blocked",
      "verified": true,
      "timestamp": "T-0"
    }
  ]
}
```

**Response:**

```json
{
  "optimized_incidents": [...],
  "fairness_score": 75.5,
  "algorithm": "placeholder_reverse_v1"
}
```

> **Note:** Currently returns reversed list as placeholder. Real optimization algorithm coming soon.

## 📁 Project Structure

```
equa-response-api/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── data/
│   └── scenarios.json   # Disaster scenarios data
└── README.md
```

## 🔧 CORS Configuration

CORS is enabled for:

- `http://localhost:3000`
- `http://localhost:3001`

## 🧪 Testing

Use the interactive API docs at http://localhost:8000/docs to test all endpoints.

Or use curl:

```bash
# Get scenarios
curl http://localhost:8000/scenarios

# Get specific scenario
curl http://localhost:8000/scenarios/kalutara_flood_2017

# Optimize (POST request)
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{"incidents": [...]}'
```

## 📝 Development Notes

- The `/optimize` endpoint is currently a placeholder
- Add authentication/authorization for production
- Consider rate limiting for production deployment
- Implement caching for frequently accessed scenarios
- Add database support for dynamic scenario management

## 🛠️ Tech Stack

- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation and serialization
