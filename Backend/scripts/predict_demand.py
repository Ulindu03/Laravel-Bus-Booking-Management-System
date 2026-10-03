# =============================================================================
# 🔮 predict_demand.py
# Demand Prediction Script — Laravel Backend එකෙන් call කරනවා
# =============================================================================
# මේක Laravel backend එකෙන් shell_exec() use කරලා call කරනවා.
# Trained XGBoost model load කරලා, single prediction එකක් return කරනවා.
#
# Usage: python predict_demand.py --model=path/to/model.pkl 
#        --route=5 --segment=2 --date=2026-08-15 --hour=8
#        --bus_type=1 --historical_avg=12.5
#
# Output: JSON → {"predicted_demand": 14.5}
# =============================================================================

import argparse
import pickle
import json
import sys
import os
import numpy as np
import pandas as pd
from datetime import datetime

# =============================================================================
# 1. ARGUMENTS PARSE කරනවා — Laravel sends these via command line
# =============================================================================

parser = argparse.ArgumentParser(description='Demand Prediction — Serendib Go')
parser.add_argument('--model', required=True, help='Path to trained model .pkl file')
parser.add_argument('--route', type=int, required=True, help='Route ID')
parser.add_argument('--segment', type=int, required=True, help='Segment index (0-based)')
parser.add_argument('--date', required=True, help='Date (YYYY-MM-DD)')
parser.add_argument('--hour', type=int, required=True, help='Hour of day (0-23)')
parser.add_argument('--fare', type=float, required=False, default=0.0, help='Segment Fare (for Expected Revenue)')
parser.add_argument('--bus_type', type=int, required=False, default=1, help='Bus type (1=normal, 2=semi, 3=luxury, 4=ac)')
parser.add_argument('--historical_avg', type=float, required=False, default=0.0, help='Historical avg demand for this segment')
args = parser.parse_args()

# =============================================================================
# 2. MODEL LOAD කරනවා
# =============================================================================

try:
    with open(args.model, 'rb') as f:
        model = pickle.load(f)
except FileNotFoundError:
    # Model file හම්බ වුනේ නෑ — error JSON return කරනවා
    print(json.dumps({'error': 'Model file not found', 'predicted_demand': 15.0}))
    sys.exit(0)
except Exception as e:
    print(json.dumps({'error': str(e), 'predicted_demand': 15.0}))
    sys.exit(0)

# =============================================================================
# 3. SRI LANKAN HOLIDAY CALENDAR
# =============================================================================

# Production එකේ database එකෙන් ගන්න ඕන — මේක 2026 holidays
SRI_LANKAN_HOLIDAYS = {
    # 2026 holidays
    (1, 14), (1, 15),   # Thai Pongal, Duruthu Poya
    (2, 4), (2, 13),    # National Day, Navam Poya
    (3, 14),            # Medin Poya
    (4, 1), (4, 13), (4, 14),  # Bank Holiday, Bak Poya, New Year
    (5, 1), (5, 12), (5, 13),  # May Day, Vesak
    (6, 11),            # Poson Poya
    (7, 10),            # Esala Poya
    (8, 1), (8, 30),    # Nikini Poya, Binara Poya
    (9, 29),            # Vap Poya
    (10, 7), (10, 28),  # Deepavali, Il Poya
    (11, 27),           # Unduvap Poya
    (12, 25), (12, 26), # Christmas, Duruthu Poya
}

def is_holiday(date_obj):
    """Check if the date is a Sri Lankan public holiday"""
    return (date_obj.month, date_obj.day) in SRI_LANKAN_HOLIDAYS

def get_hour_bucket(hour):
    """
    Hour bucket assignment — must match preprocess_data.py exactly!
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

# =============================================================================
# 4. FEATURE VECTOR හදනවා — Model එකට input
# =============================================================================

try:
    date_obj = datetime.strptime(args.date, '%Y-%m-%d')
    
    # Day of week (ISO: 1=Monday, 7=Sunday)
    day_of_week = date_obj.isoweekday()
    
    # Weekend check
    is_weekend = 1 if day_of_week >= 6 else 0
    
    # Holiday check — SL calendar
    is_hol = 1 if is_holiday(date_obj) else 0
    
    # Month end check
    # Use proper month-end check instead of just day >= 28
    import calendar
    last_day = calendar.monthrange(date_obj.year, date_obj.month)[1]
    is_month_end = 1 if date_obj.day >= (last_day - 2) else 0
    
    # Hour bucket
    hour_bucket = get_hour_bucket(args.hour)
    
    # Historical average — from Laravel DB or fallback
    # If Laravel passes 0, use a reasonable default based on segment
    historical_avg = args.historical_avg if args.historical_avg > 0 else 10.0
    
    # Feature vector create කරනවා — same order as training!
    # feature_columns.json එක reference කරන්න:
    # ["route_id", "boarding_stop_index", "day_of_week", "hour_of_day", "is_weekend", "is_holiday", "is_month_end", "historical_avg_demand", "bus_type_encoded"]
    features = pd.DataFrame([{
        'route_id': args.route,
        'boarding_stop_index': args.segment,
        'day_of_week': day_of_week,
        'hour_of_day': args.hour,
        'is_weekend': is_weekend,
        'is_holiday': is_hol,
        'is_month_end': is_month_end,
        'historical_avg_demand': historical_avg,
        'bus_type_encoded': args.bus_type,
    }])
    
    # =============================================================================
    # 5. PREDICTION — Model එකෙන් predict කරනවා
    # =============================================================================
    
    prediction = model.predict(features)[0]
    
    # Negative predictions avoid කරනවා (demand negative වෙන්න බෑ)
    prediction = max(0, float(prediction))
    
    # Calculate demand level based on requirement thresholds
    if prediction > 20:
        demand_level = 'high'
    elif prediction >= 10:
        demand_level = 'medium'
    else:
        demand_level = 'low'
    
    # Calculate Expected Revenue (EMSR logic base)
    expected_revenue = prediction * args.fare if args.fare else 0.0

    # Output JSON — Laravel read කරනවා
    print(json.dumps({
        'predicted_demand': round(prediction, 2),
        'demand_level': demand_level,
        'expected_revenue': round(expected_revenue, 2),
        'route_id': args.route,
        'segment_index': args.segment,
        'date': args.date,
        'hour': args.hour,
    }))

except Exception as e:
    # Error occurred — fallback prediction return කරනවා
    print(json.dumps({
        'error': str(e),
        'predicted_demand': 15.0,  # Safe fallback value
        'demand_level': 'medium',
        'expected_revenue': 15.0 * (args.fare if 'args' in locals() and args.fare else 0.0)
    }))
