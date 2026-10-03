# =============================================================================
# 📈 evaluate_models.py
# Model Evaluation & Report Generation
# =============================================================================
# මේකෙන් කරන්නේ: Trained models load කරලා test data මත evaluate කරනවා.
# Metrics, charts, comparison report generate කරනවා.
#
# Run කරන්න: python ML/scripts/evaluate_models.py
# Output: ML/models/evaluation_report.json, ML/models/charts/
# =============================================================================

import pandas as pd
import numpy as np
import os
import sys
import pickle
import json
from datetime import datetime

# ML Libraries
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    mean_absolute_percentage_error,
    silhouette_score
)

try:
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend — server එකේ display නැති නිසා
    import matplotlib.pyplot as plt
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    print("⚠️  matplotlib not installed — charts will be skipped")

# =============================================================================
# 1. SETUP
# =============================================================================

script_dir = os.path.dirname(os.path.abspath(__file__))
ml_root = os.path.dirname(script_dir)

PROCESSED_DIR = os.path.join(ml_root, "data", "processed")
MODELS_DIR = os.path.join(ml_root, "models")
CHARTS_DIR = os.path.join(MODELS_DIR, "charts")

os.makedirs(CHARTS_DIR, exist_ok=True)

print("=" * 60)
print("📈 MODEL EVALUATION & REPORT")
print("=" * 60)

# =============================================================================
# 2. LOAD MODELS & TEST DATA
# =============================================================================

print("\n📥 Step 1: Loading models and test data...")

# Load test data
test_path = os.path.join(PROCESSED_DIR, "demand_test.csv")
test_df = pd.read_csv(test_path)
print(f"   ✅ Test data loaded: {len(test_df)} records")

# Load XGBoost model
xgb_path = os.path.join(MODELS_DIR, "demand_model.pkl")
with open(xgb_path, 'rb') as f:
    xgb_model = pickle.load(f)
print(f"   ✅ XGBoost model loaded")

# Load Random Forest model
rf_path = os.path.join(MODELS_DIR, "demand_model_rf.pkl")
if os.path.exists(rf_path):
    with open(rf_path, 'rb') as f:
        rf_model = pickle.load(f)
    print(f"   ✅ Random Forest model loaded")
else:
    rf_model = None
    print(f"   ⚠️  Random Forest model not found, skipping")

# Feature columns
FEATURE_COLUMNS = [
    'route_id', 'boarding_stop_index', 'day_of_week', 'hour_of_day',
    'is_weekend', 'is_holiday', 'is_month_end', 'historical_avg_demand',
    'bus_type_encoded',
]

X_test = test_df[FEATURE_COLUMNS]
y_test = test_df['actual_demand']

# =============================================================================
# 3. DEMAND MODEL EVALUATION
# =============================================================================

print("\n📊 Step 2: Evaluating Demand Prediction Models...")

# XGBoost predictions
xgb_pred = np.maximum(xgb_model.predict(X_test), 0)

# Metrics calculate කරනවා
# MAE: Average කොච්චර passengers off ද prediction එක
# RMSE: Big errors වලට penalty වැඩි — MAE වගේම but large errors penalize
# R²: Model එක data explain කරන ප්‍රමාණය (1.0 = perfect)
# MAPE: Percentage error — relative accuracy

mask = y_test > 0
xgb_metrics = {
    'mae': round(mean_absolute_error(y_test, xgb_pred), 4),
    'rmse': round(np.sqrt(mean_squared_error(y_test, xgb_pred)), 4),
    'r2': round(r2_score(y_test, xgb_pred), 4),
    'mape': round(mean_absolute_percentage_error(y_test[mask], xgb_pred[mask]) * 100, 2) if mask.sum() > 0 else 0,
}

print(f"\n   🌲 XGBoost Results:")
print(f"      MAE:  {xgb_metrics['mae']:.2f} passengers {'✅' if xgb_metrics['mae'] < 3 else '⚠️'} (target: < 3)")
print(f"      RMSE: {xgb_metrics['rmse']:.2f} passengers {'✅' if xgb_metrics['rmse'] < 4 else '⚠️'} (target: < 4)")
print(f"      R²:   {xgb_metrics['r2']:.4f} {'✅' if xgb_metrics['r2'] > 0.75 else '⚠️'} (target: > 0.75)")
print(f"      MAPE: {xgb_metrics['mape']:.2f}% {'✅' if xgb_metrics['mape'] < 20 else '⚠️'} (target: < 20%)")

rf_metrics = None
if rf_model:
    rf_pred = np.maximum(rf_model.predict(X_test), 0)
    rf_metrics = {
        'mae': round(mean_absolute_error(y_test, rf_pred), 4),
        'rmse': round(np.sqrt(mean_squared_error(y_test, rf_pred)), 4),
        'r2': round(r2_score(y_test, rf_pred), 4),
        'mape': round(mean_absolute_percentage_error(y_test[mask], rf_pred[mask]) * 100, 2) if mask.sum() > 0 else 0,
    }
    
    print(f"\n   🌳 Random Forest Results:")
    print(f"      MAE:  {rf_metrics['mae']:.2f} passengers")
    print(f"      RMSE: {rf_metrics['rmse']:.2f} passengers")
    print(f"      R²:   {rf_metrics['r2']:.4f}")
    print(f"      MAPE: {rf_metrics['mape']:.2f}%")

# =============================================================================
# 4. GENERATE CHARTS — Evaluation charts generate කරනවා
# =============================================================================

if HAS_MATPLOTLIB:
    print("\n📊 Step 3: Generating evaluation charts...")
    
    # --- Chart 1: Actual vs Predicted scatter plot ---
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    # XGBoost
    axes[0].scatter(y_test, xgb_pred, alpha=0.3, s=10, color='#2196F3')
    axes[0].plot([0, y_test.max()], [0, y_test.max()], 'r--', linewidth=2)
    axes[0].set_xlabel('Actual Demand')
    axes[0].set_ylabel('Predicted Demand')
    axes[0].set_title(f'XGBoost: Actual vs Predicted\nMAE={xgb_metrics["mae"]:.2f}, R²={xgb_metrics["r2"]:.4f}')
    axes[0].grid(True, alpha=0.3)
    
    # Random Forest
    if rf_model:
        axes[1].scatter(y_test, rf_pred, alpha=0.3, s=10, color='#4CAF50')
        axes[1].plot([0, y_test.max()], [0, y_test.max()], 'r--', linewidth=2)
        axes[1].set_xlabel('Actual Demand')
        axes[1].set_ylabel('Predicted Demand')
        axes[1].set_title(f'Random Forest: Actual vs Predicted\nMAE={rf_metrics["mae"]:.2f}, R²={rf_metrics["r2"]:.4f}')
        axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    scatter_path = os.path.join(CHARTS_DIR, "actual_vs_predicted.png")
    plt.savefig(scatter_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"   ✅ Saved: {scatter_path}")
    
    # --- Chart 2: Error distribution histogram ---
    fig, ax = plt.subplots(figsize=(10, 6))
    errors = y_test.values - xgb_pred
    ax.hist(errors, bins=30, color='#FF9800', edgecolor='white', alpha=0.8)
    ax.axvline(x=0, color='red', linestyle='--', linewidth=2)
    ax.set_xlabel('Prediction Error (Actual - Predicted)')
    ax.set_ylabel('Frequency')
    ax.set_title('XGBoost Prediction Error Distribution')
    ax.grid(True, alpha=0.3)
    
    hist_path = os.path.join(CHARTS_DIR, "error_distribution.png")
    plt.savefig(hist_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"   ✅ Saved: {hist_path}")
    
    # --- Chart 3: Feature Importance bar chart ---
    feature_importance = xgb_model.feature_importances_
    importance_df = pd.DataFrame({
        'feature': FEATURE_COLUMNS,
        'importance': feature_importance
    }).sort_values('importance', ascending=True)
    
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(importance_df['feature'], importance_df['importance'], color='#9C27B0')
    ax.set_xlabel('Importance Score')
    ax.set_title('XGBoost Feature Importance')
    ax.grid(True, alpha=0.3)
    
    fi_path = os.path.join(CHARTS_DIR, "feature_importance.png")
    plt.savefig(fi_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"   ✅ Saved: {fi_path}")

# =============================================================================
# 5. CLUSTERING EVALUATION
# =============================================================================

print("\n👥 Step 4: Evaluating Clustering Model...")

cluster_model_path = os.path.join(MODELS_DIR, "clustering_model.pkl")
if os.path.exists(cluster_model_path):
    with open(cluster_model_path, 'rb') as f:
        cluster_bundle = pickle.load(f)
    
    print(f"   ✅ Clustering model loaded")
    print(f"   📊 Clusters: {cluster_bundle['n_clusters']}")
    print(f"   📊 Silhouette Score: {cluster_bundle['silhouette_score']:.4f}")
    
    for idx, name in cluster_bundle['cluster_names'].items():
        print(f"   🏷️  Cluster {idx}: {name}")
    
    clustering_eval = {
        'n_clusters': cluster_bundle['n_clusters'],
        'silhouette_score': cluster_bundle['silhouette_score'],
        'cluster_names': cluster_bundle['cluster_names'],
    }
else:
    print("   ⚠️  Clustering model not found, skipping")
    clustering_eval = None

# =============================================================================
# 6. SAVE EVALUATION REPORT
# =============================================================================

print("\n💾 Step 5: Saving evaluation report...")

report = {
    'evaluation_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'test_samples': len(test_df),
    'demand_prediction': {
        'xgboost': xgb_metrics,
        'random_forest': rf_metrics,
        'targets_met': {
            'mae_under_3': bool(xgb_metrics['mae'] < 3),
            'rmse_under_4': bool(xgb_metrics['rmse'] < 4),
            'r2_over_075': bool(xgb_metrics['r2'] > 0.75),
            'mape_under_20': bool(xgb_metrics['mape'] < 20),
        }
    },
    'clustering': clustering_eval,
    'charts_generated': bool(HAS_MATPLOTLIB),
}

report_path = os.path.join(MODELS_DIR, "evaluation_report.json")
with open(report_path, 'w') as f:
    json.dump(report, f, indent=2)
print(f"   ✅ Report saved: {report_path}")

# =============================================================================
# 7. FINAL SUMMARY
# =============================================================================

print("\n" + "=" * 60)
print("📈 EVALUATION COMPLETE!")
print("=" * 60)

targets = report['demand_prediction']['targets_met']
passed = sum(targets.values())
total = len(targets)

print(f"\n🎯 Targets Met: {passed}/{total}")
for target, met in targets.items():
    status = "✅" if met else "❌"
    print(f"   {status} {target}")

if passed == total:
    print(f"\n🎉 All targets met! Model is ready for production.")
else:
    print(f"\n⚠️  Some targets not met. Consider:")
    print(f"   - Generating more training data")
    print(f"   - Tuning hyperparameters")
    print(f"   - Adding more features")
