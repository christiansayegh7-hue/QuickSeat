web: mkdir -p database && touch database/database.sqlite && php artisan migrate --force && (test -e public/storage || php artisan storage:link) && php artisan serve --host=0.0.0.0 --port=$PORT
