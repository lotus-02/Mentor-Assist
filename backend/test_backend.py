import os
import sys

# Ensure backend dir is on python path
sys.path.insert(0, os.path.dirname(__file__))

from app.ml.pipeline import engine
from app.ml.features import engineer_features
import pandas as pd

def test_full_pipeline():
    print("=== 1. Testing Engine Initialization & Training ===")
    engine.initialize_and_train()
    assert engine.is_trained, "Engine should be trained"
    print("Engine trained successfully!")

    print("\n=== 2. Testing Feature Leakage Protection ===")
    leakage_df = pd.DataFrame([{'G1': 10, 'G2': 11, 'G3': 9, 'failures': 1, 'studytime': 2, 'absences': 3}])
    try:
        engineer_features(leakage_df)
        print("ERROR: Leakage check failed to catch G3!")
        sys.exit(1)
    except ValueError as e:
        print("SUCCESS: G3 leakage successfully caught and blocked:", e)

    print("\n=== 3. Testing Cohort Prediction ===")
    sample_df = engine.df_train.head(50).copy()
    ranked = engine.predict_cohort(sample_df, budget_pct=0.20, use_pofr=True)
    assert len(ranked) == 50, f"Expected 50 ranked students, got {len(ranked)}"
    # Verify strict top 20% budget selection: ceil(0.20 * 50) = 10 selected
    selected_count = sum(1 for s in ranked if s['selected_for_support'])
    assert selected_count == 10, f"Expected 10 selected students, got {selected_count}"
    print(f"Top 20% budget constraint strictly verified: {selected_count} / {len(ranked)} selected.")
    print("Top ranked student:", ranked[0]['id'], "POFR score:", ranked[0]['pofr_score'], "Risk:", ranked[0]['calibrated_risk_prob'])

    print("\n=== 4. Testing Benchmark 100-Point Evaluation & Comparison ===")
    comp = engine.evaluate_benchmark(budget_pct=0.20)
    base_score = comp['base_eval']['total_score']
    pofr_score = comp['pofr_eval']['total_score']
    print(f"Base Model Score: {base_score} pts")
    print(f"POFR-Ed Score:   {pofr_score} pts")
    print(f"Score Delta:     {comp['comparisons'][0]['delta']} pts")
    print(f"Worst Group Recall: Base = {comp['base_eval']['worst_group_recall']*100:.1f}% -> POFR = {comp['pofr_eval']['worst_group_recall']*100:.1f}%")
    print(f"Fairness Gap:       Base = {comp['base_eval']['fairness_gap']*100:.1f}% -> POFR = {comp['pofr_eval']['fairness_gap']*100:.1f}%")
    assert pofr_score > 0 and pofr_score <= 100, "Score should be in [0, 100]"

    print("\n=== 5. Testing What-If Simulation ===")
    sample_student = engine.df_train.iloc[0].to_dict()
    sim = engine.simulate_student(sample_student, modified_studytime=4, modified_absences=1)
    print("Simulation result:", sim)
    assert 'risk_change_pct' in sim, "Simulation result must contain risk_change_pct"

    print("\nALL BACKEND UNIT AND PIPELINE TESTS PASSED!")

if __name__ == "__main__":
    test_full_pipeline()
