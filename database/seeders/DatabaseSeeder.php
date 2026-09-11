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
        // Renamed from @olive.com to @gmail.com - update the existing rows in
        // place first so re-running this seeder doesn't create duplicate
        // admin/manager accounts (and orphan the manager_id/manager_id FKs
        // pointing at the old rows).
        User::where('email', 'admin@olive.com')->update(['email' => 'admin@gmail.com']);
        User::where('email', 'manager@olive.com')->update(['email' => 'manager@gmail.com']);

        $admin = User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Admin User',
                'password' => 'P@ssword123',
                'role' => 'admin',
            ]
        );

        $customer = User::updateOrCreate(
            ['email' => 'rawan@example.com'],
            [
                'name' => 'Rawan Ahmad',
                'password' => 'P@ssword123',
                'role' => 'customer',
            ]
        );

        $customer2 = User::updateOrCreate(
            ['email' => 'omar@example.com'],
            [
                'name' => 'Omar Al-Zoubi',
                'password' => 'P@ssword123',
                'role' => 'customer',
            ]
        );

        // A restaurant-manager account (role = "restaurant"), so the
        // CategoryController's manager branch has a real user to log in as.
        // It is assigned as the manager of La Maison below.
        $restaurantManager = User::updateOrCreate(
            ['email' => 'manager@gmail.com'],
            [
                'name' => 'La Maison Manager',
                'password' => 'P@ssword123',
                'role' => 'restaurant',
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
                'opening_time' => '11:00',
                'closing_time' => '23:00',
                'max_capacity' => 30,
                'about' => 'La Maison brings the taste of Italy to your table. Enjoy a warm atmosphere, friendly service, and delicious homemade dishes.',
                'categories' => [
                    'Starters' => [
                        ['name' => 'Bruschetta al Pomodoro', 'price' => 7.00, 'description' => 'Toasted bread with tomato, garlic and basil.'],
                        ['name' => 'Caprese Salad', 'price' => 8.50, 'description' => 'Fresh mozzarella, tomato and basil, olive oil drizzle.'],
                        ['name' => 'Arancini', 'price' => 7.50, 'description' => 'Crispy risotto balls stuffed with mozzarella.'],
                    ],
                    'Pizza' => [
                        ['name' => 'Margherita Pizza', 'price' => 12.00, 'description' => 'Classic tomato, mozzarella and basil.'],
                        ['name' => 'Quattro Formaggi', 'price' => 14.50, 'description' => 'Four-cheese blend on a crispy crust.'],
                        ['name' => 'Pepperoni Pizza', 'price' => 13.50, 'description' => 'Loaded with spicy pepperoni and mozzarella.'],
                        ['name' => 'Prosciutto e Funghi', 'price' => 15.00, 'description' => 'Ham, mushrooms and mozzarella on a thin crust.'],
                    ],
                    'Pasta' => [
                        ['name' => 'Pasta Alfredo', 'price' => 14.00, 'description' => 'Creamy parmesan sauce with fettuccine.'],
                        ['name' => 'Spaghetti Bolognese', 'price' => 13.50, 'description' => 'Slow cooked beef ragu.'],
                        ['name' => 'Penne Arrabbiata', 'price' => 12.50, 'description' => 'Spicy tomato sauce with garlic and chili.'],
                        ['name' => 'Lasagna della Casa', 'price' => 15.50, 'description' => 'Layered pasta with beef ragu and bechamel.'],
                    ],
                    'Dessert' => [
                        ['name' => 'Tiramisu', 'price' => 8.00, 'description' => 'Espresso soaked ladyfingers with mascarpone cream.'],
                        ['name' => 'Panna Cotta', 'price' => 7.00, 'description' => 'Silky vanilla cream with berry compote.'],
                    ],
                    'Drinks' => [
                        ['name' => 'Italian Soda', 'price' => 4.00, 'description' => 'Sparkling water with fruit syrup.'],
                        ['name' => 'Espresso', 'price' => 3.00, 'description' => 'Rich and bold Italian espresso.'],
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
                'opening_time' => '08:00',
                'closing_time' => '22:00',
                'max_capacity' => 40,
                'about' => 'Fresh, healthy and colorful dishes made from locally sourced ingredients, for a guilt-free dining experience.',
                'categories' => [
                    'Salads' => [
                        ['name' => 'Quinoa Salad', 'price' => 9.50, 'description' => 'Quinoa, cherry tomatoes, cucumber and feta.'],
                        ['name' => 'Avocado Bowl', 'price' => 10.50, 'description' => 'Avocado, chickpeas, greens and tahini dressing.'],
                        ['name' => 'Kale Caesar Salad', 'price' => 9.00, 'description' => 'Kale, parmesan, croutons, light Caesar dressing.'],
                        ['name' => 'Roasted Beet Salad', 'price' => 9.50, 'description' => 'Roasted beets, walnuts, goat cheese, arugula.'],
                    ],
                    'Bowls' => [
                        ['name' => 'Grilled Chicken Bowl', 'price' => 11.50, 'description' => 'Grilled chicken, brown rice, greens, tahini sauce.'],
                        ['name' => 'Falafel Power Bowl', 'price' => 10.00, 'description' => 'Falafel, hummus, greens, pickled vegetables.'],
                        ['name' => 'Salmon Poke Bowl', 'price' => 13.00, 'description' => 'Fresh salmon, rice, edamame, avocado, sesame.'],
                    ],
                    'Smoothies' => [
                        ['name' => 'Green Detox', 'price' => 6.00, 'description' => 'Spinach, apple, ginger and lemon.'],
                        ['name' => 'Berry Blast', 'price' => 6.50, 'description' => 'Mixed berries, banana and almond milk.'],
                        ['name' => 'Tropical Mango', 'price' => 6.50, 'description' => 'Mango, pineapple and coconut water.'],
                    ],
                    'Dessert' => [
                        ['name' => 'Chia Pudding', 'price' => 5.50, 'description' => 'Chia seeds, coconut milk, fresh fruit.'],
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
                'opening_time' => '12:00',
                'closing_time' => '00:00',
                'max_capacity' => 50,
                'about' => 'Premium cuts, char-grilled to perfection. A must for steak and BBQ lovers.',
                'categories' => [
                    'Starters' => [
                        ['name' => 'Grilled Shrimp Skewers', 'price' => 11.00, 'description' => 'Char-grilled shrimp with garlic butter.'],
                        ['name' => 'Loaded Potato Skins', 'price' => 8.50, 'description' => 'Crispy potato skins with cheddar and bacon.'],
                        ['name' => 'BBQ Chicken Wings', 'price' => 9.50, 'description' => 'Smoky wings tossed in house BBQ sauce.'],
                    ],
                    'Main Course' => [
                        ['name' => 'Grilled Salmon', 'price' => 18.00, 'description' => 'Served with seasonal vegetables.'],
                        ['name' => 'Ribeye Steak', 'price' => 26.00, 'description' => '300g ribeye, grilled to your liking.'],
                        ['name' => 'T-Bone Steak', 'price' => 29.00, 'description' => '400g T-bone, char-grilled with herb butter.'],
                        ['name' => 'BBQ Beef Ribs', 'price' => 24.00, 'description' => 'Slow-cooked ribs glazed in BBQ sauce.'],
                        ['name' => 'Smoked Beef Brisket', 'price' => 22.00, 'description' => '12-hour smoked brisket, served with fries.'],
                    ],
                    'Sides' => [
                        ['name' => 'Mac and Cheese', 'price' => 6.50, 'description' => 'Creamy three-cheese blend.'],
                        ['name' => 'Grilled Corn', 'price' => 5.00, 'description' => 'Charred corn with chili-lime butter.'],
                    ],
                    'Dessert' => [
                        ['name' => 'Chocolate Brownie', 'price' => 7.50, 'description' => 'Warm brownie with vanilla ice cream.'],
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
                'opening_time' => '10:00',
                'closing_time' => '23:00',
                'max_capacity' => 35,
                'about' => 'Fresh catch of the day served with a stunning sea view. Seafood the way it should be.',
                'categories' => [
                    'Starters' => [
                        ['name' => 'Calamari Fritti', 'price' => 9.50, 'description' => 'Crispy fried calamari with lemon aioli.'],
                        ['name' => 'Seafood Chowder', 'price' => 8.50, 'description' => 'Creamy chowder with shrimp, fish and clams.'],
                    ],
                    'Seafood' => [
                        ['name' => 'Grilled Sea Bass', 'price' => 17.50, 'description' => 'Whole grilled sea bass with lemon herb butter.'],
                        ['name' => 'Shrimp Pasta', 'price' => 15.00, 'description' => 'Linguine with shrimp in a garlic white wine sauce.'],
                        ['name' => 'Grilled Octopus', 'price' => 19.00, 'description' => 'Chargrilled octopus with olive oil and paprika.'],
                        ['name' => 'Seafood Platter', 'price' => 28.00, 'description' => 'Shrimp, calamari, fish and mussels for two.'],
                        ['name' => 'Lobster Risotto', 'price' => 24.00, 'description' => 'Creamy risotto with fresh lobster meat.'],
                    ],
                    'Dessert' => [
                        ['name' => 'Lemon Tart', 'price' => 7.00, 'description' => 'Tangy lemon curd on a buttery crust.'],
                        ['name' => 'Coconut Panna Cotta', 'price' => 7.50, 'description' => 'Silky coconut cream with mango coulis.'],
                    ],
                    'Drinks' => [
                        ['name' => 'Fresh Lemonade', 'price' => 4.00, 'description' => 'Freshly squeezed lemonade with mint.'],
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
                    'manager_id' => $data['name'] === 'La Maison' ? $restaurantManager->id : $admin->id,
                    'address' => $data['address'],
                    'phone' => $data['phone'],
                    'email' => $data['email'],
                    'restaurant_type' => $data['restaurant_type'],
                    'price_range' => $data['price_range'],
                    'opening_hours' => $data['opening_hours'],
                    'opening_time' => $data['opening_time'],
                    'closing_time' => $data['closing_time'],
                    'max_capacity' => $data['max_capacity'],
                    'description' => $data['about'],
                ]
            );

            // Tables - "location" is a short description of where the table
            // sits in the restaurant, shown to customers while booking.
            $capacities = [2, 2, 4, 4, 6, 8];
            $locations = ['Near the window', 'Indoor', 'Outdoor', 'Quiet area', 'Near the entrance', 'Upstairs'];
            foreach ($capacities as $i => $capacity) {
                Table::updateOrCreate(
                    [
                        'restaurant_id' => $restaurant->id,
                        'table_number' => $i + 1,
                    ],
                    [
                        'capacity' => $capacity,
                        'location' => $locations[$i % count($locations)],
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
