<?php

namespace App\Console\Commands;

use App\Jobs\SendMonthlyRestaurantReportJob;
use App\Models\Reservation;
use App\Models\Restaurant;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendMonthlyRestaurantReports extends Command
{
    /**
     * php artisan reports:monthly            -> reports on last month, jobs queued
     * php artisan reports:monthly --sync     -> jobs run immediately (no queue worker needed)
     * php artisan reports:monthly --month=8 --year=2026
     */
    protected $signature = 'reports:monthly
                            {--month= : Month to report on (1-12), defaults to last month}
                            {--year= : Year to report on, defaults to last month\'s year}
                            {--sync : Run the notification jobs immediately instead of queueing them}';

    protected $description = 'Send each restaurant its monthly reservations / customers / revenue report';

    public function handle(): int
    {
        $period = $this->option('month') && $this->option('year')
            ? Carbon::createFromDate((int) $this->option('year'), (int) $this->option('month'), 1)
            : now()->subMonthNoOverflow();

        $start = $period->copy()->startOfMonth()->toDateString();
        $end = $period->copy()->endOfMonth()->toDateString();
        $periodLabel = $period->format('F Y');

        $restaurants = Restaurant::all();

        $reservationStats = Reservation::select(
                'restaurant_id',
                DB::raw('COUNT(*) as reservations_count'),
                DB::raw('COUNT(DISTINCT user_id) as customers_count')
            )
            ->where('status', '!=', 'cancelled')
            ->whereBetween('reservation_date', [$start, $end])
            ->groupBy('restaurant_id')
            ->get()
            ->keyBy('restaurant_id');

        $revenueStats = DB::table('reservations')
            ->join('reservation_items', 'reservation_items.reservation_id', '=', 'reservations.id')
            ->select('reservations.restaurant_id', DB::raw('SUM(reservation_items.subtotal) as total_revenue'))
            ->where('reservations.status', 'confirmed')
            ->whereBetween('reservations.reservation_date', [$start, $end])
            ->groupBy('reservations.restaurant_id')
            ->get()
            ->keyBy('restaurant_id');

        $sync = (bool) $this->option('sync');
        $count = 0;

        foreach ($restaurants as $restaurant) {
            $stats = [
                'reservations_count' => (int) ($reservationStats->get($restaurant->id)->reservations_count ?? 0),
                'customers_count' => (int) ($reservationStats->get($restaurant->id)->customers_count ?? 0),
                'total_revenue' => number_format((float) ($revenueStats->get($restaurant->id)->total_revenue ?? 0), 2, '.', ''),
            ];

            $job = new SendMonthlyRestaurantReportJob($restaurant, $stats, $periodLabel);

            if ($sync) {
                dispatch_sync($job);
            } else {
                dispatch($job);
            }

            $count++;
            $this->info("Queued {$periodLabel} report for {$restaurant->name}: {$stats['reservations_count']} reservations, {$stats['customers_count']} customers, \${$stats['total_revenue']} revenue.");
        }

        $this->info("Done. {$count} restaurant(s) processed for {$periodLabel}.");

        return self::SUCCESS;
    }
}
