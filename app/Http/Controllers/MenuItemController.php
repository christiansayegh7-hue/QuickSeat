<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\MenuItem;
use App\Models\ReservationItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MenuItemController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Show all menu items for a restaurant
    |--------------------------------------------------------------------------
    */

    public function restaurantMenu($restaurantId)
    {
        $categories = Category::where('restaurant_id', $restaurantId)
            ->with(['menuItems' => function ($query) {
                $query->where('is_available', true);
            }])
            ->get();

        return response()->json([
            'restaurant_id' => $restaurantId,
            'categories' => $categories
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Create menu item
    |--------------------------------------------------------------------------
    | Same admin-vs-restaurant-manager pattern as CategoryController: admin
    | may target any category, a restaurant manager only one belonging to
    | their own restaurant - verified from the category's restaurant_id,
    | never trusted from the request.
    */

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|image|max:5120',
            'is_available' => 'nullable|boolean',
        ]);

        $category = Category::find($validated['category_id']);

        if (!$this->canManage($user, $category->restaurant_id)) {
            return response()->json([
                'message' => 'Unauthorized. You do not manage this restaurant.'
            ], 403);
        }

        $menuItem = MenuItem::create([
            'category_id' => $category->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'image' => $request->hasFile('image') ? $request->file('image')->store('menu-items', 'public') : null,
            'is_available' => $validated['is_available'] ?? true,
        ]);

        return response()->json([
            'message' => 'Menu item created successfully.',
            'menu_item' => $menuItem
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Update menu item
    |--------------------------------------------------------------------------
    | POST (not PATCH) so a real multipart image upload works reliably -
    | mirrors the same approach used for updating a restaurant's cover photo.
    */

    public function update(Request $request, $id)
    {
        $menuItem = MenuItem::with('category')->find($id);

        if (!$menuItem) {
            return response()->json([
                'message' => 'Menu item not found.'
            ], 404);
        }

        if (!$this->canManage($request->user(), $menuItem->category->restaurant_id)) {
            return response()->json([
                'message' => 'Unauthorized. You do not manage this restaurant.'
            ], 403);
        }

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'image' => 'nullable|image|max:5120',
            'is_available' => 'sometimes|boolean',
        ]);

        // Moving a menu item to a different category must not be a way to
        // smuggle it into another restaurant's menu.
        if (isset($validated['category_id'])) {
            $targetCategory = Category::find($validated['category_id']);
            if (!$this->canManage($request->user(), $targetCategory->restaurant_id)) {
                return response()->json([
                    'message' => 'Unauthorized. You do not manage that restaurant.'
                ], 403);
            }
        }

        if ($request->hasFile('image')) {
            if ($menuItem->image && !str_starts_with($menuItem->image, 'http')) {
                Storage::disk('public')->delete($menuItem->image);
            }

            $validated['image'] = $request->file('image')->store('menu-items', 'public');
        } else {
            unset($validated['image']);
        }

        $menuItem->update($validated);

        return response()->json([
            'message' => 'Menu item updated successfully.',
            'menu_item' => $menuItem
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete menu item
    |--------------------------------------------------------------------------
    */

    public function destroy(Request $request, $id)
    {
        $menuItem = MenuItem::with('category')->find($id);

        if (!$menuItem) {
            return response()->json([
                'message' => 'Menu item not found.'
            ], 404);
        }

        if (!$this->canManage($request->user(), $menuItem->category->restaurant_id)) {
            return response()->json([
                'message' => 'Unauthorized. You do not manage this restaurant.'
            ], 403);
        }

        // menu_items.id is restrictOnDelete() from reservation_items - once a
        // dish has ever been ordered (even on a past/cancelled reservation)
        // it can no longer be deleted outright, to keep those historical
        // orders intact. Mark it unavailable instead to hide it from the menu.
        $hasBeenOrdered = ReservationItem::where('menu_item_id', $menuItem->id)->exists();

        if ($hasBeenOrdered) {
            return response()->json([
                'message' => 'This menu item has already been ordered in one or more reservations and cannot be deleted. Set it as unavailable instead to hide it from the menu.'
            ], 409);
        }

        if ($menuItem->image && !str_starts_with($menuItem->image, 'http')) {
            Storage::disk('public')->delete($menuItem->image);
        }

        $menuItem->delete();

        return response()->json([
            'message' => 'Menu item deleted successfully.'
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
