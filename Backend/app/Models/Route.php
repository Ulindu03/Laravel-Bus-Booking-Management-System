<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Route extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'route_number',
        'origin',
        'destination',
        'stops',
        'distance_km',
        'duration_mins',
        'base_fare',
        'fare_matrix',
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
            'stops' => 'array',
            'fare_matrix' => 'array',
            'distance_km' => 'decimal:2',
            'base_fare' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the full ordered sequence of stops as plain strings.
     * Always returns [origin, ...intermediate_stops, destination].
     * Handles both object format [{name, duration_mins}] and plain string arrays.
     *
     * @return array<string>
     */
    public function getFullStopSequence(): array
    {
        $rawStops = $this->stops ?? [];
        $stopNames = [];

        foreach ($rawStops as $s) {
            if (is_array($s) && isset($s['name'])) {
                $stopNames[] = $s['name'];
            } elseif (is_string($s)) {
                $stopNames[] = $s;
            }
        }

        // If stops already include origin/destination (seeder format), return as-is
        if (!empty($stopNames)
            && strcasecmp($stopNames[0], $this->origin) === 0
            && strcasecmp(end($stopNames), $this->destination) === 0
        ) {
            return $stopNames;
        }

        // Otherwise build full sequence: origin + intermediates + destination
        $sequence = [$this->origin];
        foreach ($stopNames as $name) {
            if (strcasecmp($name, $this->origin) !== 0 && strcasecmp($name, $this->destination) !== 0) {
                $sequence[] = $name;
            }
        }
        $sequence[] = $this->destination;

        return $sequence;
    }

    /**
     * Get the schedules for this route.
     */
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    /**
     * Get the ML prediction logs for this route.
     */
    public function mlPredictions()
    {
        return $this->hasMany(MlPrediction::class);
    }
}
