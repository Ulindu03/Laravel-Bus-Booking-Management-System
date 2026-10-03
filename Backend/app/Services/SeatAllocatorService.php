<?php

namespace App\Services;

use App\Models\Schedule;
use App\Models\SegmentAvailability;
use Illuminate\Support\Facades\Log;

class SeatAllocatorService
{
    private DemandPredictorService $demandPredictor;

    public function __construct(DemandPredictorService $demandPredictor)
    {
        $this->demandPredictor = $demandPredictor;
    }

    /**
     * Calculate segment-based seat availability for a schedule.
     *
     * This is the core AI-powered allocation algorithm (Modified EMSR-b).
     * Instead of treating seats as whole-journey only, it calculates
     * how many seats are available on each segment of the route.
     *
     * @param Schedule $schedule
     * @return array Segment availability data
     */
    public function calculateAvailability(Schedule $schedule): array
    {
        $route = $schedule->route;
        $stops = $route->getFullStopSequence();

        if (count($stops) < 2) {
            // No intermediate stops — treat as single-segment route
            return [[
                'segment_index' => 0,
                'from' => $route->origin,
                'to' => $route->destination,
                'total_seats' => $schedule->bus->total_seats ?? $schedule->available_seats,
                'booked_seats' => $this->getBookedCountForSchedule($schedule),
                'available_seats' => max(0, ($schedule->bus->total_seats ?? $schedule->available_seats) - $this->getBookedCountForSchedule($schedule)),
                'predicted_demand' => null,
                'demand_level' => 'normal',
            ]];
        }

        $totalSeats = $schedule->bus->total_seats ?? $schedule->available_seats;
        $date = $schedule->departure_time->toDateString();
        $hour = $schedule->departure_time->hour;
        $busType = $schedule->bus->type ?? 'normal';

        // Extract exact fares for each segment
        $fareMatrix = $route->fare_matrix ?? [];
        $segmentFares = [];
        for ($i = 0; $i < count($stops) - 1; $i++) {
            $key = "{$stops[$i]}-{$stops[$i + 1]}";
            $segmentFares[$i] = isset($fareMatrix[$key]) ? (float) $fareMatrix[$key] : 0.0;
        }

        // Get demand predictions for each segment (ML will calculate Expected Revenue)
        $predictions = $this->demandPredictor->predictAllSegments(
            $route->id, $date, $hour, $segmentFares, $busType
        );

        // Get existing bookings per segment
        $existingBookings = $this->getExistingSegmentBookings($schedule, $stops);

        // Calculate protection levels using modified EMSR-b
        $allocations = $this->calculateProtectionLevels(
            totalSeats: $totalSeats,
            stops: $stops,
            predictions: $predictions,
            existingBookings: $existingBookings
        );

        // Update the segment_availability table
        $this->updateSegmentAvailability($schedule, $allocations);

        return $allocations;
    }

    /**
     * Check if specific seats are available for a segment booking.
     *
     * @param Schedule $schedule
     * @param string $boardingStop
     * @param string $alightingStop
     * @param array $seatNumbers
     * @return bool
     */
    public function areSeatsAvailable(
        Schedule $schedule,
        string $boardingStop,
        string $alightingStop,
        array $seatNumbers
    ): bool {
        $stops = $schedule->route->getFullStopSequence();
        $stopsLower = array_map('strtolower', $stops);
        $boardingIdx = array_search(strtolower($boardingStop), $stopsLower);
        $alightingIdx = array_search(strtolower($alightingStop), $stopsLower);

        if ($boardingIdx === false || $alightingIdx === false || $boardingIdx >= $alightingIdx) {
            return false;
        }

        // Check each segment between boarding and alighting
        for ($i = $boardingIdx; $i < $alightingIdx; $i++) {
            foreach ($seatNumbers as $seatNumber) {
                if ($this->isSeatBookedOnSegment($schedule, $seatNumber, $i)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Modified EMSR-b protection level calculation.
     *
     * Adapted from airline revenue management for fixed-fare bus systems.
     * Instead of maximizing revenue (airlines change prices), we maximize
     * seat utilization (bus fares are fixed by NTC).
     *
     * @param int $totalSeats
     * @param array $stops
     * @param array $predictions Keyed by segment_index
     * @param array $existingBookings Keyed by segment_index
     * @return array Allocation data per segment
     */
    private function calculateProtectionLevels(
        int $totalSeats,
        array $stops,
        array $predictions,
        array $existingBookings
    ): array {
        $segmentCount = count($stops) - 1;
        $allocations = [];

        // Step 1: Calculate full-journey protection
        // Full-journey passengers occupy a seat for ALL segments,
        // so they should get priority if demand is high.
        // predictions now returns array with 'predicted_demand' and 'demand_level' keys
        $firstPrediction = $predictions[0] ?? ['predicted_demand' => 15, 'demand_level' => 'medium'];
        $fullJourneyDemand = is_array($firstPrediction) ? ($firstPrediction['predicted_demand'] ?? 15) : $firstPrediction;
        $confidenceFactor = 0.8; // Default confidence until we have accuracy data

        // Protect seats for full-journey passengers
        $fullJourneyProtected = (int) min(
            $totalSeats * 0.5,  // Never protect more than 50% for full journey
            round($fullJourneyDemand * $confidenceFactor * 0.6)
        );

        // Step 2: Allocate remaining capacity across segments
        $remainingCapacity = $totalSeats - $fullJourneyProtected;

        for ($i = 0; $i < $segmentCount; $i++) {
            $from = $stops[$i];
            $to = $stops[$i + 1];

            // Extract predicted demand from array format
            $predictionData = $predictions[$i] ?? ['predicted_demand' => 15, 'demand_level' => 'medium'];
            $predicted = is_array($predictionData) ? ($predictionData['predicted_demand'] ?? 15) : $predictionData;
            $booked = $existingBookings[$i] ?? 0;

            // Protection for this segment based on demand
            // Longer remaining journey = more protection
            $segmentsRemaining = $segmentCount - $i;
            $protectionWeight = $segmentsRemaining / $segmentCount;
            $protected = (int) round($fullJourneyProtected * $protectionWeight);

            // Available seats = total - already booked on overlapping segments - protected
            $available = max(0, $totalSeats - $booked - $protected);

            // Determine demand level using requirement thresholds (>20=high, 10-20=medium, <10=low)
            $demandLevel = DemandPredictorService::getDemandLevel($predicted);

            $allocations[] = [
                'segment_index' => $i,
                'from' => $from,
                'to' => $to,
                'total_seats' => $totalSeats,
                'booked_seats' => $booked,
                'protected_seats' => $protected,
                'available_seats' => $available,
                'predicted_demand' => $predicted,
                'demand_level' => $demandLevel,
            ];
        }

        return $allocations;
    }

    /**
     * Get the count of existing bookings per segment for a schedule.
     *
     * @param Schedule $schedule
     * @param array $stops
     * @return array<int, int> Keyed by segment_index
     */
    private function getExistingSegmentBookings(Schedule $schedule, array $stops): array
    {
        $segmentCounts = array_fill(0, count($stops) - 1, 0);
        $stopsLower = array_map('strtolower', $stops);

        $bookings = $schedule->bookings()
            ->where('status', '!=', 'cancelled')
            ->with('bookedSeats')
            ->get();

        foreach ($bookings as $booking) {
            foreach ($booking->bookedSeats as $seat) {
                $boardingStop = $seat->boarding_stop;
                $alightingStop = $seat->alighting_stop;

                if ($boardingStop && $alightingStop) {
                    // Segment-based booking: mark all segments between boarding and alighting
                    $boardingIdx = array_search(strtolower($boardingStop), $stopsLower);
                    $alightingIdx = array_search(strtolower($alightingStop), $stopsLower);

                    if ($boardingIdx !== false && $alightingIdx !== false) {
                        for ($i = $boardingIdx; $i < $alightingIdx; $i++) {
                            $segmentCounts[$i]++;
                        }
                    }
                } else {
                    // Legacy whole-journey booking: occupies ALL segments
                    for ($i = 0; $i < count($stops) - 1; $i++) {
                        $segmentCounts[$i]++;
                    }
                }
            }
        }

        return $segmentCounts;
    }

    /**
     * Check if a specific seat is booked on a specific segment.
     *
     * @param Schedule $schedule
     * @param string $seatNumber
     * @param int $segmentIndex
     * @return bool
     */
    private function isSeatBookedOnSegment(Schedule $schedule, string $seatNumber, int $segmentIndex): bool
    {
        $stops = $schedule->route->getFullStopSequence();
        $stopsLower = array_map('strtolower', $stops);

        $bookedSeats = $schedule->bookings()
            ->where('status', '!=', 'cancelled')
            ->with('bookedSeats')
            ->get()
            ->pluck('bookedSeats')
            ->flatten()
            ->where('seat_number', $seatNumber);

        foreach ($bookedSeats as $seat) {
            if ($seat->boarding_stop && $seat->alighting_stop) {
                $boardingIdx = array_search(strtolower($seat->boarding_stop), $stopsLower);
                $alightingIdx = array_search(strtolower($seat->alighting_stop), $stopsLower);

                if ($boardingIdx !== false && $alightingIdx !== false
                    && $segmentIndex >= $boardingIdx && $segmentIndex < $alightingIdx) {
                    return true;
                }
            } else {
                // Whole-journey booking — occupied on ALL segments
                return true;
            }
        }

        return false;
    }

    /**
     * Get total booked seats for a schedule (all segments combined).
     *
     * @param Schedule $schedule
     * @return int
     */
    private function getBookedCountForSchedule(Schedule $schedule): int
    {
        return $schedule->bookings()
            ->where('status', '!=', 'cancelled')
            ->withCount('bookedSeats')
            ->get()
            ->sum('booked_seats_count');
    }

    /**
     * Persist calculated allocations to the segment_availability table.
     *
     * @param Schedule $schedule
     * @param array $allocations
     */
    private function updateSegmentAvailability(Schedule $schedule, array $allocations): void
    {
        try {
            foreach ($allocations as $allocation) {
                SegmentAvailability::updateOrCreate(
                    [
                        'schedule_id' => $schedule->id,
                        'segment_index' => $allocation['segment_index'],
                    ],
                    [
                        'segment_start' => $allocation['from'],
                        'segment_end' => $allocation['to'],
                        'total_seats' => $allocation['total_seats'],
                        'booked_seats' => $allocation['booked_seats'],
                        'protected_seats' => $allocation['protected_seats'],
                        'available_seats' => $allocation['available_seats'],
                        'predicted_demand' => $allocation['predicted_demand'],
                    ]
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to update segment availability', [
                'schedule_id' => $schedule->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
