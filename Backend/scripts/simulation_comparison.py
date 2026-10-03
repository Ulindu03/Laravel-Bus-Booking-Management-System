import pandas as pd
import numpy as np
import joblib
import os
import argparse
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns

# ML Model Data Evaluation Script (සැබෑ දත්ත සහ AI අනාවැකි සංසන්දනය)
# මෙම ස්ක්‍රිප්ට් එක මගින් පුහුණු කළ XGBoost ආකෘතියේ නිරවද්‍යතාවය මනිනවා.

def evaluate_models(data_path, model_path):
    print("==================================================")
    print(" AI MODEL EVALUATION & SIMULATION COMPARISON")
    print("==================================================")
    
    # 1. දත්ත පරීක්ෂාව (Load Data)
    if not os.path.exists(data_path):
        print(f"⚠️ Warning: Data file not found at {data_path}. Generating a mock dataset for simulation...")
        
        # Generate mock test data
        mock_data = []
        for _ in range(50):
            day = np.random.randint(0, 7)
            hour = np.random.randint(5, 22)
            mock_data.append({
                'route_id': np.random.choice([1, 2, 15]),
                'boarding_stop_index': np.random.randint(0, 4),
                'day_of_week': day,
                'hour_of_day': hour,
                'is_weekend': 1 if day >= 5 else 0,
                'is_holiday': np.random.choice([0, 1], p=[0.9, 0.1]),
                'is_month_end': np.random.choice([0, 1], p=[0.8, 0.2]),
                'historical_avg_demand': np.random.randint(10, 50),
                'bus_type_encoded': np.random.choice([0, 1, 2]),
                'actual_demand': np.random.randint(5, 40),
                'booking_date': '2026-08-15'
            })
        df = pd.DataFrame(mock_data)
        df.to_csv(data_path, index=False)
        print(f"✅ Created mock data file at {data_path}")
    else:
        df = pd.read_csv(data_path)
        
    print(f"✅ Loaded {len(df)} records for simulation")
    
    # 2. ආකෘතිය පරීක්ෂාව (Load Model)
    xgb_path = os.path.join(model_path, 'demand_model.pkl')
    
    if not os.path.exists(xgb_path):
        print(f"❌ Error: Model file not found at {xgb_path}")
        return
        
    xgb_model = joblib.load(xgb_path)
    print(f"✅ Loaded XGBoost model from {xgb_path}")
    
    # 3. දත්ත සකස් කිරීම (Data Preparation)
    features = [
        'route_id', 'boarding_stop_index', 'day_of_week', 'hour_of_day', 
        'is_weekend', 'is_holiday', 'is_month_end', 'historical_avg_demand', 
        'bus_type_encoded'
    ]
    
    X = df[features]
    y_true = df['actual_demand'] # The synthetic actual demand
    
    # 4. අනාවැකි ලබාගැනීම (Make Predictions)
    print("⏳ Running predictions on test data...")
    y_pred = xgb_model.predict(X)
    
    # 5. ප්‍රතිඵල විශ්ලේෂණය (Calculate Metrics)
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    
    print("\n📊 Evaluation Metrics:")
    print(f"  - Mean Absolute Error (MAE): {mae:.2f} (සාමාන්‍ය වැරදීම - මගීන් ගණන)")
    print(f"  - Root Mean Squared Error (RMSE): {rmse:.2f}")
    print(f"  - R-squared (R2 Score): {r2:.2f} (1.0 ට ආසන්න නම් ආකෘතිය ඉතා සාර්ථකයි)")
    
    if r2 > 0.8:
        print("\n🏆 Model performance is EXCELLENT!")
    elif r2 > 0.6:
        print("\n👍 Model performance is GOOD.")
    else:
        print("\n⚠️ Model performance needs improvement.")
        
    # 6. Sample Comparison (උදාහරණ සංසන්දනය)
    print("\n🔍 Sample Comparison (Actual vs Predicted):")
    sample_df = df.sample(10, random_state=42).copy()
    sample_X = sample_df[features]
    sample_pred = xgb_model.predict(sample_X)
    
    sample_df['predicted_demand'] = np.round(sample_pred).astype(int)
    sample_df['error'] = sample_df['predicted_demand'] - sample_df['actual_demand']
    
    display_cols = ['route_id', 'boarding_stop_index', 'hour_of_day', 'is_weekend', 'actual_demand', 'predicted_demand', 'error']
    print(sample_df[display_cols].to_string(index=False))
    
    print("\n✅ Simulation Comparison Complete!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate AI Demand Prediction Model")
    parser.add_argument("--data", type=str, default="../storage/ml_models/synthetic_booking_data.csv", help="Path to test data CSV")
    parser.add_argument("--models", type=str, default="../storage/ml_models", help="Path to model directory")
    
    args = parser.parse_args()
    evaluate_models(args.data, args.models)
