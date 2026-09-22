FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
        git unzip libsqlite3-dev libzip-dev \
    && docker-php-ext-install pdo pdo_sqlite zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8080

# Idempotent boot chain (safe across restarts/redeploys):
# - migrate tracks its own state, so re-running is a no-op after the first boot
# - the sqlite file is (re)created only if missing
# - storage:link is skipped if the symlink already exists (--force doesn't
#   reliably recreate it, confirmed while testing this locally)
CMD mkdir -p database && touch database/database.sqlite \
    && php artisan migrate --force \
    && (test -e public/storage || php artisan storage:link) \
    && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
