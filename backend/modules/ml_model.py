"""
ML pipeline for risk / decision prediction.

Uses events collected at access-decision time to train a simple
RandomForest classifier that predicts the final decision
('ALLOW', 'CONDITIONAL', 'DENY') from contextual features.
"""

from __future__ import annotations

import os
from typing import Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from db import _get_db


MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "risk_decision_model.pkl")


def _load_events() -> pd.DataFrame:
  """
  Load ML events from MongoDB and return as DataFrame.
  Each event should contain the contextual features and
  the final decision label.
  """
  db = _get_db()
  docs = list(db.ml_events.find({}))
  if not docs:
      return pd.DataFrame()

  for d in docs:
      d.pop("_id", None)
  return pd.DataFrame(docs)


def train_decision_model() -> Tuple[dict, str]:
  """
  Train a RandomForest classifier to predict 'decision' based on context.
  Returns (metrics_dict, status_message).
  """
  df = _load_events()
  if df.empty:
      return {"samples": 0}, "No ML events available to train on."

  # Define target and features
  if "decision" not in df.columns:
      return {"samples": 0}, "ML events missing 'decision' field."

  y = df["decision"]

  feature_cols = [
      "failed_attempts",
      "access_hour",
      "device_trust_score",
      "resource_sensitivity",
      "user_department",
      "current_location",
      "last_location",
      "resource_required_departments_size",
      "user_id",
      "resource_id",
  ]

  # Ensure all required columns exist (fill missing with defaults)
  for col in feature_cols:
      if col not in df.columns:
          df[col] = None

  X = df[feature_cols]

  numeric_features = [
      "failed_attempts",
      "access_hour",
      "device_trust_score",
      "resource_sensitivity",
      "resource_required_departments_size",
  ]
  categorical_features = [
      "user_department",
      "current_location",
      "last_location",
      "user_id",
      "resource_id",
  ]

  preprocessor = ColumnTransformer(
      transformers=[
          ("num", "passthrough", numeric_features),
          ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
      ]
  )

  clf = RandomForestClassifier(
      n_estimators=200,
      max_depth=None,
      random_state=42,
      n_jobs=-1,
  )

  pipeline = Pipeline(
      steps=[
          ("preprocess", preprocessor),
          ("clf", clf),
      ]
  )

  X_train, X_test, y_train, y_test = train_test_split(
      X, y, test_size=0.2, random_state=42, stratify=y
  )

  pipeline.fit(X_train, y_train)

  y_pred = pipeline.predict(X_test)
  acc = accuracy_score(y_test, y_pred)
  report = classification_report(y_test, y_pred, output_dict=False)

  os.makedirs(MODEL_DIR, exist_ok=True)
  joblib.dump(pipeline, MODEL_PATH)

  metrics = {
      "samples": int(len(df)),
      "train_size": int(len(X_train)),
      "test_size": int(len(X_test)),
      "accuracy": float(acc),
      "classification_report": report,
  }
  return metrics, f"Model trained on {len(df)} events with accuracy {acc:.3f}"


def _load_model():
  if not os.path.exists(MODEL_PATH):
      return None
  return joblib.load(MODEL_PATH)


def predict_decision(context: dict) -> dict:
  """
  Predict decision for a given context using the trained model.
  Returns dict with prediction and probabilities.
  """
  model = _load_model()
  if model is None:
      return {"model_available": False}

  # Build feature row consistent with training
  row = {
      "failed_attempts": context.get("failed_attempts", 0),
      "access_hour": context.get("access_hour"),
      "device_trust_score": context.get("device_trust_score"),
      "resource_sensitivity": context.get("resource_sensitivity"),
      "user_department": context.get("user_department"),
      "current_location": context.get("current_location"),
      "last_location": context.get("last_location"),
      "resource_required_departments_size": len(
          context.get("resource_required_departments", []) or []
      ),
      "user_id": context.get("user_id"),
      "resource_id": context.get("resource_id"),
  }

  X = pd.DataFrame([row])
  pred = model.predict(X)[0]
  if hasattr(model, "predict_proba"):
      proba = model.predict_proba(X)[0]
      classes = list(model.classes_)
      probs = {cls: float(p) for cls, p in zip(classes, proba)}
  else:
      probs = {}

  return {
      "model_available": True,
      "predicted_decision": pred,
      "probabilities": probs,
  }

