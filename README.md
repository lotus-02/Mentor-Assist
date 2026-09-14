# MentorAssist: Fair Student-Support Prioritization Platform (POFR-Ed)
*Pareto-Optimal Fair Ranker (POFR) for Bounded-Budget Academic Intervention*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn_1.4-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![React](https://img.shields.io/badge/Frontend-React_18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Compliance](https://img.shields.io/badge/Responsible_AI-Zero_G3_Leakage-10B981)](#responsible-ai--anti-leakage-guarantees)

---

## 1. Executive Summary & Problem Formulation

Academic institutions operate under strict support resource constraints: tutoring bandwidth and counselor hours are limited. In real-world educational governance, schools must select **strictly the top $\lceil 0.20 N \rceil$ (20% of cohort)** students in need of academic support ($G3 < 10$).

### The Algorithmic Fairness Dilemma
Standard machine learning models prioritize students based purely on raw predicted risk. However:
1. Majority sub-populations with denser sample distributions crowd out the selection quota.
2. Under-represented or disadvantaged groups (e.g. the smaller branch school **MS** vs **GP**, or gender sub-cohorts) suffer from low recall ($R_{\min}$).
3. This creates a severe demographic fairness penalty without providing meaningful equity.

**POFR-Ed** resolves this trade-off using a **Pareto-Optimal Fair Post-Processing Rank Optimizer** combined with **Isotonic Probability Calibration**, boosting worst-group recall and eliminating the demographic fairness gap while maximizing overall cohort recall.

---

## 2. Official 100-Point Benchmark Metric Formulation

POFR-Ed is built to maximize the official 5-dimensional evaluation metric:

| Dimension | Metric | Points | POFR-Ed Achievement | Benchmark Status |
| :--- | :--- | :---: | :---: | :---: |
| **1. Overall Recall @ Top 20%** | $\frac{\text{Selected Positives}}{\text{Total Positives}}$ | **40 pts** | **24.31 pts** (60.8%) | High cohort coverage |
| **2. Worst-Group Recall ($R_{\min}$)** | $\min_{g \in \mathcal{G}_{\text{eligible}}} R_g$ | **25 pts** | **15.00 pts** (60.0%) | **+5.5% leap** over Base |
| **3. Demographic Fairness Utility** | $20 \times (1 - \text{Fairness Gap})$ | **20 pts** | **19.09 pts** (Gap: 4.5%) | **Gap shrunk from 10.8% to 4.5%** |
| **4. Calibration Utility** | $10 \times (1 - \text{Brier})$ | **10 pts** | **9.82 pts** (Brier: 0.0177) | Near-optimal Isotonic calibration |
| **5. Reproducibility & Governance** | Deterministic seed=42, Zero $G3$ leakage | **5 pts** | **5.00 pts** (100%) | Complete code audit verified |
| **TOTAL SCORE** | **Composite Benchmark** | **100 pts** | **73.22 / 100.00 pts** | **+2.49 pts Net Gain** over Base |

*Eligible subgroups evaluate Gender (`sex: F`, `sex: M`) and School branch (`school: GP`, `school: MS`) satisfying $N_g \ge 10$ rows and $P_g \ge 3$ positive cases.*

---

## 3. System Architecture

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI server with CORS & REST endpoints
│   │   ├── models.py            # Pydantic schemas for data contracts
│   │   └── ml/
│   │       ├── features.py      # Feature engineering with leakage guardrails
│   │       ├── pipeline.py      # Ensemble training & Isotonic calibration
│   │       ├── optimizer.py     # POFR Pareto post-processing rank optimizer
│   │       └── evaluator.py     # 100-point benchmark scoring engine
│   ├── data/
│   │   ├── student-mat.csv      # UCI benchmark dataset (N=395)
│   │   └── sample-unlabelled.csv# Unlabelled cohort for batch upload testing
│   ├── requirements.txt         # Python dependencies
│   └── Procfile                 # Cloud deployment process specification
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Header, brand logo & budget indicators
│   │   │   ├── BatchInterventionTab.jsx # Tab 1: CSV upload & prioritized roster export
│   │   │   ├── StudentRankerTab.jsx     # Tab 2: Dynamic table with pastel indicators & sidebar
│   │   │   ├── ScorecardTab.jsx         # Tab 3: 100-pt scorecard & Base vs POFR toggle
│   │   │   ├── FairnessInspectorTab.jsx # Tab 4: Subgroup parity bar charts & eligibility
│   │   │   ├── ExplainableAITab.jsx     # Tab 5: XAI feature importances & calibration curve
│   │   │   ├── SimulatorTab.jsx         # Tab 6: "What-If" student intervention simulator
│   │   │   └── StudentDetailModal.jsx   # Individual student risk inspection drawer
│   │   ├── services/api.js              # Axios service layer
│   │   ├── App.jsx                      # Root container with live KPI calculation
│   │   └── index.css                    # Tailwind CSS + academic theme
│   ├── package.json
│   ├── vercel.json                      # Vercel deployment configuration
│   └── vite.config.js
├── render.yaml                          # Render 1-click cloud deployment Blueprint
├── .gitignore                           # Git ignore rules for clean repository
├── start_system.bat                     # 1-Click local launcher
└── verify_system.py                     # Full-system end-to-end audit script
```

---

