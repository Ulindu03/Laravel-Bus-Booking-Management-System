<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BusController;
use App\Http\Controllers\RouteController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AIChatController;
use App\Http\Controllers\PredictionController;

// Public routes
Route::get('/schedules/search', [ScheduleController::class, 'search']);
Route::get('/schedules/{schedule}', [ScheduleController::class, 'show']);
Route::post('/bookings', [BookingController::class, 'store']); // Guest + auth booking

Route::prefix('auth')->group(function () {
    // Public auth routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    // Protected auth routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// User routes - protected by auth:sanctum
Route::middleware('auth:sanctum')->group(function () {
    // Bookings
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
});

// Admin routes - protected by auth:sanctum
Route::middleware(['auth:sanctum', 'role:admin,super_admin'])->prefix('admin')->group(function () {
    // Dashboard & Bookings
    Route::get('/dashboard', [AdminDashboardController::class, 'dashboard']);
    Route::get('/bookings', [AdminDashboardController::class, 'bookings']);

    // Bus management
    Route::get('/buses', [BusController::class, 'index']);
    Route::post('/buses', [BusController::class, 'store']);
    Route::get('/buses/{bus}', [BusController::class, 'show']);
    Route::put('/buses/{bus}', [BusController::class, 'update']);
    Route::delete('/buses/{bus}', [BusController::class, 'destroy']);

    // Route management
    Route::get('/routes', [RouteController::class, 'index']);
    Route::post('/routes', [RouteController::class, 'store']);
    Route::get('/routes/{route}', [RouteController::class, 'show']);
    Route::put('/routes/{route}', [RouteController::class, 'update']);
    Route::delete('/routes/{route}', [RouteController::class, 'destroy']);

    // Schedule management
    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::post('/schedules', [ScheduleController::class, 'store']);
    Route::get('/schedules/{schedule}', [ScheduleController::class, 'show']);
    Route::put('/schedules/{schedule}', [ScheduleController::class, 'update']);
    Route::delete('/schedules/{schedule}', [ScheduleController::class, 'destroy']);

    // User management
    Route::get('/users', [AdminDashboardController::class, 'users']);
    Route::put('/users/{user}', [AdminDashboardController::class, 'updateUser']);
});

// =========================================================================
// AI/ML Routes
// =========================================================================

// Public AI routes (no auth required)
Route::prefix('ai')->group(function () {
    // Chatbot — accessible to all users (guests included)
    Route::post('/chat', [AIChatController::class, 'chat']);
    Route::post('/chat/stream', [AIChatController::class, 'chatStream']);

    // Segment availability — used by frontend seat map
    Route::get('/segments/{schedule_id}', [PredictionController::class, 'segmentAvailability']);
});

// Authenticated AI routes
Route::middleware('auth:sanctum')->prefix('ai')->group(function () {
    // Chat history and feedback (needs user identity)
    Route::get('/chat/history', [AIChatController::class, 'history']);
    Route::post('/chat/feedback', [AIChatController::class, 'feedback']);
});

// Admin-only AI routes
Route::middleware(['auth:sanctum', 'role:admin,super_admin'])->prefix('admin/ai')->group(function () {
    // Demand predictions
    Route::get('/predict/demand/{route_id}', [PredictionController::class, 'demandPrediction']);

    // Passenger pattern insights
    Route::get('/insights/patterns', [PredictionController::class, 'patternInsights']);

    // AI system health check
    Route::get('/health', [PredictionController::class, 'healthCheck']);
});