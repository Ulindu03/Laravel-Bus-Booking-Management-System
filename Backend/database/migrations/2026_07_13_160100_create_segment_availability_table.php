<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * AI/ML Feature: Segment-based seat availability tracking.
     * Each row represents one segment of a route for a specific schedule,
     * with ML-predicted demand and protected seat counts.
     */
    public function up(): void
    {
        Schema::create('segment_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained('schedules')->onDelete('cascade');
            $table->string('segment_start', 100);
            $table->string('segment_end', 100);
            $table->unsignedInteger('segment_index');
            $table->unsignedInteger('total_seats');
            $table->unsignedInteger('booked_seats')->default(0);
            $table->unsignedInteger('protected_seats')->default(0);
            $table->unsignedInteger('available_seats');
            $table->unsignedInteger('predicted_demand')->nullable();
            $table->timestamps();

            // Index for fast lookups by schedule + segment
            $table->index(['schedule_id', 'segment_index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('segment_availability');
    }
};
