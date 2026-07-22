# ChurchConnect - Complete Architecture

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | Full-stack, SSR, API routes, PWA |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS + shadcn/ui | Fast, professional UI |
| Database | SQLite (dev) / PostgreSQL (prod) | Free, zero setup |
| ORM | Prisma | Type-safe DB, migrations |
| Auth | Custom JWT (bcrypt + jose) | Free, no external dependency |
| Push Notifications | web-push (VAPID) | 100% free |
| Voice | Web Speech API | Free, browser-native |
| QR Codes | qrcode + html5-qrcode | Free, open-source |
| Charts | Recharts | Free, React-native |
| PWA | next-pwa | Free |
| CSV Parser | papaparse | Free |
| Validation | zod | Free, type-safe |
| State | React hooks + Server Components | No extra state lib needed |

---

## Database Schema (Prisma)

### users
```
id            String    @id @default(uuid())
email         String    @unique
passwordHash  String
name          String
role          ENUM      (SUPER_ADMIN, CHURCH_ADMIN)
churchId      String    FK -> churches
isActive      Boolean   @default(true)
createdAt     DateTime  @default(now())
updatedAt     DateTime  @updatedAt
```

### churches
```
id            String    @id @default(uuid())
name          String
address       String?
phone         String?
email         String?
logo          String?
timezone      String    @default("Asia/Kolkata")
createdAt     DateTime  @default(now())
updatedAt     DateTime  @updatedAt
```

### members
```
id              String    @id @default(uuid())
churchId        String    FK -> churches
fullName        String
phone           String
whatsappNumber  String?
email           String?
ageGroup        String?   (CHILD, YOUTH, ADULT, SENIOR)
gender          String?   (MALE, FEMALE, OTHER)
area            String?
isSubscribed    Boolean   @default(true)
isArchived      Boolean   @default(false)
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt

@@unique([churchId, phone])
```

### events
```
id                String    @id @default(uuid())
churchId          String    FK -> churches
name              String
slug              String    @unique
category          String    (Sunday_Service, Prayer_Meeting, Youth_Conference, etc.)
description       String?
startDate         DateTime
endDate           DateTime?
startTime         String
venue             String
locationLink      String?
posterImage       String?
organizerContact  String?
registrationReq   Boolean   @default(false)
voiceEnabled      Boolean   @default(true)
rsvpEnabled       Boolean   @default(true)
qrAttendance      Boolean   @default(true)
status            String    @default(DRAFT) (DRAFT, PUBLISHED, CANCELLED, COMPLETED)
createdBy         String    FK -> users
createdAt         DateTime  @default(now())
updatedAt         DateTime  @updatedAt
```

### message_templates
```
id            String    @id @default(uuid())
churchId      String    FK -> churches
name          String
subject       String?
body          String
variables     String    (JSON array of available vars)
isDefault     Boolean   @default(false)
createdAt     DateTime  @default(now())
updatedAt     DateTime  @updatedAt
```

### event_recipients
```
id            String    @id @default(uuid())
eventId       String    FK -> events
memberId      String    FK -> members
status        String    @default(SELECTED) (SELECTED, INVITED, COMPLETED)
createdAt     DateTime  @default(now())

@@unique([eventId, memberId])
```

### communication_logs
```
id              String    @id @default(uuid())
eventId         String    FK -> events
memberId        String    FK -> members
channel         String    (PUSH, WHATSAPP, SMS, EMAIL, CALL)
status          String    (PREPARED, SENT, DELIVERED, OPENED, FAILED)
messageContent  String?
sentAt          DateTime?
deliveredAt     DateTime?
openedAt        DateTime?
createdAt       DateTime  @default(now())
```

### push_subscriptions
```
id            String    @id @default(uuid())
memberId      String?   FK -> members (nullable for anonymous)
endpoint      String
p256dh        String
auth          String
userAgent     String?
createdAt     DateTime  @default(now())

@@unique([endpoint])
```

### notification_logs
```
id              String    @id @default(uuid())
title           String
body            String
eventId         String?   FK -> events
sentBy          String    FK -> users
totalSent       Int       @default(0)
totalDelivered  Int       @default(0)
totalOpened     Int       @default(0)
createdAt       DateTime  @default(now())
```

### call_campaigns
```
id              String    @id @default(uuid())
eventId         String    FK -> events
name            String
status          String    @default(QUEUED) (QUEUED, RUNNING, PAUSED, COMPLETED, CANCELLED)
totalCalls      Int       @default(0)
answered        Int       @default(0)
noAnswer        Int       @default(0)
busy            Int       @default(0)
failed          Int       @default(0)
maxRetries      Int       @default(2)
retryDelayMin   Int       @default(30)
startedAt       DateTime?
completedAt     DateTime?
createdAt       DateTime  @default(now())
```

### call_logs
```
id              String    @id @default(uuid())
campaignId      String    FK -> call_campaigns
memberId        String    FK -> members
phone           String
status          String    (QUEUED, INITIATED, RINGING, ANSWERED, COMPLETED, NO_ANSWER, BUSY, FAILED, CANCELLED)
attempts        Int       @default(0)
lastAttemptAt   DateTime?
callDuration    Int?      (seconds)
recordingUrl    String?
retryCount      Int       @default(0)
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
```

### rsvps
```
id            String    @id @default(uuid())
eventId       String    FK -> events
memberId      String?   FK -> members (nullable for public RSVP)
guestName     String?
response      String    (ATTENDING, MAYBE, NOT_ATTENDING)
guestCount    Int       @default(0)
prayerRequest String?
message       String?
createdAt     DateTime  @default(now())
updatedAt     DateTime  @updatedAt

@@unique([eventId, memberId])
```

### qr_codes
```
id            String    @id @default(uuid())
eventId       String    FK -> events
memberId      String?   FK -> members
rsvpId        String?   FK -> rsvps
token         String    @unique
isCheckedIn   Boolean   @default(false)
checkedInAt   DateTime?
createdAt     DateTime  @default(now())
```

### attendance
```
id            String    @id @default(uuid())
eventId       String    FK -> events
memberId      String?   FK -> members
qrCodeId      String?   FK -> qr_codes
checkedInAt   DateTime  @default(now())
checkedInBy   String?   FK -> users
method        String    (QR_SCAN, MANUAL)
```

### follow_ups
```
id            String    @id @default(uuid())
eventId       String    FK -> events
memberId      String    FK -> members
reason        String    (NO_RSVP, UNANSWERED_CALL, NOT_OPENED, NOT_SUBSCRIBED)
status        String    @default(PENDING) (PENDING, CONTACTED, RESOLVED)
notes         String?
contactedBy   String?   FK -> users
contactedAt   DateTime?
createdAt     DateTime  @default(now())
```

### audit_logs
```
id            String    @id @default(uuid())
userId        String    FK -> users
action        String
entity        String
entityId      String?
details       String?   (JSON)
ipAddress     String?
createdAt     DateTime  @default(now())
```

---

## Folder Structure

```
churchConnect/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   ├── manifest.json
│   ├── sw.js
│   └── offline.html
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing/home
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx          # Admin sidebar layout
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── members/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── import/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── events/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── invite/page.tsx
│   │   │   │       ├── calls/page.tsx
│   │   │   │       ├── rsvp/page.tsx
│   │   │   │       ├── attendance/page.tsx
│   │   │   │       └── analytics/page.tsx
│   │   │   ├── follow-up/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── templates/
│   │   │       ├── page.tsx
│   │   │       └── new/page.tsx
│   │   └── event/
│   │       └── [slug]/
│   │           └── page.tsx        # Public event page (no auth)
│   ├── components/
│   │   ├── ui/                     # shadcn components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── AdminLayout.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── EventSummary.tsx
│   │   │   └── Charts.tsx
│   │   ├── members/
│   │   │   ├── MemberTable.tsx
│   │   │   ├── MemberForm.tsx
│   │   │   └── CSVUploader.tsx
│   │   ├── events/
│   │   │   ├── EventForm.tsx
│   │   │   ├── EventCard.tsx
│   │   │   └── EventStatusBadge.tsx
│   │   ├── communication/
│   │   │   ├── MessagePreview.tsx
│   │   │   ├── WhatsAppButton.tsx
│   │   │   └── CallCampaign.tsx
│   │   ├── rsvp/
│   │   │   ├── RSVPForm.tsx
│   │   │   └── RSVPStats.tsx
│   │   ├── attendance/
│   │   │   ├── QRScanner.tsx
│   │   │   ├── QRCodeDisplay.tsx
│   │   │   └── AttendanceTable.tsx
│   │   ├── voice/
│   │   │   └── VoiceAnnouncement.tsx
│   │   ├── charts/
│   │   │   ├── RSVPChart.tsx
│   │   │   ├── CallStatusChart.tsx
│   │   │   └── NotificationChart.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ExportButton.tsx
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── auth.ts                 # JWT helpers
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   ├── validators.ts           # Zod schemas
│   │   ├── phone.ts                # Phone normalization
│   │   ├── csv-parser.ts
│   │   ├── invitation-generator.ts
│   │   ├── qr-generator.ts
│   │   ├── voice.ts
│   │   ├── whatsapp.ts
│   │   ├── push-notifications.ts
│   │   └── providers/
│   │       ├── index.ts            # Provider registry
│   │       ├── mock-provider.ts     # Mock calls
│   │       ├── twilio-provider.ts   # Optional
│   │       └── types.ts            # Provider interface
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useMediaQuery.ts
│   │   └── usePushNotifications.ts
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts               # Auth middleware
├── .env.example
├── .env.local
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── docker-compose.yml
├── sample-members.csv
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | Login | No |
| POST | /api/auth/logout | Logout | Yes |
| GET | /api/auth/me | Current user | Yes |

### Members
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/members | List members (paginated) | Admin |
| POST | /api/members | Create member | Admin |
| GET | /api/members/[id] | Get member | Admin |
| PUT | /api/members/[id] | Update member | Admin |
| DELETE | /api/members/[id] | Archive member | Admin |
| POST | /api/members/import | CSV/Excel import | Admin |
| GET | /api/members/export | Export CSV | Admin |

### Events
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/events | List events | Admin |
| POST | /api/events | Create event | Admin |
| GET | /api/events/[id] | Get event | Admin |
| PUT | /api/events/[id] | Update event | Admin |
| DELETE | /api/events/[id] | Delete event | Admin |
| POST | /api/events/[id]/publish | Publish event | Admin |
| GET | /api/events/public/[slug] | Public event page | No |

### Event Recipients
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/events/[id]/recipients | List recipients | Admin |
| POST | /api/events/[id]/recipients | Add recipients | Admin |
| DELETE | /api/events/[id]/recipients/[rId] | Remove recipient | Admin |

### Communication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/events/[id]/send-push | Send push notifications | Admin |
| POST | /api/events/[id]/generate-whatsapp | Generate WhatsApp messages | Admin |
| GET | /api/events/[id]/communication-logs | Communication status | Admin |

### Voice Calls
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/events/[id]/campaigns | Create call campaign | Admin |
| GET | /api/events/[id]/campaigns | List campaigns | Admin |
| POST | /api/campaigns/[id]/start | Start campaign | Admin |
| POST | /api/campaigns/[id]/pause | Pause campaign | Admin |
| POST | /api/campaigns/[id]/cancel | Cancel campaign | Admin |
| POST | /api/campaigns/[id]/retry | Retry failed calls | Admin |
| GET | /api/campaigns/[id]/logs | Call logs | Admin |
| POST | /api/webhooks/call-status | Call status webhook | Provider |

### RSVP
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/events/public/[slug]/rsvp | Submit RSVP | No |
| GET | /api/events/[id]/rsvps | List RSVPs | Admin |
| GET | /api/events/[id]/rsvp-stats | RSVP statistics | Admin |

### QR & Attendance
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/events/[id]/qr-codes | Generate QR codes | Admin |
| POST | /api/events/[id]/scan | Scan QR / check-in | Admin |
| POST | /api/events/[id]/checkin-manual | Manual check-in | Admin |
| GET | /api/events/[id]/attendance | Attendance list | Admin |
| GET | /api/qr/[token] | Validate QR token | No |

### Analytics & Reports
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/dashboard/stats | Dashboard statistics | Admin |
| GET | /api/events/[id]/analytics | Event analytics | Admin |
| GET | /api/follow-ups | Follow-up list | Admin |
| PUT | /api/follow-ups/[id] | Update follow-up | Admin |
| GET | /api/reports/[type] | Generate report | Admin |

### Templates
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/templates | List templates | Admin |
| POST | /api/templates | Create template | Admin |
| PUT | /api/templates/[id] | Update template | Admin |
| DELETE | /api/templates/[id] | Delete template | Admin |
| POST | /api/templates/preview | Preview with variables | Admin |

### Push Notification Subscription
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/push/subscribe | Subscribe to push | No |
| DELETE | /api/push/unsubscribe | Unsubscribe | No |

### Settings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/settings | Get church settings | Admin |
| PUT | /api/settings | Update settings | Super Admin |

---

## Application Modes

### Mode 1: FREE DEMO (default)
```env
NEXT_PUBLIC_APP_MODE=demo
CALL_PROVIDER=mock
WHATSAPP_MODE=click-to-chat
```
- Mock calling with simulated statuses
- Click-to-chat WhatsApp links
- Browser SpeechSynthesis for voice
- All features work, no money spent

### Mode 2: FREE-FIRST REAL
```env
NEXT_PUBLIC_APP_MODE=real
CALL_PROVIDER=mock
WHATSAPP_MODE=click-to-chat
PUSH_ENABLED=true
```
- Real push notifications
- Real PWA
- Real RSVP
- Mock calls (no real calling)
- WhatsApp click-to-chat

### Mode 3: PRODUCTION
```env
NEXT_PUBLIC_APP_MODE=production
CALL_PROVIDER=twilio
WHATSAPP_MODE=business_api
TWILIO_SID=xxx
TWILIO_AUTH_TOKEN=xxx
WHATSAPP_API_TOKEN=xxx
```
- Real WhatsApp Business API
- Real automated calls via Twilio
- Full webhook integration

---

## Environment Variables (.env.example)

```env
# Database
DATABASE_URL="file:./dev.db"

# Auth
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="ChurchConnect"
NEXT_PUBLIC_APP_MODE="demo"

# Church
NEXT_PUBLIC_CHURCH_NAME="ABC Church"
NEXT_PUBLIC_CHURCH_DEFAULT_TIMEZONE="Asia/Kolkata"

# Push Notifications (VAPID)
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@churchconnect.app"

# WhatsApp
WHATSAPP_MODE="click-to-chat"
WHATSAPP_API_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""

# Voice Calling
CALL_PROVIDER="mock"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# File Upload
MAX_FILE_SIZE_MB="5"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="60"
```

---

## Cost Analysis

| Item | Monthly Cost |
|------|-------------|
| SQLite/PostgreSQL | Free (SQLite) / Free (Supabase free tier) |
| Hosting | Free (Vercel hobby / Railway $5 credit) |
| Push Notifications | Free (VAPID - self-hosted) |
| WhatsApp | Free (click-to-chat) / Paid if Business API |
| Voice Calls | Free (mock) / ₹40-100/month (MSG91) |
| Domain | Optional ~₹500/year |

**Total: ₹0 - ₹500/month depending on calling needs**
