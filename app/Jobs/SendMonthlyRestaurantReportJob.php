<?php

namespace App\Jobs;

use App\Models\Notification as AppNotification;
use App\Models\Restaurant;
use App\Models\User;
use App\Notifications\MonthlyRestaurantReport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Notification;

class SendMonthlyRestaurantReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Restaurant $restaurant,
        public array $stats,
        public string $periodLabel
    ) {
    }

    public function handle(): void
    {
        $recipients = $this->recipients();

        if ($recipients->isEmpty()) {
            return;
        }

        // Email
        Notification::send($recipients, new MonthlyRestaurantReport($this->restaurant, $this->stats, $this->periodLabel));

        // In-app notification (the app's own notifications table/UI)
        $message = sprintf(
            '%s report for %s: %d reservations, %d customers, $%s in revenue.',
            $this->periodLabel,
            $this->restaurant->name,
            $this->stats['reservations_count'],
            $this->stats['customers_count'],
            $this->stats['total_revenue']
        );

        foreach ($recipients as $recipient) {
            AppNotification::create([
                'user_id' => $recipient->id,
                'reservation_id' => null,
                'message' => $message,
                'type' => 'monthly_report',
                'is_read' => false,
            ]);
        }
    }

    /**
     * The restaurant's manager receives the report; if it has none, all
     * admins are notified instead so the report is never silently dropped.
     */
    protected function recipients()
    {
        if ($this->restaurant->manager) {
            return collect([$this->restaurant->manager]);
        }

        return User::where('role', 'admin')->get();
    }
}
