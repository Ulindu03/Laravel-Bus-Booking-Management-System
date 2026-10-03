<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * AI/ML Feature: Prediction logging for evaluation & re-training.
     * Every demand prediction is logged here. The actual_demand column
     * is filled after the trip completes, allowing us to measure
     * prediction accuracy (MAE, RMSE, R²).
     */
    public function up(): void
    {
        Schema::create('ml_predictions_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained('routes')->onDelete('cascade');
            $table->unsignedInteger('segment_index');
            $table->date('prediction_date');
            $table->unsignedInteger('predicted_demand');
            $table->unsignedInteger('actual_demand')->nullable();
            $table->string('model_version', 20)->default('v1.0');
            $table->timestamp('created_at')->useCurrent();

            // Index for evaluation queries (compare predicted vs actual)
            $table->index(['route_id', 'prediction_date']);
            $table->index('model_version');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ml_predictions_log');
    }
};
