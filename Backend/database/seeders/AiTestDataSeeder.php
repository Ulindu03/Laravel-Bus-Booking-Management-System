<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Bus;
use App\Models\Route;
use App\Models\Schedule;
use App\Models\Booking;
use App\Models\BookedSeat;
use App\Models\User;
use Carbon\Carbon;

/**
 * AI Test Data Seeder
 * 
 * මේකෙන් කරන්නේ: Python script එකෙන් generate කළ synthetic booking data
 * CSV file එකෙන් read කරලා database එකට seed කරනවා.
 * ML model training වලට ප්‍රමාණවත් data database එකේ තියෙන්න ඕන.
 * 
 * Run: php artisan db:seed --class=AiTestDataSeeder
 */
class AiTestDataSeeder extends Seeder
{
    /**
     * Route definitions — Python script එකේ define කළ routes match කරනවා
     */
    private array $routeDefinitions = [
        1 => [
            'name' => 'Colombo - Kandy Express',
            'origin' => 'Colombo',
            'destination' => 'Kandy',
            'stops' => ['Colombo', 'Peliyagoda', 'Kegalle', 'Mawanella', 'Kandy'],
            'distance_km' => 115.0,
            'duration_mins' => 210,
            'base_fare' => 450.00,
        ],
        2 => [
            'name' => 'Colombo - Matara Coastal',
            'origin' => 'Colombo',
            'destination' => 'Matara',
            'stops' => ['Colombo', 'Panadura', 'Kalutara', 'Galle', 'Matara'],
            'distance_km' => 160.0,
            'duration_mins' => 240,
            'base_fare' => 1022.00,
        ],
        15 => [
            'name' => 'Colombo - Anuradhapura Heritage',
            'origin' => 'Colombo',
            'destination' => 'Anuradhapura',
            'stops' => ['Colombo', 'Nittambuwa', 'Kurunegala', 'Dambulla', 'Anuradhapura'],
            'distance_km' => 200.0,
            'duration_mins' => 300,
            'base_fare' => 1433.00,
        ],
    ];

    /**
     * Bus definitions — each route එකට multiple buses
     */
    private array $busDefinitions = [
        ['bus_number' => 'NB-1234', 'name' => 'Kandy Express Normal', 'type' => 'normal', 'total_seats' => 54, 'seat_layout' => '2x2'],
        ['bus_number' => 'NB-5678', 'name' => 'Kandy Express Luxury', 'type' => 'luxury', 'total_seats' => 40, 'seat_layout' => '2x2'],
        ['bus_number' => 'NB-9012', 'name' => 'Matara Coastal Normal', 'type' => 'normal', 'total_seats' => 54, 'seat_layout' => '2x2'],
        ['bus_number' => 'SL-3456', 'name' => 'Matara Semi-Luxury', 'type' => 'semi_luxury', 'total_seats' => 42, 'seat_layout' => '2x2'],
        ['bus_number' => 'NB-7890', 'name' => 'Anuradhapura Normal', 'type' => 'normal', 'total_seats' => 54, 'seat_layout' => '2x2'],
        ['bus_number' => 'AC-1111', 'name' => 'Anuradhapura AC', 'type' => 'ac', 'total_seats' => 36, 'seat_layout' => '2x2'],
        ['bus_number' => 'SL-2222', 'name' => 'Kandy Semi-Luxury', 'type' => 'semi_luxury', 'total_seats' => 42, 'seat_layout' => '2x2'],
        ['bus_number' => 'AC-3333', 'name' => 'Matara AC Express', 'type' => 'ac', 'total_seats' => 36, 'seat_layout' => '2x2'],
        ['bus_number' => 'LX-4444', 'name' => 'Anuradhapura Luxury', 'type' => 'luxury', 'total_seats' => 40, 'seat_layout' => '2x2'],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚌 Starting AI Test Data Seeder...');
        $this->command->info('');

        // ===================================================================
        // Step 1: Test users create කරනවා
        // ===================================================================
        $this->command->info('👥 Step 1: Creating test users...');
        $this->createTestUsers();

        // ===================================================================
        // Step 2: Routes create කරනවා (stops JSON column ඇතුළත්)
        // ===================================================================
        $this->command->info('🛤️  Step 2: Creating routes with stops...');
        $routeIdMap = $this->createRoutes();

        // ===================================================================
        // Step 3: Buses create කරනවා
        // ===================================================================
        $this->command->info('🚌 Step 3: Creating buses...');
        $this->createBuses();

        // ===================================================================
        // Step 4: Schedules create කරනවා
        // ===================================================================
        $this->command->info('📅 Step 4: Creating schedules...');
        $this->createSchedules($routeIdMap);

        // ===================================================================
        // Step 5: CSV data import කරනවා (bookings + booked_seats)
        // ===================================================================
        $this->command->info('📊 Step 5: Importing synthetic booking data from CSV...');
        $this->importBookingsFromCSV($routeIdMap);

        $this->command->info('');
        $this->command->info('🎉 AI Test Data Seeder completed!');
        $this->command->info('   Now you can train the ML models.');
    }

    /**
     * Test users 200ක් create කරනවා (frequent travelers)
     */
    private function createTestUsers(): void
    {
        $existingCount = User::count();
        $needed = max(0, 200 - $existingCount);

        if ($needed === 0) {
            $this->command->info("   ✅ Users already exist ({$existingCount} found)");
            return;
        }

        for ($i = $existingCount + 1; $i <= $existingCount + $needed; $i++) {
            User::firstOrCreate(
                ['email' => "testuser{$i}@serendibgo.lk"],
                [
                    'name' => "Test User {$i}",
                    'password' => bcrypt('password123'),
                    'role' => 'user',
                    'email_verified_at' => now(),
                ]
            );
        }

        $this->command->info("   ✅ Created {$needed} test users");
    }

    /**
     * Routes create or update කරනවා — stops JSON ඇතුළත්
     * Returns map of our route keys to actual DB IDs
     */
    private function createRoutes(): array
    {
        $routeIdMap = [];

        foreach ($this->routeDefinitions as $key => $routeDef) {
            $route = Route::updateOrCreate(
                ['name' => $routeDef['name']],
                [
                    'origin' => $routeDef['origin'],
                    'destination' => $routeDef['destination'],
                    'stops' => $routeDef['stops'],
                    'distance_km' => $routeDef['distance_km'],
                    'duration_mins' => $routeDef['duration_mins'],
                    'base_fare' => $routeDef['base_fare'],
                    'status' => 'active',
                ]
            );
            $routeIdMap[$key] = $route->id;
            $this->command->info("   ✅ Route: {$routeDef['name']} (ID: {$route->id})");
        }

        return $routeIdMap;
    }

    /**
     * Buses create කරනවා
     */
    private function createBuses(): void
    {
        foreach ($this->busDefinitions as $busDef) {
            Bus::updateOrCreate(
                ['bus_number' => $busDef['bus_number']],
                [
                    'name' => $busDef['name'],
                    'type' => $busDef['type'],
                    'total_seats' => $busDef['total_seats'],
                    'seat_layout' => $busDef['seat_layout'],
                    'status' => 'active',
                ]
            );
        }
        $this->command->info("   ✅ Created " . count($this->busDefinitions) . " buses");
    }

    /**
     * Schedules create කරනවා — 90 day range එකට
     * Route + bus type combo එකකට day එකකට 3-4 schedules
     */
    private function createSchedules(array $routeIdMap): void
    {
        $startDate = Carbon::parse('2026-08-01');
        $endDate = Carbon::parse('2026-10-30');
        $schedulesCreated = 0;

        // Bus type to route mapping
        $busRouteMap = [
            // Route 1: Colombo-Kandy
            ['bus_number' => 'NB-1234', 'route_key' => 1, 'times' => ['06:00', '10:00', '14:00', '18:00']],
            ['bus_number' => 'NB-5678', 'route_key' => 1, 'times' => ['07:00', '15:00']],
            ['bus_number' => 'SL-2222', 'route_key' => 1, 'times' => ['08:00', '16:00']],
            // Route 2: Colombo-Matara
            ['bus_number' => 'NB-9012', 'route_key' => 2, 'times' => ['05:30', '09:00', '13:00', '17:00']],
            ['bus_number' => 'SL-3456', 'route_key' => 2, 'times' => ['06:30', '14:30']],
            ['bus_number' => 'AC-3333', 'route_key' => 2, 'times' => ['07:30', '15:30']],
            // Route 15: Colombo-Anuradhapura
            ['bus_number' => 'NB-7890', 'route_key' => 15, 'times' => ['05:00', '08:00', '12:00', '16:00']],
            ['bus_number' => 'AC-1111', 'route_key' => 15, 'times' => ['06:00', '14:00']],
            ['bus_number' => 'LX-4444', 'route_key' => 15, 'times' => ['07:00', '15:00']],
        ];

        $current = $startDate->copy();

        while ($current->lte($endDate)) {
            foreach ($busRouteMap as $mapping) {
                $bus = Bus::where('bus_number', $mapping['bus_number'])->first();
                $routeId = $routeIdMap[$mapping['route_key']] ?? null;
                $routeDef = $this->routeDefinitions[$mapping['route_key']];

                if (!$bus || !$routeId) continue;

                foreach ($mapping['times'] as $time) {
                    $departure = Carbon::parse($current->format('Y-m-d') . ' ' . $time);
                    $arrival = $departure->copy()->addMinutes($routeDef['duration_mins']);

                    // Price based on bus type
                    $priceMultiplier = match($bus->type) {
                        'normal' => 1.0,
                        'semi_luxury' => 1.3,
                        'luxury' => 1.6,
                        'ac' => 1.8,
                        default => 1.0,
                    };

                    Schedule::updateOrCreate(
                        [
                            'bus_id' => $bus->id,
                            'route_id' => $routeId,
                            'departure_time' => $departure,
                        ],
                        [
                            'arrival_time' => $arrival,
                            'price_per_seat' => round($routeDef['base_fare'] * $priceMultiplier, 2),
                            'available_seats' => $bus->total_seats,
                            'status' => $departure->isPast() ? 'completed' : 'scheduled',
                        ]
                    );
                    $schedulesCreated++;
                }
            }
            $current->addDay();
        }

        $this->command->info("   ✅ Created {$schedulesCreated} schedules (90 days × " . count($busRouteMap) . " bus-route combos)");
    }

    /**
     * CSV file එකෙන් bookings import කරනවා
     */
    private function importBookingsFromCSV(array $routeIdMap): void
    {
        $csvPath = base_path('../ML/data/raw/bus_bookings_10000.csv');

        if (!file_exists($csvPath)) {
            $this->command->warn("   ⚠️  CSV file not found: {$csvPath}");
            $this->command->warn("   💡 First run: python ML/scripts/generate_synthetic_data.py");
            return;
        }

        $csv = array_map('str_getcsv', file($csvPath));
        $headers = array_shift($csv); // First row = headers

        $totalImported = 0;
        $totalSkipped = 0;
        $batchSize = 500;
        $batch = [];

        DB::beginTransaction();

        try {
            foreach ($csv as $index => $row) {
                if (count($row) !== count($headers)) {
                    $totalSkipped++;
                    continue;
                }

                $data = array_combine($headers, $row);

                // Map our route_id keys to actual DB route IDs
                $csvRouteId = (int) $data['route_id'];
                $dbRouteId = $routeIdMap[$csvRouteId] ?? null;

                if (!$dbRouteId) {
                    $totalSkipped++;
                    continue;
                }

                // Find a matching schedule (closest departure time)
                $departureTime = Carbon::parse($data['departure_time']);
                $schedule = Schedule::where('route_id', $dbRouteId)
                    ->whereDate('departure_time', $departureTime->toDateString())
                    ->orderByRaw("ABS(TIMESTAMPDIFF(MINUTE, departure_time, ?))", [$departureTime])
                    ->first();

                if (!$schedule) {
                    // No schedule found for this date — try to find any schedule on this route
                    $schedule = Schedule::where('route_id', $dbRouteId)
                        ->inRandomOrder()
                        ->first();
                }

                if (!$schedule) {
                    $totalSkipped++;
                    continue;
                }

                // Find or create user
                $userId = min((int) $data['user_id'], 200); // Cap at 200 test users
                $user = User::find($userId);
                if (!$user) {
                    $user = User::first(); // Fallback to first user
                }

                // Create booking
                $booking = Booking::create([
                    'user_id' => $user->id,
                    'schedule_id' => $schedule->id,
                    'booking_ref' => 'SG-' . strtoupper(Str::random(8)),
                    'total_seats' => 1,
                    'total_amount' => (float) $data['fare'],
                    'status' => $data['status'] ?? 'confirmed',
                    'booked_at' => Carbon::parse($data['booked_at']),
                ]);

                // Create booked seat with segment data (boarding_stop, alighting_stop)
                // මේක තමයි AI/ML component එකේ key feature — segment-based booking!
                BookedSeat::create([
                    'booking_id' => $booking->id,
                    'seat_number' => $data['seat_number'] ?? 'A1',
                    'passenger_name' => $data['passenger_name'] ?? "Passenger {$user->id}",
                    'passenger_phone' => null,
                    'boarding_stop' => $data['boarding_stop'],
                    'alighting_stop' => $data['alighting_stop'],
                ]);

                // Update available seats
                $schedule->decrement('available_seats');

                $totalImported++;

                // Progress update
                if ($totalImported % 1000 === 0) {
                    $this->command->info("   📊 Imported {$totalImported} bookings...");
                }
            }

            DB::commit();

            $this->command->info("   ✅ Imported {$totalImported} bookings ({$totalSkipped} skipped)");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("   ❌ Import failed: " . $e->getMessage());
        }
    }
}
