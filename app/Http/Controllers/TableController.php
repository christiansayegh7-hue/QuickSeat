<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Table;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TableController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Create Table
    |--------------------------------------------------------------------------
    |
    | Same admin-vs-restaurant-manager store() pattern as CategoryController:
    | admin may target any restaurant, a restaurant manager only their own
    | (inferred from the token, not requested).
    */

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            $validated = $request->validate([
                'restaurant_id' => 'required|exists:restaurants,id',
                'table_number' => 'required|integer|min:1',
                'capacity' => 'required|integer|min:1',
                'location' => 'nullable|string|max:100',
                'status' => 'nullable|in:available,unavailable',
            ]);

            $restaurantId = $validated['restaurant_id'];
        } elseif ($user->role === 'restaurant') {
            $restaurant = $user->managedRestaurants()->first();

            if (!$restaurant) {
                return response()->json([
                    'message' => 'You do not manage any restaurant yet.'
                ], 403);
            }

            $validated = $request->validate([
                'table_number' => 'required|integer|min:1',
                'capacity' => 'required|integer|min:1',
                'location' => 'nullable|string|max:100',
                'status' => 'nullable|in:available,unavailable',
            ]);

            $restaurantId = $restaurant->id;
        } else {
            return response()->json([
                'message' => 'Unauthorized. Only admins or restaurant managers can manage tables.'
            ], 403);
        }

        $duplicate = Table::where('restaurant_id', $restaurantId)
            ->where('table_number', $validated['table_number'])
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'This restaurant already has a table with that number.'
            ], 422);
        }

        $table = Table::create([
            'restaurant_id' => $restaurantId,
            'table_number' => $validated['table_number'],
            'capacity' => $validated['capacity'],
            'location' => $validated['location'] ?? null,
            'status' => $validated['status'] ?? 'available',
        ]);

        return response()->json([
            'message' => 'Table created successfully.',
            'table' => $table,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Table
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, $id)
    {
        $table = Table::find($id);

        if (!$table) {
            return response()->json(['message' => 'Table not found.'], 404);
        }

        $user = $request->user();

        if (!$this->canManage($user, $table->restaurant_id)) {
            return response()->json([
                'message' => 'Unauthorized. You do not manage this restaurant.'
            ], 403);
        }

        $validated = $request->validate([
            'table_number' => [
                'sometimes',
                'integer',
                'min:1',
                Rule::unique('tables', 'table_number')
                    ->where('restaurant_id', $table->restaurant_id)
                    ->ignore($table->id),
            ],
            'capacity' => 'sometimes|integer|min:1',
            'location' => 'nullable|string|max:100',
            'status' => 'sometimes|in:available,unavailable',
        ]);

        $table->update($validated);

        return response()->json([
            'message' => 'Table updated successfully.',
            'table' => $table,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Table
    |--------------------------------------------------------------------------
    | table_id cascades onto reservations at the database level, so a table
    | with any active reservation is refused here rather than silently
    | deleting a customer's booking along with it.
    */

    public function destroy(Request $request, $id)
    {
        $table = Table::find($id);

        if (!$table) {
            return response()->json(['message' => 'Table not found.'], 404);
        }

        $user = $request->user();

        if (!$this->canManage($user, $table->restaurant_id)) {
            return response()->json([
                'message' => 'Unauthorized. You do not manage this restaurant.'
            ], 403);
        }

        $hasActiveReservations = Reservation::where('table_id', $table->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($hasActiveReservations) {
            return response()->json([
                'message' => 'This table has active reservations and cannot be deleted.'
            ], 409);
        }

        $table->delete();

        return response()->json([
            'message' => 'Table deleted successfully.'
        ]);
    }

    private function canManage(User $user, int $restaurantId): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'restaurant') {
            return $user->managedRestaurants()->where('id', $restaurantId)->exists();
        }

        return false;
    }
}
