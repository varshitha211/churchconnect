# ChurchConnect

Smart Church Event Communication, Notification, Voice Announcement, RSVP, Attendance, and Analytics Platform — built for **Sion Holy Church**.

## Features

- **Member Management** — CRUD, CSV import/export, search, filters, age groups, areas
- **Event Management** — Create events, track RSVPs, attendance, analytics
- **Invitation Generator** — Template-based invitations with preview
- **WhatsApp Notifications** — Free click-to-chat with pre-filled messages
- **Browser Push Notifications** — Free VAPID-based web push
- **Voice Announcements** — Browser SpeechSynthesis (free, no API)
- **Mock Call Campaigns** — Simulate calling statuses for follow-up tracking
- **QR Code Attendance** — Event check-in system
- **Follow-up Lists** — Track members needing follow-up after events
- **Reports** — Demographics by age group, gender, area
- **PWA** — Installable, works offline, home screen prompt
- **Settings** — Church name, logo, default timezone, notification preferences

## Tech Stack

- **Framework:** Next.js 16 (App Router + Turbopack)
- **Database:** SQLite via Prisma ORM (v7 with libsql adapter)
- **Auth:** JWT (httpOnly cookies)
- **Styling:** Tailwind CSS
- **PWA:** Service Worker + Web App Manifest

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Generate VAPID keys for push notifications
node scripts/generate-vapid-keys.mjs

# Initialize database
npx prisma migrate dev

# Seed sample data
npx tsx prisma/seed.mts

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default Login

- **Email:** admin@church.com
- **Password:** admin123

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login page
│   ├── admin/           # Admin panel (members, events, reports, settings)
│   ├── api/             # REST API routes
│   ├── event/[slug]/    # Public event pages (RSVP, voice announcement)
│   └── offline/         # PWA offline fallback
├── lib/
│   ├── prisma.ts        # Database client
│   ├── auth.ts          # JWT auth helpers
│   ├── push.ts          # Web push notification sender
│   ├── phone.ts         # Phone normalization, WhatsApp links
│   └── invitation-generator.ts
├── components/
│   └── layout/          # Sidebar, Header
└── proxy.ts             # Auth proxy (Next.js 16 replacement for middleware)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current session |
| GET | `/api/dashboard/stats` | Dashboard stats |
| GET/POST | `/api/members` | List/create members |
| GET/PUT/DELETE | `/api/members/[id]` | Single member CRUD |
| POST | `/api/members/import` | CSV import |
| GET | `/api/members/export` | CSV export |
| GET/POST | `/api/events` | List/create events |
| GET/PUT/DELETE | `/api/events/[id]` | Single event CRUD |
| GET | `/api/events/public/[slug]` | Public event data |
| POST | `/api/events/public/[slug]/rsvp` | Submit RSVP |
| GET/POST | `/api/events/[id]/campaigns` | Call campaigns |
| GET/POST | `/api/events/[id]/attendance` | Attendance |
| POST | `/api/push/subscribe` | Subscribe to push |
| POST | `/api/push/unsubscribe` | Unsubscribe from push |
| POST | `/api/push/send` | Send push notification |

## Deployment

### Docker

```bash
docker compose up -d
```

### Manual

```bash
npm run build
npm start
```

Ensure SQLite database directory is writable and `DATABASE_URL` points to it.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite connection string | `file:./dev.db` |
| `JWT_SECRET` | Secret for JWT signing | — (required) |
| `NEXT_PUBLIC_APP_URL` | Public URL | `http://localhost:3000` |
| `NEXT_PUBLIC_CHURCH_NAME` | Church name | `Sion Holy Church` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push public key | — |
| `VAPID_PRIVATE_KEY` | Web push private key | — |
| `WHATSAPP_MODE` | `click-to-chat` or `official-api` | `click-to-chat` |
| `CALL_PROVIDER` | `mock` or `twilio`/`msg91` | `mock` |

## License

Private — Sion Holy Church
