<?php

namespace App\Http\Controllers;

use App\Models\Bus;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class BusController extends Controller
{
    /**
     * Display a listing of all buses.
     */
    public function index(): JsonResponse
    {
        $buses = Bus::all();

        return response()->json([
            'success' => true,
            'data' => $buses,
        ]);
    }

    /**
     * Store a newly created bus in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bus_number' => 'required|string|unique:buses,bus_number',
            'name' => 'required|string|max:255',
            'type' => 'required|in:normal,semi_luxury,luxury,ac',
            'total_seats' => 'required|integer|min:1',
            'seat_layout' => 'required|string',
            'amenities' => 'nullable|array',
            'status' => 'required|in:active,inactive,maintenance',
            'image' => 'nullable|string',
        ]);

        $bus = Bus::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Bus created successfully',
            'data' => $bus,
        ], 201);
    }

    /**
     * Display the specified bus.
     */
    public function show(Bus $bus): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $bus,
        ]);
    }

    /**
     * Update the specified bus in storage.
     */
    public function update(Request $request, Bus $bus): JsonResponse
    {
        $validated = $request->validate([
            'bus_number' => [
                'sometimes',
                'string',
                Rule::unique('buses', 'bus_number')->ignore($bus->id),
            ],
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:normal,semi_luxury,luxury,ac',
            'total_seats' => 'sometimes|integer|min:1',
            'seat_layout' => 'sometimes|string',
            'amenities' => 'nullable|array',
            'status' => 'sometimes|in:active,inactive,maintenance',
            'image' => 'nullable|string',
        ]);

        $bus->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Bus updated successfully',
            'data' => $bus,
        ]);
    }

    /**
     * Remove the specified bus from storage.
     */
    public function destroy(Bus $bus): JsonResponse
    {
        $bus->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bus deleted successfully',
        ]);
    }
}
