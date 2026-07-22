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

async function createTables() {
  console.log("Creating tables...");

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS Church (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      timezone TEXT DEFAULT 'Asia/Kolkata',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      churchId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (churchId) REFERENCES Church(id)
    );

    CREATE TABLE IF NOT EXISTS Member (
      id TEXT PRIMARY KEY,
      churchId TEXT NOT NULL,
      fullName TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsappNumber TEXT,
      email TEXT,
      ageGroup TEXT,
      gender TEXT,
      area TEXT,
      avatar TEXT,
      address TEXT,
      bloodGroup TEXT,
      dateOfBirth DATETIME,
      familyMembers TEXT,
      isSubscribed INTEGER DEFAULT 1,
      isArchived INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (churchId) REFERENCES Church(id),
      UNIQUE(churchId, phone)
    );

    CREATE TABLE IF NOT EXISTS Event (
      id TEXT PRIMARY KEY,
      churchId TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      startDate DATETIME NOT NULL,
      endDate DATETIME,
      startTime TEXT NOT NULL,
      venue TEXT NOT NULL,
      locationLink TEXT,
      organizerContact TEXT,
      status TEXT DEFAULT 'DRAFT',
      voiceEnabled INTEGER DEFAULT 1,
      rsvpEnabled INTEGER DEFAULT 1,
      qrAttendance INTEGER DEFAULT 1,
      registrationReq INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (churchId) REFERENCES Church(id),
      UNIQUE(churchId, slug)
    );

    CREATE TABLE IF NOT EXISTS Attendance (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      memberId TEXT NOT NULL,
      method TEXT DEFAULT 'MANUAL',
      checkedInBy TEXT,
      checkedInAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventId) REFERENCES Event(id),
      FOREIGN KEY (memberId) REFERENCES Member(id)
    );

    CREATE TABLE IF NOT EXISTS Rsvp (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      memberId TEXT NOT NULL,
      response TEXT NOT NULL,
      guestCount INTEGER DEFAULT 0,
      guestName TEXT,
      prayerRequest TEXT,
      message TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventId) REFERENCES Event(id),
      FOREIGN KEY (memberId) REFERENCES Member(id),
      UNIQUE(eventId, memberId)
    );

    CREATE TABLE IF NOT EXISTS Sermon (
      id TEXT PRIMARY KEY,
      churchId TEXT NOT NULL,
      title TEXT NOT NULL,
      speaker TEXT,
      description TEXT,
      date DATETIME NOT NULL,
      duration TEXT,
      youtubeUrl TEXT,
      audioUrl TEXT,
      notes TEXT,
      category TEXT,
      tags TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (churchId) REFERENCES Church(id)
    );

    CREATE TABLE IF NOT EXISTS Announcement (
      id TEXT PRIMARY KEY,
      churchId TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'NORMAL',
      targetAudience TEXT DEFAULT 'ALL',
      published INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (churchId) REFERENCES Church(id)
    );

    CREATE TABLE IF NOT EXISTS Template (
      id TEXT PRIMARY KEY,
      churchId TEXT NOT NULL,
      name TEXT NOT NULL,
      subject TEXT,
      body TEXT NOT NULL,
      isDefault INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (churchId) REFERENCES Church(id)
    );

    CREATE TABLE IF NOT EXISTS EventRecipient (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      memberId TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      sentAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventId) REFERENCES Event(id),
      FOREIGN KEY (memberId) REFERENCES Member(id)
    );

    CREATE TABLE IF NOT EXISTS QrCode (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      memberId TEXT,
      token TEXT UNIQUE NOT NULL,
      isCheckedIn INTEGER DEFAULT 0,
      checkedInAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventId) REFERENCES Event(id),
      FOREIGN KEY (memberId) REFERENCES Member(id)
    );

    CREATE TABLE IF NOT EXISTS Campaign (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      totalCalls INTEGER DEFAULT 0,
      answered INTEGER DEFAULT 0,
      noAnswer INTEGER DEFAULT 0,
      busy INTEGER DEFAULT 0,
      failed INTEGER DEFAULT 0,
      maxRetries INTEGER DEFAULT 2,
      retryDelayMin INTEGER DEFAULT 30,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventId) REFERENCES Event(id)
    );

    CREATE TABLE IF NOT EXISTS CallLog (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      eventId TEXT NOT NULL,
      campaignId TEXT,
      status TEXT NOT NULL,
      duration INTEGER,
      attemptedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memberId) REFERENCES Member(id),
      FOREIGN KEY (eventId) REFERENCES Event(id)
    );

    CREATE TABLE IF NOT EXISTS CommunicationLog (
      id TEXT PRIMARY KEY,
      eventId TEXT,
      memberId TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT DEFAULT 'SENT',
      sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventId) REFERENCES Event(id),
      FOREIGN KEY (memberId) REFERENCES Member(id)
    );

    CREATE TABLE IF NOT EXISTS FollowUp (
      id TEXT PRIMARY KEY,
      churchId TEXT NOT NULL,
      memberId TEXT NOT NULL,
      eventId TEXT,
      status TEXT DEFAULT 'PENDING',
      priority TEXT DEFAULT 'NORMAL',
      notes TEXT,
      assignedTo TEXT,
      dueDate DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (churchId) REFERENCES Church(id),
      FOREIGN KEY (memberId) REFERENCES Member(id)
    );

    CREATE TABLE IF NOT EXISTS PrayerRequest (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      request TEXT NOT NULL,
      isAnonymous INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memberId) REFERENCES Member(id)
    );

    CREATE TABLE IF NOT EXISTS BibleReading (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      passage TEXT NOT NULL,
      readAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memberId) REFERENCES Member(id)
    );

    CREATE TABLE IF NOT EXISTS UserNotification (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT DEFAULT 'GENERAL',
      isRead INTEGER DEFAULT 0,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id)
    );

    CREATE TABLE IF NOT EXISTS PushSubscription (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id)
    );

    CREATE TABLE IF NOT EXISTS SermonBookmark (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      sermonId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memberId) REFERENCES Member(id),
      FOREIGN KEY (sermonId) REFERENCES Sermon(id),
      UNIQUE(memberId, sermonId)
    );

    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      finished_at DATETIME,
      migration_name TEXT NOT NULL,
      logs TEXT,
      rolled_back_at DATETIME,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      applied_steps_count INTEGER DEFAULT 0
    );
  `);

  console.log("Tables created!");
}

async function seed() {
  console.log("Seeding data...");

  const churchId = uuid();
  const adminUserId = uuid();
  const adminId = uuid();

  await db.execute({
    sql: "INSERT OR IGNORE INTO Church (id, name, address, phone, email, timezone) VALUES (?, ?, ?, ?, ?, ?)",
    args: [churchId, "Sion Holy Church", "123 Faith Street, City Center", "+919876543210", "info@sionholychurch.com", "Asia/Kolkata"],
  });

  const passwordHash = await bcrypt.hash("admin123", 12);

  await db.execute({
    sql: "INSERT OR IGNORE INTO User (id, email, passwordHash, name, role, churchId) VALUES (?, ?, ?, ?, ?, ?)",
    args: [adminUserId, "admin@church.com", passwordHash, "Church Admin", "CHURCH_ADMIN", churchId],
  });

  await db.execute({
    sql: "INSERT OR IGNORE INTO Member (id, churchId, fullName, phone, email, isSubscribed) VALUES (?, ?, ?, ?, ?, ?)",
    args: [adminId, churchId, "Church Admin", "+919876543210", "admin@church.com", 1],
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
      sql: `INSERT OR IGNORE INTO Event (id, churchId, name, slug, category, description, startDate, startTime, venue, status, voiceEnabled, rsvpEnabled, qrAttendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        eventId, churchId, eventNames[i], slug, categories[i],
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
    await createTables();
    await seed();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
