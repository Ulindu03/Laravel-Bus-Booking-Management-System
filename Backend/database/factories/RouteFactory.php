<?php

namespace Database\Factories;

use App\Models\Route;
use Illuminate\Database\Eloquent\Factories\Factory;

class RouteFactory extends Factory
{
    protected $model = Route::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->city() . ' - ' . $this->faker->city() . ' Express',
            'origin' => $this->faker->city(),
            'destination' => $this->faker->city(),
            'stops' => null,
            'distance_km' => $this->faker->randomFloat(1, 50, 300),
            'duration_mins' => $this->faker->numberBetween(60, 360),
            'base_fare' => $this->faker->randomFloat(2, 200, 2000),
            'status' => 'active',
        ];
    }
}
