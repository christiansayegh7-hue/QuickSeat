<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Reservation;
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
            'end_time' => 'required|date_format:H:i|after:start_time',

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
        | Check reservation time overlap
        |--------------------------------------------------------------------------
        */

        $tableIsBooked = Reservation::where('table_id', $validated['table_id'])
            ->where('reservation_date', $validated['reservation_date'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->where(function ($query) use ($validated) {

                $query->where('start_time', '<', $validated['end_time'])
                      ->where('end_time', '>', $validated['start_time']);

            })
            ->exists();

        if ($tableIsBooked) {
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



    public function cancel(Request $request, $id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => 'Reservation not found.'
            ], 404);
        }

        // Only the reservation's own customer or an admin may cancel it -
        // taken from the Sanctum-authenticated user, never a client-supplied id.
        $authUser = $request->user();

        if ($reservation->user_id != $authUser->id && $authUser->role !== 'admin') {
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
        'end_time' => 'required|date_format:H:i|after:start_time',
        'number_of_guests' => 'required|integer|min:1',
    ]);

    // Get all tables belonging to this restaurant
    $tables = Table::where('restaurant_id', $restaurantId)
        ->where('capacity', '>=', $validated['number_of_guests'])
        ->where('status', 'available')
        ->get();

    // Find tables that already have an overlapping reservation
    $bookedTableIds = Reservation::where('restaurant_id', $restaurantId)
        ->where('reservation_date', $validated['reservation_date'])
        ->whereIn('status', ['pending', 'confirmed'])
        ->where(function ($query) use ($validated) {

            $query->where('start_time', '<', $validated['end_time'])
                  ->where('end_time', '>', $validated['start_time']);

        })
        ->pluck('table_id');

    // Remove booked tables
    $availableTables = $tables->whereNotIn('id', $bookedTableIds)->values();

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