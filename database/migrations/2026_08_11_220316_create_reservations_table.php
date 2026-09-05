<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
        
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
        
            $table->foreignId('restaurant_id')
                  ->constrained('restaurants')
                  ->cascadeOnDelete();
        
            $table->date('reservation_date');
            $table->time('reservation_time');
            $table->integer('number_of_guests');
        
            $table->string('reservation_method')->nullable();
            $table->string('status')->default('pending');
        
            $table->foreignId('created_by_user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
        
            $table->string('reservation_code')->unique();
        
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
