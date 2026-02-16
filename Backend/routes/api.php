<?php

use Illuminate\Support\Facades\Route;  // Import the Route facade
use App\Http\Controllers\AuthController; // Import the AuthController
use Illuminate\Http\Request; // Import the Request class

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
}); // Add other API routes as needed