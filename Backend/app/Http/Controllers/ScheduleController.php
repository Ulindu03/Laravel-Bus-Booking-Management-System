<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Services\DemandPredictorService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class ScheduleController extends Controller
{
    private DemandPredictorService $demandPredictor;

    public function __construct(DemandPredictorService $demandPredictor)
    {
        $this->demandPredictor = $demandPredictor;
    }
    /**
     * Display a listing of all schedules.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Schedule::with(['bus', 'route']);

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by bus
        if ($request->has('bus_id') && $request->bus_id) {
            $query->where('bus_id', $request->bus_id);
        }

        // Filter by route
        if ($request->has('route_id') && $request->route_id) {
            $query->where('route_id', $request->route_id);
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->where('departure_time', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->where('departure_time', '<=', $request->date_to . ' 23:59:59');
        }

        $schedules = $query->orderBy('departure_time', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    /**
     * Public search for schedules by origin, destination, and date.
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'origin' => 'required|string',
            'destination' => 'required|string',
            'date' => 'required|date',
        ]);

        $origin = $validated['origin'];
        $destination = $validated['destination'];
        $date = $validated['date'];

        // Cache search results for 60 seconds — avoid repeated DB hits
        $cacheKey = 'search:' . md5("{$origin}|{$destination}|{$date}");

        $schedules = Cache::remember($cacheKey, 60, function () use ($origin, $destination, $date) {
            return $this->executeSearch($origin, $destination, $date);
        });

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    /**
     * Execute the actual search query (called by search() with caching).
     */
    private function executeSearch(string $origin, string $destination, string $date)
    {

        $schedules = Schedule::with([
                'bus:id,name,type,bus_number,total_seats',
                'route:id,name,origin,destination,stops,fare_matrix,distance_km,duration_mins'
            ])
            ->whereHas('route', function ($query) use ($origin, $destination) {
                $query->where('status', 'active')
                      ->where(function($q) use ($origin, $destination) {
                          // Check origin exists in route (origin col, destination col, or stops JSON)
                          $q->where(function($originQ) use ($origin) {
                              $originQ->whereRaw('LOWER(origin) = ?', [strtolower($origin)])
                                  ->orWhereRaw('LOWER(destination) = ?', [strtolower($origin)])
                                  // Fast LIKE on JSON column — avoids expensive JSON_SEARCH
                                  ->orWhereRaw('LOWER(CAST(stops AS CHAR)) LIKE ?', ['%' . strtolower($origin) . '%']);
                          })
                          // AND destination exists in route
                          ->where(function($destQ) use ($destination) {
                              $destQ->whereRaw('LOWER(origin) = ?', [strtolower($destination)])
                                  ->orWhereRaw('LOWER(destination) = ?', [strtolower($destination)])
                                  ->orWhereRaw('LOWER(CAST(stops AS CHAR)) LIKE ?', ['%' . strtolower($destination) . '%']);
                          });
                      });
            })
            ->where('status', 'scheduled')
            ->whereDate('departure_time', $date)
            ->where('departure_time', '>', now())
            ->orderBy('departure_time', 'asc')
            ->get();

        // Post-query: validate stop ordering — origin must come before destination
        // Uses getFullStopSequence() which includes origin + intermediates + destination
        $schedules = $schedules->filter(function ($schedule) use ($origin, $destination) {
            $route = $schedule->route;
            $fullStops = $route->getFullStopSequence();
            $fullStopsLower = array_map('strtolower', $fullStops);

            $originLower = strtolower($origin);
            $destLower   = strtolower($destination);

            $originIdx = array_search($originLower, $fullStopsLower);
            $destIdx   = array_search($destLower, $fullStopsLower);

            // Both must exist and origin must come before destination
            return $originIdx !== false && $destIdx !== false && $originIdx < $destIdx;
        })->values();

        // Calculate fares for each schedule
        $schedules->map(function ($schedule) use ($origin, $destination) {
            $route = $schedule->route;
            $fareMatrix = $route->fare_matrix ?? [];
            $matrixKey = "{$origin}-{$destination}";

            if (isset($fareMatrix[$matrixKey]) && is_numeric($fareMatrix[$matrixKey])) {
                $schedule->calculated_fare = round((float) $fareMatrix[$matrixKey], 2);
            } else {
                $schedule->calculated_fare = $schedule->price_per_seat;
            }

            // Quick inline demand estimate — no Python needed, instant
            // Uses seat availability ratio + time-based heuristics
            $totalSeats = $schedule->bus->total_seats ?? 54;
            $availableSeats = $schedule->available_seats;
            $fillRate = 1 - ($availableSeats / max($totalSeats, 1));
            $hour = $schedule->departure_time->hour ?? 8;

            // Boost for rush hours
            $rushBoost = (($hour >= 6 && $hour <= 9) || ($hour >= 16 && $hour <= 19)) ? 0.15 : 0;

            $demandScore = $fillRate + $rushBoost;

            if ($demandScore > 0.7 || $availableSeats <= 5) {
                $schedule->demand_level = 'high';
                $schedule->predicted_demand = (int) round(25 + ($fillRate * 10));
            } elseif ($demandScore > 0.4) {
                $schedule->demand_level = 'medium';
                $schedule->predicted_demand = (int) round(12 + ($fillRate * 8));
            } else {
                $schedule->demand_level = 'low';
                $schedule->predicted_demand = (int) round(5 + ($fillRate * 5));
            }

            return $schedule;
        });

        return $schedules;
    }


    /**
     * Store a newly created schedule in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bus_id' => 'required|exists:buses,id',
            'route_id' => 'required|exists:routes,id',
            'departure_time' => 'required|date|after:now',
            'arrival_time' => 'required|date|after:departure_time',
            'price_per_seat' => 'required|numeric|min:0',
            'available_seats' => 'required|integer|min:1',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
        ]);

        // Check for conflicts — same bus at overlapping time
        $conflict = Schedule::where('bus_id', $validated['bus_id'])
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($validated) {
                $query->whereBetween('departure_time', [$validated['departure_time'], $validated['arrival_time']])
                      ->orWhereBetween('arrival_time', [$validated['departure_time'], $validated['arrival_time']])
                      ->orWhere(function ($q) use ($validated) {
                          $q->where('departure_time', '<=', $validated['departure_time'])
                            ->where('arrival_time', '>=', $validated['arrival_time']);
                      });
            })
            ->exists();

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'Schedule conflict: This bus is already assigned during the selected time period.',
            ], 422);
        }

        $schedule = Schedule::create($validated);
        $schedule->load(['bus', 'route']);

        return response()->json([
            'success' => true,
            'message' => 'Schedule created successfully',
            'data' => $schedule,
        ], 201);
    }

    /**
     * Display the specified schedule.
     */
    public function show(Schedule $schedule): JsonResponse
    {
        $schedule->load(['bus', 'route', 'bookings' => function($query) {
            $query->where('status', '!=', 'cancelled')->with('bookedSeats');
        }]);

        // Add normalized stop sequence for segment-based booking UI
        $scheduleData = $schedule->toArray();
        $scheduleData['full_stops'] = $schedule->route->getFullStopSequence();

        return response()->json([
            'success' => true,
            'data' => $scheduleData,
        ]);
    }

    /**
     * Update the specified schedule in storage.
     */
    public function update(Request $request, Schedule $schedule): JsonResponse
    {
        $validated = $request->validate([
            'bus_id' => 'sometimes|exists:buses,id',
            'route_id' => 'sometimes|exists:routes,id',
            'departure_time' => 'sometimes|date',
            'arrival_time' => 'sometimes|date',
            'price_per_seat' => 'sometimes|numeric|min:0',
            'available_seats' => 'sometimes|integer|min:0',
            'status' => 'sometimes|in:scheduled,in_progress,completed,cancelled',
        ]);

        // Check for conflicts if bus or time is being changed
        if (isset($validated['bus_id']) || isset($validated['departure_time']) || isset($validated['arrival_time'])) {
            $busId = $validated['bus_id'] ?? $schedule->bus_id;
            $departure = $validated['departure_time'] ?? $schedule->departure_time;
            $arrival = $validated['arrival_time'] ?? $schedule->arrival_time;

            $conflict = Schedule::where('bus_id', $busId)
                ->where('id', '!=', $schedule->id)
                ->where('status', '!=', 'cancelled')
                ->where(function ($query) use ($departure, $arrival) {
                    $query->whereBetween('departure_time', [$departure, $arrival])
                          ->orWhereBetween('arrival_time', [$departure, $arrival])
                          ->orWhere(function ($q) use ($departure, $arrival) {
                              $q->where('departure_time', '<=', $departure)
                                ->where('arrival_time', '>=', $arrival);
                          });
                })
                ->exists();

            if ($conflict) {
                return response()->json([
                    'success' => false,
                    'message' => 'Schedule conflict: This bus is already assigned during the selected time period.',
                ], 422);
            }
        }

        $schedule->update($validated);
        $schedule->load(['bus', 'route']);

        return response()->json([
            'success' => true,
            'message' => 'Schedule updated successfully',
            'data' => $schedule,
        ]);
    }

    /**
     * Remove the specified schedule from storage.
     */
    public function destroy(Schedule $schedule): JsonResponse
    {
        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Schedule deleted successfully',
        ]);
    }
}
