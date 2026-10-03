<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * AI/ML Feature: Chatbot conversation logging.
     * Stores every chatbot interaction including the context data
     * injected into the prompt, response time, and user feedback.
     * Used for evaluating chatbot quality and improving responses.
     */
    public function up(): void
    {
        Schema::create('chatbot_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('user_message');
            $table->text('ai_response');
            $table->json('context_data')->nullable();
            $table->unsignedInteger('response_time_ms')->default(0);
            $table->boolean('helpful')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chatbot_conversations');
    }
};
