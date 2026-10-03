<?php

namespace App\Http\Controllers;

use App\Models\Bus;
use App\Models\Route;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    /**
     * Get dashboard overview stats.
     */
    public function dashboard(): JsonResponse
    {
        $totalBuses = Bus::count();
        $activeBuses = Bus::where('status', 'active')->count();
        $maintenanceBuses = Bus::where('status', 'maintenance')->count();

        $totalRoutes = Route::count();
        $activeRoutes = Route::where('status', 'active')->count();

        $totalSchedules = Schedule::count();
        $upcomingSchedules = Schedule::where('status', 'scheduled')
            ->where('departure_time', '>', now())
            ->count();

        $totalUsers = User::count();
        $newUsersThisMonth = User::where('created_at', '>=', now()->startOfMonth())->count();

        // Recent activity — latest schedules and users
        $recentSchedules = Schedule::with(['bus', 'route'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'type' => 'schedule',
                    'message' => "New schedule: {$schedule->bus->name} on {$schedule->route->name}",
                    'time' => $schedule->created_at,
                ];
            })->all();

        $recentUsers = User::orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'type' => 'user',
                    'message' => "New user registered: {$user->name}",
                    'time' => $user->created_at,
                ];
            })->all();

        $recentActivity = collect($recentSchedules)->merge($recentUsers)
            ->sortByDesc('time')
            ->values()
            ->take(10);

        // Real revenue data (last 7 days) from bookings table
        $revenueData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dayBookings = \App\Models\Booking::whereDate('created_at', $date->toDateString())
                ->where('status', '!=', 'cancelled');
            $revenueData[] = [
                'date' => $date->format('M d'),
                'revenue' => (float) $dayBookings->sum('total_amount'),
                'bookings' => $dayBookings->count(),
            ];
        }

        // Popular routes — real booking counts via schedules
        $popularRoutes = Route::where('status', 'active')
            ->get()
            ->map(function ($route) {
                $bookingCount = \App\Models\Booking::whereHas('schedule', function ($q) use ($route) {
                    $q->where('route_id', $route->id);
                })->where('status', '!=', 'cancelled')->count();

                return [
                    'name' => "{$route->origin} → {$route->destination}",
                    'bookings' => $bookingCount,
                ];
            })
            ->sortByDesc('bookings')
            ->values()
            ->take(5);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'total_buses' => $totalBuses,
                    'active_buses' => $activeBuses,
                    'maintenance_buses' => $maintenanceBuses,
                    'total_routes' => $totalRoutes,
                    'active_routes' => $activeRoutes,
                    'total_schedules' => $totalSchedules,
                    'upcoming_schedules' => $upcomingSchedules,
                    'total_users' => $totalUsers,
                    'new_users_this_month' => $newUsersThisMonth,
                    'total_bookings' => \App\Models\Booking::count(),
                    'total_revenue' => (float) \App\Models\Booking::where('status', '!=', 'cancelled')->sum('total_amount'),
                ],
                'revenue_data' => $revenueData,
                'popular_routes' => $popularRoutes,
                'recent_activity' => $recentActivity,
            ],
        ]);
    }

    /**
     * Get all users list.
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::query();

        // Search by name or email
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->has('role') && $request->role) {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Update user status (block/unblock).
     */
    public function updateUser(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:active,blocked',
            'role' => 'sometimes|in:admin,user',
        ]);

        if (isset($validated['role']) && $validated['role'] === 'admin') {
            if ($request->user()->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only the Super Admin can create or promote users to admin.',
                ], 403);
            }
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user,
        ]);
    }

    /**
     * Get all bookings (paginated) for admin.
     */
    public function bookings(Request $request): JsonResponse
    {
        $query = \App\Models\Booking::with(['user', 'schedule.route', 'schedule.bus']);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Search by booking ref
        if ($request->has('search') && $request->search) {
            $query->where('booking_ref', 'like', "%{$request->search}%");
        }

        $bookings = $query->orderBy('created_at', 'desc')->paginate(50);

        // Get aggregate stats for the top cards
        $total = \App\Models\Booking::count();
        $pending = \App\Models\Booking::where('status', 'pending')->count();
        $confirmed = \App\Models\Booking::where('status', 'confirmed')->count();
        $revenue = \App\Models\Booking::where('status', '!=', 'cancelled')->sum('total_amount');

        return response()->json([
            'success' => true,
            'data' => $bookings,
            'stats' => [
                'total' => $total,
                'pending' => $pending,
                'confirmed' => $confirmed,
                'revenue' => (float) $revenue,
            ]
        ]);
    }
}
