<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Swagger UI for the API - reads the hand-authored OpenAPI spec served
// statically from public/docs/openapi.json (no swagger package installed).
Route::get('/documentation', function () {
    return view('docs');
});
