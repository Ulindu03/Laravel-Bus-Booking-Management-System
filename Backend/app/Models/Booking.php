<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'schedule_id',
        'booking_ref',
        'total_seats',
        'total_amount',
        'status',
        'booked_at',
        'cancelled_at',
        'guest_name',
        'guest_email',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'booked_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function bookedSeats()
    {
        return $this->hasMany(BookedSeat::class);
    }
}
