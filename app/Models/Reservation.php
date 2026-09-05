<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'restaurant_id',
        'table_id',
        'reservation_date',
        'start_time',
        'end_time',
        'number_of_guests',
        'reservation_method',
        'notes',
        'status',
        'reservation_code',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    public function items()
    {
        return $this->hasMany(ReservationItem::class);
    }

    public function Notifications() 
    {
        return $this->hasMany(Notification::class);
    }
}