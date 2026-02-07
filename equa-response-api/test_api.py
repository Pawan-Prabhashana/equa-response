"""
Quick test script to verify API endpoints
Run this after starting the API server
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_root():
    """Test root endpoint"""
    print("\n" + "="*60)
    print("Testing GET /")
    print("="*60)
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    print("✓ PASSED")

def test_scenarios():
    """Test scenarios list endpoint"""
    print("\n" + "="*60)
    print("Testing GET /scenarios")
    print("="*60)
    response = requests.get(f"{BASE_URL}/scenarios")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Scenario Count: {data['count']}")
    for scenario in data['scenarios']:
        print(f"  - {scenario['id']}: {scenario['name']}")
    assert response.status_code == 200
    assert data['count'] > 0
    print("✓ PASSED")

def test_scenario_details():
    """Test scenario details endpoint"""
    print("\n" + "="*60)
    print("Testing GET /scenarios/kalutara_flood_2017")
    print("="*60)
    response = requests.get(f"{BASE_URL}/scenarios/kalutara_flood_2017")
    print(f"Status: {response.status_code}")
    data = response.json()
    scenario = data['scenario']
    print(f"Scenario: {scenario['name']}")
    print(f"Incidents: {len(scenario['incidents'])}")
    print(f"Resources: {len(scenario['resources'])}")
    assert response.status_code == 200
    print("✓ PASSED")

def test_optimize():
    """Test optimize endpoint"""
    print("\n" + "="*60)
    print("Testing POST /optimize")
    print("="*60)
    
    # Sample incidents
    incidents = [
        {
            "id": "inc_01",
            "type": "FLOOD",
            "severity": 9,
            "lat": 6.6111,
            "lon": 80.0123,
            "description": "Hospital entrance blocked",
            "verified": True,
            "timestamp": "T-0"
        },
        {
            "id": "inc_02",
            "type": "LANDSLIDE",
            "severity": 10,
            "lat": 6.6345,
            "lon": 80.0567,
            "description": "Road blocked",
            "verified": True,
            "timestamp": "T-15m"
        }
    ]
    
    response = requests.post(
        f"{BASE_URL}/optimize",
        json={"incidents": incidents}
    )
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Fairness Score: {data['fairness_score']}")
    print(f"Algorithm: {data['algorithm']}")
    print(f"Optimized Count: {len(data['optimized_incidents'])}")
    assert response.status_code == 200
    print("✓ PASSED")

def test_health():
    """Test health check endpoint"""
    print("\n" + "="*60)
    print("Testing GET /health")
    print("="*60)
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"API Status: {data['status']}")
    print(f"Data Loaded: {data['data_loaded']}")
    print(f"Scenarios: {data['scenario_count']}")
    assert response.status_code == 200
    assert data['status'] == 'healthy'
    print("✓ PASSED")

if __name__ == "__main__":
    print("🧪 Equa-Response API Test Suite")
    print("Make sure the API server is running on http://localhost:8000")
    print()
    input("Press Enter to start tests...")
    
    try:
        test_root()
        test_health()
        test_scenarios()
        test_scenario_details()
        test_optimize()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to API")
        print("Make sure the server is running: python main.py")
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
