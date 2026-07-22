import "dotenv/config";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const db = createClient({ url: tursoUrl, authToken: tursoToken });

async function dropAllTables() {
  console.log("Dropping existing tables...");

  const tables = [
    "SermonBookmark", "BibleReading", "UserNotification", "PrayerRequest",
    "FollowUp", "AuditLog", "CallLog", "CallCampaign", "NotificationLog",
    "PushSubscription", "CommunicationLog", "EventRecipient", "MessageTemplate",
    "Attendance", "QrCode", "Rsvp", "Event", "Member", "Sermon", "Announcement",
    "User", "Church",
  ];

  for (const table of tables) {
    try {
      await db.execute(`DROP TABLE IF EXISTS "${table}"`);
    } catch {
      // ignore
    }
  }
  console.log("All tables dropped.");
}

async function createTables() {
  console.log("Creating tables...");

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS "Church" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT NOT NULL,
      "address" TEXT,
      "phone" TEXT,
      "email" TEXT,
      "logo" TEXT,
      "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'CHURCH_ADMIN',
      "churchId" TEXT NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("churchId") REFERENCES "Church"("id")
    );

    CREATE TABLE IF NOT EXISTS "Member" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "churchId" TEXT NOT NULL,
      "fullName" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "whatsappNumber" TEXT,
      "email" TEXT,
      "ageGroup" TEXT,
      "gender" TEXT,
      "area" TEXT,
      "avatar" TEXT,
      "address" TEXT,
      "bloodGroup" TEXT,
      "dateOfBirth" DATETIME,
      "familyMembers" TEXT,
      "isSubscribed" BOOLEAN NOT NULL DEFAULT 1,
      "isArchived" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("churchId") REFERENCES "Church"("id"),
      UNIQUE("churchId", "phone")
    );

    CREATE TABLE IF NOT EXISTS "Event" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "churchId" TEXT NOT NULL,
      "createdBy" TEXT NOT NULL DEFAULT '',
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "category" TEXT NOT NULL,
      "description" TEXT,
      "startDate" DATETIME NOT NULL,
      "endDate" DATETIME,
      "startTime" TEXT NOT NULL,
      "venue" TEXT NOT NULL,
      "locationLink" TEXT,
      "posterImage" TEXT,
      "organizerContact" TEXT,
      "registrationReq" BOOLEAN NOT NULL DEFAULT 0,
      "voiceEnabled" BOOLEAN NOT NULL DEFAULT 1,
      "rsvpEnabled" BOOLEAN NOT NULL DEFAULT 1,
      "qrAttendance" BOOLEAN NOT NULL DEFAULT 1,
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("churchId") REFERENCES "Church"("id"),
      FOREIGN KEY ("createdBy") REFERENCES "User"("id")
    );

    CREATE TABLE IF NOT EXISTS "MessageTemplate" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "churchId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "subject" TEXT,
      "body" TEXT NOT NULL,
      "variables" TEXT NOT NULL DEFAULT '[]',
      "isDefault" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("churchId") REFERENCES "Church"("id")
    );

    CREATE TABLE IF NOT EXISTS "EventRecipient" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "eventId" TEXT NOT NULL,
      "memberId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'SELECTED',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("eventId") REFERENCES "Event"("id"),
      FOREIGN KEY ("memberId") REFERENCES "Member"("id"),
      UNIQUE("eventId", "memberId")
    );

    CREATE TABLE IF NOT EXISTS "CommunicationLog" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "eventId" TEXT NOT NULL,
      "memberId" TEXT NOT NULL,
      "channel" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'SENT',
      "messageContent" TEXT,
      "sentAt" DATETIME,
      "deliveredAt" DATETIME,
      "openedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("eventId") REFERENCES "Event"("id"),
      FOREIGN KEY ("memberId") REFERENCES "Member"("id")
    );

    CREATE TABLE IF NOT EXISTS "PushSubscription" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "endpoint" TEXT NOT NULL UNIQUE,
      "p256dh" TEXT NOT NULL,
      "auth" TEXT NOT NULL,
      "memberId" TEXT,
      "userAgent" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "NotificationLog" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "eventId" TEXT,
      "sentBy" TEXT NOT NULL DEFAULT '',
      "totalSent" INTEGER NOT NULL DEFAULT 0,
      "totalDelivered" INTEGER NOT NULL DEFAULT 0,
      "totalOpened" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("eventId") REFERENCES "Event"("id")
    );

    CREATE TABLE IF NOT EXISTS "CallCampaign" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "eventId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'QUEUED',
      "totalCalls" INTEGER NOT NULL DEFAULT 0,
      "answered" INTEGER NOT NULL DEFAULT 0,
      "noAnswer" INTEGER NOT NULL DEFAULT 0,
      "busy" INTEGER NOT NULL DEFAULT 0,
      "failed" INTEGER NOT NULL DEFAULT 0,
      "maxRetries" INTEGER NOT NULL DEFAULT 2,
      "retryDelayMin" INTEGER NOT NULL DEFAULT 30,
      "startedAt" DATETIME,
      "completedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("eventId") REFERENCES "Event"("id")
    );

    CREATE TABLE IF NOT EXISTS "CallLog" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "campaignId" TEXT NOT NULL,
      "memberId" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'QUEUED',
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "lastAttemptAt" DATETIME,
      "callDuration" INTEGER,
      "recordingUrl" TEXT,
      "retryCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("campaignId") REFERENCES "CallCampaign"("id"),
      FOREIGN KEY ("memberId") REFERENCES "Member"("id")
    );

    CREATE TABLE IF NOT EXISTS "Rsvp" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "eventId" TEXT NOT NULL,
      "memberId" TEXT,
      "guestName" TEXT,
      "response" TEXT NOT NULL,
      "guestCount" INTEGER NOT NULL DEFAULT 0,
      "prayerRequest" TEXT,
      "message" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("eventId") REFERENCES "Event"("id"),
      FOREIGN KEY ("memberId") REFERENCES "Member"("id"),
      UNIQUE("eventId", "memberId")
    );

    CREATE TABLE IF NOT EXISTS "QrCode" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "eventId" TEXT NOT NULL,
      "memberId" TEXT,
      "rsvpId" TEXT UNIQUE,
      "token" TEXT NOT NULL UNIQUE,
      "isCheckedIn" BOOLEAN NOT NULL DEFAULT 0,
      "checkedInAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("eventId") REFERENCES "Event"("id"),
      FOREIGN KEY ("memberId") REFERENCES "Member"("id"),
      FOREIGN KEY ("rsvpId") REFERENCES "Rsvp"("id")
    );

    CREATE TABLE IF NOT EXISTS "Attendance" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "eventId" TEXT NOT NULL,
      "memberId" TEXT,
      "qrCodeId" TEXT,
      "checkedInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "checkedInBy" TEXT,
      "method" TEXT NOT NULL,
      FOREIGN KEY ("eventId") REFERENCES "Event"("id"),
      FOREIGN KEY ("memberId") REFERENCES "Member"("id"),
      FOREIGN KEY ("checkedInBy") REFERENCES "User"("id")
    );

    CREATE TABLE IF NOT EXISTS "FollowUp" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "eventId" TEXT NOT NULL,
      "memberId" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "notes" TEXT,
      "contactedBy" TEXT,
      "contactedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("eventId") REFERENCES "Event"("id"),
      FOREIGN KEY ("memberId") REFERENCES "Member"("id")
    );

    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "entity" TEXT NOT NULL,
      "entityId" TEXT,
      "details" TEXT,
      "ipAddress" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id")
    );

    CREATE TABLE IF NOT EXISTS "Sermon" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "churchId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "speaker" TEXT NOT NULL,
      "date" DATETIME NOT NULL,
      "description" TEXT,
      "videoUrl" TEXT,
      "audioUrl" TEXT,
      "notesPdf" TEXT,
      "thumbnail" TEXT,
      "duration" INTEGER,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("churchId") REFERENCES "Church"("id")
    );

    CREATE TABLE IF NOT EXISTS "SermonBookmark" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "memberId" TEXT NOT NULL,
      "sermonId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("memberId") REFERENCES "Member"("id"),
      FOREIGN KEY ("sermonId") REFERENCES "Sermon"("id"),
      UNIQUE("memberId", "sermonId")
    );

    CREATE TABLE IF NOT EXISTS "Announcement" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "churchId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "attachment" TEXT,
      "priority" TEXT NOT NULL DEFAULT 'NORMAL',
      "isPublished" BOOLEAN NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("churchId") REFERENCES "Church"("id")
    );

    CREATE TABLE IF NOT EXISTS "PrayerRequest" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "memberId" TEXT NOT NULL,
      "churchId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "isAnonymous" BOOLEAN NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "prayerCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("memberId") REFERENCES "Member"("id"),
      FOREIGN KEY ("churchId") REFERENCES "Church"("id")
    );

    CREATE TABLE IF NOT EXISTS "BibleReading" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "memberId" TEXT NOT NULL,
      "date" DATETIME NOT NULL,
      "book" TEXT NOT NULL,
      "chapter" INTEGER NOT NULL,
      "verses" TEXT,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("memberId") REFERENCES "Member"("id"),
      UNIQUE("memberId", "date")
    );

    CREATE TABLE IF NOT EXISTS "UserNotification" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "memberId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'GENERAL',
      "isRead" BOOLEAN NOT NULL DEFAULT 0,
      "link" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("memberId") REFERENCES "Member"("id")
    );
  `);

  console.log("All tables created!");
}

async function seed() {
  console.log("Seeding data...");

  const churchId = uuid();
  const adminUserId = uuid();
  const adminMemberId = uuid();

  await db.execute({
    sql: "INSERT OR IGNORE INTO Church (id, name, address, phone, email, timezone) VALUES (?, ?, ?, ?, ?, ?)",
    args: [churchId, "Sion Holy Church", "123 Faith Street, City Center", "+919876543210", "info@sionholychurch.com", "Asia/Kolkata"],
  });

  const passwordHash = await bcrypt.hash("admin123", 12);

  await db.execute({
    sql: "INSERT OR IGNORE INTO User (id, email, passwordHash, name, role, churchId, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [adminUserId, "admin@church.com", passwordHash, "Church Admin", "CHURCH_ADMIN", churchId, 1],
  });

  await db.execute({
    sql: "INSERT OR IGNORE INTO Member (id, churchId, fullName, phone, email, isSubscribed) VALUES (?, ?, ?, ?, ?, ?)",
    args: [adminMemberId, churchId, "Church Admin", "+919876543210", "admin@church.com", 1],
  });

  console.log("Admin user created: admin@church.com / admin123");

  const categories = ["SUNDAY_SERVICE", "YOUTH_MEETING", "PRAYER_MEETING", "SPECIAL_EVENT"];
  const eventNames = [
    "Sunday Worship Service",
    "Youth Fellowship Night",
    "Wednesday Prayer Meeting",
    "Christmas Celebration",
  ];
  const venues = ["Main Sanctuary", "Youth Hall", "Prayer Room", "Church Grounds"];

  for (let i = 0; i < 4; i++) {
    const eventId = uuid();
    const slug = eventNames[i].toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const date = new Date();
    date.setDate(date.getDate() + i + 1);

    await db.execute({
      sql: `INSERT OR IGNORE INTO Event (id, churchId, createdBy, name, slug, category, description, startDate, startTime, venue, status, voiceEnabled, rsvpEnabled, qrAttendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        eventId, churchId, adminUserId, eventNames[i], slug, categories[i],
        `Join us for ${eventNames[i]}`,
        date.toISOString(), "10:00 AM", venues[i], "PUBLISHED",
        1, 1, 1,
      ],
    });
  }

  console.log("4 sample events created (PUBLISHED status)");
  console.log("\nDone! Turso database is ready.");
}

async function main() {
  try {
    await dropAllTables();
    await createTables();
    await seed();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
