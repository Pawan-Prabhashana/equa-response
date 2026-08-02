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

Compute a response route over the given incidents using a greedy dynamic-scoring
algorithm. Starting from the depot, the next stop is chosen by minimizing:

```
score = distance_km * (1 - alpha) - severity * alpha * 10
```

- `alpha = 0.0` → pure efficiency (nearest incident first)
- `alpha = 1.0` → pure equity (highest severity first)
- `alpha = 0.5` → balanced

**Request Body:** `incidents` and `resources` are both required; `alpha` and
`depot` are optional (defaults: `alpha = 0.5`, `depot = [7.87, 80.77]`).

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
  ],
  "resources": [
    {
      "id": "res_01",
      "type": "BOAT",
      "status": "IDLE",
      "lat": 7.8731,
      "lon": 80.7718,
      "capacity": 10
    }
  ],
  "alpha": 0.5,
  "depot": [7.8731, 80.7718]
}
```

**Response:**

```json
{
  "path": [[7.8731, 80.7718], [6.6111, 80.0123]],
  "ordered_incidents": [ ... ],
  "total_distance_km": 164.79,
  "algorithm": "DynamicScore: (dist*(1-alpha))-(severity*alpha*10)",
  "alpha_used": 0.5
}
```

- `path` — ordered coordinates `[[lat, lon], ...]`, starting at the depot.
- `ordered_incidents` — the incidents in visit order (depot excluded).
- `total_distance_km` — total route length (Haversine).

## 📁 Project Structure

```
equa-response-api/
├── main.py                # FastAPI application (models + endpoints)
├── requirements.txt       # Runtime dependencies
├── requirements-dev.txt   # Test dependencies (adds requests)
├── .python-version        # Supported interpreter (3.11)
├── test_api.py            # Endpoint smoke tests
├── test_optimization.py   # /optimize alpha-mode demo
├── data/
│   └── scenarios.json     # Disaster scenarios data
└── README.md
```

## 🔧 CORS Configuration

CORS is enabled for the frontend dev origin:

- `http://localhost:3000`

## 🧪 Testing

Install the test dependency and run the scripts against a running server:

```bash
pip install -r requirements-dev.txt   # adds `requests`
python main.py                        # start the server in another terminal
python test_optimization.py           # /optimize efficiency vs equity demo
python test_api.py                    # endpoint smoke tests
```

Or explore interactively at http://localhost:8000/docs, or with curl:

```bash
curl http://localhost:8000/scenarios
curl http://localhost:8000/scenarios/kalutara_flood_2017
```

## 📝 Development Notes

For production hardening, consider:

- Authentication/authorization
- Rate limiting
- Caching for frequently accessed scenarios
- A database for dynamic scenario management

## 🛠️ Tech Stack

- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation and serialization
