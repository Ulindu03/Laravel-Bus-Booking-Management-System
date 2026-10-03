<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookedSeat extends Model
{
    protected $fillable = [
        'booking_id',
        'seat_number',
        'passenger_name',
        'passenger_phone',
        'boarding_stop',
        'alighting_stop',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
