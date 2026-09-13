<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReservationController extends Controller
{
    public function index()
    {
        $reservations = Reservation::with(
        'items.menuItem',
        'restaurant',
        'table',
        'user'
        )->get();

        return response()->json([
        'message' => 'Reservations retrieved successfully.',
        'reservations' => $reservations
        ], 200);
    }

    public function restaurantReservations($restaurantId)
    {
        $reservations = Reservation::where('restaurant_id', $restaurantId)
            ->with(
                'items.menuItem',
                'restaurant',
                'table',
                'user'
            )
            ->orderBy('reservation_date')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'message' => 'Restaurant reservations retrieved successfully.',
            'restaurant_id' => $restaurantId,
            'reservations' => $reservations
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
            'table_id' => 'required|exists:tables,id',

            'reservation_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            // Not "after:start_time" - a reservation ending at midnight is
            // stored as "00:00", which a same-day "after" comparison would
            // wrongly reject. isWithinOperatingHours() below does the real
            // (wraparound-aware) validation instead.
            'end_time' => 'required|date_format:H:i',

            'number_of_guests' => 'required|integer|min:1',
            'reservation_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string',

            'items' => 'nullable|array',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        // The customer is never taken from the request body: they are already
        // signed in, so their identity comes from the Sanctum token.
        $user = $request->user();

        if ($user->is_blocked) {
            return response()->json([
                'message' => 'Your account is blocked. You cannot make a reservation.'
            ], 403);
        }

        // A restaurant manager may only ever create a reservation at the
        // restaurant they manage - never at another one, even though the
        // request could technically name any restaurant_id.
        if ($user->role === 'restaurant') {
            $ownsThisRestaurant = $user->managedRestaurants()
                ->where('id', $validated['restaurant_id'])
                ->exists();

            if (!$ownsThisRestaurant) {
                return response()->json([
                    'message' => 'Restaurant accounts can only make reservations at their own restaurant.'
                ], 403);
            }
        }

        $restaurant = Restaurant::find($validated['restaurant_id']);

        /*
        |--------------------------------------------------------------------------
        | Check restaurant guest capacity
        |--------------------------------------------------------------------------
        */

        if ($restaurant->max_capacity && $validated['number_of_guests'] > $restaurant->max_capacity) {
            return response()->json([
                'message' => "This restaurant only accommodates up to {$restaurant->max_capacity} guests per reservation."
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Check reservation falls within opening/closing hours
        |--------------------------------------------------------------------------
        */

        if (!$this->isWithinOperatingHours($restaurant, $validated['start_time'], $validated['end_time'])) {
            return response()->json([
                'message' => 'The selected time is outside this restaurant\'s opening hours.'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Check table belongs to restaurant
        |--------------------------------------------------------------------------
        */

        $table = Table::where('id', $validated['table_id'])
            ->where('restaurant_id', $validated['restaurant_id'])
            ->first();

        if (!$table) {
            return response()->json([
                'message' => 'The selected table does not belong to this restaurant.'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Check table capacity
        |--------------------------------------------------------------------------
        */

        if ($table->capacity < $validated['number_of_guests']) {
            return response()->json([
                'message' => 'This table cannot accommodate the number of guests.'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Check reservation time overlap (same rule availableTables() uses)
        |--------------------------------------------------------------------------
        */

        $tableIsFree = $this->tablesAvailableFor(
            $validated['restaurant_id'],
            $validated['reservation_date'],
            $validated['start_time'],
            $validated['end_time'],
            $validated['number_of_guests']
        )->contains('id', $validated['table_id']);

        if (!$tableIsFree) {
            return response()->json([
                'message' => 'The selected table is not available during this time period.'
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | Check menu items
        |--------------------------------------------------------------------------
        */

        if (!empty($validated['items'])) {

            $menuItemIds = collect($validated['items'])
                ->pluck('menu_item_id');

            $validMenuItemsCount = MenuItem::whereIn('id', $menuItemIds)
                ->whereHas('category', function ($query) use ($validated) {
                    $query->where('restaurant_id', $validated['restaurant_id']);
                })
                ->where('is_available', true)
                ->count();

            if ($validMenuItemsCount !== $menuItemIds->unique()->count()) {
                return response()->json([
                    'message' => 'One or more selected menu items are not available in this restaurant.'
                ], 422);
            }
        }
        /*
        |--------------------------------------------------------------------------
        | Create reservation
        |--------------------------------------------------------------------------
        */

        $reservation = DB::transaction(function () use ($validated, $user) {

            $reservation = Reservation::create([
                'user_id' => $user->id,
                'restaurant_id' => $validated['restaurant_id'],
                'table_id' => $validated['table_id'],

                'reservation_date' => $validated['reservation_date'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],

                'number_of_guests' => $validated['number_of_guests'],

                'reservation_method' =>
                    $validated['reservation_method'] ?? 'website',

                'notes' => $validated['notes'] ?? null,

                'status' => 'confirmed',

                'reservation_code' =>
                    'RES-' . strtoupper(Str::random(10)),
            ]);

            /*
            |--------------------------------------------------------------------------
            | Add reservation items
            |--------------------------------------------------------------------------
            */

            foreach ($validated['items'] ?? [] as $item) {

                $menuItem = MenuItem::find($item['menu_item_id']);

                $quantity = $item['quantity'];
                $unitPrice = $menuItem->price;
                $subtotal = $unitPrice * $quantity;

                $reservation->items()->create([
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Notify the customer that their reservation was created
            |--------------------------------------------------------------------------
            */

            $reservation->load('restaurant');

            Notification::create([
                'user_id' => $user->id,
                'reservation_id' => $reservation->id,
                'message' => "Your reservation at {$reservation->restaurant->name} on {$reservation->reservation_date} at {$reservation->start_time} has been confirmed. Code: {$reservation->reservation_code}.",
                'type' => 'reservation_confirmed',
                'is_read' => false,
            ]);

            return $reservation;
        });

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'message' => 'Reservation saved successfully.',
            'reservation' => $reservation->load(
                'items.menuItem',
                'restaurant',
                'table'
            )
        ], 201);
    }

    public function myReservations(Request $request)
    {
        $reservations = Reservation::where('user_id', $request->user()->id)
        ->with([
            'restaurant',
            'table',
            'items.menuItem'
        ])
        ->orderBy('reservation_date', 'desc')
        ->orderBy('start_time', 'desc')
        ->get();

        return response()->json([
        'message' => 'User reservations retrieved successfully.',
        'reservations' => $reservations
        ], 200);
    }



    /*
    |--------------------------------------------------------------------------
    | Add Dishes To A Reservation (restaurant manager only)
    |--------------------------------------------------------------------------
    | Lets a restaurant add menu items to one of ITS OWN reservations after
    | it was made (e.g. the table orders more food once seated). Adding to
    | an existing menu_item_id increases its quantity instead of creating a
    | duplicate row - same subtotal calculation store() already uses.
    */

    public function addItems(Request $request, $id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.'
            ], 404);
        }

        $user = $request->user();

        $manages = $user->role === 'restaurant'
            && $user->managedRestaurants()->where('id', $reservation->restaurant_id)->exists();

        if (!$manages) {
            return response()->json([
                'message' => 'Unauthorized. You do not manage this restaurant.'
            ], 403);
        }

        if ($reservation->status === 'cancelled') {
            return response()->json([
                'message' => 'Cannot add dishes to a cancelled reservation.'
            ], 409);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $menuItemIds = collect($validated['items'])->pluck('menu_item_id');

        $validMenuItemsCount = MenuItem::whereIn('id', $menuItemIds)
            ->whereHas('category', function ($query) use ($reservation) {
                $query->where('restaurant_id', $reservation->restaurant_id);
            })
            ->where('is_available', true)
            ->count();

        if ($validMenuItemsCount !== $menuItemIds->unique()->count()) {
            return response()->json([
                'message' => 'One or more selected menu items are not available in this restaurant.'
            ], 422);
        }

        DB::transaction(function () use ($validated, $reservation) {
            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::find($item['menu_item_id']);
                $quantity = $item['quantity'];

                $existingItem = $reservation->items()
                    ->where('menu_item_id', $menuItem->id)
                    ->first();

                if ($existingItem) {
                    $newQuantity = $existingItem->quantity + $quantity;
                    $existingItem->update([
                        'quantity' => $newQuantity,
                        'subtotal' => $menuItem->price * $newQuantity,
                    ]);
                } else {
                    $reservation->items()->create([
                        'menu_item_id' => $menuItem->id,
                        'quantity' => $quantity,
                        'unit_price' => $menuItem->price,
                        'subtotal' => $menuItem->price * $quantity,
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Dishes added to the reservation successfully.',
            'reservation' => $reservation->load('items.menuItem', 'table', 'user:id,name,email'),
        ]);
    }

    public function cancel(Request $request, $id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.'
            ], 404);
        }

        // The reservation's own customer, an admin, or the restaurant manager
        // that owns this reservation's restaurant may cancel it - taken from
        // the Sanctum-authenticated user, never a client-supplied id.
        $authUser = $request->user();

        $isOwnReservation = $reservation->user_id == $authUser->id;
        $isAdmin = $authUser->role === 'admin';
        $managesThisRestaurant = $authUser->role === 'restaurant'
            && $authUser->managedRestaurants()->where('id', $reservation->restaurant_id)->exists();

        if (!$isOwnReservation && !$isAdmin && !$managesThisRestaurant) {
            return response()->json([
                'message' => 'You are not allowed to cancel this reservation.'
            ], 403);
        }

        // Check if reservation is already cancelled
        if ($reservation->status === 'cancelled') {
            return response()->json([
                'message' => 'This reservation is already cancelled.'
            ], 409);
        }

        // Check if reservation has already started
        $reservationStart = \Carbon\Carbon::parse(
            $reservation->reservation_date . ' ' . $reservation->start_time
        );

        if (now()->greaterThanOrEqualTo($reservationStart)) {
            return response()->json([
                'message' => 'You cannot cancel a reservation after it has started.'
            ], 409);
        }

        $reservation->update([
            'status' => 'cancelled'
        ]);

        return response()->json([
            'message' => 'Reservation cancelled successfully.',
            'reservation' => $reservation->load(
                'items.menuItem',
                'restaurant',
                'table'
            )
        ], 200);
    }

     public function markNoShow($id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.'
            ], 404);
        }

        if ($reservation->status === 'cancelled') {
            return response()->json([
                'message' => 'A cancelled reservation cannot be marked as no-show.'
            ], 409);
        }

        if ($reservation->status === 'no_show') {
            return response()->json([
                'message' => 'This reservation is already marked as no-show.'
            ], 409);
        }

        $reservation->update([
            'status' => 'no_show'
        ]);

        return response()->json([
            'message' => 'Reservation marked as no-show successfully.',
            'reservation' => $reservation->load(
                'items.menuItem',
                'restaurant',
                'table'
            )
        ], 200);
    }
    public function blockUser($id)
    {
    $user = \App\Models\User::find($id);

    if (!$user) {
        return response()->json([
            'message' => 'User not found.'
        ], 404);
    }

    $user->is_blocked = true;
    $user->save();

    return response()->json([
        'message' => 'User blocked successfully.'
    ]);
    }

    public function unblockUser($id)
    {
    $user = \App\Models\User::find($id);

    if (!$user) {
        return response()->json([
            'message' => 'User not found.'
        ], 404);
    }

    $user->is_blocked = false;
    $user->save();

    return response()->json([
        'message' => 'User unblocked successfully.'
    ]);
    }

    public function availableTables(Request $request, $restaurantId)
{
    $validated = $request->validate([
        'reservation_date' => 'required|date',
        'start_time' => 'required|date_format:H:i',
        // See store() - not "after:start_time", a midnight end_time ("00:00")
        // would wrongly fail a same-day comparison.
        'end_time' => 'required|date_format:H:i',
        'number_of_guests' => 'required|integer|min:1',
    ]);

    $restaurant = Restaurant::find($restaurantId);

    if (!$restaurant) {
        return response()->json(['message' => 'Restaurant not found.'], 404);
    }

    // This is a "browse" endpoint, not a "commit" one - an out-of-range
    // request just gets an empty result with a reason, not a hard error.
    if (
        ($restaurant->max_capacity && $validated['number_of_guests'] > $restaurant->max_capacity)
        || !$this->isWithinOperatingHours($restaurant, $validated['start_time'], $validated['end_time'])
    ) {
        return response()->json([
            'restaurant_id' => $restaurantId,
            'reservation_date' => $validated['reservation_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'number_of_guests' => $validated['number_of_guests'],
            'available_tables_count' => 0,
            'available_tables' => [],
        ]);
    }

    $availableTables = $this->tablesAvailableFor(
        $restaurantId,
        $validated['reservation_date'],
        $validated['start_time'],
        $validated['end_time'],
        $validated['number_of_guests']
    );

    return response()->json([
        'restaurant_id' => $restaurantId,
        'reservation_date' => $validated['reservation_date'],
        'start_time' => $validated['start_time'],
        'end_time' => $validated['end_time'],
        'number_of_guests' => $validated['number_of_guests'],
        'available_tables_count' => $availableTables->count(),
        'available_tables' => $availableTables,
    ]);
}

/*
|--------------------------------------------------------------------------
| Which start times (given a date/duration/guest count) actually have an
| available table - lets the frontend remove dead options instead of the
| customer discovering a slot doesn't work only after picking it.
|--------------------------------------------------------------------------
*/

public function availableStartTimes(Request $request, $restaurantId)
{
    $validated = $request->validate([
        'reservation_date' => 'required|date',
        'duration_minutes' => 'required|integer|min:30|max:1440',
        'number_of_guests' => 'required|integer|min:1',
    ]);

    $restaurant = Restaurant::find($restaurantId);

    if (!$restaurant) {
        return response()->json(['message' => 'Restaurant not found.'], 404);
    }

    if ($restaurant->max_capacity && $validated['number_of_guests'] > $restaurant->max_capacity) {
        return response()->json([
            'restaurant_id' => $restaurantId,
            'reservation_date' => $validated['reservation_date'],
            'duration_minutes' => $validated['duration_minutes'],
            'start_times' => [],
        ]);
    }

    [$open, $close] = $this->operatingWindow($restaurant);
    $duration = $validated['duration_minutes'];

    // Every eligible table for this many guests, and every one of that
    // day's active reservations - two queries total, reused for every
    // candidate slot below instead of one query per slot.
    $eligibleTables = Table::where('restaurant_id', $restaurantId)
        ->where('capacity', '>=', $validated['number_of_guests'])
        ->where('status', 'available')
        ->get(['id']);

    $dayReservations = Reservation::where('restaurant_id', $restaurantId)
        ->where('reservation_date', $validated['reservation_date'])
        ->whereIn('status', ['pending', 'confirmed'])
        ->get(['table_id', 'start_time', 'end_time']);

    $startTimes = [];

    for ($slot = $open; $slot + $duration <= $close; $slot += 30) {
        $slotEnd = $slot + $duration;

        $hasFreeTable = $eligibleTables->contains(function ($table) use ($dayReservations, $slot, $slotEnd) {
            $conflict = $dayReservations->first(function ($reservation) use ($table, $slot, $slotEnd) {
                if ($reservation->table_id !== $table->id) {
                    return false;
                }

                $resStart = $this->minutesOfTime($reservation->start_time);
                $resEnd = $this->minutesOfTime($reservation->end_time);
                if ($resEnd <= $resStart) {
                    $resEnd += 1440;
                }

                return $resStart < $slotEnd && $resEnd > $slot;
            });

            return !$conflict;
        });

        if ($hasFreeTable) {
            $startTimes[] = $this->formatMinutesAsTime($slot % 1440);
        }
    }

    return response()->json([
        'restaurant_id' => $restaurantId,
        'reservation_date' => $validated['reservation_date'],
        'duration_minutes' => $duration,
        'start_times' => $startTimes,
    ]);
}

/*
|--------------------------------------------------------------------------
| Shared time/availability helpers
|--------------------------------------------------------------------------
*/

private function minutesOfTime(string $time): int
{
    [$hours, $minutes] = array_map('intval', explode(':', $time));
    return $hours * 60 + $minutes;
}

private function formatMinutesAsTime(int $minutes): string
{
    return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
}

/**
 * [openMinutes, closeMinutes] for a restaurant, closeMinutes always >
 * openMinutes (added 1440 when closing time is at/before opening time,
 * i.e. the restaurant closes after midnight). Restaurants that haven't
 * configured structured hours yet stay open all day (0-1440) so nothing
 * that already worked for them breaks.
 */
private function operatingWindow(Restaurant $restaurant): array
{
    if (!$restaurant->opening_time || !$restaurant->closing_time) {
        return [0, 1440];
    }

    $open = $this->minutesOfTime($restaurant->opening_time);
    $close = $this->minutesOfTime($restaurant->closing_time);

    if ($close <= $open) {
        $close += 1440;
    }

    return [$open, $close];
}

private function isWithinOperatingHours(Restaurant $restaurant, string $startTime, string $endTime): bool
{
    if ($startTime === $endTime) {
        return false;
    }

    [$open, $close] = $this->operatingWindow($restaurant);

    $start = $this->minutesOfTime($startTime);
    $end = $this->minutesOfTime($endTime);

    if ($end <= $start) {
        $end += 1440;
    }

    return $start >= $open && $end <= $close;
}

/**
 * The same overlap+capacity query availableTables() has always used,
 * extracted so availableStartTimes() can reuse the exact same rule
 * instead of duplicating it.
 */
private function tablesAvailableFor($restaurantId, string $date, string $startTime, string $endTime, int $guests)
{
    $tables = Table::where('restaurant_id', $restaurantId)
        ->where('capacity', '>=', $guests)
        ->where('status', 'available')
        ->get();

    // "end_time" can legitimately be "00:00" (midnight) for a reservation
    // that runs to closing - a plain string comparison would treat that as
    // the *earliest* possible time instead of the latest, so both the
    // candidate's own end_time and the stored column are normalized to
    // "24:00" for this comparison only (start_time is never "00:00" - the
    // app never offers midnight as a start time).
    $normalizedEndParam = $endTime === '00:00' ? '24:00' : $endTime;

    $bookedTableIds = Reservation::where('restaurant_id', $restaurantId)
        ->where('reservation_date', $date)
        ->whereIn('status', ['pending', 'confirmed'])
        ->where('start_time', '<', $normalizedEndParam)
        ->whereRaw("CASE WHEN end_time = '00:00' THEN '24:00' ELSE end_time END > ?", [$startTime])
        ->pluck('table_id');

    return $tables->whereNotIn('id', $bookedTableIds)->values();
}

public function restaurantProfits(Request $request, $restaurantId)
{
    $validated = $request->validate([
        'from' => 'required|date',
        'to' => 'required|date|after_or_equal:from',
    ]);

    $reservations = Reservation::where('restaurant_id', $restaurantId)
        ->whereBetween('reservation_date', [
            $validated['from'],
            $validated['to']
        ])
        ->where('status', 'confirmed')
        ->with('items')
        ->get();

    $totalProfit = 0;

    foreach ($reservations as $reservation) {
        foreach ($reservation->items as $item) {
            $totalProfit += $item->subtotal;
        }
    }

    return response()->json([
        'restaurant_id' => $restaurantId,
        'from' => $validated['from'],
        'to' => $validated['to'],
        'confirmed_reservations_count' => $reservations->count(),
        'total_profit' => number_format($totalProfit, 2, '.', ''),
    ]);
}
}