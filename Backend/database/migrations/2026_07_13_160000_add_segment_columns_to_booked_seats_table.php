<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * AI/ML Feature: Segment-based booking support.
     * These columns allow tracking WHERE a passenger boards and alights,
     * enabling the seat to be reused on other segments of the same route.
     */
    public function up(): void
    {
        Schema::table('booked_seats', function (Blueprint $table) {
            $table->string('boarding_stop', 100)->nullable()->after('passenger_phone');
            $table->string('alighting_stop', 100)->nullable()->after('boarding_stop');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booked_seats', function (Blueprint $table) {
            $table->dropColumn(['boarding_stop', 'alighting_stop']);
        });
    }
};
