<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ManagerController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | The restaurant is always resolved from the authenticated manager's own
    | managedRestaurants() - never from a client-supplied id - so there is
    | no id for a request to tamper with in the first place.
    |--------------------------------------------------------------------------
    */

    private function ownRestaurantOrFail(Request $request)
    {
        $restaurant = $request->user()->managedRestaurants()->first();

        if (!$restaurant) {
            abort(403, 'You do not manage any restaurant yet.');
        }

        return $restaurant;
    }

    public function restaurant(Request $request)
    {
        $restaurant = $this->ownRestaurantOrFail($request)
            ->load('reviews', 'tables', 'categories.menuItems');

        return response()->json([
            'restaurant' => $restaurant,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Update own restaurant - name/description/photo/capacity/hours.
    |--------------------------------------------------------------------------
    | Same validation/image-handling as RestaurantController::update() (the
    | admin equivalent), but there is no {id} parameter at all - the target
    | restaurant can only ever be the caller's own, resolved server-side.
    */

    public function updateRestaurant(Request $request)
    {
        $restaurant = $this->ownRestaurantOrFail($request);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'address' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:50',
            'email' => 'nullable|email|max:255',
            'restaurant_type' => 'nullable|string|max:100',
            'price_range' => 'nullable|string|max:10',
            'opening_hours' => 'nullable|string|max:100',
            'opening_time' => 'sometimes|date_format:H:i',
            'closing_time' => 'sometimes|date_format:H:i',
            'max_capacity' => 'sometimes|integer|min:1',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            if ($restaurant->cover_image) {
                Storage::disk('public')->delete($restaurant->cover_image);
            }

            $validated['cover_image'] = $request->file('image')->store('restaurants', 'public');
        }

        unset($validated['image']);

        $restaurant->update($validated);

        return response()->json([
            'message' => 'Restaurant updated successfully.',
            'restaurant' => $restaurant->fresh(),
        ]);
    }

    public function reservations(Request $request)
    {
        $restaurant = $this->ownRestaurantOrFail($request);

        $reservations = Reservation::where('restaurant_id', $restaurant->id)
            ->with('items.menuItem', 'table', 'user:id,name,email')
            ->orderBy('reservation_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get();

        return response()->json([
            'restaurant_id' => $restaurant->id,
            'reservations' => $reservations,
        ]);
    }
}
