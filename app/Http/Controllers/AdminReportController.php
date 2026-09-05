<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\ReservationItem;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class AdminReportController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | 1) Restaurant Activity
    |--------------------------------------------------------------------------
    | How many reservations / distinct customers each restaurant has received,
    | so the admin can tell the most and least active restaurants apart.
    */

    public function restaurantActivity()
    {
        $reservationCounts = Reservation::select(
                'restaurant_id',
                DB::raw('COUNT(*) as reservations_count'),
                DB::raw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count"),
                DB::raw("SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show_count"),
                DB::raw('COUNT(DISTINCT user_id) as customers_count')
            )
            ->groupBy('restaurant_id')
            ->get()
            ->keyBy('restaurant_id');

        $restaurants = Restaurant::all();

        $activity = $restaurants->map(function ($restaurant) use ($reservationCounts) {
            $stats = $reservationCounts->get($restaurant->id);

            return [
                'restaurant_id' => $restaurant->id,
                'name' => $restaurant->name,
                'restaurant_type' => $restaurant->restaurant_type,
                'reservations_count' => (int) ($stats->reservations_count ?? 0),
                'cancelled_count' => (int) ($stats->cancelled_count ?? 0),
                'no_show_count' => (int) ($stats->no_show_count ?? 0),
                'customers_count' => (int) ($stats->customers_count ?? 0),
            ];
        })->sortByDesc('reservations_count')->values();

        return response()->json([
            'most_active_restaurant_id' => $activity->first()['restaurant_id'] ?? null,
            'least_active_restaurant_id' => $activity->last()['restaurant_id'] ?? null,
            'restaurants' => $activity,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 2) Daily Customers
    |--------------------------------------------------------------------------
    | Distinct customers per restaurant per day, over a chosen date range.
    */

    public function dailyCustomers(Request $request)
    {
        $validated = $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
            'restaurant_id' => 'nullable|exists:restaurants,id',
        ]);

        $rows = Reservation::select(
                'restaurant_id',
                'reservation_date as date',
                DB::raw('COUNT(DISTINCT user_id) as customers_count'),
                DB::raw('COUNT(*) as reservations_count')
            )
            ->where('status', '!=', 'cancelled')
            ->whereBetween('reservation_date', [$validated['from'], $validated['to']])
            ->when($validated['restaurant_id'] ?? null, fn ($q, $id) => $q->where('restaurant_id', $id))
            ->groupBy('restaurant_id', 'reservation_date')
            ->orderBy('reservation_date')
            ->with('restaurant:id,name')
            ->get();

        return response()->json([
            'from' => $validated['from'],
            'to' => $validated['to'],
            'rows' => $rows,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 3) Daily Revenue / Profit
    |--------------------------------------------------------------------------
    | Revenue per restaurant per day, computed with GROUP BY + SUM/COUNT over
    | confirmed reservations and their reservation_items.
    */

    public function dailyRevenue(Request $request)
    {
        $validated = $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
            'restaurant_id' => 'nullable|exists:restaurants,id',
        ]);

        $rows = DB::table('reservations')
            ->join('reservation_items', 'reservation_items.reservation_id', '=', 'reservations.id')
            ->select(
                'reservations.restaurant_id',
                'reservations.reservation_date as date',
                DB::raw('SUM(reservation_items.subtotal) as revenue'),
                DB::raw('COUNT(DISTINCT reservations.id) as reservations_count')
            )
            ->where('reservations.status', 'confirmed')
            ->whereBetween('reservations.reservation_date', [$validated['from'], $validated['to']])
            ->when($validated['restaurant_id'] ?? null, fn ($q, $id) => $q->where('reservations.restaurant_id', $id))
            ->groupBy('reservations.restaurant_id', 'reservations.reservation_date')
            ->orderBy('date')
            ->get();

        $restaurantNames = Restaurant::whereIn('id', $rows->pluck('restaurant_id')->unique())
            ->pluck('name', 'id');

        $rows = $rows->map(function ($row) use ($restaurantNames) {
            $row->restaurant_name = $restaurantNames->get($row->restaurant_id);
            $row->revenue = number_format((float) $row->revenue, 2, '.', '');
            return $row;
        });

        return response()->json([
            'from' => $validated['from'],
            'to' => $validated['to'],
            'total_revenue' => number_format($rows->sum(fn ($r) => (float) $r->revenue), 2, '.', ''),
            'rows' => $rows,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 6) Top 10 Customers
    |--------------------------------------------------------------------------
    */

    public function topCustomers()
    {
        $top = Reservation::select('user_id', DB::raw('COUNT(*) as reservations_count'))
            ->where('status', '!=', 'cancelled')
            ->groupBy('user_id')
            ->orderByDesc('reservations_count')
            ->limit(10)
            ->with('user:id,name,email')
            ->get();

        return response()->json([
            'top_customers' => $top,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 7) Top 10 Menu Items (overall, or scoped to one restaurant)
    |--------------------------------------------------------------------------
    */

    public function topMenuItems(Request $request)
    {
        $validated = $request->validate([
            'restaurant_id' => 'nullable|exists:restaurants,id',
        ]);

        $top = ReservationItem::select(
                'menu_item_id',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(subtotal) as total_revenue')
            )
            ->whereHas('reservation', function ($q) {
                $q->where('status', '!=', 'cancelled');
            })
            ->when($validated['restaurant_id'] ?? null, function ($q, $restaurantId) {
                $q->whereHas('menuItem.category', function ($q2) use ($restaurantId) {
                    $q2->where('restaurant_id', $restaurantId);
                });
            })
            ->groupBy('menu_item_id')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->with('menuItem.category.restaurant:id,name')
            ->get();

        return response()->json([
            'top_menu_items' => $top,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 4) Monthly Automatic Report - manual trigger for testing/demo
    |--------------------------------------------------------------------------
    */

    public function runMonthlyReport(Request $request)
    {
        $validated = $request->validate([
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2000|max:2100',
        ]);

        $options = ['--sync' => true];
        if (!empty($validated['month'])) {
            $options['--month'] = $validated['month'];
        }
        if (!empty($validated['year'])) {
            $options['--year'] = $validated['year'];
        }

        Artisan::call('reports:monthly', $options);

        return response()->json([
            'message' => 'Monthly report run completed.',
            'output' => Artisan::output(),
        ]);
    }
}
