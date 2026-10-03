<?php

namespace Database\Factories;

use App\Models\Schedule;
use App\Models\Route;
use App\Models\Bus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class ScheduleFactory extends Factory
{
    protected $model = Schedule::class;

    public function definition(): array
    {
        $departure = Carbon::parse('2026-08-15 08:00:00');

        return [
            'route_id' => Route::factory(),
            'bus_id' => Bus::factory(),
            'departure_time' => $departure,
            'arrival_time' => $departure->copy()->addHours(3),
            'price_per_seat' => $this->faker->randomFloat(2, 200, 2000),
            'available_seats' => 54,
            'status' => 'scheduled',
        ];
    }
}
