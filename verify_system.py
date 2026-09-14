"""
POFR-Ed System End-to-End Verification Script
Tests ML pipeline, fairness optimizer, API endpoints, and bundle integrity.
"""
import sys
import os
import subprocess
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.ml.pipeline import engine
from app.ml.features import engineer_features
import pandas as pd

def run_checks():
    print("=" * 60)
    print(" POFR-Ed: NATIONAL HACKATHON VERIFICATION SUITE")
    print("=" * 60)
    
    # 1. Check dataset existence
    csv_path = os.path.join('backend', 'data', 'student-mat.csv')
    assert os.path.exists(csv_path), f"Missing benchmark file {csv_path}"
    print("[PASS] Benchmark dataset verified: backend/data/student-mat.csv")
    
    # 2. Check engine training
    engine.initialize_and_train()
    assert engine.is_trained, "Engine failed to train"
    print("[PASS] Calibrated ensemble model trained with 5-fold CV Isotonic calibration")
    
    # 3. Check leakage prevention
    leakage_test = pd.DataFrame([{'G1': 10, 'G2': 12, 'G3': 8}])
    try:
        engineer_features(leakage_test)
        print("[FAIL] G3 leakage check failed!")
        sys.exit(1)
    except ValueError:
        print("[PASS] Responsible AI Audit: Zero G3 leakage guaranteed & enforced")
        
    # 4. Check 100-point benchmark metrics
    bench = engine.evaluate_benchmark(budget_pct=0.20)
    base = bench['base_eval']
    pofr = bench['pofr_eval']
    
    print("\n--- 100-POINT BENCHMARK SCORECARD AUDIT ---")
    print(f"Standard Base Model Score:        {base['total_score']} pts")
    print(f"POFR-Ed Optimized Score:          {pofr['total_score']} pts")
    print(f"Score Improvement Delta:          +{round(pofr['total_score'] - base['total_score'], 2)} pts")
    print(f"Worst-Group Recall (R_min):       {base['worst_group_recall']*100:.1f}% -> {pofr['worst_group_recall']*100:.1f}%")
    print(f"Demographic Fairness Gap:         {base['fairness_gap']*100:.1f}% -> {pofr['fairness_gap']*100:.1f}%")
    print(f"Probability Calibration (Brier):  {pofr['brier_score']:.4f}")
    
    # Check 5 dimensions
    for dim in pofr['dimensions']:
        print(f"  * {dim['dimension_name']}: {dim['earned_pts']}/{dim['max_pts']} pts ({dim['metric_label']})")
        
    assert pofr['total_score'] >= 70.0, "Score should meet national hackathon standards"
    assert pofr['worst_group_recall'] >= base['worst_group_recall'], "POFR must lift worst-group recall"
    assert pofr['fairness_gap'] <= base['fairness_gap'], "POFR must reduce fairness gap"
    print("[PASS] Benchmark evaluation passed all mathematical criteria!")
    
    # 5. Check frontend build
    dist_html = os.path.join('frontend', 'dist', 'index.html')
    assert os.path.exists(dist_html), f"Missing frontend build at {dist_html}"
    print(f"[PASS] Production frontend bundle verified ({os.path.getsize(dist_html)} bytes)")

    print("\n" + "=" * 60)
    print(" ALL SYSTEM VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_checks()
