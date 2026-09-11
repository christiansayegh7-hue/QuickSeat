<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Restaurant;
use App\Models\RestaurantApplication;
use Illuminate\Http\Request;

class AdminRestaurantApplicationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | List Restaurant Applications
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $applications = RestaurantApplication::with('user:id,name,email')
            ->latest()
            ->get();

        return response()->json([
            'restaurant_applications' => $applications,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Approve - activates the restaurant role and creates the restaurant
    |--------------------------------------------------------------------------
    */

    public function approve(Request $request, $id)
    {
        $application = RestaurantApplication::with('user')->find($id);

        if (!$application) {
            return response()->json(['message' => 'Restaurant application not found.'], 404);
        }

        if ($application->status !== 'pending') {
            return response()->json(['message' => 'This application has already been reviewed.'], 409);
        }

        $application->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $application->user->update(['role' => 'restaurant']);

        $restaurant = Restaurant::create([
            'manager_id' => $application->user_id,
            'name' => $application->restaurant_name,
            'address' => 'To be updated',
            'phone' => $application->phone ?? 'To be updated',
            'email' => $application->user->email,
        ]);

        Notification::create([
            'user_id' => $application->user_id,
            'reservation_id' => null,
            'message' => "Great news! Your restaurant \"{$restaurant->name}\" has been approved. You can now log in using the Restaurant option and manage your restaurant dashboard.",
            'type' => 'restaurant_application_approved',
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Restaurant application approved successfully.',
            'restaurant_application' => $application,
            'restaurant' => $restaurant,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Reject
    |--------------------------------------------------------------------------
    */

    public function reject(Request $request, $id)
    {
        $application = RestaurantApplication::with('user')->find($id);

        if (!$application) {
            return response()->json(['message' => 'Restaurant application not found.'], 404);
        }

        if ($application->status !== 'pending') {
            return response()->json(['message' => 'This application has already been reviewed.'], 409);
        }

        $application->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        Notification::create([
            'user_id' => $application->user_id,
            'reservation_id' => null,
            'message' => 'Sorry, your restaurant account request was not approved. You cannot access the platform as a restaurant.',
            'type' => 'restaurant_application_rejected',
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Restaurant application rejected.',
            'restaurant_application' => $application,
        ]);
    }
}
