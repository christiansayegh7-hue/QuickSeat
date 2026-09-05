<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MenuItem;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\Table;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Written with firstOrCreate/updateOrCreate so it is safe to re-run
     * without wiping out any reservations already made against this data.
     */
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@olive.com'],
            [
                'name' => 'Admin User',
                'password' => 'password',
                'role' => 'admin',
            ]
        );

        $customer = User::updateOrCreate(
            ['email' => 'rawan@example.com'],
            [
                'name' => 'Rawan Ahmad',
                'password' => 'password',
                'role' => 'customer',
            ]
        );

        $customer2 = User::updateOrCreate(
            ['email' => 'omar@example.com'],
            [
                'name' => 'Omar Al-Zoubi',
                'password' => 'password',
                'role' => 'customer',
            ]
        );

        $restaurants = [
            [
                'name' => 'La Maison',
                'address' => 'Downtown, Main Street, 123',
                'phone' => '+962 79 123 4567',
                'email' => 'contact@lamaison.example',
                'restaurant_type' => 'Italian',
                'price_range' => '$$',
                'opening_hours' => '11:00 AM - 11:00 PM',
                'about' => 'La Maison brings the taste of Italy to your table. Enjoy a warm atmosphere, friendly service, and delicious homemade dishes.',
                'categories' => [
                    'Pizza' => [
                        ['name' => 'Margherita Pizza', 'price' => 12.00, 'description' => 'Classic tomato, mozzarella and basil.'],
                        ['name' => 'Quattro Formaggi', 'price' => 14.50, 'description' => 'Four-cheese blend on a crispy crust.'],
                    ],
                    'Pasta' => [
                        ['name' => 'Pasta Alfredo', 'price' => 14.00, 'description' => 'Creamy parmesan sauce with fettuccine.'],
                        ['name' => 'Spaghetti Bolognese', 'price' => 13.50, 'description' => 'Slow cooked beef ragu.'],
                    ],
                    'Dessert' => [
                        ['name' => 'Tiramisu', 'price' => 8.00, 'description' => 'Espresso soaked ladyfingers with mascarpone cream.'],
                    ],
                ],
            ],
            [
                'name' => 'Green Delight',
                'address' => 'City Center, Al Baraka Street, 45',
                'phone' => '+962 79 222 1122',
                'email' => 'contact@greendelight.example',
                'restaurant_type' => 'Healthy',
                'price_range' => '$$',
                'opening_hours' => '08:00 AM - 10:00 PM',
                'about' => 'Fresh, healthy and colorful dishes made from locally sourced ingredients, for a guilt-free dining experience.',
                'categories' => [
                    'Salads' => [
                        ['name' => 'Quinoa Salad', 'price' => 9.50, 'description' => 'Quinoa, cherry tomatoes, cucumber and feta.'],
                        ['name' => 'Avocado Bowl', 'price' => 10.50, 'description' => 'Avocado, chickpeas, greens and tahini dressing.'],
                    ],
                    'Smoothies' => [
                        ['name' => 'Green Detox', 'price' => 6.00, 'description' => 'Spinach, apple, ginger and lemon.'],
                    ],
                ],
            ],
            [
                'name' => 'The Grill House',
                'address' => 'West Side, Al Madina Road, 78',
                'phone' => '+962 79 333 4455',
                'email' => 'contact@grillhouse.example',
                'restaurant_type' => 'Steakhouse',
                'price_range' => '$$$',
                'opening_hours' => '12:00 PM - 12:00 AM',
                'about' => 'Premium cuts, char-grilled to perfection. A must for steak and BBQ lovers.',
                'categories' => [
                    'Starters' => [
                        ['name' => 'Grilled Shrimp Skewers', 'price' => 11.00, 'description' => 'Char-grilled shrimp with garlic butter.'],
                    ],
                    'Main Course' => [
                        ['name' => 'Grilled Salmon', 'price' => 18.00, 'description' => 'Served with seasonal vegetables.'],
                        ['name' => 'Ribeye Steak', 'price' => 26.00, 'description' => '300g ribeye, grilled to your liking.'],
                    ],
                ],
            ],
            [
                'name' => 'Sea Breeze',
                'address' => 'Beach Area, Corniche Road, 9',
                'phone' => '+962 79 444 7788',
                'email' => 'contact@seabreeze.example',
                'restaurant_type' => 'Seafood',
                'price_range' => '$$',
                'opening_hours' => '10:00 AM - 11:00 PM',
                'about' => 'Fresh catch of the day served with a stunning sea view. Seafood the way it should be.',
                'categories' => [
                    'Seafood' => [
                        ['name' => 'Grilled Sea Bass', 'price' => 17.50, 'description' => 'Whole grilled sea bass with lemon herb butter.'],
                        ['name' => 'Shrimp Pasta', 'price' => 15.00, 'description' => 'Linguine with shrimp in a garlic white wine sauce.'],
                    ],
                    'Dessert' => [
                        ['name' => 'Lemon Tart', 'price' => 7.00, 'description' => 'Tangy lemon curd on a buttery crust.'],
                    ],
                ],
            ],
        ];

        $reviewers = [$customer, $customer2, $admin];
        $sampleComments = [
            'Amazing food and great service, will definitely come back!',
            'Cozy atmosphere and delicious homemade dishes.',
            'The staff was very friendly and attentive.',
            'Loved the presentation and the flavors were on point.',
            'A bit noisy but the food made up for it.',
        ];

        foreach ($restaurants as $index => $data) {
            $restaurant = Restaurant::updateOrCreate(
                ['name' => $data['name']],
                [
                    'manager_id' => $admin->id,
                    'address' => $data['address'],
                    'phone' => $data['phone'],
                    'email' => $data['email'],
                    'restaurant_type' => $data['restaurant_type'],
                    'price_range' => $data['price_range'],
                    'opening_hours' => $data['opening_hours'],
                    'description' => $data['about'],
                ]
            );

            // Tables
            $capacities = [2, 2, 4, 4, 6, 8];
            foreach ($capacities as $i => $capacity) {
                Table::updateOrCreate(
                    [
                        'restaurant_id' => $restaurant->id,
                        'table_number' => $i + 1,
                    ],
                    [
                        'capacity' => $capacity,
                        'location' => $capacity >= 6 ? 'Hall' : ($i % 2 === 0 ? 'Window' : 'Patio'),
                        'status' => 'available',
                    ]
                );
            }

            // Categories + menu items
            $seed = $index * 97;
            foreach ($data['categories'] as $categoryName => $items) {
                $category = Category::updateOrCreate(
                    [
                        'restaurant_id' => $restaurant->id,
                        'name' => $categoryName,
                    ],
                    ['is_active' => true]
                );

                foreach ($items as $item) {
                    MenuItem::updateOrCreate(
                        [
                            'category_id' => $category->id,
                            'name' => $item['name'],
                        ],
                        [
                            'description' => $item['description'],
                            'price' => $item['price'],
                            'image' => 'https://picsum.photos/seed/' . urlencode($item['name']) . '/400/300',
                            'is_available' => true,
                        ]
                    );
                }
            }

            // Reviews
            foreach ($reviewers as $ri => $reviewer) {
                Review::updateOrCreate(
                    [
                        'restaurant_id' => $restaurant->id,
                        'user_id' => $reviewer->id,
                    ],
                    [
                        'rating_food' => rand(4, 5),
                        'rating_service' => rand(4, 5),
                        'rating_cleanliness' => rand(4, 5),
                        'comment' => $sampleComments[($seed + $ri) % count($sampleComments)],
                    ]
                );
            }

            // Reservations spread across last month, this month and today, so the
            // admin reports (daily revenue/customers, monthly report, top lists)
            // have real data to show instead of zeros.
            $this->seedReservations($restaurant, [$customer, $customer2]);
        }
    }

    private function seedReservations(Restaurant $restaurant, array $customers): void
    {
        $tables = Table::where('restaurant_id', $restaurant->id)->get();
        $menuItems = MenuItem::whereHas('category', fn ($q) => $q->where('restaurant_id', $restaurant->id))->get();

        if ($tables->isEmpty() || $menuItems->isEmpty()) {
            return;
        }

        // Negative offsets = last month / earlier this month, positive = upcoming.
        $dayOffsets = [-48, -42, -35, -28, -21, -14, -7, -3, -1, 0, 3, 7];

        foreach ($dayOffsets as $i => $offset) {
            $date = Carbon::now()->addDays($offset);
            $table = $tables[$i % $tables->count()];
            $customer = $customers[$i % count($customers)];
            $startHour = 12 + ($i % 8);
            $status = match (true) {
                $i % 9 === 0 => 'cancelled',
                $i % 6 === 0 => 'no_show',
                default => 'confirmed',
            };

            $reservation = Reservation::updateOrCreate(
                ['reservation_code' => "RES-SEED-{$restaurant->id}-" . ($i + 1)],
                [
                    'user_id' => $customer->id,
                    'restaurant_id' => $restaurant->id,
                    'table_id' => $table->id,
                    'reservation_date' => $date->toDateString(),
                    'start_time' => sprintf('%02d:00', $startHour),
                    'end_time' => sprintf('%02d:00', $startHour + 2),
                    'number_of_guests' => min($table->capacity, rand(1, 4)),
                    'reservation_method' => 'website',
                    'status' => $status,
                ]
            );

            $reservation->items()->delete();
            $itemCount = min(2, $menuItems->count());
            foreach ($menuItems->random($itemCount) as $menuItem) {
                $quantity = rand(1, 3);
                $reservation->items()->create([
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $quantity,
                    'unit_price' => $menuItem->price,
                    'subtotal' => $menuItem->price * $quantity,
                ]);
            }
        }
    }
}
