# DEPLOYMENT — DRIP TO YOU Bali

Self-hosted VPS deployment guide. This app does NOT use Vercel.

---

## Prerequisites

- Ubuntu 22.04+ VPS (min 1 vCPU, 1GB RAM)
- Node.js 20+ (via nvm recommended)
- MySQL 8.0+
- Nginx
- PM2 (`npm install -g pm2`)
- Domain pointing to your VPS IP

---

## 1. Database Setup

```bash
mysql -u root -p
CREATE DATABASE dripstoyou CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'drip'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON dripstoyou.* TO 'drip'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 2. Environment Variables

```bash
cp .env.example .env
nano .env
```

Fill in all values. Generate secrets:

```bash
# SESSION_SECRET (must be ≥ 32 chars)
openssl rand -base64 32

# FIELD_ENCRYPTION_KEY (must be exactly 64 hex chars = 32 bytes)
openssl rand -hex 32
```

**Required env vars:**
```
DATABASE_URL="mysql://drip:StrongPassword123!@localhost:3306/dripstoyou"
SESSION_SECRET="<32+ char random string>"
FIELD_ENCRYPTION_KEY="<64 char hex string>"
WHATSAPP_NUMBER="6281200000000"
NEXT_PUBLIC_WHATSAPP_NUMBER="6281200000000"
NEXT_PUBLIC_APP_URL="https://dripstoyou.com"
NODE_ENV="production"
```

---

## 3. Install & Build

```bash
# Clone / upload project to /var/www/dripstoyou
cd /var/www/dripstoyou

npm install --production=false
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run build
```

---

## 4. PM2 Process Manager

```bash
# Start with PM2
pm2 start npm --name "dripstoyou" -- start

# Save PM2 process list
pm2 save

# Enable PM2 on reboot
pm2 startup
# Run the command it outputs (e.g. sudo env PATH=... pm2 startup systemd ...)
```

---

## 5. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/dripstoyou.com
server {
    listen 80;
    server_name dripstoyou.com www.dripstoyou.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dripstoyou.com www.dripstoyou.com;

    ssl_certificate     /etc/letsencrypt/live/dripstoyou.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dripstoyou.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Admin panel — restrict by IP if possible
    location /admin {
        # Uncomment and set your IP to restrict admin access:
        # allow 1.2.3.4;
        # deny all;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/dripstoyou.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 6. SSL with Certbot

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d dripstoyou.com -d www.dripstoyou.com
```

---

## 7. Updating the App

```bash
cd /var/www/dripstoyou
git pull   # or upload new files

npm install
npx prisma generate
npx prisma migrate deploy
npm run build

pm2 restart dripstoyou
```

---

## First Login

After seeding, login at:
- URL: `https://dripstoyou.com/admin/login`
- Email: `admin@dripstoyou.com`
- Password: `AdminDrip2025!`

**Change the password immediately after first login.**

---

## Ports

- Next.js: `3000` (internal only, proxied by Nginx)
- MySQL: `3306` (localhost only, never expose to internet)

Firewall:
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP (redirects to HTTPS)
ufw allow 443   # HTTPS
ufw enable
```
