<?php

namespace App\Http\Controllers;

use App\Services\ChatbotService;
use App\Services\OllamaClient;
use App\Models\ChatbotConversation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AIChatController extends Controller
{
    private ChatbotService $chatbotService;

    public function __construct(ChatbotService $chatbotService)
    {
        $this->chatbotService = $chatbotService;
    }

    /**
     * Send a message to the AI chatbot (non-streaming).
     * Falls back endpoint — use /ai/chat/stream for real-time.
     *
     * POST /api/ai/chat
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function chat(Request $request): JsonResponse
    {
        set_time_limit(90);

        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $userId = $request->user()?->id;
        $message = $request->input('message');

        $result = $this->chatbotService->chat($message, $userId);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Stream AI response via Server-Sent Events (SSE).
     * Frontend receives tokens as they're generated — feels instant.
     *
     * POST /api/ai/chat/stream
     *
     * @param Request $request
     * @return StreamedResponse
     */
    public function chatStream(Request $request): StreamedResponse
    {
        set_time_limit(90);

        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $userId = $request->user()?->id;
        $message = $request->input('message');

        $chatbotService = $this->chatbotService;

        return response()->stream(function () use ($message, $userId, $chatbotService) {
            $startTime = microtime(true);

            // Build prompt using ChatbotService's public methods
            $context = $chatbotService->buildContext($message, $userId);
            $prompt = $chatbotService->buildPrompt($message, $context);

            // Stream from Ollama
            $ollama = app(OllamaClient::class);
            $fullResponse = '';

            foreach ($ollama->generateStream($prompt) as $chunk) {
                $fullResponse .= $chunk;

                // Send SSE event
                echo "data: " . json_encode(['chunk' => $chunk]) . "\n\n";

                // Flush immediately
                if (ob_get_level() > 0) ob_flush();
                flush();
            }

            $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);

            // Save the complete conversation
            $conversation = ChatbotConversation::create([
                'user_id' => $userId,
                'user_message' => $message,
                'ai_response' => $fullResponse,
                'context_data' => $context ? ['context' => $context] : null,
                'response_time_ms' => $responseTimeMs,
            ]);

            // Send final SSE event with metadata
            echo "data: " . json_encode([
                'done' => true,
                'conversation_id' => $conversation->id,
                'response_time_ms' => $responseTimeMs,
            ]) . "\n\n";

            if (ob_get_level() > 0) ob_flush();
            flush();

        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',  // Disable nginx buffering
        ]);
    }

    /**
     * Get chat history for the authenticated user.
     *
     * GET /api/ai/chat/history
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function history(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 20);
        $history = $this->chatbotService->getHistory($request->user()->id, $limit);

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Submit feedback on a chatbot response.
     *
     * POST /api/ai/chat/feedback
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function feedback(Request $request): JsonResponse
    {
        $request->validate([
            'conversation_id' => 'required|integer|exists:chatbot_conversations,id',
            'helpful' => 'required|boolean',
        ]);

        $updated = $this->chatbotService->rateFeedback(
            $request->input('conversation_id'),
            $request->boolean('helpful')
        );

        return response()->json([
            'success' => $updated,
            'message' => $updated ? 'Thank you for your feedback!' : 'Feedback could not be saved.',
        ]);
    }
}
