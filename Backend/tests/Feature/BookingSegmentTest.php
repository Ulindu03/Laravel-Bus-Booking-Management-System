<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Route;
use App\Models\Bus;
use App\Models\Schedule;
use App\Models\Booking;
use App\Models\BookedSeat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

/**
 * Booking API Feature Tests
 *
 * Segment booking, overlap detection, fare calculation, API flow test කරනවා.
 */
class BookingSegmentTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Route $route;
    private Bus $bus;
    private Schedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user
        $this->user = User::factory()->create([
            'role' => 'user',
        ]);

        // Create route with intermediate stops
        $this->route = Route::factory()->create([
            'origin' => 'Colombo',
            'destination' => 'Kandy',
            'stops' => ['Colombo', 'Peliyagoda', 'Kegalle', 'Mawanella', 'Kandy'],
            'base_fare' => 450.00,
        ]);

        // Create bus
        $this->bus = Bus::factory()->create([
            'total_seats' => 54,
            'type' => 'normal',
            'seat_layout' => '2x2',
        ]);

        // Create schedule
        $this->schedule = Schedule::factory()->create([
            'route_id' => $this->route->id,
            'bus_id' => $this->bus->id,
            'departure_time' => Carbon::parse('2026-08-15 08:00:00'),
            'arrival_time' => Carbon::parse('2026-08-15 11:30:00'),
            'price_per_seat' => 450.00,
            'available_seats' => 54,
            'status' => 'scheduled',
        ]);
    }

    /**
     * Test: Full journey booking (backwards compatible)
     */
    public function test_full_journey_booking_works(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'schedule_id' => $this->schedule->id,
            'seats' => [
                ['seat_number' => 'A1', 'passenger_name' => 'John Doe'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        // Check booked seat has default stops (full journey)
        $this->assertDatabaseHas('booked_seats', [
            'seat_number' => 'A1',
            'boarding_stop' => 'Colombo',
            'alighting_stop' => 'Kandy',
        ]);
    }

    /**
     * Test: Segment booking with boarding and alighting stops
     */
    public function test_segment_booking_stores_stops(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'schedule_id' => $this->schedule->id,
            'boarding_stop' => 'Colombo',
            'alighting_stop' => 'Kegalle',
            'seats' => [
                ['seat_number' => 'B2', 'passenger_name' => 'Jane Doe'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('booked_seats', [
            'seat_number' => 'B2',
            'boarding_stop' => 'Colombo',
            'alighting_stop' => 'Kegalle',
        ]);
    }

    /**
     * Test: Partial journey fare is proportional
     */
    public function test_partial_journey_fare_is_proportional(): void
    {
        // Full journey = 4 segments, Colombo→Kegalle = 2 segments = 50% fare
        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'schedule_id' => $this->schedule->id,
            'boarding_stop' => 'Colombo',
            'alighting_stop' => 'Kegalle',
            'seats' => [
                ['seat_number' => 'C1', 'passenger_name' => 'Test User'],
            ],
        ]);

        $response->assertStatus(201);

        $booking = Booking::latest()->first();
        $expectedFare = round(450.00 * (2 / 4), 2); // 2/4 segments = Rs. 225.00
        $this->assertEquals($expectedFare, (float) $booking->total_amount);
    }

    /**
     * Test: Non-overlapping segments allow same seat
     * A1 booked Colombo→Kegalle, then A1 booked Kegalle→Kandy should SUCCEED
     */
    public function test_non_overlapping_segments_allow_same_seat(): void
    {
        // First booking: Colombo → Kegalle
        $this->actingAs($this->user)->postJson('/api/bookings', [
            'schedule_id' => $this->schedule->id,
            'boarding_stop' => 'Colombo',
            'alighting_stop' => 'Kegalle',
            'seats' => [
                ['seat_number' => 'A1', 'passenger_name' => 'Person 1'],
            ],
        ])->assertStatus(201);

        // Second booking: Kegalle → Kandy (no overlap — should succeed)
        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'schedule_id' => $this->schedule->id,
            'boarding_stop' => 'Kegalle',
            'alighting_stop' => 'Kandy',
            'seats' => [
                ['seat_number' => 'A1', 'passenger_name' => 'Person 2'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);
    }

    /**
     * Test: Overlapping segments reject same seat
     * A1 booked Colombo→Kegalle, then A1 booked Peliyagoda→Mawanella should FAIL
     */
    public function test_overlapping_segments_reject_same_seat(): void
    {
        // First booking: Colombo → Kegalle (segments 0, 1)
        $this->actingAs($this->user)->postJson('/api/bookings', [
            'schedule_id' => $this->schedule->id,
            'boarding_stop' => 'Colombo',
            'alighting_stop' => 'Kegalle',
            'seats' => [
                ['seat_number' => 'A1', 'passenger_name' => 'Person 1'],
            ],
        ])->assertStatus(201);

        // Second booking: Peliyagoda → Mawanella (segments 1, 2 — overlaps at segment 1)
        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'schedule_id' => $this->schedule->id,
            'boarding_stop' => 'Peliyagoda',
            'alighting_stop' => 'Mawanella',
            'seats' => [
                ['seat_number' => 'A1', 'passenger_name' => 'Person 2'],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJson(['success' => false]);
    }

    /**
     * Test: Invalid stop names are rejected
     */
    public function test_invalid_stop_names_rejected(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'schedule_id' => $this->schedule->id,
            'boarding_stop' => 'Colombo',
            'alighting_stop' => 'Galle', // Not in this route!
            'seats' => [
                ['seat_number' => 'A1', 'passenger_name' => 'Test'],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Invalid boarding or alighting stop for this route.']);
    }

    /**
     * Test: Reversed stops (alighting before boarding) rejected
     */
    public function test_reversed_stops_rejected(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'schedule_id' => $this->schedule->id,
            'boarding_stop' => 'Kandy',
            'alighting_stop' => 'Colombo', // Wrong order!
            'seats' => [
                ['seat_number' => 'A1', 'passenger_name' => 'Test'],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Boarding stop must be before alighting stop.']);
    }

    /**
     * Test: Booking when no seats available
     */
    public function test_booking_fails_when_no_seats(): void
    {
        $this->schedule->update(['available_seats' => 0]);

        $response = $this->actingAs($this->user)->postJson('/api/bookings', [
            'schedule_id' => $this->schedule->id,
            'seats' => [
                ['seat_number' => 'A1', 'passenger_name' => 'Test'],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Not enough seats available.']);
    }

    /**
     * Test: Unauthenticated users cannot book
     */
    public function test_unauthenticated_cannot_book(): void
    {
        $response = $this->postJson('/api/bookings', [
            'schedule_id' => $this->schedule->id,
            'seats' => [
                ['seat_number' => 'A1', 'passenger_name' => 'Test'],
            ],
        ]);

        $response->assertStatus(401);
    }
}
