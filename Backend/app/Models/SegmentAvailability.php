<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SegmentAvailability extends Model
{
    protected $table = 'segment_availability';

    protected $fillable = [
        'schedule_id',
        'segment_start',
        'segment_end',
        'segment_index',
        'total_seats',
        'booked_seats',
        'protected_seats',
        'available_seats',
        'predicted_demand',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the schedule this segment belongs to.
     */
    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }
}
