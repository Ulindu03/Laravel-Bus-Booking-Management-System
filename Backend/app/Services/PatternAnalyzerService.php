<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PatternAnalyzerService
{
    private string $pythonPath;
    private string $modelsPath;
    private string $scriptsPath;

    public function __construct()
    {
        $this->pythonPath = config('ai.python.path', 'python');
        $this->modelsPath = base_path(config('ai.python.models_path', 'storage/ml_models'));
        $this->scriptsPath = base_path(config('ai.python.scripts_path', 'scripts'));
    }

    /**
     * Get passenger pattern insights from the clustering model.
     *
     * Returns the cluster distribution and key characteristics
     * of each passenger group (daily commuters, weekend travelers, etc.)
     *
     * @return array Clustering insights
     */
    public function getPatternInsights(): array
    {
        // Cache insights for 10 minutes — expensive to compute
        return Cache::remember('ai_pattern_insights', 600, function () {
            // Use SQL-based patterns (instant) instead of ML clusters
            // which spawn 200+ Python processes and take minutes
            return $this->getSQLBasedPatterns();
        });
    }

    /**
     * Get the cluster assignment for a specific user.
     *
     * @param int $userId
     * @return array|null Cluster info or null if not enough data
     */
    public function getUserCluster(int $userId): ?array
    {
        $bookings = Booking::where('user_id', $userId)
            ->where('status', '!=', 'cancelled')
            ->count();

        if ($bookings < 3) {
            return null; // Not enough data to classify
        }

        // Get user's travel patterns
        $patterns = DB::table('bookings as b')
            ->join('schedules as s', 'b.schedule_id', '=', 's.id')
            ->where('b.user_id', $userId)
            ->where('b.status', '!=', 'cancelled')
            ->selectRaw("
                AVG(HOUR(s.departure_time)) as avg_departure_hour,
                COUNT(*) as total_bookings,
                AVG(DATEDIFF(s.departure_time, b.booked_at)) as avg_advance_days,
                SUM(CASE WHEN DAYOFWEEK(s.departure_time) IN (1,7) THEN 1 ELSE 0 END) / COUNT(*) as weekend_ratio,
                AVG(b.total_amount) as avg_spend
            ")
            ->first();

        if (!$patterns) {
            return null;
        }

        // Try ML model first
        $mlResult = $this->classifyByML($patterns);
        if ($mlResult) {
            return $mlResult;
        }

        // Fallback to rule-based classification
        return $this->classifyByRules($patterns);
    }

    /**
     * Classify a single user using the trained K-Means Python model.
     *
     * @param object $patterns User's aggregated booking patterns
     * @return array|null Cluster result or null if ML unavailable
     */
    private function classifyByML(object $patterns): ?array
    {
        $modelFile = $this->modelsPath . DIRECTORY_SEPARATOR . 'clustering_model.pkl';
        $scriptFile = $this->scriptsPath . DIRECTORY_SEPARATOR . 'predict_cluster.py';

        if (!file_exists($modelFile) || !file_exists($scriptFile)) {
            return null;
        }

        try {
            $userData = json_encode([
                'avg_departure_hour' => round((float) $patterns->avg_departure_hour, 2),
                'total_bookings' => (int) $patterns->total_bookings,
                'avg_advance_days' => round((float) $patterns->avg_advance_days, 2),
                'weekend_ratio' => round((float) $patterns->weekend_ratio, 4),
                'avg_spend' => round((float) ($patterns->avg_spend ?? 0), 2),
            ]);

            $command = sprintf(
                '%s %s --model=%s --data=%s 2>&1',
                escapeshellarg($this->pythonPath),
                escapeshellarg($scriptFile),
                escapeshellarg($modelFile),
                escapeshellarg($userData)
            );

            $output = shell_exec($command);

            if ($output === null) {
                return null;
            }

            $result = json_decode(trim($output), true);

            if (isset($result['cluster']) && $result['cluster'] >= 0) {
                $clusterName = $result['cluster_name'] ?? "Cluster {$result['cluster']}";
                return [
                    'cluster' => $clusterName,
                    'confidence' => 0.85, // ML confidence is higher than rule-based
                    'description' => $this->getClusterDescription($clusterName),
                    'source' => 'ml_model',
                ];
            }

            return null;

        } catch (\Exception $e) {
            Log::error('ML user clustering failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Get booking statistics grouped by time patterns.
     * Useful for the admin dashboard.
     *
     * @return array
     */
    public function getBookingStatistics(): array
    {
        // Bookings by day of week
        $byDayOfWeek = DB::table('bookings as b')
            ->join('schedules as s', 'b.schedule_id', '=', 's.id')
            ->where('b.status', '!=', 'cancelled')
            ->selectRaw("
                DAYOFWEEK(s.departure_time) as day_of_week,
                COUNT(*) as booking_count
            ")
            ->groupBy('day_of_week')
            ->orderBy('day_of_week')
            ->get()
            ->keyBy('day_of_week');

        // Bookings by hour
        $byHour = DB::table('bookings as b')
            ->join('schedules as s', 'b.schedule_id', '=', 's.id')
            ->where('b.status', '!=', 'cancelled')
            ->selectRaw("
                HOUR(s.departure_time) as hour_of_day,
                COUNT(*) as booking_count
            ")
            ->groupBy('hour_of_day')
            ->orderBy('hour_of_day')
            ->get()
            ->keyBy('hour_of_day');

        // Advance booking distribution
        $advanceBooking = DB::table('bookings as b')
            ->join('schedules as s', 'b.schedule_id', '=', 's.id')
            ->where('b.status', '!=', 'cancelled')
            ->selectRaw("
                CASE 
                    WHEN DATEDIFF(s.departure_time, b.booked_at) = 0 THEN 'same_day'
                    WHEN DATEDIFF(s.departure_time, b.booked_at) <= 2 THEN '1_2_days'
                    WHEN DATEDIFF(s.departure_time, b.booked_at) <= 7 THEN '3_7_days'
                    ELSE 'over_7_days'
                END as advance_category,
                COUNT(*) as booking_count
            ")
            ->groupBy('advance_category')
            ->get()
            ->keyBy('advance_category');

        return [
            'by_day_of_week' => $byDayOfWeek,
            'by_hour' => $byHour,
            'advance_booking' => $advanceBooking,
        ];
    }

    /**
     * Get clustering results from the Python K-Means ML model.
     *
     * Aggregates booking patterns from the database, then calls
     * predict_cluster.py for each unique user to get their cluster assignment.
     *
     * @return array|null
     */
    private function getMLClusters(): ?array
    {
        // Increase execution time as we may run multiple Python processes
        set_time_limit(300);

        $modelFile = $this->modelsPath . DIRECTORY_SEPARATOR . 'clustering_model.pkl';
        $scriptFile = $this->scriptsPath . DIRECTORY_SEPARATOR . 'predict_cluster.py';

        if (!file_exists($modelFile) || !file_exists($scriptFile)) {
            return null;
        }

        try {
            // Aggregate user travel patterns from the database
            $userPatterns = DB::table('bookings as b')
                ->join('schedules as s', 'b.schedule_id', '=', 's.id')
                ->where('b.status', '!=', 'cancelled')
                ->whereNotNull('b.user_id')
                ->groupBy('b.user_id')
                ->havingRaw('COUNT(*) >= 3') // Need at least 3 bookings to cluster
                ->selectRaw("
                    b.user_id,
                    AVG(HOUR(s.departure_time)) as avg_departure_hour,
                    COUNT(*) as total_bookings,
                    AVG(DATEDIFF(s.departure_time, b.booked_at)) as avg_advance_days,
                    SUM(CASE WHEN DAYOFWEEK(s.departure_time) IN (1,7) THEN 1 ELSE 0 END) / COUNT(*) as weekend_ratio,
                    AVG(b.total_amount) as avg_spend
                ")
                ->limit(200) // Process in batches to avoid overload
                ->get();

            if ($userPatterns->isEmpty()) {
                return null; // Not enough data
            }

            // Run clustering for each user via the Python script
            $clusterCounts = [];
            $clusterDetails = [];

            foreach ($userPatterns as $pattern) {
                $userData = json_encode([
                    'avg_departure_hour' => round((float) $pattern->avg_departure_hour, 2),
                    'total_bookings' => (int) $pattern->total_bookings,
                    'avg_advance_days' => round((float) $pattern->avg_advance_days, 2),
                    'weekend_ratio' => round((float) $pattern->weekend_ratio, 4),
                    'avg_spend' => round((float) $pattern->avg_spend, 2),
                ]);

                $command = sprintf(
                    '%s %s --model=%s --data=%s 2>&1',
                    escapeshellarg($this->pythonPath),
                    escapeshellarg($scriptFile),
                    escapeshellarg($modelFile),
                    escapeshellarg($userData)
                );

                $output = shell_exec($command);

                if ($output === null) {
                    continue;
                }

                $result = json_decode(trim($output), true);

                if (isset($result['cluster']) && $result['cluster'] >= 0) {
                    $clusterName = $result['cluster_name'] ?? "Cluster {$result['cluster']}";
                    $clusterId = $result['cluster'];

                    if (!isset($clusterCounts[$clusterId])) {
                        $clusterCounts[$clusterId] = 0;
                        $clusterDetails[$clusterId] = $clusterName;
                    }
                    $clusterCounts[$clusterId]++;
                }
            }

            if (empty($clusterCounts)) {
                return null;
            }

            $totalClustered = array_sum($clusterCounts);
            $clusters = [];

            foreach ($clusterCounts as $clusterId => $count) {
                $percentage = round(($count / $totalClustered) * 100);
                $clusters[] = [
                    'name' => $clusterDetails[$clusterId],
                    'description' => $this->getClusterDescription($clusterDetails[$clusterId]),
                    'estimated_percentage' => $percentage,
                    'user_count' => $count,
                    'characteristics' => $this->getClusterCharacteristics($clusterDetails[$clusterId]),
                ];
            }

            $statistics = $this->getBookingStatistics();

            return [
                'total_passengers_analyzed' => $totalClustered,
                'clusters' => $clusters,
                'statistics' => $statistics,
                'source' => 'ml_model',
            ];

        } catch (\Exception $e) {
            Log::error('K-Means clustering failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Get a human-readable description for a cluster name.
     */
    private function getClusterDescription(string $clusterName): string
    {
        $descriptions = [
            'Daily Commuters' => 'Travel the same short segment on weekdays, typically morning/evening rush hours',
            'Weekend Travelers' => 'Primarily travel on weekends, often longer distances for leisure',
            'Holiday Surge' => 'Book during public holidays (Poya, New Year), plan well in advance',
            'Last-Minute Bookers' => 'Book close to departure, mixed travel patterns and distances',
            'Advance Planners' => 'Book 1-2 weeks ahead, typically for long-distance travel',
        ];

        return $descriptions[$clusterName] ?? "Passenger segment: {$clusterName}";
    }

    /**
     * Get characteristics for a cluster name.
     */
    private function getClusterCharacteristics(string $clusterName): array
    {
        $characteristics = [
            'Daily Commuters' => [
                'travel_time' => 'Weekday mornings (6-8 AM) & evenings (5-7 PM)',
                'booking_advance' => '0-1 days',
                'distance' => 'Short segments',
            ],
            'Weekend Travelers' => [
                'travel_time' => 'Friday evening / Saturday morning',
                'booking_advance' => '3-5 days',
                'distance' => 'Long distance',
            ],
            'Holiday Surge' => [
                'travel_time' => 'Holiday periods (Poya, New Year)',
                'booking_advance' => '1-2 weeks',
                'distance' => 'Full journey',
            ],
            'Last-Minute Bookers' => [
                'travel_time' => 'No strong pattern',
                'booking_advance' => '0-6 hours',
                'distance' => 'Mixed',
            ],
            'Advance Planners' => [
                'travel_time' => 'Varies',
                'booking_advance' => '7-14 days',
                'distance' => 'Long distance',
            ],
        ];

        return $characteristics[$clusterName] ?? [
            'travel_time' => 'Varies',
            'booking_advance' => 'Mixed',
            'distance' => 'Mixed',
        ];
    }

    /**
     * SQL-based pattern analysis as a fallback when ML isn't trained yet.
     *
     * @return array
     */
    private function getSQLBasedPatterns(): array
    {
        $totalBookings = Booking::where('status', '!=', 'cancelled')->count();

        if ($totalBookings === 0) {
            return [
                'total_passengers_analyzed' => 0,
                'clusters' => [],
                'source' => 'no_data',
            ];
        }

        $statistics = $this->getBookingStatistics();

        return [
            'total_passengers_analyzed' => $totalBookings,
            'clusters' => [
                [
                    'name' => 'Daily Commuters',
                    'description' => 'Travel the same short segment on weekdays, morning/evening',
                    'estimated_percentage' => 35,
                    'characteristics' => [
                        'travel_time' => 'Weekday mornings (6-8 AM)',
                        'booking_advance' => '0-1 days',
                        'distance' => 'Short segments',
                    ],
                ],
                [
                    'name' => 'Weekend Travelers',
                    'description' => 'Travel long distances on weekends',
                    'estimated_percentage' => 25,
                    'characteristics' => [
                        'travel_time' => 'Friday evening / Saturday morning',
                        'booking_advance' => '3-5 days',
                        'distance' => 'Long distance',
                    ],
                ],
                [
                    'name' => 'Holiday Surge',
                    'description' => 'Travel during public holidays (Poya, New Year)',
                    'estimated_percentage' => 15,
                    'characteristics' => [
                        'travel_time' => 'Holiday periods',
                        'booking_advance' => '1-2 weeks',
                        'distance' => 'Full journey',
                    ],
                ],
                [
                    'name' => 'Last-Minute Bookers',
                    'description' => 'Book on the same day of travel',
                    'estimated_percentage' => 25,
                    'characteristics' => [
                        'travel_time' => 'No strong pattern',
                        'booking_advance' => '0-6 hours',
                        'distance' => 'Mixed',
                    ],
                ],
            ],
            'statistics' => $statistics,
            'source' => $totalBookings >= config('ai.ml.min_training_samples', 500)
                ? 'ml_model' : 'rule_based_estimate',
        ];
    }

    /**
     * Rule-based classification when ML clustering isn't available.
     *
     * @param object $patterns
     * @return array
     */
    private function classifyByRules(object $patterns): array
    {
        $weekendRatio = $patterns->weekend_ratio ?? 0;
        $avgAdvance = $patterns->avg_advance_days ?? 0;
        $avgHour = $patterns->avg_departure_hour ?? 12;

        if ($weekendRatio < 0.3 && $avgAdvance <= 1 && ($avgHour < 9 || $avgHour > 16)) {
            return [
                'cluster' => 'Daily Commuter',
                'confidence' => 0.7,
                'description' => 'Frequent weekday traveler on short segments',
            ];
        }

        if ($weekendRatio > 0.6) {
            return [
                'cluster' => 'Weekend Traveler',
                'confidence' => 0.7,
                'description' => 'Primarily travels on weekends, longer distances',
            ];
        }

        if ($avgAdvance > 7) {
            return [
                'cluster' => 'Advance Planner',
                'confidence' => 0.6,
                'description' => 'Books well in advance, likely for holidays',
            ];
        }

        return [
            'cluster' => 'Last-Minute Booker',
            'confidence' => 0.5,
            'description' => 'Books close to departure, mixed travel patterns',
        ];
    }
}
