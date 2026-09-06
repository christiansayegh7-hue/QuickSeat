<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\MenuItem;
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
    */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|image|max:5120',
            'is_available' => 'nullable|boolean',
        ]);

        $category = Category::find($validated['category_id']);

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
        $menuItem = MenuItem::find($id);

        if (!$menuItem) {
            return response()->json([
                'message' => 'Menu item not found.'
            ], 404);
        }

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'image' => 'nullable|image|max:5120',
            'is_available' => 'sometimes|boolean',
        ]);

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

    public function destroy($id)
    {
        $menuItem = MenuItem::find($id);

        if (!$menuItem) {
            return response()->json([
                'message' => 'Menu item not found.'
            ], 404);
        }

        if ($menuItem->image && !str_starts_with($menuItem->image, 'http')) {
            Storage::disk('public')->delete($menuItem->image);
        }

        $menuItem->delete();

        return response()->json([
            'message' => 'Menu item deleted successfully.'
        ]);
    }
}
