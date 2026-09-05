<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// On the 1st of every month at 01:00, email + notify every restaurant
// about its previous month's reservations, customers and revenue.
Schedule::command('reports:monthly')->monthlyOn(1, '01:00');
