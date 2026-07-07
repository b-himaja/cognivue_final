import sys
import joblib
import json
import numpy as np
import os
import re

USE_TFIDF = os.environ.get("USE_TFIDF", "true").lower() == "true"

text = sys.argv[1] if len(sys.argv) > 1 else ""
if not text:
    print(json.dumps({"error": "No text provided"}))
    sys.exit(1)

if USE_TFIDF:
    vectorizer = joblib.load("ml/models/tfidf_vectorizer.pkl")
    model = joblib.load("ml/models/multilabel_model.pkl")
    mlb = joblib.load("ml/models/label_binarizer.pkl")

    # Split into short segments so each chunk resembles the training snippets.
    # Taking the max probability per class across all segments gives the
    # most-severe signal from the page rather than a diluted average.
    segments = [s.strip() for s in re.split(r'[.!?\n]+', text) if len(s.strip()) > 3]
    if not segments:
        segments = [text]

    X_all = vectorizer.transform(segments)
    # shape: (n_segments, n_classes) — take column-wise max
    y_probs_matrix = model.predict_proba(X_all)
    y_pred_probs = np.max(y_probs_matrix, axis=0)

else:
    # Original sentence-transformers model (~88MB, requires sentence-transformers)
    embedding_model = joblib.load("ml/models/embedding_model.pkl")
    model_multilabel = joblib.load("ml/models/hybrid_multilabel_model.pkl")
    scaler = joblib.load("ml/models/scaler.pkl")
    mlb = joblib.load("ml/models/label_binarizer.pkl")

    X_emb = embedding_model.encode([text])
    X_scaled = scaler.transform(X_emb)
    y_pred_probs = model_multilabel.predict_proba(X_scaled)[0]

threshold = 0.4
detected = [
    label for label, prob in zip(mlb.classes_, y_pred_probs)
    if prob > threshold and label != "Not Dark Pattern"
]
confidences = {label: float(prob) for label, prob in zip(mlb.classes_, y_pred_probs)}

print(json.dumps({
    "mlPrediction": {
        "detectedPatterns": detected,
        "confidences": confidences,
        "confidence": float(max(y_pred_probs)) if len(y_pred_probs) > 0 else 0.0,
    }
}))
