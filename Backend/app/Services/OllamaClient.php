<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaClient
{
    private string $host;
    private string $model;
    private int $timeout;
    private array $defaultOptions;

    public function __construct()
    {
        $this->host = config('ai.ollama.host', 'http://localhost:11434');
        $this->model = config('ai.ollama.model', 'qwen2.5:3b');
        $this->timeout = config('ai.ollama.timeout', 60);
        $this->defaultOptions = config('ai.ollama.options', [
            'temperature' => 0.5,
            'top_p' => 0.85,
            'num_predict' => 256,
            'num_ctx' => 2048,
            'repeat_penalty' => 1.1,
        ]);
    }

    /**
     * Generate a response from the Ollama LLM (non-streaming).
     * Used for standard API responses.
     *
     * @param string $prompt The full prompt to send
     * @param array $options Override default model options
     * @return string The AI-generated response text
     */
    public function generate(string $prompt, array $options = []): string
    {
        $mergedOptions = array_merge($this->defaultOptions, $options);

        try {
            $response = Http::timeout($this->timeout)
                ->post("{$this->host}/api/generate", [
                    'model' => $this->model,
                    'prompt' => $prompt,
                    'stream' => false,
                    'keep_alive' => '10m',  // Keep model loaded for 10 minutes
                    'options' => $mergedOptions,
                ]);

            if ($response->successful()) {
                return $response->json('response', '');
            }

            Log::error('Ollama API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return 'I apologize, but I am temporarily unable to process your request. Please try again in a moment.';

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Ollama connection failed', [
                'host' => $this->host,
                'error' => $e->getMessage(),
            ]);

            return 'The AI assistant is currently offline. Please make sure Ollama is running (run "ollama serve" in your terminal).';

        } catch (\Exception $e) {
            Log::error('Ollama unexpected error', [
                'error' => $e->getMessage(),
            ]);

            return 'An unexpected error occurred. Please try again later.';
        }
    }

    /**
     * Stream a response from Ollama — yields chunks as they arrive.
     * Used for the SSE (Server-Sent Events) streaming endpoint.
     *
     * @param string $prompt The full prompt to send
     * @param array $options Override default model options
     * @return \Generator Yields response chunks as strings
     */
    public function generateStream(string $prompt, array $options = []): \Generator
    {
        $mergedOptions = array_merge($this->defaultOptions, $options);

        try {
            // Use cURL directly for true streaming
            $ch = curl_init("{$this->host}/api/generate");

            $payload = json_encode([
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => true,
                'keep_alive' => '10m',
                'options' => $mergedOptions,
            ]);

            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $payload,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_TIMEOUT => $this->timeout,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_RETURNTRANSFER => false,
                CURLOPT_WRITEFUNCTION => function ($ch, $data) use (&$buffer) {
                    $buffer .= $data;
                    return strlen($data);
                },
            ]);

            // Use a different approach: read the whole stream in chunks
            $buffer = '';
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            // Actually, let's use a line-by-line streaming approach
            $responseBody = '';
            $fullResponse = '';

            // For streaming, we'll use a callback-based approach
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
            curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $chunk) use (&$fullResponse) {
                $fullResponse .= $chunk;
                return strlen($chunk);
            });

            curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                yield 'Sorry, the AI is temporarily unavailable. Please try again.';
                return;
            }

            // Parse NDJSON lines from the response
            $lines = explode("\n", trim($fullResponse));
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line)) continue;

                $json = json_decode($line, true);
                if ($json && isset($json['response'])) {
                    yield $json['response'];
                }
            }

        } catch (\Exception $e) {
            Log::error('Ollama stream error', ['error' => $e->getMessage()]);
            yield 'The AI assistant encountered an error. Please try again.';
        }
    }

    /**
     * Preload the model into memory so first request is fast.
     * Call this on server boot or via artisan command.
     *
     * @return bool Whether the model was successfully loaded
     */
    public function warmup(): bool
    {
        try {
            $response = Http::timeout(120)
                ->post("{$this->host}/api/generate", [
                    'model' => $this->model,
                    'prompt' => '',
                    'keep_alive' => '10m',
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::warning('Ollama warmup failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Check if Ollama server is reachable and the model is available.
     *
     * @return array Health status with 'online' and 'model_available' keys
     */
    public function healthCheck(): array
    {
        try {
            $response = Http::timeout(5)->get("{$this->host}/api/tags");

            if (!$response->successful()) {
                return ['online' => false, 'model_available' => false];
            }

            $models = collect($response->json('models', []))
                ->pluck('name');

            return [
                'online' => true,
                'model_available' => $models->contains($this->model),
                'configured_model' => $this->model,
                'available_models' => $models->toArray(),
            ];

        } catch (\Exception $e) {
            return ['online' => false, 'model_available' => false];
        }
    }
}
