<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RestaurantController extends Controller
{
    public function index()
    {
        $restaurants = Restaurant::with([
            'reviews',
            'tables'
        ])->get();

        $this->attachFullStatus($restaurants);

        return response()->json([
            'restaurants' => $restaurants
        ]);
    }


    public function show($id)
    {
        $restaurant = Restaurant::with([
            'reviews.user',
            'tables',
            'categories.menuItems'
        ])->find($id);

        if (!$restaurant) {
            return response()->json([
                'message' => 'Restaurant not found.'
            ], 404);
        }

        $this->attachFullStatus(collect([$restaurant]));

        return response()->json([
            'restaurant' => $restaurant
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Restaurant (admin only) - name, details and cover image
    |--------------------------------------------------------------------------
    | Uses POST (not PATCH) so a real multipart file upload works reliably;
    | the frontend still calls this to "edit" a restaurant's profile.
    */

    public function update(Request $request, $id)
    {
        $restaurant = Restaurant::find($id);

        if (!$restaurant) {
            return response()->json([
                'message' => 'Restaurant not found.'
            ], 404);
        }

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

    /*
    |--------------------------------------------------------------------------
    | 5) Restaurant Full Status
    |--------------------------------------------------------------------------
    | Computed on every request from live table/reservation data (not a
    | stored flag), so it always reflects current availability: a restaurant
    | is "full" right now when every one of its available tables is covered
    | by a confirmed/pending reservation whose time window includes now.
    */

    private function attachFullStatus($restaurants)
    {
        if ($restaurants->isEmpty()) {
            return;
        }

        $now = now();
        $today = $now->toDateString();
        $nowTime = $now->format('H:i:s');

        $busyTableCounts = Reservation::whereIn('restaurant_id', $restaurants->pluck('id'))
            ->where('reservation_date', $today)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('start_time', '<=', $nowTime)
            ->where('end_time', '>', $nowTime)
            ->select('restaurant_id', DB::raw('COUNT(DISTINCT table_id) as busy_tables'))
            ->groupBy('restaurant_id')
            ->pluck('busy_tables', 'restaurant_id');

        foreach ($restaurants as $restaurant) {
            $totalTables = $restaurant->tables->where('status', 'available')->count();
            $busyTables = (int) ($busyTableCounts[$restaurant->id] ?? 0);

            $restaurant->is_full = $totalTables > 0 && $busyTables >= $totalTables;
            $restaurant->available_tables_now = max(0, $totalTables - $busyTables);
        }
    }
}
