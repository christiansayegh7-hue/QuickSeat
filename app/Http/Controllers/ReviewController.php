<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Add Review
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',

            'rating_food' => 'required|integer|min:1|max:5',
            'rating_service' => 'required|integer|min:1|max:5',
            'rating_cleanliness' => 'required|integer|min:1|max:5',

            'comment' => 'nullable|string',
        ]);

        $user = Auth::user();

        /*
        |--------------------------------------------------------------------------
        | Prevent multiple reviews for the same restaurant
        |--------------------------------------------------------------------------
        */

        $alreadyReviewed = Review::where('user_id', $user->id)
            ->where('restaurant_id', $validated['restaurant_id'])
            ->exists();

        if ($alreadyReviewed) {
            return response()->json([
                'message' => 'You have already reviewed this restaurant.'
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | Create Review
        |--------------------------------------------------------------------------
        */

        $review = Review::create([
            'user_id' => $user->id,
            'restaurant_id' => $validated['restaurant_id'],
            'rating_food' => $validated['rating_food'],
            'rating_service' => $validated['rating_service'],
            'rating_cleanliness' => $validated['rating_cleanliness'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return response()->json([
            'message' => 'Review added successfully.',
            'review' => $review->load('user', 'restaurant')
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | Get Restaurant Reviews
    |--------------------------------------------------------------------------
    */

    public function restaurantReviews($restaurantId)
    {
        $restaurant = Restaurant::find($restaurantId);

        if (!$restaurant) {
            return response()->json([
                'message' => 'Restaurant not found.'
            ], 404);
        }

        $reviews = Review::where('restaurant_id', $restaurantId)
            ->with('user')
            ->latest()
            ->get();

        return response()->json([
            'restaurant' => $restaurant->name,
            'reviews_count' => $reviews->count(),
            'reviews' => $reviews
        ]);
    }
}