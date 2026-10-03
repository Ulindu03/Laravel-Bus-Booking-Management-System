<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Services\DemandPredictorService;
use App\Services\SeatAllocatorService;
use App\Services\PatternAnalyzerService;
use App\Services\OllamaClient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class PredictionController extends Controller
{
    private DemandPredictorService $demandPredictor;
    private SeatAllocatorService $seatAllocator;
    private PatternAnalyzerService $patternAnalyzer;

    public function __construct(
        DemandPredictorService $demandPredictor,
        SeatAllocatorService $seatAllocator,
        PatternAnalyzerService $patternAnalyzer
    ) {
        $this->demandPredictor = $demandPredictor;
        $this->seatAllocator = $seatAllocator;
        $this->patternAnalyzer = $patternAnalyzer;
    }

    /**
     * Get demand prediction for all segments of a route.
     *
     * GET /api/ai/predict/demand/{route_id}
     * Admin only.
     *
     * @param Request $request
     * @param int $routeId
     * @return JsonResponse
     */
    public function demandPrediction(Request $request, int $routeId): JsonResponse
    {
        $request->validate([
            'date' => 'required|date|after_or_equal:today',
            'hour' => 'required|integer|min:0|max:23',
        ]);

        $predictions = $this->demandPredictor->predictAllSegments(
            $routeId,
            $request->input('date'),
            (int) $request->input('hour')
        );

        $route = \App\Models\Route::find($routeId);

        return response()->json([
            'success' => true,
            'data' => [
                'route_id' => $routeId,
                'route_name' => $route?->name,
                'date' => $request->input('date'),
                'hour' => (int) $request->input('hour'),
                'predictions' => $predictions,
            ],
        ]);
    }

    /**
     * Get AI-powered segment availability for a schedule.
     *
     * GET /api/ai/segments/{schedule_id}
     * Public access — used by the frontend seat map.
     *
     * @param int $scheduleId
     * @return JsonResponse
     */
    public function segmentAvailability(int $scheduleId): JsonResponse
    {
        $schedule = Schedule::with(['route', 'bus'])->find($scheduleId);

        if (!$schedule) {
            return response()->json([
                'success' => false,
                'message' => 'Schedule not found.',
            ], 404);
        }

        $segments = $this->seatAllocator->calculateAvailability($schedule);

        $route = $schedule->route;
        $stops = $route->getFullStopSequence();

        return response()->json([
            'success' => true,
            'data' => [
                'schedule_id' => $schedule->id,
                'route' => implode(' → ', $stops),
                'route_name' => $route->name,
                'total_seats' => $schedule->bus->total_seats ?? $schedule->available_seats,
                'segments' => $segments,
            ],
        ]);
    }

    /**
     * Get passenger pattern insights from clustering analysis.
     *
     * GET /api/ai/insights/patterns
     * Admin only.
     *
     * @return JsonResponse
     */
    public function patternInsights(): JsonResponse
    {
        $insights = $this->patternAnalyzer->getPatternInsights();

        return response()->json([
            'success' => true,
            'data' => $insights,
        ]);
    }

    /**
     * Check AI system health status.
     *
     * GET /api/ai/health
     * Admin only.
     *
     * @return JsonResponse
     */
    public function healthCheck(OllamaClient $ollama): JsonResponse
    {
        // Cache health status for 2 minutes
        $data = Cache::remember('ai_health_status', 120, function () use ($ollama) {
            $ollamaHealth = $ollama->healthCheck();

            $modelFileExists = file_exists(
                base_path(config('ai.python.models_path') . '/demand_model.pkl')
            );

            return [
                'ollama' => $ollamaHealth,
                'ml_model' => [
                    'demand_model' => $modelFileExists,
                    'clustering_model' => file_exists(
                        base_path(config('ai.python.models_path') . '/clustering_model.pkl')
                    ),
                ],
                'config' => [
                    'ollama_host' => config('ai.ollama.host'),
                    'ollama_model' => config('ai.ollama.model'),
                    'python_path' => config('ai.python.path'),
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
