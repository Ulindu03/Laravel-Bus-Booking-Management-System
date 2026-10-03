<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\DemandPredictorService;
use App\Models\Route;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;

/**
 * DemandPredictorService Unit Tests
 *
 * Demand prediction logic, fallback behavior, rule-based predictions test කරනවා.
 */
class DemandPredictorServiceTest extends TestCase
{
    use RefreshDatabase;

    private DemandPredictorService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // Set config for testing — use fallback mode (no Python needed)
        Config::set('ai.python_path', 'python_not_available');
        Config::set('ai.models_path', storage_path('ml_models'));

        $this->service = new DemandPredictorService();
    }

    /**
     * Test: Rule-based prediction returns a positive number
     */
    public function test_rule_based_prediction_returns_positive_value(): void
    {
        $result = $this->service->predict(
            routeId: 1,
            segmentIndex: 0,
            date: '2026-08-15',
            hour: 8
        );

        $this->assertIsInt($result);
        $this->assertGreaterThan(0, $result);
    }

    /**
     * Test: Rush hour returns higher demand than off-peak
     */
    public function test_rush_hour_has_higher_demand(): void
    {
        // Rush hour (7 AM)
        $rushDemand = $this->service->predict(1, 0, '2026-08-18', 7);
        // Off-peak (2 PM)
        $offPeakDemand = $this->service->predict(1, 0, '2026-08-18', 14);

        // Rush hour should be higher (rule-based has rush multiplier)
        $this->assertGreaterThanOrEqual($offPeakDemand, $rushDemand);
    }

    /**
     * Test: Weekend has higher demand than weekday for same time
     */
    public function test_weekend_demand_multiplier(): void
    {
        // Tuesday = weekday
        $weekday = $this->service->predict(1, 0, '2026-08-18', 8);
        // Saturday = weekend
        $weekend = $this->service->predict(1, 0, '2026-08-22', 8);

        // Weekend should have multiplied demand (1.3x in rule-based)
        $this->assertGreaterThanOrEqual($weekday, $weekend);
    }

    /**
     * Test: predictAllSegments returns array for multiple segments
     */
    public function test_predict_all_segments_returns_array(): void
    {
        $route = Route::factory()->create([
            'id' => 1,
            'stops' => ['Colombo', 'Kegalle', 'Kandy']
        ]);

        $result = $this->service->predictAllSegments($route->id, '2026-08-15', 8);

        $this->assertIsArray($result);
        // Should contain predictions keyed by segment index
        $this->assertNotEmpty($result);
    }

    /**
     * Test: Demand never returns negative
     */
    public function test_demand_never_negative(): void
    {
        // Test across multiple hours
        for ($hour = 0; $hour < 24; $hour++) {
            $demand = $this->service->predict(1, 0, '2026-08-15', $hour);
            $this->assertGreaterThanOrEqual(0, $demand, "Hour {$hour} returned negative demand");
        }
    }
}
