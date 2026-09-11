<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\ReservationItem;
use App\Models\User;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Create Category
    |--------------------------------------------------------------------------
    |
    | Single store() branched by the authenticated user's role, taken from the
    | Sanctum token - no separate admin/restaurant endpoints:
    | - admin: may target any restaurant, so restaurant_id is required.
    | - restaurant (manager): restaurant is taken automatically from the
    |   restaurant(s) they manage, so restaurant_id is not requested.
    */

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            $validated = $request->validate([
                'restaurant_id' => 'required|exists:restaurants,id',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'is_active' => 'nullable|boolean',
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
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'is_active' => 'nullable|boolean',
            ]);

            $restaurantId = $restaurant->id;
        } else {
            return response()->json([
                'message' => 'Unauthorized. Only admins or restaurant managers can create categories.'
            ], 403);
        }

        $category = Category::create([
            'restaurant_id' => $restaurantId,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => $category
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Category
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'message' => 'Category not found.'
            ], 404);
        }

        $user = $request->user();

        if (!$this->canManage($user, $category->restaurant_id)) {
            return response()->json([
                'message' => 'Unauthorized. You do not manage this restaurant.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => $category
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Category
    |--------------------------------------------------------------------------
    */

    public function destroy(Request $request, $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'message' => 'Category not found.'
            ], 404);
        }

        $user = $request->user();

        if (!$this->canManage($user, $category->restaurant_id)) {
            return response()->json([
                'message' => 'Unauthorized. You do not manage this restaurant.'
            ], 403);
        }

        // Deleting a category cascades onto its menu items (cascadeOnDelete),
        // but a menu item that has ever been ordered is restrictOnDelete()
        // from reservation_items - so this would otherwise fail midway with
        // a raw FK constraint error. Caught here up front instead.
        $hasOrderedItems = ReservationItem::whereHas('menuItem', function ($query) use ($category) {
            $query->where('category_id', $category->id);
        })->exists();

        if ($hasOrderedItems) {
            return response()->json([
                'message' => 'This category has menu items that have already been ordered in one or more reservations and cannot be deleted. Mark those items as unavailable instead, or move them to another category first.'
            ], 409);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.'
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
