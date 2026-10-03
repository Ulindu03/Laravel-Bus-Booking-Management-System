<?php

namespace App\Services;

use App\Models\MlPrediction;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DemandPredictorService
{
    private string $pythonPath;
    private string $modelsPath;
    private string $scriptsPath;
    private int $cacheMinutes;
    private int $minSamples;

    public function __construct()
    {
        $this->pythonPath = config('ai.python.path', 'python');
        $this->modelsPath = base_path(config('ai.python.models_path', 'storage/ml_models'));
        $this->scriptsPath = base_path(config('ai.python.scripts_path', 'scripts'));
        $this->cacheMinutes = config('ai.ml.prediction_cache_minutes', 30);
        $this->minSamples = config('ai.ml.min_training_samples', 500);
    }

    /**
     * Predict demand for a specific route segment on a given date/time.
     *
     * Uses the trained XGBoost model via a Python script call.
     * Falls back to rule-based estimation if the model isn't available
     * or there isn't enough training data yet.
     *
     * @param int $routeId The route to predict for
     * @param int $segmentIndex Which segment of the route (0-indexed)
     * @param string $date Date string (Y-m-d)
     * @param int $hour Hour of departure (0-23)
     * @param float $fare The fare for this segment (for expected revenue)
     * @param string $busType Bus type string (normal, semi_luxury, luxury, ac)
     * @return array{predicted_demand: int, demand_level: string}
     */
    public function predict(int $routeId, int $segmentIndex, string $date, int $hour, float $fare = 0.0, string $busType = 'normal'): array
    {
        // Check cache first
        $cacheKey = "demand_prediction:{$routeId}:{$segmentIndex}:{$date}:{$hour}:{$busType}";
        $cached = Cache::get($cacheKey);

        if ($cached !== null) {
            return $cached;
        }

        // Try ML model prediction
        $result = $this->mlPredict($routeId, $segmentIndex, $date, $hour, $fare, $busType);

        // Fall back to rule-based if ML fails
        if ($result === null) {
            $predictedDemand = $this->ruleBasedEstimate($routeId, $segmentIndex, $date, $hour);
            $result = [
                'predicted_demand' => $predictedDemand,
                'demand_level' => self::getDemandLevel($predictedDemand),
            ];
        }

        // Cache the result
        Cache::put($cacheKey, $result, now()->addMinutes($this->cacheMinutes));

        // Log the prediction
        $this->logPrediction($routeId, $segmentIndex, $date, $result['predicted_demand']);

        return $result;
    }

    /**
     * Get demand predictions for ALL segments of a route at once.
     *
     * @param int $routeId
     * @param string $date
     * @param int $hour
     * @param array $segmentFares Array of fares keyed by segment_index
     * @param string $busType Bus type string
     * @return array<int, array{predicted_demand: int, demand_level: string}>
     */
    public function predictAllSegments(int $routeId, string $date, int $hour, array $segmentFares = [], string $busType = 'normal'): array
    {
        $route = \App\Models\Route::find($routeId);
        if (!$route || empty($route->stops)) {
            return [];
        }

        $stops = $route->stops;
        $predictions = [];

        // A route with N stops has N-1 segments
        for ($i = 0; $i < count($stops) - 1; $i++) {
            $fare = $segmentFares[$i] ?? 0.0;
            $predictions[$i] = $this->predict($routeId, $i, $date, $hour, $fare, $busType);
        }

        return $predictions;
    }

    /**
     * Classify a predicted demand value into High / Medium / Low.
     *
     * Thresholds from requirement:
     *   High   = predicted > 20
     *   Medium = 10 to 20
     *   Low    = < 10
     *
     * @param int $predictedDemand
     * @return string 'high' | 'medium' | 'low'
     */
    public static function getDemandLevel(int $predictedDemand): string
    {
        if ($predictedDemand > 20) {
            return 'high';
        } elseif ($predictedDemand >= 10) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Call the Python ML model for prediction.
     * Returns null if the model file doesn't exist or the script fails.
     *
     * @param int $routeId
     * @param int $segmentIndex
     * @param string $date
     * @param int $hour
     * @param float $fare
     * @param string $busType
     * @return array|null
     */
    private function mlPredict(int $routeId, int $segmentIndex, string $date, int $hour, float $fare = 0.0, string $busType = 'normal'): ?array
    {
        $modelFile = $this->modelsPath . DIRECTORY_SEPARATOR . 'demand_model.pkl';
        $scriptFile = $this->scriptsPath . DIRECTORY_SEPARATOR . 'predict_demand.py';

        // Check if model and script exist
        if (!file_exists($modelFile) || !file_exists($scriptFile)) {
            Log::info('ML model or script not found, using rule-based fallback', [
                'model_exists' => file_exists($modelFile),
                'script_exists' => file_exists($scriptFile),
            ]);
            return null;
        }

        // Encode bus type to numeric
        $busTypeMap = [
            'normal' => 1,
            'semi_luxury' => 2,
            'luxury' => 3,
            'ac' => 4,
        ];
        $busTypeEncoded = $busTypeMap[$busType] ?? 1;

        try {
            $command = sprintf(
                '%s %s --model=%s --route=%d --segment=%d --date=%s --hour=%d --fare=%.2f --bus_type=%d --historical_avg=%.2f 2>&1',
                escapeshellarg($this->pythonPath),
                escapeshellarg($scriptFile),
                escapeshellarg($modelFile),
                $routeId,
                $segmentIndex,
                escapeshellarg($date),
                $hour,
                $fare,
                $busTypeEncoded,
                0.0 // historical_avg — Python script uses default if 0
            );

            $output = shell_exec($command);

            if ($output === null) {
                Log::warning('Python script returned no output');
                return null;
            }

            $result = json_decode(trim($output), true);

            if (isset($result['predicted_demand'])) {
                $predicted = (int) round($result['predicted_demand']);
                $demandLevel = $result['demand_level'] ?? self::getDemandLevel($predicted);

                return [
                    'predicted_demand' => $predicted,
                    'demand_level' => $demandLevel,
                ];
            }

            Log::warning('Python script returned unexpected format', ['output' => $output]);
            return null;

        } catch (\Exception $e) {
            Log::error('ML prediction failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Rule-based fallback for demand estimation.
     * Used when the ML model isn't available yet (cold start).
     *
     * Uses simple heuristics:
     * - Weekdays: moderate demand
     * - Weekends/holidays: higher demand
     * - Morning rush (6-9): higher demand
     * - Evening rush (16-19): higher demand
     *
     * @param int $routeId
     * @param int $segmentIndex
     * @param string $date
     * @param int $hour
     * @return int
     */
    private function ruleBasedEstimate(int $routeId, int $segmentIndex, string $date, int $hour): int
    {
        $baseDemand = 15; // Default estimate

        $dateObj = \Carbon\Carbon::parse($date);

        // Weekend boost
        if ($dateObj->isWeekend()) {
            $baseDemand += 5;
        }

        // Rush hour boost
        if (($hour >= 6 && $hour <= 9) || ($hour >= 16 && $hour <= 19)) {
            $baseDemand += 5;
        }

        // First segment (origin) usually has higher demand
        if ($segmentIndex === 0) {
            $baseDemand += 3;
        }

        // Later segments tend to have less demand
        $baseDemand = max(5, $baseDemand - ($segmentIndex * 2));

        return $baseDemand;
    }

    /**
     * Log a prediction to the ml_predictions_log table.
     *
     * @param int $routeId
     * @param int $segmentIndex
     * @param string $date
     * @param int $predictedDemand
     */
    private function logPrediction(int $routeId, int $segmentIndex, string $date, int $predictedDemand): void
    {
        try {
            MlPrediction::create([
                'route_id' => $routeId,
                'segment_index' => $segmentIndex,
                'prediction_date' => $date,
                'predicted_demand' => $predictedDemand,
                'model_version' => config('ai.ml.model_version', 'v1.0'),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log prediction', ['error' => $e->getMessage()]);
        }
    }
}
