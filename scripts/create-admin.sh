#!/bin/bash
# Create initial admin user
# Usage: ./scripts/create-admin.sh admin@example.com yourpassword

EMAIL=${1:-"admin@chartink-tracker.com"}
PASSWORD=${2:-"Admin@123"}

HASH=$(docker exec cstt_backend node -e "
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('$PASSWORD', 10));
")

docker exec cstt_postgres psql -U cstt_user -d chartink_tracker -c "
INSERT INTO users (username, email, password, role)
VALUES ('admin', '$EMAIL', '$HASH', 'admin')
ON CONFLICT (email) DO UPDATE SET password = '$HASH';
"

echo "✅ Admin user created: $EMAIL"
