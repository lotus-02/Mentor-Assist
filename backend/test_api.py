import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api():
    print("Testing /api/health...")
    r = client.get("/api/health")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    print("Health response:", r.json())

    print("Testing /api/model-info...")
    r = client.get("/api/model-info")
    assert r.status_code == 200
    info = r.json()
    print("Model name:", info['name'])
    print("Feature count:", len(info['features']))
    print("Top feature:", info['feature_importances'][0])
    print("Zero G3 leakage verified:", info['compliance_audit']['zero_g3_leakage_verified'])

    print("Testing /api/benchmark-dataset...")
    r = client.get("/api/benchmark-dataset?limit=10")
    assert r.status_code == 200
    data = r.json()
    print(f"Loaded {len(data['data'])} records from benchmark API.")

    print("Testing /api/compare-models...")
    r = client.get("/api/compare-models?budget_pct=0.20")
    assert r.status_code == 200
    comp = r.json()
    print("Comparison summary:", comp['summary'])

    print("Testing /api/predict...")
    sample_students = data['data'][:5]
    r = client.post("/api/predict", json={"students": sample_students, "budget_pct": 0.20})
    assert r.status_code == 200
    preds = r.json()
    print(f"Predicted {len(preds)} students. First student rank={preds[0]['rank']}, risk={preds[0]['calibrated_risk_prob']}")

    print("Testing /api/simulate-intervention...")
    sim_req = {
        "student": sample_students[0],
        "modified_studytime": 4,
        "modified_absences": 2
    }
    r = client.post("/api/simulate-intervention", json=sim_req)
    assert r.status_code == 200
    print("Simulation response:", r.json())

    print("\nALL API ENDPOINTS FUNCTIONING FLAWLESSLY!")

if __name__ == "__main__":
    test_api()
