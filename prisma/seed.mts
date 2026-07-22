import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

function createAdapter() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  if (tursoUrl && tursoToken) {
    return new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
  }
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dbPath = path.resolve(__dirname, "..", "dev.db");
  return new PrismaLibSql({ url: `file:${dbPath}` });
}

const libsql = createAdapter();
const prisma = new PrismaClient({ adapter: libsql });

async function main() {
  console.log("🌱 Seeding database...");

  const church = await prisma.church.create({
    data: {
      name: "Sion Holy Church",
      address: "123 Faith Street, City Center",
      phone: "+919876543210",
      email: "info@abcchurch.com",
      timezone: "Asia/Kolkata",
    },
  });

  console.log(`✅ Church created: ${church.name} (${church.id})`);

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@church.com",
      passwordHash,
      name: "Church Admin",
      role: "SUPER_ADMIN",
      churchId: church.id,
    },
  });

  console.log(`✅ Admin created: ${admin.email} / admin123`);

  const now = new Date();

  const sampleEvents = [
    {
      name: "Sunday Worship Service",
      slug: "sunday-worship-service",
      category: "WORSHIP",
      description: "Join us for a blessed time of worship, praise, and the Word of God.",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay())),
      startTime: "09:00 AM",
      venue: "Main Sanctuary",
      status: "PUBLISHED",
      rsvpEnabled: true,
      qrAttendance: true,
      voiceEnabled: true,
    },
    {
      name: "Youth Fellowship Night",
      slug: "youth-fellowship-night",
      category: "FELLOWSHIP",
      description: "An evening of fun, games, and spiritual growth for young adults.",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
      startTime: "06:30 PM",
      venue: "Youth Hall",
      status: "PUBLISHED",
      rsvpEnabled: true,
      qrAttendance: true,
      voiceEnabled: true,
    },
    {
      name: "Annual Church Picnic",
      slug: "annual-church-picnic",
      category: "SOCIAL",
      description: "Bring your family and friends for a day of outdoor fun, food, and fellowship.",
      startDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      startTime: "10:00 AM",
      venue: "Green Valley Park",
      status: "PUBLISHED",
      rsvpEnabled: true,
      qrAttendance: false,
      voiceEnabled: false,
    },
    {
      name: "Midweek Prayer Meeting",
      slug: "midweek-prayer-meeting",
      category: "PRAYER",
      description: "Come together in prayer for our church, community, and the nations.",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
      startTime: "07:00 PM",
      venue: "Prayer Chapel",
      status: "PUBLISHED",
      rsvpEnabled: false,
      qrAttendance: true,
      voiceEnabled: true,
    },
  ];

  for (const eventData of sampleEvents) {
    await prisma.event.create({
      data: {
        churchId: church.id,
        createdBy: admin.id,
        ...eventData,
        endDate: eventData.startDate,
      },
    });
  }

  console.log(`✅ ${sampleEvents.length} events created (status: PUBLISHED — use "Go Live" in admin to activate)`);

  const sampleSermons = [
    {
      title: "Walking in Faith",
      speaker: "Pastor David John",
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
      description: "A powerful message about trusting God's plan even when the path seems unclear.",
      duration: 2340,
      videoUrl: "https://www.youtube.com/watch?v=example1",
      audioUrl: "https://example.com/audio/sermon1.mp3",
    },
    {
      title: "The Power of Prayer",
      speaker: "Pastor Mary Thomas",
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14),
      description: "Understanding the transformative power of consistent prayer in our daily lives.",
      duration: 1860,
      videoUrl: "https://www.youtube.com/watch?v=example2",
    },
    {
      title: "Grace Upon Grace",
      speaker: "Guest Speaker Rev. Samuel Raj",
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 21),
      description: "An in-depth study of God's unmerited grace and how it changes everything.",
      duration: 2700,
      videoUrl: "https://www.youtube.com/watch?v=example3",
      audioUrl: "https://example.com/audio/sermon3.mp3",
      notesPdf: "https://example.com/notes/sermon3.pdf",
    },
    {
      title: "Love Your Neighbor",
      speaker: "Pastor David John",
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 28),
      description: "Exploring what it truly means to love our neighbors as ourselves.",
      duration: 2100,
      audioUrl: "https://example.com/audio/sermon4.mp3",
    },
    {
      title: "Standing Firm in Trials",
      speaker: "Pastor Grace Moses",
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 35),
      description: "How to maintain your faith and stand firm when life throws challenges at you.",
      duration: 1980,
      videoUrl: "https://www.youtube.com/watch?v=example5",
    },
  ];

  for (const sermonData of sampleSermons) {
    await prisma.sermon.create({
      data: {
        churchId: church.id,
        ...sermonData,
      },
    });
  }

  console.log(`✅ ${sampleSermons.length} sermons created`);

  const sampleAnnouncements = [
    {
      title: "Easter Sunday Celebration",
      description: "Join us for a special Easter Sunday service with worship, choir performance, and a message of hope. Bring your family and friends! Service starts at 9:00 AM followed by an Easter egg hunt for children.",
      priority: "HIGH",
      isPublished: true,
    },
    {
      title: "New Member Registration Open",
      description: "We're excited to welcome new members! If you've been attending regularly and would like to officially join our church family, please register at the welcome desk or through the member portal.",
      priority: "NORMAL",
      isPublished: true,
    },
    {
      title: "Church Building Fund",
      description: "We are raising funds for our new community hall. Every contribution counts. Please prayerfully consider your giving. Details available at the church office.",
      priority: "NORMAL",
      isPublished: true,
    },
    {
      title: "Road Closure Notice - Sunday Access",
      description: "Main Street will be closed for road work this Sunday. Please use the alternative route via Oak Avenue. Allow an extra 10 minutes for arrival. Parking available at the community center lot.",
      priority: "URGENT",
      isPublished: true,
    },
  ];

  for (const annData of sampleAnnouncements) {
    await prisma.announcement.create({
      data: {
        churchId: church.id,
        ...annData,
      },
    });
  }

  console.log(`✅ ${sampleAnnouncements.length} announcements created`);

  const defaultTemplate = await prisma.messageTemplate.create({
    data: {
      churchId: church.id,
      name: "Default Event Invitation",
      subject: "You're Invited!",
      body: `Praise the Lord, {{member_name}}!

You are warmly invited to {{event_name}}, happening on {{event_dates}} at {{event_time}} at {{venue}}.

We would be blessed to have you with us!

View event details: {{event_link}}`,
      variables: JSON.stringify([
        "member_name",
        "event_name",
        "event_dates",
        "event_time",
        "venue",
        "event_link",
        "church_name",
      ]),
      isDefault: true,
    },
  });

  console.log(`✅ Default template created: ${defaultTemplate.name}`);

  console.log("\n🎉 Seed complete!");
  console.log("   Admin login: admin@church.com / admin123");
  console.log("   No sample members — register real members through the app.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
