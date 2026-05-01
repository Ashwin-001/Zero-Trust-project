import sys
import os
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier

sys.path.append('d:/All/ZeroTrust/backend')
from modules.ml_model import _load_events, feature_cols, numeric_features, categorical_features

df = _load_events()
print("Base ROWS:", len(df))

if "resource_required_departments" in df.columns:
    df["resource_required_departments_size"] = df["resource_required_departments"].apply(
        lambda x: len(x) if isinstance(x, list) else 0
    )

for col in numeric_features:
    if col not in df.columns:
        df[col] = 0
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

for col in categorical_features:
    if col not in df.columns:
        df[col] = "missing"
    df[col] = df[col].fillna("missing").astype(str)

X = df[feature_cols]
y = df["decision"]

print("X NaN counts:")
print(X.isna().sum())
print("Y NaN count:", y.isna().sum())

preprocessor = ColumnTransformer(
    transformers=[
        ("num", "passthrough", numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
    ]
)

try:
    X_trans = preprocessor.fit_transform(X)
    if hasattr(X_trans, 'data'): # sparse
        nans = np.isnan(X_trans.data).sum()
    else:
        nans = np.isnan(X_trans).sum()
    print("Transformed X NaNs:", nans)
    
    clf = RandomForestClassifier(n_estimators=10, random_state=42)
    clf.fit(X_trans, y)
    print("Fit successful!")
except Exception as e:
    import traceback
    traceback.print_exc()
