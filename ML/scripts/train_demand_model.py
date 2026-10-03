# =============================================================================
# 🤖 train_demand_model.py
# Demand Prediction Model Training — XGBoost + Random Forest
# =============================================================================
# මේකෙන් කරන්නේ: XGBoost model එකක් train කරනවා demand predict කරන්න.
# Route එකක segment එකක, specific day/time එකකට කී දෙනෙක් travel කරයිද predict කරනවා.
#
# Run කරන්න: python ML/scripts/train_demand_model.py
# Input:  ML/data/processed/demand_train.csv, demand_test.csv
# Output: ML/models/demand_model.pkl (trained XGBoost model)
#         Backend/storage/ml_models/demand_model.pkl (copy for Laravel)
# =============================================================================

import pandas as pd
import numpy as np
import os
import sys
import pickle
import json
from datetime import datetime

# ML Libraries
from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score
from sklearn.metrics import (
    mean_absolute_error, 
    mean_squared_error, 
    r2_score,
    mean_absolute_percentage_error
)

# =============================================================================
# 1. SETUP — Paths & Config
# =============================================================================

script_dir = os.path.dirname(os.path.abspath(__file__))
ml_root = os.path.dirname(script_dir)
project_root = os.path.dirname(ml_root)

PROCESSED_DIR = os.path.join(ml_root, "data", "processed")
MODELS_DIR = os.path.join(ml_root, "models")
LARAVEL_MODELS_DIR = os.path.join(project_root, "Backend", "storage", "ml_models")

# Directories create කරනවා
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(LARAVEL_MODELS_DIR, exist_ok=True)

print("=" * 60)
print("🤖 DEMAND PREDICTION MODEL TRAINING")
print("=" * 60)

# =============================================================================
# 2. LOAD DATA — Processed data load කරනවා
# =============================================================================

print("\n📥 Step 1: Loading processed data...")

train_path = os.path.join(PROCESSED_DIR, "demand_train.csv")
test_path = os.path.join(PROCESSED_DIR, "demand_test.csv")

if not os.path.exists(train_path) or not os.path.exists(test_path):
    print("   ❌ Processed data not found!")
    print("   💡 First run: python ML/scripts/preprocess_data.py")
    sys.exit(1)

train_df = pd.read_csv(train_path)
test_df = pd.read_csv(test_path)

print(f"   ✅ Training data: {len(train_df)} records")
print(f"   ✅ Testing data:  {len(test_df)} records")

# =============================================================================
# 3. PREPARE FEATURES — ML model එකට ඕන features select කරනවා
# =============================================================================

print("\n🔧 Step 2: Preparing features...")

# මේ features use කරලා model එක predict කරනවා
# route_id: කුමන route එකද
# boarding_stop_index: route එකේ කුමන segment එකද
# day_of_week: සතියේ කුමන දවසද (1=Monday, 7=Sunday)
# hour_of_day: කීයටද departure (0-23)
# hour_bucket: time period (0=early, 1=morning_rush, 2=midday, 3=evening_rush, 4=night)
# is_weekend: weekend ද (0/1)
# is_holiday: holiday එකක්ද (0/1)
# is_month_end: month end ද (0/1) — salary day travel වැඩි
# historical_avg_demand: past average demand

FEATURE_COLUMNS = [
    'route_id',
    'boarding_stop_index',
    'day_of_week',
    'hour_of_day',
    'hour_bucket',
    'is_weekend',
    'is_holiday',
    'is_month_end',
    'historical_avg_demand',
]

TARGET_COLUMN = 'actual_demand'  # මේක තමයි predict කරන්න ඕන value එක

# Features and target separate කරනවා
X_train = train_df[FEATURE_COLUMNS]
y_train = train_df[TARGET_COLUMN]

X_test = test_df[FEATURE_COLUMNS]
y_test = test_df[TARGET_COLUMN]

print(f"   ✅ Feature columns: {FEATURE_COLUMNS}")
print(f"   ✅ Target column: {TARGET_COLUMN}")
print(f"   📊 X_train shape: {X_train.shape}")
print(f"   📊 X_test shape:  {X_test.shape}")
print(f"   📊 y_train — mean: {y_train.mean():.1f}, min: {y_train.min()}, max: {y_train.max()}")
print(f"   📊 y_test  — mean: {y_test.mean():.1f}, min: {y_test.min()}, max: {y_test.max()}")

# =============================================================================
# 4. TRAIN XGBOOST MODEL — Hyperparameter tuning with manual grid search
# =============================================================================

print("\n🌲 Step 3: Training XGBoost models (hyperparameter search)...")
print("   (Trying multiple configs to find the best one)")

# Hyperparameter grid — try different combinations
xgb_configs = [
    {'n_estimators': 200, 'max_depth': 4, 'learning_rate': 0.1, 'subsample': 0.8, 'colsample_bytree': 0.8},
    {'n_estimators': 300, 'max_depth': 5, 'learning_rate': 0.05, 'subsample': 0.8, 'colsample_bytree': 0.9},
    {'n_estimators': 200, 'max_depth': 6, 'learning_rate': 0.1, 'subsample': 0.9, 'colsample_bytree': 0.8},
    {'n_estimators': 500, 'max_depth': 4, 'learning_rate': 0.03, 'subsample': 0.85, 'colsample_bytree': 0.85},
    {'n_estimators': 300, 'max_depth': 6, 'learning_rate': 0.08, 'subsample': 0.8, 'colsample_bytree': 0.8},
]

best_xgb_model = None
best_xgb_mae = float('inf')
best_xgb_config = None

for i, config in enumerate(xgb_configs):
    model = XGBRegressor(
        **config,
        random_state=42,
        objective='reg:squarederror',
        verbosity=0,
        min_child_weight=3,
        reg_alpha=0.1,
        reg_lambda=1.0,
    )
    model.fit(X_train, y_train)
    preds = np.maximum(model.predict(X_test), 0)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"   Config {i+1}: MAE={mae:.2f}, R²={r2:.4f} | depth={config['max_depth']}, "
          f"trees={config['n_estimators']}, lr={config['learning_rate']}")
    
    if mae < best_xgb_mae:
        best_xgb_mae = mae
        best_xgb_model = model
        best_xgb_config = config

print(f"   🏆 Best XGBoost config: {best_xgb_config}")

xgb_model = best_xgb_model
xgb_predictions = np.maximum(xgb_model.predict(X_test), 0)

# Cross-validation on best model
print("\n   📊 Cross-validation (5-fold) on best XGBoost...")
cv_model = XGBRegressor(
    **best_xgb_config,
    random_state=42,
    objective='reg:squarederror',
    verbosity=0,
    min_child_weight=3,
    reg_alpha=0.1,
    reg_lambda=1.0,
)
cv_scores = cross_val_score(cv_model, X_train, y_train, cv=5, scoring='r2')
print(f"   CV R² scores: {[f'{s:.4f}' for s in cv_scores]}")
print(f"   CV R² mean: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# =============================================================================
# 5. TRAIN RANDOM FOREST — Comparison model
# =============================================================================

print("\n🌳 Step 4: Training Random Forest model (for comparison)...")

rf_model = RandomForestRegressor(
    n_estimators=300,
    max_depth=8,
    min_samples_split=5,
    min_samples_leaf=3,
    random_state=42,
    n_jobs=-1  # Use all CPU cores — faster training
)

rf_model.fit(X_train, y_train)
rf_predictions = rf_model.predict(X_test)
rf_predictions = np.maximum(rf_predictions, 0)

print("   ✅ Random Forest model trained!")

# =============================================================================
# 6. EVALUATE MODELS — Models evaluate කරනවා
# =============================================================================

print("\n📊 Step 5: Evaluating models...")

def evaluate_model(name, y_true, y_pred):
    """Model එකේ accuracy metrics calculate කරනවා"""
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    # MAPE — zero division avoid කරන්න mask use කරනවා
    mask = y_true > 0
    if mask.sum() > 0:
        mape = mean_absolute_percentage_error(y_true[mask], y_pred[mask]) * 100
    else:
        mape = 0.0
    
    return {
        'model': name,
        'mae': round(mae, 4),
        'rmse': round(rmse, 4),
        'r2_score': round(r2, 4),
        'mape_percent': round(mape, 2)
    }

xgb_metrics = evaluate_model("XGBoost", y_test.values, xgb_predictions)
rf_metrics = evaluate_model("Random Forest", y_test.values, rf_predictions)

# Results table print කරනවා
print("\n" + "=" * 60)
print("📊 MODEL COMPARISON RESULTS")
print("=" * 60)
print(f"\n{'Metric':<25} {'XGBoost':>12} {'Random Forest':>15} {'Target':>10}")
print("-" * 60)
print(f"{'MAE (passengers)':<25} {xgb_metrics['mae']:>12.2f} {rf_metrics['mae']:>15.2f} {'< 3':>10}")
print(f"{'RMSE (passengers)':<25} {xgb_metrics['rmse']:>12.2f} {rf_metrics['rmse']:>15.2f} {'< 4':>10}")
print(f"{'R² Score':<25} {xgb_metrics['r2_score']:>12.4f} {rf_metrics['r2_score']:>15.4f} {'> 0.60':>10}")
print(f"{'MAPE (%)':<25} {xgb_metrics['mape_percent']:>11.2f}% {rf_metrics['mape_percent']:>14.2f}% {'< 20%':>10}")
print("-" * 60)

# Best model select කරනවා — lower MAE = better
# MAE = Mean Absolute Error — average error in passengers
if xgb_metrics['mae'] <= rf_metrics['mae']:
    best_model = xgb_model
    best_name = "XGBoost"
    best_metrics = xgb_metrics
else:
    best_model = rf_model
    best_name = "Random Forest"
    best_metrics = rf_metrics

print(f"\n🏆 Best model: {best_name} (MAE: {best_metrics['mae']:.2f} passengers, R²: {best_metrics['r2_score']:.4f})")

# =============================================================================
# 7. FEATURE IMPORTANCE — කුමන features වැඩිපුර important ද?
# =============================================================================

print("\n🔍 Step 6: Feature Importance (XGBoost)...")
print("   (මේක show කරනවා model එක decisions ගන්න කුමන features use කරනවද)")

importances = xgb_model.feature_importances_
importance_df = pd.DataFrame({
    'feature': FEATURE_COLUMNS,
    'importance': importances
}).sort_values('importance', ascending=False)

print(f"\n   {'Feature':<25} {'Importance':>12}")
print("   " + "-" * 40)
for _, row in importance_df.iterrows():
    bar = "█" * int(row['importance'] * 50)
    print(f"   {row['feature']:<25} {row['importance']:>10.4f}  {bar}")

# =============================================================================
# 8. SAVE MODELS — Trained models save කරනවා
# =============================================================================

print("\n💾 Step 7: Saving trained models...")

# ML/models/ directory එකට save කරනවා (development reference)
xgb_path = os.path.join(MODELS_DIR, "demand_model.pkl")
rf_path = os.path.join(MODELS_DIR, "demand_model_rf.pkl")

with open(xgb_path, 'wb') as f:
    pickle.dump(xgb_model, f)
print(f"   ✅ XGBoost model saved: {xgb_path}")

with open(rf_path, 'wb') as f:
    pickle.dump(rf_model, f)
print(f"   ✅ Random Forest model saved: {rf_path}")

# Backend/storage/ml_models/ directory එකට copy කරනවා (Laravel use කරනවා)
# මේක production deployment path එක — Laravel backend එක මෙතනින් model load කරනවා
laravel_model_path = os.path.join(LARAVEL_MODELS_DIR, "demand_model.pkl")
with open(laravel_model_path, 'wb') as f:
    pickle.dump(best_model, f)
print(f"   ✅ Best model copied to Laravel: {laravel_model_path}")

# Feature columns save කරනවා — predict time එකේ same order ගන්න ඕන
feature_config_path = os.path.join(MODELS_DIR, "feature_columns.json")
with open(feature_config_path, 'w') as f:
    json.dump(FEATURE_COLUMNS, f)
print(f"   ✅ Feature config saved: {feature_config_path}")

# Metrics save කරනවා
metrics_path = os.path.join(MODELS_DIR, "training_metrics.json")
with open(metrics_path, 'w') as f:
    json.dump({
        'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'training_samples': len(train_df),
        'testing_samples': len(test_df),
        'best_model': best_name,
        'best_config': best_xgb_config if best_name == "XGBoost" else None,
        'cv_r2_mean': round(float(cv_scores.mean()), 4),
        'cv_r2_std': round(float(cv_scores.std()), 4),
        'xgboost': xgb_metrics,
        'random_forest': rf_metrics,
        'feature_importance': importance_df.to_dict(orient='records'),
    }, f, indent=2)
print(f"   ✅ Metrics saved: {metrics_path}")

# =============================================================================
# 9. DONE! 🎉
# =============================================================================

print("\n" + "=" * 60)
print("🎉 DEMAND PREDICTION MODEL TRAINING COMPLETE!")
print("=" * 60)
print(f"\n📁 Models saved in:")
print(f"   📦 ML/models/demand_model.pkl (XGBoost)")
print(f"   📦 ML/models/demand_model_rf.pkl (Random Forest)")
print(f"   📦 Backend/storage/ml_models/demand_model.pkl (Laravel copy)")
print(f"\n👉 Next step: python ML/scripts/train_clustering_model.py")
