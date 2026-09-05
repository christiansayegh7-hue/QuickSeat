<?php

namespace App\Http\Controllers;

use App\Models\User;

class AdminUserController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | List Users
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $users = User::withCount('reservations')->latest()->get();

        return response()->json([
            'users' => $users
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Block User
    |--------------------------------------------------------------------------
    */

    public function block($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        if ($user->role === 'admin') {
            return response()->json([
                'message' => 'Admin users cannot be blocked.'
            ], 403);
        }

        $user->update([
            'is_blocked' => true
        ]);

        return response()->json([
            'message' => 'User blocked successfully.',
            'user_id' => $user->id,
            'is_blocked' => $user->is_blocked
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Unblock User
    |--------------------------------------------------------------------------
    */

    public function unblock($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        $user->update([
            'is_blocked' => false
        ]);

        return response()->json([
            'message' => 'User unblocked successfully.',
            'user_id' => $user->id,
            'is_blocked' => $user->is_blocked
        ]);
    }
}