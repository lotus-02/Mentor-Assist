import math
import numpy as np
import pandas as pd
from typing import Dict, Tuple, Any, List, Optional
from sklearn.metrics import brier_score_loss

class POFROptimizer:
    """
    Pareto-Optimal Fair Ranker (POFR)
    Post-processing optimizer that balances overall cohort recall against worst-group recall
    and demographic fairness parity under a strict budget constraint ceil(0.20 * N).
    """
    def __init__(self):
        # Default learned weights from cross-validation
        self.weights = {
            'sex_F': 1.05,
            'sex_M': 0.95,
            'school_MS': 1.10,
            'school_GP': 1.00
        }
        self.is_fitted = False

    def fit_weights(self, probs: np.ndarray, y_true: np.ndarray, df_demo: pd.DataFrame, budget_pct: float = 0.20):
        """
        Learns optimal demographic multipliers that maximize the 100-point hackathon metric.
        Eligible groups: sex (F, M) and school (GP, MS) with >= 10 rows and >= 3 positive examples.
        """
        N = len(probs)
        k = math.ceil(budget_pct * N)
        total_pos = y_true.sum()
        if total_pos == 0:
            return

        # Check eligibility for groups
        eligible_groups = []
        for col, val in [('sex', 'F'), ('sex', 'M'), ('school', 'GP'), ('school', 'MS')]:
            mask = (df_demo[col] == val).values
            n_g = mask.sum()
            p_g = (y_true[mask] == 1).sum()
            if n_g >= 10 and p_g >= 3:
                eligible_groups.append((col, val, f"{col}_{val}"))

        best_score = -1.0
        best_w = self.weights.copy()

        # Grid search Pareto multipliers
        w_f_range = [0.90, 0.95, 1.00, 1.05, 1.10, 1.15]
        w_ms_range = [0.90, 1.00, 1.08, 1.15, 1.25]

        for wf in w_f_range:
            for wms in w_ms_range:
                curr_weights = {
                    'sex_F': wf,
                    'sex_M': 1.00,
                    'school_GP': 1.00,
                    'school_MS': wms
                }
                scores = self.calculate_scores(probs, df_demo, curr_weights)
                
                # Strict top k selection
                top_idx = np.argsort(-scores)[:k]
                selected = np.zeros(N, dtype=bool)
                selected[top_idx] = True
                
                sel_pos = (y_true[selected] == 1).sum()
                ov_recall = sel_pos / total_pos if total_pos > 0 else 0
                
                recalls = {}
                for col, val, tag in eligible_groups:
                    mask = (df_demo[col] == val).values
                    pos_g = (y_true[mask] == 1).sum()
                    sel_g = (selected[mask] & (y_true[mask] == 1)).sum()
                    recalls[tag] = sel_g / pos_g if pos_g > 0 else 0.0
                
                r_min = min(recalls.values()) if recalls else 0.0
                sex_gap = abs(recalls.get('sex_F', 0) - recalls.get('sex_M', 0))
                school_gap = abs(recalls.get('school_GP', 0) - recalls.get('school_MS', 0))
                fairness_gap = max(sex_gap, school_gap)
                
                # Hackathon objective: 40 * Recall + 25 * R_min + 20 * (1 - Gap)
                composite_score = (40.0 * ov_recall) + (25.0 * r_min) + (20.0 * max(0.0, 1.0 - fairness_gap))
                
                if composite_score > best_score:
                    best_score = composite_score
                    best_w = curr_weights.copy()

        self.weights = best_w
        self.is_fitted = True

    def calculate_scores(self, probs: np.ndarray, df_demo: pd.DataFrame, custom_weights: Optional[Dict[str, float]] = None) -> np.ndarray:
        """
        Computes POFR post-processed ranking scores:
        score_i = p_i * multiplier_sex * multiplier_school
        """
        w = custom_weights if custom_weights is not None else self.weights
        scores = probs.copy()
        
        sex_f_mask = (df_demo['sex'] == 'F').values
        sex_m_mask = (df_demo['sex'] == 'M').values
        school_gp_mask = (df_demo['school'] == 'GP').values
        school_ms_mask = (df_demo['school'] == 'MS').values
        
        mult = np.ones_like(scores, dtype=float)
        mult[sex_f_mask] *= w.get('sex_F', 1.0)
        mult[sex_m_mask] *= w.get('sex_M', 1.0)
        mult[school_gp_mask] *= w.get('school_GP', 1.0)
        mult[school_ms_mask] *= w.get('school_MS', 1.0)
        
        return scores * mult

    def select_budget(self, scores: np.ndarray, budget_pct: float = 0.20) -> np.ndarray:
        """
        Applies strict budget constraint: exactly ceil(budget_pct * N) students are selected.
        Returns a boolean mask of length N.
        """
        N = len(scores)
        k = math.ceil(budget_pct * N)
        sorted_indices = np.argsort(-scores)
        selected_mask = np.zeros(N, dtype=bool)
        selected_mask[sorted_indices[:k]] = True
        return selected_mask
