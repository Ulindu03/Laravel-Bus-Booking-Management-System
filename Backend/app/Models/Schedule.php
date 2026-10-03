<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Schedule extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'bus_id',
        'route_id',
        'departure_time',
        'arrival_time',
        'price_per_seat',
        'available_seats',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'departure_time' => 'datetime',
            'arrival_time' => 'datetime',
            'price_per_seat' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the bus for this schedule.
     */
    public function bus()
    {
        return $this->belongsTo(Bus::class);
    }

    /**
     * Get the route for this schedule.
     */
    public function route()
    {
        return $this->belongsTo(Route::class);
    }

    /**
     * Get the bookings for this schedule.
     */
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Get the segment availability records for this schedule.
     */
    public function segmentAvailabilities()
    {
        return $this->hasMany(SegmentAvailability::class);
    }

    /**
     * Get the number of bookings per segment for this schedule.
     * Used by the SeatAllocatorService for allocation decisions.
     *
     * @return array<string, int> Keyed by "segment_{start}_{end}"
     */
    public function getSegmentBookings(): array
    {
        $bookings = $this->bookings()
            ->where('status', '!=', 'cancelled')
            ->with('bookedSeats')
            ->get();

        $segmentCounts = [];

        foreach ($bookings as $booking) {
            foreach ($booking->bookedSeats as $seat) {
                $key = ($seat->boarding_stop ?? 'full') . '_' . ($seat->alighting_stop ?? 'full');
                $segmentCounts[$key] = ($segmentCounts[$key] ?? 0) + 1;
            }
        }

        return $segmentCounts;
    }
}
