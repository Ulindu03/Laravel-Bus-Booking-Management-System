<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow guest bookings — make user_id nullable and add guest contact fields.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Drop existing foreign key constraint
            $table->dropForeign(['user_id']);
            
            // Re-add as nullable
            $table->foreignId('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            
            // Guest booking fields
            $table->string('guest_name', 100)->nullable()->after('user_id');
            $table->string('guest_email', 150)->nullable()->after('guest_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['guest_name', 'guest_email']);
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade')->change();
        });
    }
};
