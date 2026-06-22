# train_transformer_balanced_fixed.py
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import MultiLabelBinarizer, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.multiclass import OneVsRestClassifier
from sklearn.metrics import classification_report
import joblib
import os

# === Load dataset ===
df = pd.read_csv("server/ml/dataset.csv")

# --- Preprocess labels ---
df["labels"] = df["Pattern Category"].apply(
    lambda x: [label.strip() for label in str(x).split(",") if label.strip()]
)

# Remove rows that mention 'Forced Action' anywhere in Pattern Category (if desired)
df = df[~df["Pattern Category"].str.contains("Forced Action", case=False, na=False)].reset_index(drop=True)

# === Encode labels ===
mlb = MultiLabelBinarizer()
y_multilabel = mlb.fit_transform(df["labels"])

print("Classes:", mlb.classes_)

# === Load Sentence Transformer ===
print("Loading transformer model (DistilBERT)...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# === Generate embeddings ===
print("Generating embeddings...")
X_embeddings = embedding_model.encode(df["text"].tolist(), show_progress_bar=True)

# === Scale embeddings ===
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_embeddings)

# === Split ===
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_multilabel, test_size=0.2, random_state=42
)

# === Show class distribution BEFORE resampling ===
def print_label_counts(y, classes, title=""):
    counts = y.sum(axis=0)
    print(title)
    for cls, c in zip(classes, counts):
        print(f"  {cls}: {int(c)}")
    return counts

print_label_counts(y_train, mlb.classes_, title="\nLabel counts BEFORE resampling (train):")

# === Label-wise oversampling by duplication ===
def oversample_multilabel_by_duplication(X, y, target=None, random_state=42):
    """
    Oversample minority labels by duplicating examples that contain them.
    X : ndarray (n_samples, n_features)
    y : ndarray (n_samples, n_labels)  (binary multi-hot)
    target : int or None -> desired positive count per label. If None -> max count among labels.
    Returns (X_res, y_res)
    """
    rng = np.random.default_rng(random_state)
    n_samples, n_labels = y.shape

    # positive counts per label
    pos_counts = y.sum(axis=0).astype(int)
    if target is None:
        target = int(max(pos_counts))  # bring all labels up to the current max
        # but ensure target at least some reasonable minimum
        target = max(target, 20)

    X_list = [X.copy()]
    y_list = [y.copy()]

    for i in range(n_labels):
        cur = pos_counts[i]
        if cur >= target or cur == 0:
            # skip labels already at/above target or completely missing
            continue

        # indices where this label is present
        pos_idx = np.where(y[:, i] == 1)[0]
        if len(pos_idx) == 0:
            continue  # nothing to oversample

        # how many additional samples needed
        need = target - cur
        # sample with replacement from positive indices
        chosen = rng.choice(pos_idx, size=need, replace=True)

        X_list.append(X[chosen])
        y_list.append(y[chosen])

    # concatenate and shuffle
    X_res = np.vstack(X_list)
    y_res = np.vstack(y_list)

    # shuffle
    perm = rng.permutation(X_res.shape[0])
    return X_res[perm], y_res[perm]

# Choose target balance strategy:
# - target=None uses current max positive count among labels (avoids exploding dataset).
# - You may set target explicitly (e.g., 200) depending on desired dataset size.
X_resampled, y_resampled = oversample_multilabel_by_duplication(X_train, y_train, target=None, random_state=42)

print_label_counts(y_resampled, mlb.classes_, title="\nLabel counts AFTER resampling (train):")
print(f"\nResampled training shape: X={X_resampled.shape}, y={y_resampled.shape}")

# === Train classifier with class weighting ===
base_model = LogisticRegression(max_iter=2000, class_weight='balanced')
model_multilabel = OneVsRestClassifier(base_model)
model_multilabel.fit(X_resampled, y_resampled)

# === Evaluate ===
y_pred = model_multilabel.predict(X_test)
print("\n=== Multi-Label Classification Report ===")
print(classification_report(y_test, y_pred, target_names=mlb.classes_))

# === Save models ===
os.makedirs("server/ml/models", exist_ok=True)
joblib.dump(model_multilabel, "server/ml/models/hybrid_multilabel_model.pkl")
joblib.dump(scaler, "server/ml/models/scaler.pkl")
joblib.dump(mlb, "server/ml/models/label_binarizer.pkl")
joblib.dump(embedding_model, "server/ml/models/embedding_model.pkl")

print("\nBalanced DistilBERT-based model trained and saved successfully!")
