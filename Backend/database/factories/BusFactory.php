<?php

namespace Database\Factories;

use App\Models\Bus;
use Illuminate\Database\Eloquent\Factories\Factory;

class BusFactory extends Factory
{
    protected $model = Bus::class;

    public function definition(): array
    {
        return [
            'bus_number' => strtoupper($this->faker->bothify('??-####')),
            'name' => $this->faker->words(3, true) . ' Bus',
            'type' => $this->faker->randomElement(['normal', 'semi_luxury', 'luxury', 'ac']),
            'total_seats' => $this->faker->randomElement([36, 40, 42, 54]),
            'seat_layout' => '2x2',
            'status' => 'active',
        ];
    }
}
