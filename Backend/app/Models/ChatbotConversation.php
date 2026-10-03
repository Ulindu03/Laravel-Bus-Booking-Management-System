<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotConversation extends Model
{
    /**
     * Only created_at exists in this table (no updated_at).
     * Setting UPDATED_AT to null tells Laravel not to look for it.
     */
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'user_message',
        'ai_response',
        'context_data',
        'response_time_ms',
        'helpful',
    ];

    protected function casts(): array
    {
        return [
            'context_data' => 'array',
            'helpful' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Get the user who initiated this conversation (if logged in).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

