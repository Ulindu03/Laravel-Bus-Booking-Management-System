# 🤖 Serendib Go — ML Module

## Quick Start (Step by Step)

### Step 1: Install Python Dependencies
```bash
cd ML
pip install -r requirements.txt
```

### Step 2: Generate Synthetic Training Data (10,000 bookings)
```bash
python ML/scripts/generate_synthetic_data.py
```
Output: `ML/data/raw/bus_bookings_10000.csv`

### Step 3: Seed Data into Database
```bash
cd Backend
php artisan db:seed --class=AiTestDataSeeder
```

### Step 4: Preprocess Data (Feature Engineering + Train/Test Split)
```bash
python ML/scripts/preprocess_data.py
```
Output: `ML/data/processed/demand_train.csv`, `demand_test.csv`, `clustering_data.csv`

### Step 5: Train Demand Prediction Model (XGBoost)
```bash
python ML/scripts/train_demand_model.py
```
Output: `ML/models/demand_model.pkl` → auto-copied to `Backend/storage/ml_models/`

### Step 6: Train Clustering Model (K-Means)
```bash
python ML/scripts/train_clustering_model.py
```
Output: `ML/models/clustering_model.pkl` → auto-copied to `Backend/storage/ml_models/`

### Step 7: Evaluate Models
```bash
python ML/scripts/evaluate_models.py
```
Output: `ML/models/evaluation_report.json` + charts in `ML/models/charts/`

---

## Folder Structure

```
ML/
├── data/
│   ├── raw/                          ← Raw CSV data
│   │   └── bus_bookings_10000.csv
│   └── processed/                    ← ML-ready processed data
│       ├── demand_train.csv
│       ├── demand_test.csv
│       ├── demand_full.csv
│       └── clustering_data.csv
├── models/                           ← Trained model files
│   ├── demand_model.pkl              ← XGBoost model
│   ├── demand_model_rf.pkl           ← Random Forest (comparison)
│   ├── clustering_model.pkl          ← K-Means model + scaler
│   ├── scaler.pkl                    ← StandardScaler
│   ├── feature_columns.json          ← Feature order config
│   ├── training_metrics.json         ← Model accuracy metrics
│   ├── cluster_analysis.json         ← Cluster details
│   ├── evaluation_report.json        ← Full evaluation report
│   └── charts/                       ← Evaluation visualizations
├── scripts/
│   ├── generate_synthetic_data.py    ← Step 2
│   ├── preprocess_data.py            ← Step 4
│   ├── train_demand_model.py         ← Step 5
│   ├── train_clustering_model.py     ← Step 6
│   └── evaluate_models.py           ← Step 7
├── requirements.txt
└── README.md                         ← You are here
```

## Target Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| MAE | < 3 passengers | Average prediction error |
| RMSE | < 4 passengers | Root mean squared error |
| R² Score | > 0.75 | Model explanatory power |
| MAPE | < 20% | Percentage error |
