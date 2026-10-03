<?php

namespace App\Http\Controllers;

use App\Models\Route;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RouteController extends Controller
{
    /**
     * Display a listing of all routes.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Route::query();

        // Search by name, origin, or destination
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('route_number', 'like', "%{$search}%")
                  ->orWhere('origin', 'like', "%{$search}%")
                  ->orWhere('destination', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $routes = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $routes,
        ]);
    }

    /**
     * Store a newly created route in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'route_number' => 'nullable|string|max:50',
            'origin' => 'required|string|max:100',
            'destination' => 'required|string|max:100',
            'stops' => 'nullable|array',
            'stops.*.name' => 'required_with:stops|string',
            'stops.*.duration_mins' => 'required_with:stops|integer|min:0',
            'distance_km' => 'nullable|numeric|min:0',
            'duration_mins' => 'nullable|integer|min:0',
            'base_fare' => 'required|numeric|min:0',
            'fare_matrix' => 'nullable|array',
            'status' => 'required|in:active,inactive',
        ]);

        $route = Route::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Route created successfully',
            'data' => $route,
        ], 201);
    }

    /**
     * Display the specified route.
     */
    public function show(Route $route): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $route,
        ]);
    }

    /**
     * Update the specified route in storage.
     */
    public function update(Request $request, Route $route): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'route_number' => 'nullable|string|max:50',
            'origin' => 'sometimes|string|max:100',
            'destination' => 'sometimes|string|max:100',
            'stops' => 'nullable|array',
            'stops.*.name' => 'required_with:stops|string',
            'stops.*.duration_mins' => 'required_with:stops|integer|min:0',
            'distance_km' => 'nullable|numeric|min:0',
            'duration_mins' => 'nullable|integer|min:0',
            'base_fare' => 'sometimes|numeric|min:0',
            'fare_matrix' => 'nullable|array',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $route->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Route updated successfully',
            'data' => $route,
        ]);
    }

    /**
     * Remove the specified route from storage.
     */
    public function destroy(Route $route): JsonResponse
    {
        $route->delete();

        return response()->json([
            'success' => true,
            'message' => 'Route deleted successfully',
        ]);
    }
}
