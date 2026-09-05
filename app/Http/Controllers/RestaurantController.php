<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Restaurant;
use Illuminate\Support\Facades\DB;

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
