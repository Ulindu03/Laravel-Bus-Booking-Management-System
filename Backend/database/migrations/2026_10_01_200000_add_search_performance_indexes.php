<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add performance indexes for search queries.
     * These indexes dramatically speed up the schedule search API
     * which filters by departure_time, status, and route_id.
     */
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            // Composite index for the most common search query pattern:
            // WHERE status = 'scheduled' AND departure_time > NOW() ORDER BY departure_time
            $table->index(['status', 'departure_time'], 'idx_schedules_status_departure');

            // Index for route_id lookups (already has FK, but explicit index helps)
            $table->index(['route_id', 'status'], 'idx_schedules_route_status');
        });

        Schema::table('routes', function (Blueprint $table) {
            // Index for active route filtering
            $table->index('status', 'idx_routes_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropIndex('idx_schedules_status_departure');
            $table->dropIndex('idx_schedules_route_status');
        });

        Schema::table('routes', function (Blueprint $table) {
            $table->dropIndex('idx_routes_status');
        });
    }
};
