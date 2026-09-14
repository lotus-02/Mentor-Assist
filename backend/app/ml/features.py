import pandas as pd
import numpy as np
from typing import Tuple

CATEGORICAL_FEATURES = [
    'school', 'sex', 'address', 'famsize', 'Pstatus', 'Mjob', 'Fjob',
    'reason', 'guardian', 'schoolsup', 'famsup', 'paid', 'activities',
    'nursery', 'higher', 'internet', 'romantic'
]

NUMERIC_FEATURES = [
    'age', 'Medu', 'Fedu', 'traveltime', 'studytime', 'failures',
    'famrel', 'freetime', 'goout', 'Dalc', 'Walc', 'health', 'absences',
    'G1', 'G2', 'grade_velocity', 'risk_index', 'effort_ratio'
]

DEFAULTS = {
    'school': 'GP', 'sex': 'F', 'age': 17, 'address': 'U', 'famsize': 'GT3',
    'Pstatus': 'T', 'Medu': 2, 'Fedu': 2, 'Mjob': 'other', 'Fjob': 'other',
    'reason': 'course', 'guardian': 'mother', 'traveltime': 1, 'studytime': 2,
    'failures': 0, 'schoolsup': 'no', 'famsup': 'no', 'paid': 'no',
    'activities': 'no', 'nursery': 'yes', 'higher': 'yes', 'internet': 'yes',
    'romantic': 'no', 'famrel': 4, 'freetime': 3, 'goout': 3, 'Dalc': 1,
    'Walc': 1, 'health': 3, 'absences': 4, 'G1': 10, 'G2': 10
}

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes required competition domain features:
    1. grade_velocity = G2 - G1
    2. risk_index = (20 - G2) * (failures + 1)
    3. effort_ratio = studytime / (absences + 1)
    Also fills sensible defaults for any missing features so custom/partial CSVs process reliably.
    """
    df = df.copy()
    
    # Enforce absence of G3 in features
    if 'G3' in df.columns:
        raise ValueError("CRITICAL LEAKAGE DETECTED: 'G3' must never be passed to feature engineering!")
    
    # Fill defaults for any missing columns
    for col, default_val in DEFAULTS.items():
        if col not in df.columns:
            df[col] = default_val
        else:
            # Handle empty/NaN values
            df[col] = df[col].fillna(default_val)
            
    # Cast numerics properly
    for col in ['age', 'Medu', 'Fedu', 'traveltime', 'studytime', 'failures',
                'famrel', 'freetime', 'goout', 'Dalc', 'Walc', 'health', 'absences', 'G1', 'G2']:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(DEFAULTS[col])
        
    df['grade_velocity'] = (df['G2'] - df['G1']).astype(float)
    df['risk_index'] = ((20 - df['G2']) * (df['failures'] + 1)).astype(float)
    df['effort_ratio'] = (df['studytime'] / (df['absences'] + 1)).astype(float)
    
    return df

def prepare_training_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Extracts binary target support_needed = 1 if G3 < 10 else 0,
    then purges G3 completely to avoid leakage.
    """
    df = df.copy()
    if 'G3' not in df.columns:
        raise ValueError("Ground truth column 'G3' required for training/eval dataset.")
        
    y = (df['G3'] < 10).astype(int)
    X = df.drop(columns=['G3'])
    X = engineer_features(X)
    return X, y
