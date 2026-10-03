<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\SeatAllocatorService;
use App\Services\DemandPredictorService;
use App\Models\Schedule;
use App\Models\Route;
use App\Models\Bus;
use App\Models\Booking;
use App\Models\BookedSeat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

/**
 * SeatAllocatorService Unit Tests
 *
 * EMSR-b algorithm, segment availability, seat overlap detection test කරනවා.
 */
class SeatAllocatorServiceTest extends TestCase
{
    use RefreshDatabase;

    private SeatAllocatorService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock the DemandPredictorService — actual ML model access needed නෑ
        $mockPredictor = Mockery::mock(DemandPredictorService::class);
        $mockPredictor->shouldReceive('predictAllSegments')
            ->andReturn([0 => 10, 1 => 15, 2 => 8, 3 => 12]);
        $mockPredictor->shouldReceive('predictDemand')
            ->andReturn(12.5);

        $this->service = new SeatAllocatorService($mockPredictor);
    }

    /**
     * Test: Segment availability with no existing bookings
     * Expected: All segments should show full capacity available
     */
    public function test_calculate_availability_returns_segments_for_multi_stop_route(): void
    {
        $route = Route::factory()->create([
            'origin' => 'Colombo',
            'destination' => 'Kandy',
            'stops' => ['Colombo', 'Peliyagoda', 'Kegalle', 'Mawanella', 'Kandy'],
        ]);

        $bus = Bus::factory()->create([
            'total_seats' => 54,
            'type' => 'normal',
        ]);

        $schedule = Schedule::factory()->create([
            'route_id' => $route->id,
            'bus_id' => $bus->id,
            'available_seats' => 54,
        ]);

        $result = $this->service->calculateAvailability($schedule);

        // Should have 4 segments for 5 stops
        $this->assertCount(4, $result);

        // Each segment should have the required keys
        foreach ($result as $segment) {
            $this->assertArrayHasKey('segment_index', $segment);
            $this->assertArrayHasKey('from', $segment);
            $this->assertArrayHasKey('to', $segment);
            $this->assertArrayHasKey('total_seats', $segment);
            $this->assertArrayHasKey('available_seats', $segment);
            $this->assertArrayHasKey('demand_level', $segment);
        }

        // First segment should be Colombo → Peliyagoda
        $this->assertEquals('Colombo', $result[0]['from']);
        $this->assertEquals('Peliyagoda', $result[0]['to']);
    }

    /**
     * Test: Two-stop route treated as single segment
     */
    public function test_single_segment_route_returns_one_segment(): void
    {
        $route = Route::factory()->create([
            'origin' => 'Colombo',
            'destination' => 'Galle',
            'stops' => null,
        ]);

        $bus = Bus::factory()->create(['total_seats' => 40]);
        $schedule = Schedule::factory()->create([
            'route_id' => $route->id,
            'bus_id' => $bus->id,
            'available_seats' => 40,
        ]);

        $result = $this->service->calculateAvailability($schedule);

        $this->assertCount(1, $result);
        $this->assertEquals('Colombo', $result[0]['from']);
        $this->assertEquals('Galle', $result[0]['to']);
    }

    /**
     * Test: Seat availability check with overlapping segments
     * Seat A1 booked for Colombo→Kegalle, should NOT be available for Colombo→Kandy
     */
    public function test_seats_unavailable_for_overlapping_segments(): void
    {
        $route = Route::factory()->create([
            'stops' => ['Colombo', 'Peliyagoda', 'Kegalle', 'Mawanella', 'Kandy'],
        ]);

        $bus = Bus::factory()->create(['total_seats' => 54]);
        $schedule = Schedule::factory()->create([
            'route_id' => $route->id,
            'bus_id' => $bus->id,
        ]);

        // Book seat A1 for Colombo → Kegalle
        $booking = Booking::factory()->create([
            'schedule_id' => $schedule->id,
            'status' => 'confirmed',
        ]);
        BookedSeat::create([
            'booking_id' => $booking->id,
            'seat_number' => 'A1',
            'passenger_name' => 'Test User',
            'boarding_stop' => 'Colombo',
            'alighting_stop' => 'Kegalle',
        ]);

        // A1 should NOT be available for Colombo → Kandy (overlaps)
        $available = $this->service->areSeatsAvailable(
            $schedule, 'Colombo', 'Kandy', ['A1']
        );
        $this->assertFalse($available);
    }

    /**
     * Test: Seat available for non-overlapping segments
     * Seat A1 booked for Colombo→Kegalle, SHOULD be available for Kegalle→Kandy
     */
    public function test_seats_available_for_non_overlapping_segments(): void
    {
        $route = Route::factory()->create([
            'stops' => ['Colombo', 'Peliyagoda', 'Kegalle', 'Mawanella', 'Kandy'],
        ]);

        $bus = Bus::factory()->create(['total_seats' => 54]);
        $schedule = Schedule::factory()->create([
            'route_id' => $route->id,
            'bus_id' => $bus->id,
        ]);

        // Book seat A1 for Colombo → Kegalle
        $booking = Booking::factory()->create([
            'schedule_id' => $schedule->id,
            'status' => 'confirmed',
        ]);
        BookedSeat::create([
            'booking_id' => $booking->id,
            'seat_number' => 'A1',
            'passenger_name' => 'Test User',
            'boarding_stop' => 'Colombo',
            'alighting_stop' => 'Kegalle',
        ]);

        // A1 SHOULD be available for Kegalle → Kandy (no overlap)
        $available = $this->service->areSeatsAvailable(
            $schedule, 'Kegalle', 'Kandy', ['A1']
        );
        $this->assertTrue($available);
    }

    /**
     * Test: Invalid stops should fail
     */
    public function test_invalid_stops_return_false(): void
    {
        $route = Route::factory()->create([
            'stops' => ['Colombo', 'Kandy'],
        ]);

        $bus = Bus::factory()->create(['total_seats' => 54]);
        $schedule = Schedule::factory()->create([
            'route_id' => $route->id,
            'bus_id' => $bus->id,
        ]);

        // Invalid stop name
        $available = $this->service->areSeatsAvailable(
            $schedule, 'Colombo', 'Galle', ['A1']
        );
        $this->assertFalse($available);

        // Boarding after alighting (reversed)
        $available = $this->service->areSeatsAvailable(
            $schedule, 'Kandy', 'Colombo', ['A1']
        );
        $this->assertFalse($available);
    }
}
