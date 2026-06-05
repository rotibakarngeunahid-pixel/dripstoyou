# CLAUDE.md

## Project
DRIP TO YOU Bali — Mobile IV Therapy booking website. Next.js 15 full-stack, MySQL 8, Prisma. Self-hosted (no Vercel).

## Non-negotiable Security Rules
- Never store admin tokens in localStorage — use HttpOnly Secure SameSite cookies.
- Hash passwords with bcrypt cost >= 12 (or Argon2id if available).
- Use Prisma/prepared statements only. No raw SQL string concat from user input.
- Validate ALL backend input with Zod schemas.
- All admin mutations require: authentication check + RBAC permission check + CSRF token.
- Record audit logs for: login, logout, booking changes, product changes, export, settings changes.
- Never commit .env or secrets.
- Do not log passwords, tokens, full phone numbers, full addresses, or booking notes.
- Encrypt sensitive fields (phone, address, notes) with AES-256-GCM using FIELD_ENCRYPTION_KEY.
- Rate limit: login 5/15min, public booking 5/10min, export 3/10min.

## Color Tokens
```
--teal:        #205251
--ocean:       #29808B
--soft-aqua:   #8EBFBF
--light-aqua:  #9ABFC1
--pale-aqua:   #D6EAEA
--gold:        #C9944C
--champagne:   #EAD4AE
--white:       #FFFFFF
--off-white:   #F3F0E7
--grey:        #DBDAD7
```

## Typography
- Headings: Playfair Display (serif)
- UI/Body: DM Sans (sans-serif)

## Workflow
- Explore → Plan → Code (never skip planning for multi-file changes)
- After any change: npm run lint && npm run typecheck
- Before final answer: npm run build
- Show command output as evidence of success.

## Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run db:migrate   # prisma migrate dev
npm run db:push      # prisma db push (quick schema sync)
npm run db:seed      # prisma db seed
npm run db:studio    # Prisma Studio
```

## Key Files
- Prisma schema: prisma/schema.prisma
- Session config: src/lib/session.ts
- Auth helpers: src/lib/auth.ts
- Encryption: src/lib/encryption.ts
- Audit log: src/lib/audit.ts
- Rate limit: src/lib/rate-limit.ts
- WA deep link: src/lib/whatsapp.ts

## Admin Roles
- SUPER_ADMIN: all access
- ADMIN_OPERASIONAL: bookings, schedule, areas (no delete, no export sensitive, no admin mgmt)
- CONTENT_ADMIN: products, FAQ, testimonials, gallery, legal (no booking export)

## Medical Content Rules
- Use: "helps support recovery", "designed to support hydration", "may help with fatigue"
- Avoid: "menyembuhkan penyakit", "garansi hasil", "pasti sembuh"
