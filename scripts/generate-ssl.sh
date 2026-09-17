#!/bin/bash
# Self-signed SSL for local/dev — replace with Let's Encrypt for production
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=ChartinkTracker/CN=localhost"
echo "✅ Self-signed SSL generated in nginx/ssl/"
echo "   For production use Let's Encrypt:"
echo "   certbot certonly --webroot -w /var/www/certbot -d YOUR_DOMAIN"
