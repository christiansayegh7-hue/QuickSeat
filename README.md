# QuickSeat

QuickSeat is a full-stack restaurant reservation platform. Customers browse restaurants, check table availability in real time, and book a table (optionally pre-ordering dishes). Restaurant owners manage their own restaurant, menu, tables and reservations. Admins oversee the whole platform.

- **Backend**: Laravel 13 (PHP 8.3), Laravel Sanctum for token-based auth, SQLite
- **Frontend**: React 19 + Vite + React Router + Tailwind CSS v4
- **API docs**: OpenAPI/Swagger UI, served at `/documentation` once the backend is running

## Who uses it, and how

### Customers
- Browse restaurants (cuisine, price range, opening hours, live "full/available" status).
- Pick a date, time and party size, see which tables are actually free for that slot, and see each table's location (e.g. "Near the window", "Outdoor") before booking.
- Optionally pre-order menu items with the reservation.
- View their reservation history and cancel an upcoming reservation.
- Leave a review (food/service/cleanliness) for a restaurant they've visited.
- Get in-app notifications (reservation confirmations, etc.).

### Restaurant managers
- Apply for a restaurant account at registration (reviewed and approved by an admin).
- Manage their own restaurant's profile: name, description, cover photo, capacity, opening hours.
- Manage tables (add/edit/delete, set each table's capacity and location) and the menu (categories + dishes, with photos and availability toggle).
- View all reservations made at their restaurant, add dishes to an existing reservation, and cancel a customer's reservation if needed.

### Admins
- Approve or reject restaurant applications.
- Manage users (block/unblock accounts).
- View platform-wide reports: restaurant activity, daily customers/revenue, top customers, top menu items.
- Manage any restaurant, table, category or menu item directly.

### Account security
Registration requires verifying your email first: a 6-digit code is emailed to you, you confirm it, then the account is created. Passwords must be at least 8 characters with upper/lower case, a number and a symbol.

## Running it locally

### Requirements
PHP 8.3+, Composer, Node.js 18+, npm.

### 1. Backend (Laravel API)

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve
```

The API runs at `http://127.0.0.1:8000`. Swagger docs are at `http://127.0.0.1:8000/documentation`.

By default `.env` has `MAIL_MAILER=log`, so verification emails are written to `storage/logs/laravel.log` instead of actually being sent - open that file to read the OTP code while testing registration. To send real emails, set `MAIL_MAILER=smtp` with real SMTP credentials (e.g. a Gmail account + [App Password](https://myaccount.google.com/apppasswords)).

### 2. Frontend (React)

```bash
cd restaurant-frontend
npm install
npm run dev
```

The site runs at `http://localhost:5173`.

### Demo accounts (after `php artisan migrate --seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@gmail.com | P@ssword123 |
| Restaurant manager (La Maison) | manager@gmail.com | P@ssword123 |
| Customer | rawan@example.com | P@ssword123 |
| Customer | omar@example.com | P@ssword123 |

## Deploying

- `Procfile` — for a buildpack-based host that natively detects PHP (e.g. Railway).
- `Dockerfile` — for a Docker-based host (e.g. Render, Fly.io). Runs migrations and links storage on every boot.

Either way, set the same environment variables shown in `.env.example`, generate a fresh `APP_KEY` (`php artisan key:generate --show`), and set `APP_DEBUG=false` for production.
