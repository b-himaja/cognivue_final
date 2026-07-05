import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split
from sklearn.multiclass import OneVsRestClassifier
from sklearn.metrics import classification_report
import joblib
import os

df = pd.read_csv("server/ml/dataset.csv")

df["labels"] = df["Pattern Category"].apply(
    lambda x: [label.strip() for label in str(x).split(",") if label.strip()]
)
df = df[~df["Pattern Category"].str.contains("Forced Action", case=False, na=False)].reset_index(drop=True)

mlb = MultiLabelBinarizer()
y = mlb.fit_transform(df["labels"])
print("Classes:", mlb.classes_)

vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    max_features=10000,
    sublinear_tf=True,
    min_df=2,
    strip_accents="unicode",
    lowercase=True,
)
X = vectorizer.fit_transform(df["text"].fillna(""))

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Oversample minority labels by duplicating rows
rng = np.random.default_rng(42)
pos_counts = y_train.sum(axis=0).astype(int)
target = max(int(pos_counts.max()), 20)
X_parts, y_parts = [X_train.toarray()], [y_train]
for i in range(y_train.shape[1]):
    cur = pos_counts[i]
    if cur >= target or cur == 0:
        continue
    idx = np.where(y_train[:, i] == 1)[0]
    chosen = rng.choice(idx, size=target - cur, replace=True)
    X_parts.append(X_train.toarray()[chosen])
    y_parts.append(y_train[chosen])
X_res = np.vstack(X_parts)
y_res = np.vstack(y_parts)
perm = rng.permutation(X_res.shape[0])
X_res, y_res = X_res[perm], y_res[perm]

model = OneVsRestClassifier(LogisticRegression(max_iter=2000, class_weight="balanced", C=1.0))
model.fit(X_res, y_res)

y_pred = model.predict(X_test)
print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=mlb.classes_))

os.makedirs("server/ml/models", exist_ok=True)
joblib.dump(vectorizer, "server/ml/models/tfidf_vectorizer.pkl")
joblib.dump(model, "server/ml/models/multilabel_model.pkl")
joblib.dump(mlb, "server/ml/models/label_binarizer.pkl")
print("\nLightweight TF-IDF model saved!")
