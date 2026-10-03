<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookedSeat;
use App\Models\Schedule;
use App\Services\SeatAllocatorService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\BookingConfirmed;
use App\Mail\BookingCancelled;

class BookingController extends Controller
{
    private SeatAllocatorService $seatAllocator;

    public function __construct(SeatAllocatorService $seatAllocator)
    {
        $this->seatAllocator = $seatAllocator;
    }
    /**
     * Display a listing of bookings for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::with(['schedule.bus', 'schedule.route', 'bookedSeats'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Store a newly created booking in storage.
     * Supports segment-based booking with boarding_stop and alighting_stop.
     * If not provided, defaults to full journey (origin → destination).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user(); // null for guests

        $validated = $request->validate([
            'schedule_id' => 'required|exists:schedules,id',
            'seats' => 'required|array|min:1',
            'seats.*.seat_number' => 'required|string',
            'seats.*.passenger_name' => 'required|string',
            'seats.*.passenger_phone' => 'nullable|string',
            // Segment booking — optional (defaults to full journey)
            'boarding_stop' => 'nullable|string',
            'alighting_stop' => 'nullable|string',
            // Guest booking fields
            'guest_email' => $user ? 'nullable|email' : 'required|email',
            'guest_name' => 'nullable|string|max:100',
        ]);

        $schedule = Schedule::with(['bus', 'route'])->findOrFail($validated['schedule_id']);
        $totalSeats = count($validated['seats']);

        // Determine boarding and alighting stops
        $route = $schedule->route;
        $stops = $route->getFullStopSequence();
        $boardingStop = $validated['boarding_stop'] ?? $route->origin;
        $alightingStop = $validated['alighting_stop'] ?? $route->destination;

        // Validate stops exist in route (case-insensitive)
        $stopsLower = array_map('strtolower', $stops);
        $boardingIdx = array_search(strtolower($boardingStop), $stopsLower);
        $alightingIdx = array_search(strtolower($alightingStop), $stopsLower);

        if ($boardingIdx === false || $alightingIdx === false) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid boarding or alighting stop for this route.',
            ], 422);
        }

        // Use the canonical stop names from the route
        $boardingStop = $stops[$boardingIdx];
        $alightingStop = $stops[$alightingIdx];

        // Validate boarding is before alighting
        if ($boardingIdx >= $alightingIdx) {
            return response()->json([
                'success' => false,
                'message' => 'Boarding stop must be before alighting stop.',
            ], 422);
        }

        // Check overall availability
        if ($schedule->available_seats < $totalSeats) {
            return response()->json([
                'success' => false,
                'message' => 'Not enough seats available.',
            ], 422);
        }

        // AI-powered segment availability check via SeatAllocatorService
        $requestedSeatNumbers = array_column($validated['seats'], 'seat_number');

        if (!$this->seatAllocator->areSeatsAvailable($schedule, $boardingStop, $alightingStop, $requestedSeatNumbers)) {
            return response()->json([
                'success' => false,
                'message' => 'One or more seats are not available for the requested segment.',
            ], 422);
        }

        // Calculate fare
        $fareMatrix = $route->fare_matrix ?? [];
        $matrixKey = "{$boardingStop}-{$alightingStop}";
        
        if (isset($fareMatrix[$matrixKey]) && is_numeric($fareMatrix[$matrixKey])) {
            $pricePerSeat = round((float) $fareMatrix[$matrixKey], 2);
        } else {
            $segmentCount = $alightingIdx - $boardingIdx;
            $totalSegments = count($stops) - 1;
            $fareRatio = $totalSegments > 0 ? ($segmentCount / $totalSegments) : 1;
            $pricePerSeat = round($schedule->price_per_seat * $fareRatio, 2);
        }
        
        $totalAmount = $totalSeats * $pricePerSeat;

        // Determine email for confirmation
        $confirmationEmail = $validated['guest_email'] ?? ($user ? $user->email : null);

        DB::beginTransaction();
        try {
            // Create Booking — supports both guest and authenticated users
            $booking = Booking::create([
                'user_id' => $user?->id,
                'schedule_id' => $schedule->id,
                'booking_ref' => 'SG-' . strtoupper(Str::random(8)),
                'total_seats' => $totalSeats,
                'total_amount' => $totalAmount,
                'status' => 'confirmed',
                'guest_name' => $validated['guest_name'] ?? ($user ? null : ($validated['seats'][0]['passenger_name'] ?? null)),
                'guest_email' => $validated['guest_email'] ?? null,
            ]);

            // Create Booked Seats with segment data
            foreach ($validated['seats'] as $seat) {
                BookedSeat::create([
                    'booking_id' => $booking->id,
                    'seat_number' => $seat['seat_number'],
                    'passenger_name' => $seat['passenger_name'],
                    'passenger_phone' => $seat['passenger_phone'] ?? null,
                    'boarding_stop' => $boardingStop,
                    'alighting_stop' => $alightingStop,
                ]);
            }

            // Decrement available seats
            $schedule->decrement('available_seats', $totalSeats);

            // Update segment_availability table with new allocation data
            $this->seatAllocator->calculateAvailability($schedule->fresh(['route', 'bus']));

            DB::commit();

            $booking->load(['schedule.bus', 'schedule.route', 'bookedSeats']);

            // Send confirmation email
            if ($confirmationEmail) {
                try {
                    Mail::to($confirmationEmail)->send(new BookingConfirmed($booking));
                } catch (\Exception $e) {
                    // Don't fail the booking if email fails
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Booking created successfully.',
                'data' => $booking,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create booking.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified booking.
     */
    public function show(Request $request, Booking $booking): JsonResponse
    {
        // Ensure user owns booking or is admin/super_admin
        if ($booking->user_id !== $request->user()->id && !in_array($request->user()->role, ['admin', 'super_admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $booking->load(['schedule.bus', 'schedule.route', 'bookedSeats']);

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    /**
     * Cancel the booking.
     */
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->user_id !== $request->user()->id && !in_array($request->user()->role, ['admin', 'super_admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['success' => false, 'message' => 'Booking is already cancelled.'], 400);
        }

        DB::beginTransaction();
        try {
            $booking->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

            // Increment available seats
            $booking->schedule->increment('available_seats', $booking->total_seats);

            // Recalculate segment availability after cancellation
            $schedule = $booking->schedule->fresh(['route', 'bus']);
            $this->seatAllocator->calculateAvailability($schedule);

            DB::commit();

            // Send cancellation email
            Mail::to($request->user()->email)->send(new BookingCancelled($booking));

            return response()->json([
                'success' => true,
                'message' => 'Booking cancelled successfully.',
                'data' => $booking,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel booking.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
