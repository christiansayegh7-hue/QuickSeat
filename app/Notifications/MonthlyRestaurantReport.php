<?php

namespace App\Notifications;

use App\Models\Restaurant;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MonthlyRestaurantReport extends Notification
{
    use Queueable;

    public function __construct(
        public Restaurant $restaurant,
        public array $stats,
        public string $periodLabel
    ) {
    }

    /**
     * Only the mail channel is used here - the app has its own custom
     * in-app notifications table (see App\Models\Notification), which is
     * written to separately by the job that dispatches this notification.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Monthly Report - {$this->restaurant->name} ({$this->periodLabel})")
            ->greeting("Hello {$notifiable->name},")
            ->line("Here is the performance summary for **{$this->restaurant->name}** during {$this->periodLabel}.")
            ->line("Reservations: {$this->stats['reservations_count']}")
            ->line("Customers served: {$this->stats['customers_count']}")
            ->line("Total revenue: \${$this->stats['total_revenue']}")
            ->line('Thank you for using QuickSeat.');
    }
}
