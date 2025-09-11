#!/bin/sh

# Simple script to import terms from CSV to database

set -e

CSV_FILE="/app/files/terms.csv"
TEMP_SQL="/tmp/import-terms.sql"

# Check if CSV file exists
if [ ! -f "$CSV_FILE" ]; then
    echo "⚠️  CSV file not found: $CSV_FILE"
    exit 0
fi

echo "📋 Importing terms from CSV..."

# Create temporary SQL file
echo "DELETE FROM terms;" > "$TEMP_SQL"
echo "LOAD DATA LOCAL INFILE '$CSV_FILE' INTO TABLE terms FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"' LINES TERMINATED BY '\n' (term, definition);" >> "$TEMP_SQL"

# Import data with SSL disabled
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" --skip-ssl "$DB_NAME" < "$TEMP_SQL"

# Clean up
rm "$TEMP_SQL"

echo "✅ Terms imported successfully"