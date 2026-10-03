<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Route;
use App\Models\Bus;
use App\Models\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

/**
 * AI/ML API Feature Tests
 *
 * AI chat, demand prediction, segment availability, health check endpoints test කරනවා.
 */
class AiApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'user']);
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    // ================================================
    // CHATBOT TESTS
    // ================================================

    /**
     * Test: Chat endpoint does not require authentication
     */
    public function test_chat_allows_unauthenticated(): void
    {
        $response = $this->postJson('/api/ai/chat', [
            'message' => 'Hello',
        ]);

        // It should return 200 OK
        $response->assertStatus(200);
    }

    /**
     * Test: Chat endpoint accepts message and returns response
     */
    public function test_chat_returns_response(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/ai/chat', [
            'message' => 'What buses go to Kandy?',
        ]);

        // Should return 200 with a response (even if Ollama is offline, fallback kicks in)
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['response'],
            ]);
    }

    /**
     * Test: Chat validates message is required
     */
    public function test_chat_validates_message(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/ai/chat', []);

        $response->assertStatus(422);
    }

    /**
     * Test: Chat history endpoint works
     */
    public function test_chat_history_returns_array(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/ai/chat/history');

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data']);
    }

    // ================================================
    // SEGMENT AVAILABILITY TESTS
    // ================================================

    /**
     * Test: Segment availability endpoint returns data
     */
    public function test_segment_availability_returns_data(): void
    {
        $route = Route::factory()->create([
            'stops' => ['Colombo', 'Kegalle', 'Kandy'],
        ]);
        $bus = Bus::factory()->create(['total_seats' => 54]);
        $schedule = Schedule::factory()->create([
            'route_id' => $route->id,
            'bus_id' => $bus->id,
            'departure_time' => Carbon::parse('2026-08-15 08:00:00'),
            'available_seats' => 54,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/ai/segments/{$schedule->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['segments'],
            ]);
    }

    // ================================================
    // ADMIN-ONLY TESTS
    // ================================================

    /**
     * Test: Health check endpoint — admin only
     */
    public function test_health_check_admin_only(): void
    {
        // Regular user should be denied
        $response = $this->actingAs($this->user)
            ->getJson('/api/admin/ai/health');

        $response->assertStatus(403);
    }

    /**
     * Test: Health check works for admin
     */
    public function test_health_check_works_for_admin(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/ai/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'ollama',
                    'ml_model',
                    'config',
                ],
            ]);
    }

    /**
     * Test: Pattern insights — admin only
     */
    public function test_pattern_insights_admin_only(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/admin/ai/insights/patterns');

        $response->assertStatus(403);
    }

    /**
     * Test: Demand prediction endpoint — admin only
     */
    public function test_demand_prediction_admin_only(): void
    {
        $route = Route::factory()->create();

        $response = $this->actingAs($this->user)
            ->getJson("/api/admin/ai/predict/demand/{$route->id}?date=2026-08-15&hour=8");

        $response->assertStatus(403);
    }

    /**
     * Test: Demand prediction works for admin
     */
    public function test_demand_prediction_works_for_admin(): void
    {
        $route = Route::factory()->create();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/ai/predict/demand/{$route->id}?date=2026-08-15&hour=8");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }
}
