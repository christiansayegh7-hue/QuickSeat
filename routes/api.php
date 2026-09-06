<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminReportController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\RestaurantController;


Route::post('/register', [AuthController::class, 'register']);

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

// The customer is identified from the Sanctum token on every one of these,
// never from a client-supplied user_id.
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/reservations', [ReservationController::class, 'store']);

    Route::get('/reservations/my', [ReservationController::class, 'myReservations']);

    Route::patch('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);

});

Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    Route::get('/reservations', [ReservationController::class, 'index']);

    Route::patch('/reservations/{id}/no-show', [ReservationController::class, 'markNoShow']);

    Route::get('/restaurants/{restaurantId}/reservations', [ReservationController::class, 'restaurantReservations']);

});

Route::middleware(['auth:sanctum', 'admin'])->get('/admin/test', function () {
    return response()->json([
        'message' => 'Admin access granted successfully.'
    ]);
});


Route::get(
    '/restaurants/{restaurantId}/menu',
    [MenuItemController::class, 'restaurantMenu']
);

Route::middleware(['auth:sanctum', 'admin'])->post(
    '/menu-items',
    [MenuItemController::class, 'store']
);

Route::middleware(['auth:sanctum', 'admin'])->patch(
    '/menu-items/{id}',
    [MenuItemController::class, 'update']
);

// Same handler as PATCH above, but reachable via POST so a real multipart
// image upload works reliably (mirrors the restaurant cover photo update).
Route::middleware(['auth:sanctum', 'admin'])->post(
    '/menu-items/{id}',
    [MenuItemController::class, 'update']
);

Route::middleware(['auth:sanctum', 'admin'])->delete(
    '/menu-items/{id}',
    [MenuItemController::class, 'destroy']
);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/reviews', [ReviewController::class, 'store']);

});

Route::get('/restaurants/{restaurantId}/reviews', [ReviewController::class, 'restaurantReviews']);

Route::get('/restaurants/{restaurantId}/available-tables', [ReservationController::class, 'availableTables']);

Route::middleware(['auth:sanctum', 'admin'])->get(
    '/admin/restaurants/{restaurantId}/profits',
    [ReservationController::class, 'restaurantProfits']
);


Route::middleware('auth:sanctum')->group(function () {

    Route::get('/notifications', [NotificationController::class, 'index']);

    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);

    Route::post('/notifications', [NotificationController::class, 'store']);

    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

});


Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    Route::get('/admin/users', [AdminUserController::class, 'index']);

    Route::patch('/admin/users/{id}/block', [AdminUserController::class, 'block']);

    Route::patch('/admin/users/{id}/unblock', [AdminUserController::class, 'unblock']);

});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin/reports')->group(function () {

    Route::get('/restaurant-activity', [AdminReportController::class, 'restaurantActivity']);

    Route::get('/daily-customers', [AdminReportController::class, 'dailyCustomers']);

    Route::get('/daily-revenue', [AdminReportController::class, 'dailyRevenue']);

    Route::get('/top-customers', [AdminReportController::class, 'topCustomers']);

    Route::get('/top-menu-items', [AdminReportController::class, 'topMenuItems']);

    Route::post('/monthly/run', [AdminReportController::class, 'runMonthlyReport']);

});

Route::get('/restaurants', [RestaurantController::class, 'index']);

Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);

// POST (not PATCH) so a real multipart image upload works reliably.
Route::middleware(['auth:sanctum', 'admin'])->post('/admin/restaurants/{id}', [RestaurantController::class, 'update']);

// Single store() branched by role (admin vs restaurant manager) - see CategoryController.
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/categories', [CategoryController::class, 'store']);

    Route::patch('/categories/{id}', [CategoryController::class, 'update']);

    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

});
