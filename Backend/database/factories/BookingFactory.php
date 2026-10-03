<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\User;
use App\Models\Schedule;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'schedule_id' => Schedule::factory(),
            'booking_ref' => 'SG-' . strtoupper(Str::random(8)),
            'total_seats' => 1,
            'total_amount' => $this->faker->randomFloat(2, 200, 2000),
            'status' => 'confirmed',
        ];
    }
}
