<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Ollama Configuration (Local AI Engine)
    |--------------------------------------------------------------------------
    |
    | Ollama runs LLM models locally on your machine. No internet or API keys
    | needed after the initial model download. Used for the chatbot feature.
    |
    */

    'ollama' => [
        'host' => env('OLLAMA_HOST', 'http://localhost:11434'),
        'model' => env('OLLAMA_MODEL', 'qwen2.5:3b'),
        'timeout' => 60, // seconds — reduced from 120
        'options' => [
            'temperature' => 0.5,       // Lower = faster, more deterministic
            'top_p' => 0.85,
            'num_predict' => 256,        // Cap output tokens — prevents runaway generation
            'num_ctx' => 2048,           // Smaller context window = faster processing
            'repeat_penalty' => 1.1,     // Discourage repetitive output
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Python ML Configuration
    |--------------------------------------------------------------------------
    |
    | The ML models are trained in Python and saved as .pkl files.
    | Laravel calls Python scripts to get predictions. Everything is local.
    |
    */

    'python' => [
        'path' => env('PYTHON_PATH', 'python'),
        'models_path' => env('ML_MODELS_PATH', 'storage/ml_models'),
        'scripts_path' => 'scripts',
    ],

    /*
    |--------------------------------------------------------------------------
    | ML Model Settings
    |--------------------------------------------------------------------------
    |
    | Cache predictions to avoid calling Python for every request.
    | Minimum training samples controls when ML kicks in vs rule-based fallback.
    |
    */

    'ml' => [
        'prediction_cache_minutes' => (int) env('ML_PREDICTION_CACHE_MINUTES', 30),
        'min_training_samples' => (int) env('ML_MIN_TRAINING_SAMPLES', 500),
        'model_version' => 'v1.0',
    ],

    /*
    |--------------------------------------------------------------------------
    | Chatbot System Prompt
    |--------------------------------------------------------------------------
    |
    | This prompt is sent to Ollama with every chat request so the LLM
    | understands its role as the Serendib Go travel assistant.
    |
    */

    'chatbot_system_prompt' => <<<'PROMPT'
You are "Serendib Go Assistant" — an AI travel helper for Sri Lanka's bus booking platform.
Be concise (2-4 sentences max). Use data below when available. Be friendly.
If you don't know, say so. Never make up schedules or prices.
PROMPT,

];
