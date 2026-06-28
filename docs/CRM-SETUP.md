# CRM Internal — Setup & Deployment

The CRM is an **additive layer** on the existing Drips To You stack. It does not
change the public website or the `/admin` panel. Architecture matches the rest of
the app: **PHP backend** (`php-api/crm/*`) does all DB/auth/encryption/audit work;
**Next.js** (`/crm/*` pages + `/api/crm/*` proxy routes) is the UI + thin proxy.

## What was added
- **DB:** `crm-database-migration.sql` (14 new tables + additive columns on
  `bookings` and `service_areas`).
- **PHP API:** `php-api/crm/` (auth, RBAC, 16 module endpoints, seed).
- **Next.js:** `src/app/crm/*` (pages), `src/app/api/crm/*` (proxy routes),
  `src/lib/crm-*.ts` (session/auth/permissions/fetch/format/status/whatsapp).

## Roles (RBAC)
| Role | Access |
|------|--------|
| OWNER | Everything incl. Dashboard, Staff, Audit |
| ADMIN | Booking, Pasien, Nurse, Layanan, Area, WhatsApp, Screening/Consent/Treatment |
| NURSE | Nurse portal, Screening, Consent, Treatment |
| FINANCE | Finance, Purchase Order |

The permission map is defined in **two mirrored places** (keep them in sync):
`php-api/crm/_crm.php → crmPermissions()` and `src/lib/crm-permissions.ts`.
PHP is the final trust boundary.

---

## Deployment steps (do once)

### 1. Run the database migration
1. Open **phpMyAdmin** (Rumahweb / cPanel) → database `rotw4785_dripstoyou`.
2. Open the **SQL** tab.
3. Paste the full contents of **`crm-database-migration.sql`** and click **Go**.

(Additive only — existing tables/columns are untouched. It runs once; re-running
the `ALTER TABLE bookings …` block will warn about duplicate columns, which is safe
to ignore.)

### 2. Upload the PHP API
Upload the new **`php-api/crm/`** folder to the cPanel host under the existing
`php-api/` directory (so it is reachable at `https://api.dripstoyou.com/crm/...`).
No changes to `php-api/config.php` are required — the CRM reuses
`FIELD_ENCRYPTION_KEY`, `SESSION_DURATION_HOURS`, and `SEED_SECRET`.

### 3. (Optional) Environment variable
The CRM session cookie reuses `SESSION_SECRET` automatically. To use a dedicated
secret, set in the Next.js env (Vercel dashboard / `.env`):
```
CRM_SESSION_SECRET=<64-char random hex>   # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
CRM_SESSION_DURATION_HOURS=8
```

### 4. Log in — ONE portal for everyone, no seed needed
There is a single login page at **`/login`** (e.g. `https://dripstoyou.com/login`)
for **all roles** — admin, nurse, finance, owner. The old `/admin/login` and
`/crm/login` now redirect there.

It accepts your existing **website admin** credentials (single sign-on bridge):

| Website admin role | CRM access |
|--------------------|------------|
| SUPER_ADMIN | OWNER (full CRM) |
| ADMIN_OPERASIONAL | ADMIN (booking/patient/nurse/etc.) |
| CONTENT_ADMIN | no CRM access |

So your existing SUPER_ADMIN just logs in at `/login` and gets full CRM access — a
`crm_staff` identity row is auto-provisioned on first login (password stays managed
in the admin panel). Admins get **both** sessions, so they can jump to the website
`/admin` panel from the CRM account menu ("Panel Website Admin"). Nurse/Finance get
only the CRM. After login each role lands on the first page it can open.
**No seed required.**

> First-run fallback: if the database has *no* usable admin and *no* CRM staff,
> `/login` shows a one-time "create first OWNER" form (backed by `crm/setup.php`,
> which only works while empty). The `crm/seed.php` script still exists for seeding
> sample accounts but is optional.

### 5. Add Nurse / Finance / custom-access accounts
From **`/crm/staff`** (OWNER only): add NURSE, FINANCE, or ADMIN accounts. Each can
optionally use **custom access** — tick exactly which modules they may open
(overrides the role default). Generated passwords are shown once. Nurse accounts
auto-link to a `nurses` roster row for assignment & the nurse portal.

The admin→CRM role mapping lives in `php-api/crm/_crm.php → crmRoleForAdmin()`.

---

## Security notes
- Passwords: bcrypt cost 12 (`password_hash`), via the shared PHP helper.
- Session: random 64-char token, sha256-hashed at rest in `crm_sessions`; the raw
  token is held only in the HttpOnly `crm_session` iron-session cookie.
- PII (phone/email/address/clinical notes) encrypted with AES-256-GCM
  (`FIELD_ENCRYPTION_KEY`) — same format as the public booking flow.
- Every mutation writes a `crm_audit_logs` row. Booking status changes are
  validated against a server-side state machine.
- Login rate-limited (5 / 15 min) via the shared `login_attempts` limiter.

## Notes / deviations from the original PRD
- Built on the **real PHP+Next architecture**, not Prisma/Next-fullstack (which the
  repo does not use and which would not run on the cPanel+Vercel split).
- Charts use lightweight dependency-free CSS/SVG bars instead of Recharts.
- CSRF is handled the same way as the existing admin: same-site `crm_session`
  cookie → Next proxy → PHP Bearer token (the PHP layer is not cookie-authenticated,
  so it is not CSRF-exposed).
