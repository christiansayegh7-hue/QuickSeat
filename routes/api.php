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
use App\Http\Controllers\AdminRestaurantApplicationController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ManagerController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\TableController;


Route::post('/register', [AuthController::class, 'register']);

// Email verification for registration: send a 6-digit code, then verify it -
// register() itself checks server-side that the email was recently verified,
// so the code never needs to be re-sent along with the registration form.
Route::post('/email/otp/send', [AuthController::class, 'sendEmailOtp'])->middleware('throttle:3,1');
Route::post('/email/otp/verify', [AuthController::class, 'verifyEmailOtp'])->middleware('throttle:10,1');

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

Route::middleware('auth:sanctum')->patch('/profile/password', [AuthController::class, 'changePassword']);

// The customer is identified from the Sanctum token on every one of these,
// never from a client-supplied user_id.
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/reservations', [ReservationController::class, 'store']);

    Route::get('/reservations/my', [ReservationController::class, 'myReservations']);

    Route::patch('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);

    // Restaurant-manager-only in practice (ownership checked inside the
    // controller, same convention as /menu-items, /categories, /tables).
    Route::post('/reservations/{id}/items', [ReservationController::class, 'addItems']);

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

// admin-vs-restaurant-manager ownership is enforced inside the controller
// (same pattern as CategoryController), so these only need auth:sanctum.
Route::middleware('auth:sanctum')->post(
    '/menu-items',
    [MenuItemController::class, 'store']
);

Route::middleware('auth:sanctum')->patch(
    '/menu-items/{id}',
    [MenuItemController::class, 'update']
);

// Same handler as PATCH above, but reachable via POST so a real multipart
// image upload works reliably (mirrors the restaurant cover photo update).
Route::middleware('auth:sanctum')->post(
    '/menu-items/{id}',
    [MenuItemController::class, 'update']
);

Route::middleware('auth:sanctum')->delete(
    '/menu-items/{id}',
    [MenuItemController::class, 'destroy']
);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/reviews', [ReviewController::class, 'store']);

});

Route::get('/restaurants/{restaurantId}/reviews', [ReviewController::class, 'restaurantReviews']);

Route::get('/restaurants/{restaurantId}/available-tables', [ReservationController::class, 'availableTables']);

Route::get('/restaurants/{restaurantId}/available-start-times', [ReservationController::class, 'availableStartTimes']);

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

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin/restaurant-applications')->group(function () {

    Route::get('/', [AdminRestaurantApplicationController::class, 'index']);

    Route::patch('/{id}/approve', [AdminRestaurantApplicationController::class, 'approve']);

    Route::patch('/{id}/reject', [AdminRestaurantApplicationController::class, 'reject']);

});

// A restaurant manager only ever operates on THEIR OWN restaurant - it is
// resolved server-side from the token, never from a route/body parameter.
Route::middleware(['auth:sanctum', 'restaurant'])->prefix('manager')->group(function () {

    Route::get('/restaurant', [ManagerController::class, 'restaurant']);

    // POST (not PATCH) so a real multipart image upload works reliably.
    Route::post('/restaurant', [ManagerController::class, 'updateRestaurant']);

    Route::get('/reservations', [ManagerController::class, 'reservations']);

});

// admin-vs-restaurant-manager ownership is enforced inside the controller
// (same pattern as CategoryController), so these only need auth:sanctum.
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/tables', [TableController::class, 'store']);

    Route::patch('/tables/{id}', [TableController::class, 'update']);

    Route::delete('/tables/{id}', [TableController::class, 'destroy']);

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
