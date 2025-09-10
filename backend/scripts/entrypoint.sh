#!/bin/sh

# Simple entrypoint for backend service

set -e

echo "🚀 Starting Music Library Backend..."

# Run database initialization directly using SQL file
if [ "$INIT_DB" = "true" ]; then
    echo "📋 Initializing database..."
    
    # Wait for database to be ready
    echo "⏳ Waiting for database..."
    until nc -z "$DB_HOST" "$DB_PORT"; do
        sleep 1
    done
    echo "✅ Database is ready"
    
    # Initialize database tables using the SQL file directly
    echo "🔧 Creating tables..."
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < /app/database/init.sql
    echo "✅ Tables created"
    
    # Import terms from CSV
    echo "📚 Importing terms from CSV..."
    /app/scripts/import-terms.sh
    echo "✅ Terms imported"
fi

# Start the main application
echo "🎵 Starting application..."
exec npm start