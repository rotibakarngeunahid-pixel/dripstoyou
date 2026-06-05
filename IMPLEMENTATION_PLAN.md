# IMPLEMENTATION PLAN — DRIP TO YOU Bali

## Stack Decision

**Next.js 15 Full-Stack (MVP)** — Route Handlers as backend, same repo.
Self-hosted friendly, no Vercel required.

- Frontend: Next.js 15, React 19, TypeScript
- Styling: Tailwind CSS, shadcn/ui, lucide-react
- Forms: React Hook Form + Zod
- Database: MySQL 8 + Prisma ORM
- Auth: iron-session (HttpOnly cookie, server-side)
- Password: bcryptjs (cost 12)
- Rate limit: upstash/ratelimit (or in-memory fallback)
- Upload: local /uploads with UUID rename (R2/S3 ready)
- Security: CSRF via csurf, headers via next/headers

## Project Structure

```
dripstoyou.com/
├── src/
│   ├── app/
│   │   ├── (public)/           # Public pages
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── treatments/
│   │   │   ├── booking/
│   │   │   ├── about/
│   │   │   ├── faq/
│   │   │   ├── contact/
│   │   │   └── legal/[slug]/
│   │   ├── admin/              # Admin panel
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── bookings/
│   │   │   ├── products/
│   │   │   ├── calendar/
│   │   │   ├── schedule/
│   │   │   ├── areas/
│   │   │   ├── settings/
│   │   │   ├── content/
│   │   │   └── audit-logs/
│   │   └── api/
│   │       ├── public/         # Public API routes
│   │       └── admin/          # Admin API routes
│   ├── components/
│   │   ├── public/             # Public page components
│   │   ├── admin/              # Admin UI components
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── session.ts
│   │   ├── auth.ts
│   │   ├── encryption.ts
│   │   ├── audit.ts
│   │   ├── rate-limit.ts
│   │   └── whatsapp.ts
│   └── types/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   └── uploads/
├── CLAUDE.md
├── DEPLOYMENT.md
├── DEPLOYMENT_SELF_HOSTED.md
├── SECURITY.md
├── ADMIN_GUIDE.md
├── .env.example
└── package.json
```

## Milestones

### Phase 1 — Foundation (current)
- [x] IMPLEMENTATION_PLAN.md
- [x] CLAUDE.md
- [ ] Next.js project init
- [ ] Prisma schema (all tables from PRD)
- [ ] .env.example
- [ ] Layout components

### Phase 2 — Homepage & Public Site
- [ ] Homepage (pixel-perfect from design)
- [ ] Treatments list & detail
- [ ] Booking form (WhatsApp deep link)
- [ ] About, FAQ, Contact, Legal pages

### Phase 3 — Admin
- [ ] Login + session
- [ ] Dashboard
- [ ] Product CRUD
- [ ] Booking management
- [ ] Calendar view
- [ ] Schedule settings
- [ ] WhatsApp settings
- [ ] Area management
- [ ] FAQ/Testimonials/Gallery

### Phase 4 — Security & Polish
- [ ] RBAC middleware
- [ ] Audit log
- [ ] Rate limiting
- [ ] CSRF
- [ ] Security headers (next.config)
- [ ] Upload validation
- [ ] Field encryption

### Phase 5 — Docs & Deploy
- [ ] README.md
- [ ] DEPLOYMENT.md + DEPLOYMENT_SELF_HOSTED.md
- [ ] SECURITY.md
- [ ] ADMIN_GUIDE.md
- [ ] Seed data
- [ ] DB migration tested
