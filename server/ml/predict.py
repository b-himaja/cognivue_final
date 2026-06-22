# === predict_transformer.py ===
import sys
import joblib
import numpy as np
import json

# === Load models ===
embedding_model = joblib.load("ml/models/embedding_model.pkl")
model_multilabel = joblib.load("ml/models/hybrid_multilabel_model.pkl")
scaler = joblib.load("ml/models/scaler.pkl")
mlb = joblib.load("ml/models/label_binarizer.pkl")

# === Input ===
text = sys.argv[1] if len(sys.argv) > 1 else ""
if not text:
    print(json.dumps({"error": "No text provided"}))
    sys.exit(1)

# === Encode & Scale ===
X_emb = embedding_model.encode([text])
X_scaled = scaler.transform(X_emb)

# === Predict ===
y_pred_probs = model_multilabel.predict_proba(X_scaled)[0]
threshold = 0.4
detected = [label for label, prob in zip(mlb.classes_, y_pred_probs) if prob > threshold]
confidences = {label: float(prob) for label, prob in zip(mlb.classes_, y_pred_probs)}

# === Output ===
result = {
    "mlPrediction": {
        "detectedPatterns": detected,
        "confidences": confidences
    }
}
print(json.dumps(result))
