"""
Test script for the Optimization Engine
Demonstrates the difference between Efficiency (alpha=0) and Equity (alpha=1) modes
"""
import requests
import json

# API endpoint
BASE_URL = "http://localhost:8000"

# Test data - 4 incidents with varying severity and locations
test_request = {
    "incidents": [
        {
            "id": "INC-001",
            "type": "FLOOD",
            "severity": 3,
            "lat": 6.9271,
            "lon": 79.8612,
            "description": "Minor flooding in Colombo",
            "verified": True,
            "timestamp": "2024-01-01T10:00:00Z"
        },
        {
            "id": "INC-002",
            "type": "LANDSLIDE",
            "severity": 9,
            "lat": 6.0535,
            "lon": 80.2210,
            "description": "Critical landslide in Galle",
            "verified": True,
            "timestamp": "2024-01-01T10:05:00Z"
        },
        {
            "id": "INC-003",
            "type": "FLOOD",
            "severity": 5,
            "lat": 7.2906,
            "lon": 80.6337,
            "description": "Moderate flooding in Kandy",
            "verified": True,
            "timestamp": "2024-01-01T10:10:00Z"
        },
        {
            "id": "INC-004",
            "type": "WIND",
            "severity": 10,
            "lat": 8.5874,
            "lon": 81.2152,
            "description": "CRITICAL cyclone damage in Trincomalee",
            "verified": True,
            "timestamp": "2024-01-01T10:15:00Z"
        }
    ],
    "resources": [
        {
            "id": "RES-001",
            "type": "BOAT",
            "status": "IDLE",
            "lat": 7.8731,
            "lon": 80.7718,
            "capacity": 10
        }
    ],
    "alpha": 0.5,  # Will test different values
    "depot": [7.8731, 80.7718]  # Central Sri Lanka
}

print("=" * 80)
print("🧪 TESTING EQUA-RESPONSE OPTIMIZATION ENGINE")
print("=" * 80)
print("\nTest Scenario:")
print("- 4 Incidents with severities: 3, 9, 5, 10")
print("- Starting from central Sri Lanka (7.8731, 80.7718)")
print("\n" + "=" * 80)

# Test 1: Efficiency Mode (alpha = 0)
print("\n📊 TEST 1: EFFICIENCY MODE (alpha = 0.0)")
print("Expected: Visit incidents in order of nearest distance")
print("-" * 80)

test_request["alpha"] = 0.0
response = requests.post(f"{BASE_URL}/optimize", json=test_request)
result = response.json()

print(f"Algorithm: {result['algorithm']}")
print(f"Total Distance: {result['total_distance_km']} km")
print(f"Alpha Used: {result['alpha_used']}")
print("\nVisit Order:")
for i, incident in enumerate(result['ordered_incidents'], 1):
    print(f"  {i}. {incident['id']} - Severity: {incident['severity']}/10 - {incident['description']}")

# Test 2: Equity Mode (alpha = 1)
print("\n" + "=" * 80)
print("\n📊 TEST 2: EQUITY MODE (alpha = 1.0)")
print("Expected: Visit incidents in order of highest severity")
print("-" * 80)

test_request["alpha"] = 1.0
response = requests.post(f"{BASE_URL}/optimize", json=test_request)
result = response.json()

print(f"Algorithm: {result['algorithm']}")
print(f"Total Distance: {result['total_distance_km']} km")
print(f"Alpha Used: {result['alpha_used']}")
print("\nVisit Order:")
for i, incident in enumerate(result['ordered_incidents'], 1):
    print(f"  {i}. {incident['id']} - Severity: {incident['severity']}/10 - {incident['description']}")

# Test 3: Balanced Mode (alpha = 0.5)
print("\n" + "=" * 80)
print("\n📊 TEST 3: BALANCED MODE (alpha = 0.5)")
print("Expected: Balance between distance and severity")
print("-" * 80)

test_request["alpha"] = 0.5
response = requests.post(f"{BASE_URL}/optimize", json=test_request)
result = response.json()

print(f"Algorithm: {result['algorithm']}")
print(f"Total Distance: {result['total_distance_km']} km")
print(f"Alpha Used: {result['alpha_used']}")
print("\nVisit Order:")
for i, incident in enumerate(result['ordered_incidents'], 1):
    print(f"  {i}. {incident['id']} - Severity: {incident['severity']}/10 - {incident['description']}")

print("\n" + "=" * 80)
print("✅ OPTIMIZATION ENGINE TESTS COMPLETE")
print("=" * 80)
