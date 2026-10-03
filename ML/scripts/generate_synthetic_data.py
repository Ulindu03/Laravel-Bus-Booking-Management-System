# =============================================================================
# 📊 generate_synthetic_data.py
# Synthetic Booking Data Generator — Serendib Go Bus Booking System
# =============================================================================
# මේකෙන් කරන්නේ: ML model train කරන්න synthetic booking data 10,000ක් generate කරනවා
# Real NTC routes use කරලා, rush hour patterns, weekend patterns, holiday patterns
# ඔක්කොම simulate කරනවා realistic data set එකක් හදන්න.
#
# Bugs fixed from original script:
#   - random.choices() returns list → [0] added
#   - hour variable inconsistent types → fixed
#   - random.choice([8-10]) → random.choice([0,15,30,45])
#   - advance_days weights count mismatch → fixed
#   - Missing closing parenthesis → fixed
# =============================================================================

import pandas as pd
import random
import os
from datetime import datetime, timedelta

# =============================================================================
# 1. BASE DATA SETUP — Routes & Segments (ඔයාගේ system එකේ තියෙන routes)
# =============================================================================

# මේ routes ඔයාගේ database එකේ තියෙන ඒවාට match වෙන්න ඕන
routes = {
    1: {
        "name": "Colombo - Kandy",
        "stops": ["Colombo", "Peliyagoda", "Kegalle", "Mawanella", "Kandy"],
        "base_fare": 450,       # NTC fixed fare (LKR)
        "distance_km": 115.0,
        "duration_mins": 210    # 3.5 hours
    },
    2: {
        "name": "Colombo - Matara",
        "stops": ["Colombo", "Panadura", "Kalutara", "Galle", "Matara"],
        "base_fare": 1022,
        "distance_km": 160.0,
        "duration_mins": 240    # 4 hours
    },
    15: {
        "name": "Colombo - Anuradhapura",
        "stops": ["Colombo", "Nittambuwa", "Kurunegala", "Dambulla", "Anuradhapura"],
        "base_fare": 1433,
        "distance_km": 200.0,
        "duration_mins": 300    # 5 hours
    }
}

# Bus types — ඔයාගේ buses table එකේ enum values match කරනවා
# Database enum: 'normal', 'semi_luxury', 'luxury', 'ac'
bus_types = {
    "normal": {"multiplier": 1.0, "seats": 54},
    "semi_luxury": {"multiplier": 1.3, "seats": 42},
    "luxury": {"multiplier": 1.6, "seats": 40},
    "ac": {"multiplier": 1.8, "seats": 36}
}

# =============================================================================
# 2. SRI LANKAN HOLIDAYS & POYA DAYS (2026 August - October)
# =============================================================================
# මේ holidays demand prediction model එකට important — Poya day, long weekend
# ඒවට bus demand ගොඩක් වැඩි වෙනවා

sri_lankan_holidays = [
    datetime(2026, 8, 1),   # Nikini Poya
    datetime(2026, 8, 30),  # Binara Poya
    datetime(2026, 9, 29),  # Vap Poya
    datetime(2026, 10, 7),  # Deepavali
    datetime(2026, 10, 28), # Il Poya
]

# =============================================================================
# 3. CONFIGURATION
# =============================================================================
TOTAL_BOOKINGS = 10000          # Generate කරන total bookings ගණන
START_DATE = datetime(2026, 8, 1)  # Data generation start date
DAYS_RANGE = 90                 # 90 දවස් range එක (Aug - Oct 2026)
TOTAL_USERS = 1500              # Simulate කරන unique users ගණන (repeat customers clustering වලට)

# =============================================================================
# 4. HELPER FUNCTIONS
# =============================================================================

def is_holiday(date):
    """දීපු date එක holiday එකක්ද check කරනවා"""
    return any(date.date() == h.date() for h in sri_lankan_holidays)

def is_month_end(date):
    """Month end ද check කරනවා — salary day = more travel"""
    return date.day >= 28

def get_rush_hour(date):
    """
    Rush hour time එක return කරනවා based on day of week.
    
    Rush patterns (Sri Lanka):
    - සඳුදා (Monday): උදේ rush — people going to work/school (4AM-9AM)
    - සිකුරාදා (Friday): සවස rush — people going home for weekend (3PM-9PM)
    - සෙනසුරාදා/ඉරිදා (Weekend): mixed — travel/leisure
    - අනිත් දවස්: normal distribution
    """
    day_of_week = date.weekday()  # 0=Monday, 4=Friday, 5=Saturday, 6=Sunday
    
    if day_of_week == 0:  # Monday — උදේ rush
        # 80% chance උදේ time, 20% chance අනිත් time
        hour = random.choices(
            [random.randint(4, 9), random.randint(10, 20)],
            weights=[0.8, 0.2]
        )[0]
    elif day_of_week == 4:  # Friday — සවස rush
        # 70% chance සවස, 30% chance උදේ
        hour = random.choices(
            [random.randint(15, 21), random.randint(6, 14)],
            weights=[0.7, 0.3]
        )[0]
    elif day_of_week in [5, 6]:  # Weekend — උදේ travel වැඩි
        hour = random.choices(
            [random.randint(5, 10), random.randint(11, 20)],
            weights=[0.6, 0.4]
        )[0]
    else:  # Normal weekdays (Tue, Wed, Thu)
        # උදේ rush + සවස rush + midday
        hour = random.choices(
            [random.randint(5, 9), random.randint(10, 15), random.randint(16, 21)],
            weights=[0.4, 0.3, 0.3]
        )[0]
    
    return hour

def get_advance_booking_days(date, is_hol):
    """
    කොච්චර දවස් කලින් book කරනවද calculate කරනවා.
    
    Patterns:
    - Holiday bookings: 7-14 දවස් කලින් book කරනවා (advance planning)
    - Weekend trips: 3-5 දවස් කලින්
    - Daily commuters: 0-1 දවස් (same day or day before)
    - Normal: random mix
    """
    if is_hol:
        # Holiday එකට කලින්ම book කරනවා
        return random.choices([7, 10, 14, 3], weights=[0.3, 0.3, 0.2, 0.2])[0]
    
    if date.weekday() in [5, 6]:  # Weekend trip
        return random.choices([3, 5, 1, 7], weights=[0.3, 0.3, 0.2, 0.2])[0]
    
    # Normal / commuter
    return random.choices([0, 1, 3, 7], weights=[0.3, 0.3, 0.2, 0.2])[0]


# =============================================================================
# 5. MAIN DATA GENERATION — මේ තමයි main loop එක
# =============================================================================

records = []
print("🚌 Generating 10,000 synthetic bookings based on Sri Lankan travel patterns...")
print(f"   📅 Date range: {START_DATE.strftime('%Y-%m-%d')} to {(START_DATE + timedelta(days=DAYS_RANGE)).strftime('%Y-%m-%d')}")
print(f"   🛤️  Routes: {len(routes)}")
print(f"   👥 Simulated users: {TOTAL_USERS}")
print()

for i in range(TOTAL_BOOKINGS):
    # --- Route select කරනවා (weighted — Colombo-Kandy most popular) ---
    route_id = random.choices(
        list(routes.keys()),
        weights=[0.45, 0.30, 0.25]   # Kandy route එක most popular
    )[0]
    route = routes[route_id]
    
    # --- Bus type select කරනවා ---
    bus_type = random.choices(
        list(bus_types.keys()),
        weights=[0.35, 0.30, 0.20, 0.15]  # Normal buses වැඩියෙන් run වෙනවා
    )[0]
    bus_info = bus_types[bus_type]
    
    # --- Boarding and Alighting stops pick කරනවා (Segment-based booking!) ---
    # මේක තමයි AI/ML component එකේ core concept එක
    # Passenger කෙනෙක් full journey එක book නොකර, segment එකක් විතරක් book කරන්න පුළුවන්
    start_idx = random.randint(0, len(route["stops"]) - 2)
    end_idx = random.randint(start_idx + 1, len(route["stops"]) - 1)
    
    # Full journey vs partial journey probability
    # 40% passengers full journey book කරනවා, 60% partial segments
    if random.random() < 0.40:
        start_idx = 0
        end_idx = len(route["stops"]) - 1
    
    # --- Departure date & time generate කරනවා ---
    random_days = random.randint(0, DAYS_RANGE)
    departure_date = START_DATE + timedelta(days=random_days)
    
    # Rush hour logic apply කරනවා
    hour = get_rush_hour(departure_date)
    minute = random.choice([0, 15, 30, 45])  # Buses usually depart on 15-min intervals
    departure_time = departure_date.replace(hour=hour, minute=minute, second=0)
    
    # --- Arrival time calculate කරනවා (approximate) ---
    segment_count = end_idx - start_idx
    total_segments = len(route["stops"]) - 1
    travel_mins = int((route["duration_mins"] / total_segments) * segment_count)
    arrival_time = departure_time + timedelta(minutes=travel_mins)
    
    # --- Booking time (කවදාද book කළේ?) ---
    hol = is_holiday(departure_date)
    advance_days = get_advance_booking_days(departure_date, hol)
    booked_at = departure_time - timedelta(days=advance_days, hours=random.randint(1, 12))
    
    # --- Fare calculate කරනවා (NTC rate + bus type multiplier) ---
    fare_per_segment = route["base_fare"] / total_segments
    fare = fare_per_segment * segment_count * bus_info["multiplier"]
    
    # --- Weekend, holiday flags ---
    day_of_week = departure_date.isoweekday()  # 1=Monday, 7=Sunday
    is_weekend = 1 if day_of_week >= 6 else 0
    is_hol = 1 if hol else 0
    is_mend = 1 if is_month_end(departure_date) else 0
    
    # --- Booking status — most confirmed, some cancelled ---
    status = random.choices(
        ['confirmed', 'completed', 'cancelled'],
        weights=[0.50, 0.40, 0.10]
    )[0]
    
    # --- User ID — simulate repeat customers ---
    # සමහර users frequently book කරනවා (commuters), සමහරු rarely (tourists)
    if random.random() < 0.35:
        # Frequent commuter — same small pool of user IDs
        user_id = random.randint(1, 200)
    elif random.random() < 0.60:
        # Regular user
        user_id = random.randint(201, 800)
    else:
        # Occasional user
        user_id = random.randint(801, TOTAL_USERS)
    
    # --- Seat number generate කරනවා ---
    total_bus_seats = bus_info["seats"]
    seat_number = f"{random.choice(['A','B','C','D'])}{random.randint(1, total_bus_seats // 4)}"
    
    # --- Record එක add කරනවා ---
    records.append({
        "booking_id": f"BKG{10000 + i}",
        "route_id": route_id,
        "route_name": route["name"],
        "bus_type": bus_type,
        "boarding_stop": route["stops"][start_idx],
        "boarding_stop_index": start_idx,
        "alighting_stop": route["stops"][end_idx],
        "alighting_stop_index": end_idx,
        "segment_count": segment_count,
        "seat_number": seat_number,
        "departure_time": departure_time.strftime("%Y-%m-%d %H:%M:%S"),
        "arrival_time": arrival_time.strftime("%Y-%m-%d %H:%M:%S"),
        "booked_at": booked_at.strftime("%Y-%m-%d %H:%M:%S"),
        "fare": round(fare, 2),
        "day_of_week": day_of_week,
        "hour_of_day": hour,
        "is_weekend": is_weekend,
        "is_holiday": is_hol,
        "is_month_end": is_mend,
        "user_id": user_id,
        "status": status,
        "passenger_name": f"Passenger_{user_id}",
    })
    
    # Progress bar එක
    if (i + 1) % 2000 == 0:
        print(f"   ✅ {i + 1}/{TOTAL_BOOKINGS} bookings generated...")

# =============================================================================
# 6. SAVE TO CSV — CSV file එකට save කරනවා
# =============================================================================

df = pd.DataFrame(records)

# ML/data/raw/ folder එකට save කරනවා
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))  # ML/ folder එකෙන් උඩට
ml_data_dir = os.path.join(os.path.dirname(script_dir), "data", "raw")

# Directory එක නැත්නම් create කරනවා
os.makedirs(ml_data_dir, exist_ok=True)

output_path = os.path.join(ml_data_dir, "bus_bookings_10000.csv")
df.to_csv(output_path, index=False)

print()
print(f"🎉 Success! Dataset saved to: {output_path}")
print(f"   📊 Total records: {len(df)}")
print(f"   🛤️  Routes covered: {df['route_id'].nunique()}")
print(f"   👥 Unique users: {df['user_id'].nunique()}")
print(f"   📅 Date range: {df['departure_time'].min()} → {df['departure_time'].max()}")
print()

# --- Quick summary print කරනවා ---
print("📈 Dataset Summary:")
print("=" * 60)
print(f"\n🛤️  Bookings per Route:")
for route_id, count in df['route_id'].value_counts().items():
    print(f"   Route {route_id} ({routes[route_id]['name']}): {count} bookings")

print(f"\n🚌 Bookings per Bus Type:")
for bt, count in df['bus_type'].value_counts().items():
    print(f"   {bt}: {count} bookings")

print(f"\n📊 Full Journey vs Partial:")
full_count = len(df[df['boarding_stop_index'] == 0])
partial_count = len(df[df['boarding_stop_index'] > 0])
print(f"   Full journey (from origin): {full_count} ({full_count/len(df)*100:.1f}%)")
print(f"   Partial segment: {partial_count} ({partial_count/len(df)*100:.1f}%)")

print(f"\n📅 Weekend vs Weekday:")
weekend = df['is_weekend'].sum()
weekday = len(df) - weekend
print(f"   Weekday: {weekday} ({weekday/len(df)*100:.1f}%)")
print(f"   Weekend: {weekend} ({weekend/len(df)*100:.1f}%)")

print(f"\n✅ Status Distribution:")
for status, count in df['status'].value_counts().items():
    print(f"   {status}: {count} ({count/len(df)*100:.1f}%)")
