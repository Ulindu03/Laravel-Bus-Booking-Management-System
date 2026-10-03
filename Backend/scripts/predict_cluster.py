# =============================================================================
# 👥 predict_cluster.py
# User Cluster Prediction — Laravel Backend එකෙන් call කරනවා
# =============================================================================
# User කෙනෙක්ගේ travel pattern data දීලා, ඒ user කුමන cluster එකටද
# belong වෙන්නේ predict කරනවා.
#
# Usage: python predict_cluster.py --model=path/to/clustering_model.pkl
#        --data='{"avg_departure_hour":7.5,"total_bookings":15,...}'
#
# Output: JSON → {"cluster": 0, "cluster_name": "Daily Commuters"}
# =============================================================================

import argparse
import pickle
import json
import sys
import numpy as np
import pandas as pd

# =============================================================================
# 1. ARGUMENTS
# =============================================================================

parser = argparse.ArgumentParser(description='Cluster Prediction — Serendib Go')
parser.add_argument('--model', required=True, help='Path to clustering model .pkl')
parser.add_argument('--data', required=True, help='JSON string with user features')
args = parser.parse_args()

# =============================================================================
# 2. MODEL LOAD
# =============================================================================

try:
    with open(args.model, 'rb') as f:
        bundle = pickle.load(f)
    
    model = bundle['model']
    scaler = bundle['scaler']
    feature_columns = bundle['feature_columns']
    cluster_names = bundle['cluster_names']
    
except FileNotFoundError:
    print(json.dumps({'error': 'Model file not found', 'cluster': -1}))
    sys.exit(0)
except Exception as e:
    print(json.dumps({'error': str(e), 'cluster': -1}))
    sys.exit(0)

# =============================================================================
# 3. PREDICT
# =============================================================================

try:
    # User data parse කරනවා
    user_data = json.loads(args.data)
    
    # Feature vector create කරනවා
    features = pd.DataFrame([{col: user_data.get(col, 0) for col in feature_columns}])
    
    # Scale features — training time එකේ use කළ scaler ම use කරනවා
    features_scaled = scaler.transform(features)
    
    # Cluster predict කරනවා
    cluster = int(model.predict(features_scaled)[0])
    cluster_name = cluster_names.get(cluster, f"Cluster {cluster}")
    
    # Output JSON
    print(json.dumps({
        'cluster': cluster,
        'cluster_name': cluster_name,
        'user_data': user_data,
    }))

except Exception as e:
    print(json.dumps({
        'error': str(e),
        'cluster': -1,
    }))
