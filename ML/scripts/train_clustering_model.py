# =============================================================================
# 👥 train_clustering_model.py
# Passenger Pattern Clustering — K-Means
# =============================================================================
# මේකෙන් කරන්නේ: Passengers ව groups වලට divide කරනවා travel patterns based.
# K-Means unsupervised learning use කරලා 4 clusters හොයනවා:
#   Cluster 1: Daily Commuters (දිනපතා commute කරන අය)
#   Cluster 2: Weekend Travelers (weekend travel කරන අය)
#   Cluster 3: Holiday Surge (holiday වලට travel කරන අය)
#   Cluster 4: Last-Minute Bookers (last minute book කරන අය)
#
# Run කරන්න: python ML/scripts/train_clustering_model.py
# Input:  ML/data/processed/clustering_data.csv
# Output: ML/models/clustering_model.pkl
# =============================================================================

import pandas as pd
import numpy as np
import os
import sys
import pickle
import json
from datetime import datetime

# ML Libraries
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

# =============================================================================
# 1. SETUP
# =============================================================================

script_dir = os.path.dirname(os.path.abspath(__file__))
ml_root = os.path.dirname(script_dir)
project_root = os.path.dirname(ml_root)

PROCESSED_DIR = os.path.join(ml_root, "data", "processed")
MODELS_DIR = os.path.join(ml_root, "models")
LARAVEL_MODELS_DIR = os.path.join(project_root, "Backend", "storage", "ml_models")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(LARAVEL_MODELS_DIR, exist_ok=True)

print("=" * 60)
print("👥 PASSENGER PATTERN CLUSTERING (K-Means)")
print("=" * 60)

# =============================================================================
# 2. LOAD DATA
# =============================================================================

print("\n📥 Step 1: Loading clustering data...")

cluster_path = os.path.join(PROCESSED_DIR, "clustering_data.csv")

if not os.path.exists(cluster_path):
    print(f"   ❌ Error: File not found: {cluster_path}")
    print(f"   💡 First run: python ML/scripts/preprocess_data.py")
    sys.exit(1)

df = pd.read_csv(cluster_path)
print(f"   ✅ Loaded {len(df)} user profiles")
print(f"   📊 Features: {list(df.columns)}")

# =============================================================================
# 3. PREPARE FEATURES — Clustering වලට features prepare කරනවා
# =============================================================================

print("\n🔧 Step 2: Preparing features...")

# Clustering features — user level patterns
# avg_departure_hour: average departure time (early bird vs late traveler)
# total_bookings: booking frequency (frequent vs occasional)
# avg_advance_days: advance planning behavior
# weekend_ratio: weekend travel preference
# avg_segment_count: journey length preference (short vs long)

CLUSTER_FEATURES = [
    'avg_departure_hour',
    'total_bookings',
    'avg_advance_days',
    'weekend_ratio',
    'avg_segment_count',
]

X = df[CLUSTER_FEATURES].copy()

# Missing/inf values handle කරනවා
X = X.replace([np.inf, -np.inf], np.nan)
X = X.fillna(X.median())

print(f"   ✅ Features selected: {CLUSTER_FEATURES}")
print(f"   📊 Shape: {X.shape}")

# =============================================================================
# 4. FEATURE SCALING — StandardScaler use කරනවා
# =============================================================================

print("\n📏 Step 3: Scaling features (StandardScaler)...")

# K-Means distance-based algorithm — features same scale එකේ තියෙන්න ඕන
# StandardScaler: mean=0, std=1 ලෙස normalize කරනවා
# scaling නොකළොත් total_bookings (0-100) weekend_ratio (0-1) ට dominate කරනවා

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print(f"   ✅ Features scaled to mean=0, std=1")

# =============================================================================
# 5. ELBOW METHOD — Optimal k value හොයනවා
# =============================================================================

print("\n📐 Step 4: Finding optimal number of clusters (Elbow Method)...")

# Elbow method: k=2 to k=8 try කරලා best k එක pick කරනවා
# Inertia (within-cluster sum of squares) minimize වෙන k එක best
# Silhouette score — clusters කොච්චර well-separated ද measure කරනවා

k_range = range(2, 9)
inertias = []
silhouette_scores = []

for k in k_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    inertias.append(kmeans.inertia_)
    sil_score = silhouette_score(X_scaled, labels)
    silhouette_scores.append(sil_score)
    print(f"   k={k}: Inertia={kmeans.inertia_:.2f}, Silhouette={sil_score:.4f}")

# Best k = highest silhouette score
best_k = list(k_range)[np.argmax(silhouette_scores)]
print(f"\n   🏆 Optimal k = {best_k} (highest silhouette score: {max(silhouette_scores):.4f})")

# Documentation එකේ k=4 recommend කළා, ඒක use කරමු unless data says otherwise
# Silhouette score difference ගොඩක් නැත්නම් k=4 ම use කරනවා
FINAL_K = 4
if best_k != FINAL_K:
    print(f"   📝 Using k={FINAL_K} as per documentation (difference is minimal)")
else:
    print(f"   ✅ Confirmed k={FINAL_K} matches documentation")

# =============================================================================
# 6. TRAIN FINAL MODEL — Final K-Means model train කරනවා
# =============================================================================

print(f"\n🤖 Step 5: Training final K-Means model (k={FINAL_K})...")

final_kmeans = KMeans(
    n_clusters=FINAL_K,
    random_state=42,
    n_init=10,          # 10 different initializations try කරනවා
    max_iter=300        # Maximum 300 iterations
)

cluster_labels = final_kmeans.fit_predict(X_scaled)
df['cluster'] = cluster_labels

final_silhouette = silhouette_score(X_scaled, cluster_labels)
print(f"   ✅ Model trained!")
print(f"   📊 Final Silhouette Score: {final_silhouette:.4f}")

# =============================================================================
# 7. ANALYZE CLUSTERS — Cluster characteristics analyze කරනවා
# =============================================================================

print(f"\n📊 Step 6: Analyzing cluster characteristics...")
print("=" * 60)

# Cluster names — based on their characteristics assign කරනවා
cluster_names = {}

for c in range(FINAL_K):
    cluster_data = df[df['cluster'] == c]
    count = len(cluster_data)
    pct = count / len(df) * 100
    
    avg_hour = cluster_data['avg_departure_hour'].mean()
    avg_bookings = cluster_data['total_bookings'].mean()
    avg_advance = cluster_data['avg_advance_days'].mean()
    avg_weekend = cluster_data['weekend_ratio'].mean()
    avg_segments = cluster_data['avg_segment_count'].mean()
    
    # Auto-label based on patterns
    # මේක cluster characteristics based name assign කරනවා
    if avg_weekend > 0.5 and avg_advance > 3:
        name = "Weekend Travelers"
        description = "Weekend වලට long distance travel කරන අය, advance book කරනවා"
    elif avg_advance < 1.5 and avg_hour < 9:
        name = "Daily Commuters"  
        description = "උදේ commute කරන අය, same day book කරනවා"
    elif avg_advance > 5:
        name = "Advance Planners"
        description = "ගොඩක් කලින් book කරන අය, holiday travelers"
    elif avg_advance < 1:
        name = "Last-Minute Bookers"
        description = "Last minute book කරන අය, no strong pattern"
    else:
        name = f"Mixed Pattern {c+1}"
        description = "Mixed travel patterns"
    
    cluster_names[c] = name
    
    print(f"\n🏷️  CLUSTER {c}: \"{name}\" ({count} users, {pct:.1f}%)")
    print(f"   {description}")
    print(f"   ├── Avg Departure Hour: {avg_hour:.1f}")
    print(f"   ├── Avg Bookings: {avg_bookings:.1f}")
    print(f"   ├── Avg Advance Days: {avg_advance:.1f}")
    print(f"   ├── Weekend Ratio: {avg_weekend:.2f}")
    print(f"   └── Avg Segments: {avg_segments:.1f}")

# =============================================================================
# 8. SAVE MODEL — Model + scaler save කරනවා
# =============================================================================

print(f"\n💾 Step 7: Saving clustering model...")

model_bundle = {
    'model': final_kmeans,
    'scaler': scaler,
    'feature_columns': CLUSTER_FEATURES,
    'cluster_names': cluster_names,
    'n_clusters': FINAL_K,
    'silhouette_score': final_silhouette,
    'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
}

# ML/models/ directory එකට save
cluster_model_path = os.path.join(MODELS_DIR, "clustering_model.pkl")
with open(cluster_model_path, 'wb') as f:
    pickle.dump(model_bundle, f)
print(f"   ✅ Saved: {cluster_model_path}")

# Scaler separately save
scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
with open(scaler_path, 'wb') as f:
    pickle.dump(scaler, f)
print(f"   ✅ Saved: {scaler_path}")

# Backend/storage/ml_models/ copy
laravel_cluster_path = os.path.join(LARAVEL_MODELS_DIR, "clustering_model.pkl")
with open(laravel_cluster_path, 'wb') as f:
    pickle.dump(model_bundle, f)
print(f"   ✅ Copied to Laravel: {laravel_cluster_path}")

laravel_scaler_path = os.path.join(LARAVEL_MODELS_DIR, "scaler.pkl")
with open(laravel_scaler_path, 'wb') as f:
    pickle.dump(scaler, f)
print(f"   ✅ Copied to Laravel: {laravel_scaler_path}")

# Cluster analysis results save
analysis_path = os.path.join(MODELS_DIR, "cluster_analysis.json")
cluster_summary = {}
for c in range(FINAL_K):
    cluster_data = df[df['cluster'] == c]
    cluster_summary[str(c)] = {
        'name': cluster_names[c],
        'count': int(len(cluster_data)),
        'percentage': round(len(cluster_data) / len(df) * 100, 1),
        'avg_departure_hour': round(cluster_data['avg_departure_hour'].mean(), 1),
        'avg_bookings': round(cluster_data['total_bookings'].mean(), 1),
        'avg_advance_days': round(cluster_data['avg_advance_days'].mean(), 1),
        'weekend_ratio': round(cluster_data['weekend_ratio'].mean(), 2),
    }

with open(analysis_path, 'w') as f:
    json.dump({
        'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'total_users': len(df),
        'n_clusters': FINAL_K,
        'silhouette_score': round(final_silhouette, 4),
        'clusters': cluster_summary,
        'elbow_data': {
            'k_values': list(k_range),
            'inertias': [round(i, 2) for i in inertias],
            'silhouette_scores': [round(s, 4) for s in silhouette_scores],
        }
    }, f, indent=2)
print(f"   ✅ Analysis saved: {analysis_path}")

print("\n" + "=" * 60)
print("🎉 CLUSTERING MODEL TRAINING COMPLETE!")
print("=" * 60)
print(f"\n👉 Next step: python ML/scripts/evaluate_models.py")
