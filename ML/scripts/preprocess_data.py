# =============================================================================
# 📊 preprocess_data.py
# Data Preprocessing Pipeline — Serendib Go ML Module
# =============================================================================
# මේකෙන් කරන්නේ: Raw booking CSV data load කරලා, ML model train කරන්න
# ඕන features engineer කරලා, train/test split කරලා, processed data save කරනවා.
#
# Run කරන්න: python ML/scripts/preprocess_data.py
# Input:  ML/data/raw/bus_bookings_10000.csv
# Output: ML/data/processed/demand_train.csv, demand_test.csv, 
#         clustering_data.csv
# =============================================================================

import pandas as pd
import numpy as np
import os
import sys
from datetime import datetime

# =============================================================================
# 1. FILE PATHS SETUP — Paths configure කරනවා
# =============================================================================

# Script එක run වෙන location එකෙන් project root එක හොයනවා
script_dir = os.path.dirname(os.path.abspath(__file__))
ml_root = os.path.dirname(script_dir)  # ML/ folder

RAW_DATA_PATH = os.path.join(ml_root, "data", "raw", "bus_bookings_10000.csv")
PROCESSED_DIR = os.path.join(ml_root, "data", "processed")

# Output directory එක create කරනවා
os.makedirs(PROCESSED_DIR, exist_ok=True)

print("=" * 60)
print("📊 DATA PREPROCESSING PIPELINE")
print("=" * 60)

# =============================================================================
# 2. LOAD RAW DATA — Raw CSV data load කරනවා
# =============================================================================

print("\n📥 Step 1: Loading raw booking data...")

if not os.path.exists(RAW_DATA_PATH):
    print(f"   ❌ Error: File not found: {RAW_DATA_PATH}")
    print(f"   💡 First run: python ML/scripts/generate_synthetic_data.py")
    sys.exit(1)

df = pd.read_csv(RAW_DATA_PATH)
print(f"   ✅ Loaded {len(df)} booking records")
print(f"   📅 Columns: {list(df.columns)}")

# =============================================================================
# 3. DATA CLEANING — Data clean කරනවා
# =============================================================================

print("\n🧹 Step 2: Cleaning data...")

# Confirmed/completed bookings විතරක් ගන්නවා (cancelled ඒවා ඉවත් කරනවා)
# Cancelled bookings prediction වලට use කරන්නේ නෑ — ඒවා real demand reflect නොකරනවා
initial_count = len(df)
df_clean = df[df['status'].isin(['confirmed', 'completed'])].copy()
removed = initial_count - len(df_clean)
print(f"   ✅ Removed {removed} cancelled bookings ({removed/initial_count*100:.1f}%)")
print(f"   📊 Remaining: {len(df_clean)} bookings")

# Date columns parse කරනවා
df_clean['departure_time'] = pd.to_datetime(df_clean['departure_time'])
df_clean['booked_at'] = pd.to_datetime(df_clean['booked_at'])

# Missing values check කරනවා
missing = df_clean.isnull().sum()
if missing.sum() > 0:
    print(f"   ⚠️  Missing values found:")
    for col, count in missing[missing > 0].items():
        print(f"      {col}: {count} missing")
    # Fill missing values
    df_clean = df_clean.fillna(0)
    print(f"   ✅ Missing values filled with 0")
else:
    print(f"   ✅ No missing values found")

# =============================================================================
# 4. FEATURE ENGINEERING — ML model වලට ඕන features හදනවා
# =============================================================================

print("\n🔧 Step 3: Feature Engineering...")

# --- Hour Bucket feature ---
# Rush hour patterns capture කරන්න hour ranges group කරනවා
# මේකෙන් model එකට "morning rush vs evening rush vs midday" pattern එක
# හොඳට learn කරන්න පුළුවන්
def get_hour_bucket(hour):
    """
    Hour bucket assignment:
    0 = Early morning (4-6)
    1 = Morning rush (7-9)
    2 = Midday (10-14)
    3 = Evening rush (15-18)
    4 = Night (19-23, 0-3)
    """
    if 4 <= hour <= 6:
        return 0
    elif 7 <= hour <= 9:
        return 1
    elif 10 <= hour <= 14:
        return 2
    elif 15 <= hour <= 18:
        return 3
    else:
        return 4

df_clean['hour_bucket'] = df_clean['hour_of_day'].apply(get_hour_bucket)

# --- Demand Prediction Model වලට Features ---
# FIXED: Coarser aggregation — route + segment + date + hour_bucket
# පරණ version එකේ bus_type, day_of_week, is_weekend etc. ඔක්කොම groupby keys
# විදියට දැම්මා. ඒකෙන් groups ගොඩක් කුඩා වුනා (demand = 1-2 per group).
# දැන් coarser groups use කරනවා → demand values 5-30 range එකට එනවා.
# day_of_week, is_weekend, is_holiday etc. features විදියට derive කරනවා date එකෙන්.

print("   📊 Creating demand features (coarser aggregation)...")

# Extract departure date
df_clean['departure_date'] = df_clean['departure_time'].dt.date

# Group by: route_id + segment + date + hour_bucket ONLY
# Count = actual demand for that combination
demand_data = df_clean.groupby([
    'route_id',
    'boarding_stop_index',
    'departure_date',
    'hour_bucket',
]).agg(
    actual_demand=('booking_id', 'count'),
    # Keep the first occurrence of these for feature derivation
    hour_of_day=('hour_of_day', 'mean'),
).reset_index()

# departure_date datetime type එකට convert කරනවා
demand_data['departure_date'] = pd.to_datetime(demand_data['departure_date'])

# --- Derive temporal features from the date (NOT used in groupby) ---
demand_data['day_of_week'] = demand_data['departure_date'].dt.dayofweek + 1  # 1=Monday, 7=Sunday
demand_data['is_weekend'] = (demand_data['day_of_week'] >= 6).astype(int)
demand_data['hour_of_day'] = demand_data['hour_of_day'].round().astype(int)

# --- Month end check ---
demand_data['is_month_end'] = (demand_data['departure_date'].dt.day >= 28).astype(int)

# --- Holiday check — Sri Lankan holidays (2026) ---
sri_lankan_holidays_2026 = [
    '2026-01-14',  # Thai Pongal
    '2026-01-15',  # Duruthu Poya
    '2026-02-04',  # National Day
    '2026-02-13',  # Navam Poya
    '2026-03-14',  # Medin Poya
    '2026-04-01',  # Bank Holiday
    '2026-04-13',  # Bak Poya
    '2026-04-14',  # Sinhala Tamil New Year
    '2026-05-01',  # May Day
    '2026-05-12',  # Vesak Poya
    '2026-05-13',  # Day after Vesak
    '2026-06-11',  # Poson Poya
    '2026-07-10',  # Esala Poya
    '2026-08-01',  # Nikini Poya
    '2026-08-30',  # Binara Poya
    '2026-09-29',  # Vap Poya
    '2026-10-07',  # Deepavali
    '2026-10-28',  # Il Poya
    '2026-11-27',  # Unduvap Poya
    '2026-12-25',  # Christmas
    '2026-12-26',  # Duruthu Poya
]
holiday_dates = set(pd.to_datetime(sri_lankan_holidays_2026).date)
demand_data['is_holiday'] = demand_data['departure_date'].dt.date.isin(holiday_dates).astype(int)

# --- Historical average demand calculate කරනවා ---
# FIXED: Now this produces meaningful averages (5-30 range) because groups are coarser
# Model එකට "මේ route + segment + day_of_week combination එකට normally කී දෙනෙක්" කියලා
historical_avg = demand_data.groupby([
    'route_id', 
    'boarding_stop_index', 
    'day_of_week'
])['actual_demand'].transform('mean')

demand_data['historical_avg_demand'] = round(historical_avg, 2)

# --- Bus type not in groupby anymore, use route-level average ---
# Since we removed bus_type from groupby, we encode it as a constant
# The model will learn route-specific patterns instead
demand_data['bus_type_encoded'] = 1  # Default; will be overridden at inference

print(f"   ✅ Demand features created: {len(demand_data)} records")
print(f"   📊 Demand range: min={demand_data['actual_demand'].min()}, "
      f"max={demand_data['actual_demand'].max()}, "
      f"mean={demand_data['actual_demand'].mean():.1f}, "
      f"median={demand_data['actual_demand'].median():.0f}")
print(f"   📊 Features: {list(demand_data.columns)}")

# =============================================================================
# 5. TRAIN/TEST SPLIT — Training data + Testing data වෙන් කරනවා
# =============================================================================

print("\n✂️  Step 4: Train/Test Split (80/20)...")

# Time-based split — අන්තිම 20% data test set එකට
# Random split නෙවෙයි time-based split — more realistic for time series data
# ඇයි? Future predict කරන model එක past data වලින් train වෙන්න ඕන

demand_data = demand_data.sort_values('departure_date')
split_idx = int(len(demand_data) * 0.8)

train_data = demand_data.iloc[:split_idx].copy()
test_data = demand_data.iloc[split_idx:].copy()

print(f"   ✅ Training set: {len(train_data)} records ({len(train_data)/len(demand_data)*100:.1f}%)")
print(f"   ✅ Testing set:  {len(test_data)} records ({len(test_data)/len(demand_data)*100:.1f}%)")
print(f"   📊 Train demand mean: {train_data['actual_demand'].mean():.1f}")
print(f"   📊 Test demand mean:  {test_data['actual_demand'].mean():.1f}")

# =============================================================================
# 6. CLUSTERING DATA — Passenger clustering data prepare කරනවා
# =============================================================================

print("\n👥 Step 5: Preparing clustering data...")

# User level aggregation — user කෙනෙක්ගේ travel pattern summarize කරනවා
# K-Means clustering වලට මේ features use කරනවා:
# - avg_departure_hour: average departure time
# - total_bookings: කී පාරක් book කළාද
# - avg_advance_days: average කොච්චර දවස් කලින් book කරනවද
# - weekend_ratio: weekends travel ratio
# - avg_segment_count: average journey length (segments)

clustering_data = df_clean.groupby('user_id').agg(
    avg_departure_hour=('hour_of_day', 'mean'),
    total_bookings=('booking_id', 'count'),
    avg_advance_days=('booked_at', lambda x: (
        (df_clean.loc[x.index, 'departure_time'] - x).dt.days.mean()
    )),
    weekend_ratio=('is_weekend', 'mean'),
    avg_segment_count=('segment_count', 'mean'),
).reset_index()

# Minimum 3 bookings තියෙන users විතරක් ගන්නවා — too few data points = unreliable clusters
min_bookings = 3
clustering_data = clustering_data[clustering_data['total_bookings'] >= min_bookings]

print(f"   ✅ Clustering data created: {len(clustering_data)} users (with >= {min_bookings} bookings)")
print(f"   📊 Features: {list(clustering_data.columns)}")

# =============================================================================
# 7. SAVE PROCESSED DATA — Processed data files save කරනවා
# =============================================================================

print("\n💾 Step 6: Saving processed data...")

# Demand prediction data
train_path = os.path.join(PROCESSED_DIR, "demand_train.csv")
test_path = os.path.join(PROCESSED_DIR, "demand_test.csv")
train_data.to_csv(train_path, index=False)
test_data.to_csv(test_path, index=False)
print(f"   ✅ Saved: {train_path}")
print(f"   ✅ Saved: {test_path}")

# Clustering data
cluster_path = os.path.join(PROCESSED_DIR, "clustering_data.csv")
clustering_data.to_csv(cluster_path, index=False)
print(f"   ✅ Saved: {cluster_path}")

# Full demand data (for reference)
full_demand_path = os.path.join(PROCESSED_DIR, "demand_full.csv")
demand_data.to_csv(full_demand_path, index=False)
print(f"   ✅ Saved: {full_demand_path}")

print("\n" + "=" * 60)
print("🎉 PREPROCESSING COMPLETE!")
print("=" * 60)
print(f"\n📁 Output files in: {PROCESSED_DIR}")
print(f"   1. demand_train.csv  — Training data for demand model")
print(f"   2. demand_test.csv   — Testing data for evaluation")
print(f"   3. clustering_data.csv — User patterns for K-Means")
print(f"   4. demand_full.csv   — Complete demand dataset")
print(f"\n👉 Next step: python ML/scripts/train_demand_model.py")
