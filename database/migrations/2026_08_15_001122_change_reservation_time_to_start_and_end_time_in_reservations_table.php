<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
        });

        DB::statement('
            UPDATE reservations
            SET start_time = reservation_time
            WHERE reservation_time IS NOT NULL
        ');

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn('reservation_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->time('reservation_time')->nullable();
        });

        DB::statement('
            UPDATE reservations
            SET reservation_time = start_time
            WHERE start_time IS NOT NULL
        ');

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn('start_time');
            $table->dropColumn('end_time');
        });
    }
};