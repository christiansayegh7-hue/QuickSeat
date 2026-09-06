<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Get My Notifications
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->with('reservation')
            ->latest()
            ->get();

        return response()->json([
            'notifications_count' => $notifications->count(),
            'unread_count' => $notifications->where('is_read', false)->count(),
            'notifications' => $notifications
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Unread Count (cheap endpoint for polling, e.g. a navbar badge)
    |--------------------------------------------------------------------------
    */

    public function unreadCount()
    {
        return response()->json([
            'unread_count' => Notification::where('user_id', Auth::id())
                ->where('is_read', false)
                ->count(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Create Notification
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reservation_id' => 'nullable|exists:reservations,id',
            'message' => 'required|string',
            'type' => 'required|string|max:50',
        ]);

        $notification = Notification::create([
            'user_id' => Auth::id(),
            'reservation_id' => $validated['reservation_id'] ?? null,
            'message' => $validated['message'],
            'type' => $validated['type'],
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Notification created successfully.',
            'notification' => $notification->load('reservation')
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | Mark Notification As Read
    |--------------------------------------------------------------------------
    */

    public function markAsRead($id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$notification) {
            return response()->json([
                'message' => 'Notification not found.'
            ], 404);
        }

        $notification->update([
            'is_read' => true
        ]);

        return response()->json([
            'message' => 'Notification marked as read.',
            'notification' => $notification
        ]);
    }
}