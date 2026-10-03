<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Route;
use App\Models\ChatbotConversation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ChatbotService
{
    private OllamaClient $ollama;

    public function __construct(OllamaClient $ollama)
    {
        $this->ollama = $ollama;
    }

    /**
     * Process a user message and return an AI response.
     *
     * Flow: User message → Check cache → Fetch DB context → Build prompt → Ollama → Response
     *
     * @param string $userMessage The passenger's question/request
     * @param int|null $userId The authenticated user's ID (null for guests)
     * @return array Response with 'response', 'response_time_ms', and 'conversation_id'
     */
    public function chat(string $userMessage, ?int $userId = null): array
    {
        $startTime = microtime(true);

        // Step 1: Check cache for common/generic questions (guest only)
        if (!$userId) {
            $cached = $this->getCachedResponse($userMessage);
            if ($cached) {
                $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);
                $conversation = ChatbotConversation::create([
                    'user_id' => null,
                    'user_message' => $userMessage,
                    'ai_response' => $cached,
                    'context_data' => ['source' => 'cache'],
                    'response_time_ms' => $responseTimeMs,
                ]);
                return [
                    'response' => $cached,
                    'response_time_ms' => $responseTimeMs,
                    'conversation_id' => $conversation->id,
                ];
            }
        }

        // Step 2: Build context from our database (lightweight)
        $context = $this->buildContext($userMessage, $userId);

        // Step 3: Create the full prompt with system instructions + context
        $prompt = $this->buildPrompt($userMessage, $context);

        // Step 4: Send to Ollama (LOCAL — no internet needed)
        $aiResponse = $this->ollama->generate($prompt);

        // Step 5: Calculate response time
        $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);

        // Step 6: Log the conversation
        $conversation = ChatbotConversation::create([
            'user_id' => $userId,
            'user_message' => $userMessage,
            'ai_response' => $aiResponse,
            'context_data' => $context ? ['context' => $context] : null,
            'response_time_ms' => $responseTimeMs,
        ]);

        // Step 7: Cache generic responses for future speed
        if (!$userId && $responseTimeMs > 0) {
            $this->cacheResponse($userMessage, $aiResponse);
        }

        return [
            'response' => $aiResponse,
            'response_time_ms' => $responseTimeMs,
            'conversation_id' => $conversation->id,
        ];
    }

    /**
     * Rate a chatbot response as helpful or not.
     *
     * @param int $conversationId
     * @param bool $helpful
     * @return bool
     */
    public function rateFeedback(int $conversationId, bool $helpful): bool
    {
        return ChatbotConversation::where('id', $conversationId)
            ->update(['helpful' => $helpful]) > 0;
    }

    /**
     * Get chat history for a user.
     *
     * @param int $userId
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getHistory(int $userId, int $limit = 20)
    {
        return ChatbotConversation::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get();
    }

    /**
     * Build relevant context from the database based on the user's message.
     * OPTIMIZED: Only fetches minimal data needed, limits route count.
     *
     * @param string $message
     * @param int|null $userId
     * @return string
     */
    public function buildContext(string $message, ?int $userId): string
    {
        $context = '';
        $messageLower = strtolower($message);

        // Route-related keywords
        $routeKeywords = ['route', 'bus', 'travel', 'go to', 'from', 'colombo',
            'kandy', 'galle', 'jaffna', 'matara', 'negombo', 'kurunegala',
            'anuradhapura', 'schedule', 'available', 'price', 'fare', 'seat'];

        $needsRoutes = false;
        foreach ($routeKeywords as $keyword) {
            if (str_contains($messageLower, $keyword)) {
                $needsRoutes = true;
                break;
            }
        }

        if ($needsRoutes) {
            // Use cached route data (refreshes every 5 minutes)
            $routes = Cache::remember('chatbot_routes', 300, function () {
                return Route::where('status', 'active')
                    ->select(['id', 'name', 'origin', 'destination', 'base_fare', 'distance_km', 'duration_mins'])
                    ->limit(15)  // Cap routes to keep prompt small
                    ->get()
                    ->toArray();
            });

            if (count($routes)) {
                $context .= "Routes:\n";
                foreach ($routes as $route) {
                    $context .= "- {$route['origin']}→{$route['destination']}";
                    $context .= " LKR{$route['base_fare']}";
                    if ($route['duration_mins']) {
                        $h = intdiv($route['duration_mins'], 60);
                        $m = $route['duration_mins'] % 60;
                        $context .= " ({$h}h{$m}m)";
                    }
                    $context .= "\n";
                }
            }
        }

        // If user has bookings, include their recent booking info
        if ($userId) {
            $bookingKeywords = ['booking', 'cancel', 'my', 'ticket', 'refund', 'status'];
            $needsBookings = false;
            foreach ($bookingKeywords as $keyword) {
                if (str_contains($messageLower, $keyword)) {
                    $needsBookings = true;
                    break;
                }
            }

            if ($needsBookings) {
                $bookings = Booking::where('user_id', $userId)
                    ->where('status', '!=', 'expired')
                    ->with(['schedule:id,route_id,departure_time', 'schedule.route:id,origin,destination'])
                    ->latest()
                    ->take(3)  // Reduced from 5 to 3
                    ->get();

                if ($bookings->count()) {
                    $context .= "\nYour Bookings:\n";
                    foreach ($bookings as $booking) {
                        $route = $booking->schedule->route ?? null;
                        $context .= "- {$booking->booking_ref} [{$booking->status}] {$booking->total_seats} seat(s) LKR{$booking->total_amount}";
                        if ($route) {
                            $context .= " {$route->origin}→{$route->destination}";
                        }
                        $context .= "\n";
                    }
                }
            }
        }

        return $context;
    }

    /**
     * Build the full prompt by combining system prompt + context + user message.
     * OPTIMIZED: Minimal prompt structure to reduce token count.
     *
     * @param string $userMessage
     * @param string $context
     * @return string
     */
    public function buildPrompt(string $userMessage, string $context): string
    {
        $systemPrompt = config('ai.chatbot_system_prompt');

        $prompt = "{$systemPrompt}\n";

        if (!empty($context)) {
            $prompt .= "\nDATA:\n{$context}\n";
        }

        $prompt .= "\nQ: {$userMessage}\nA:";

        return $prompt;
    }

    /**
     * Get a cached response for common questions.
     * Normalizes the query to increase cache hit rate.
     *
     * @param string $message
     * @return string|null
     */
    private function getCachedResponse(string $message): ?string
    {
        // Normalize: lowercase, trim, strip punctuation
        $normalized = preg_replace('/[^\w\s]/', '', strtolower(trim($message)));
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        $cacheKey = 'chatbot_resp_' . md5($normalized);

        return Cache::get($cacheKey);
    }

    /**
     * Cache a response for future identical/similar questions.
     * Only caches non-error, reasonably-lengthed responses.
     *
     * @param string $message
     * @param string $response
     */
    private function cacheResponse(string $message, string $response): void
    {
        // Don't cache error messages or very short responses
        if (str_contains($response, 'offline') || str_contains($response, 'error') || strlen($response) < 20) {
            return;
        }

        $normalized = preg_replace('/[^\w\s]/', '', strtolower(trim($message)));
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        $cacheKey = 'chatbot_resp_' . md5($normalized);

        // Cache for 30 minutes
        Cache::put($cacheKey, $response, 1800);
    }
}
