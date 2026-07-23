import "dotenv/config";
import { createClient } from "@libsql/client";

const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });

async function main() {
  // First check what references these users
  for (const email of ["kusumasaisrikambala@gmail.com", "sionmediaworks@gmail.com"]) {
    const user = await db.execute({ sql: "SELECT id FROM User WHERE email = ?", args: [email] });
    if (user.rows.length === 0) { console.log("User not found:", email); continue; }
    const uid = user.rows[0].id as string;

    const member = await db.execute({ sql: "SELECT id FROM Member WHERE email = ?", args: [email] });
    const mid = member.rows.length > 0 ? member.rows[0].id as string : null;

    // Check what references this user
    const events = await db.execute({ sql: "SELECT COUNT(*) as c FROM Event WHERE createdBy = ?", args: [uid] });
    const attByUser = await db.execute({ sql: "SELECT COUNT(*) as c FROM Attendance WHERE checkedInBy = ?", args: [uid] });
    const audits = await db.execute({ sql: "SELECT COUNT(*) as c FROM AuditLog WHERE userId = ?", args: [uid] });
    console.log(`${email}: User=${uid}, Member=${mid}, Events created=${events.rows[0].c}, Attendance checkedInBy=${attByUser.rows[0].c}, AuditLogs=${audits.rows[0].c}`);

    // Delete events created by this user first
    if ((events.rows[0].c as number) > 0) {
      const userEvents = await db.execute({ sql: "SELECT id FROM Event WHERE createdBy = ?", args: [uid] });
      for (const ev of userEvents.rows) {
        const eid = ev.id as string;
        await db.execute({ sql: "DELETE FROM QrCode WHERE eventId = ?", args: [eid] });
        await db.execute({ sql: "DELETE FROM Rsvp WHERE eventId = ?", args: [eid] });
        await db.execute({ sql: "DELETE FROM EventRecipient WHERE eventId = ?", args: [eid] });
        await db.execute({ sql: "DELETE FROM CommunicationLog WHERE eventId = ?", args: [eid] });
        await db.execute({ sql: "DELETE FROM Attendance WHERE eventId = ?", args: [eid] });
        await db.execute({ sql: "DELETE FROM FollowUp WHERE eventId = ?", args: [eid] });
        await db.execute({ sql: "DELETE FROM CallCampaign WHERE eventId = ?", args: [eid] });
        await db.execute({ sql: "DELETE FROM NotificationLog WHERE eventId = ?", args: [eid] });
        await db.execute({ sql: "DELETE FROM Event WHERE id = ?", args: [eid] });
      }
      console.log(`  Deleted ${userEvents.rows.length} events created by ${email}`);
    }

    if (mid) {
      await db.execute({ sql: "DELETE FROM Attendance WHERE memberId = ?", args: [mid] });
      await db.execute({ sql: "DELETE FROM Rsvp WHERE memberId = ?", args: [mid] });
      await db.execute({ sql: "DELETE FROM QrCode WHERE memberId = ?", args: [mid] });
      await db.execute({ sql: "DELETE FROM EventRecipient WHERE memberId = ?", args: [mid] });
      await db.execute({ sql: "DELETE FROM CommunicationLog WHERE memberId = ?", args: [mid] });
      await db.execute({ sql: "DELETE FROM FollowUp WHERE memberId = ?", args: [mid] });
      await db.execute({ sql: "DELETE FROM PrayerRequest WHERE memberId = ?", args: [mid] });
      await db.execute({ sql: "DELETE FROM BibleReading WHERE memberId = ?", args: [mid] });
      await db.execute({ sql: "DELETE FROM SermonBookmark WHERE memberId = ?", args: [mid] });
      await db.execute({ sql: "DELETE FROM UserNotification WHERE memberId = ?", args: [mid] });
      await db.execute({ sql: "DELETE FROM Member WHERE id = ?", args: [mid] });
    }

    // Attendance checked by this user
    await db.execute({ sql: "DELETE FROM Attendance WHERE checkedInBy = ?", args: [uid] });
    await db.execute({ sql: "DELETE FROM AuditLog WHERE userId = ?", args: [uid] });
    await db.execute({ sql: "DELETE FROM User WHERE id = ?", args: [uid] });
    console.log(`  Deleted user: ${email}`);
  }

  // Delete admin's Member record
  const adminMember = await db.execute({ sql: "SELECT id FROM Member WHERE email = 'admin@church.com'" });
  for (const m of adminMember.rows) {
    const mid = m.id as string;
    await db.execute({ sql: "DELETE FROM Attendance WHERE memberId = ?", args: [mid] });
    await db.execute({ sql: "DELETE FROM Rsvp WHERE memberId = ?", args: [mid] });
    await db.execute({ sql: "DELETE FROM QrCode WHERE memberId = ?", args: [mid] });
    await db.execute({ sql: "DELETE FROM EventRecipient WHERE memberId = ?", args: [mid] });
    await db.execute({ sql: "DELETE FROM CommunicationLog WHERE memberId = ?", args: [mid] });
    await db.execute({ sql: "DELETE FROM FollowUp WHERE memberId = ?", args: [mid] });
    await db.execute({ sql: "DELETE FROM UserNotification WHERE memberId = ?", args: [mid] });
    await db.execute({ sql: "DELETE FROM Member WHERE id = ?", args: [mid] });
  }
  console.log("Removed admin's Member record");

  // Final verify
  console.log("\n--- FINAL STATE ---");
  const users = await db.execute("SELECT email, name, role FROM User");
  console.log("USERS:");
  for (const r of users.rows) console.log(" ", r.email, r.name, r.role);
  const members = await db.execute("SELECT email, fullName, phone FROM Member");
  console.log("MEMBERS:");
  for (const r of members.rows) console.log(" ", r.email, r.fullName, r.phone);
  const events = await db.execute("SELECT COUNT(*) as c FROM Event");
  console.log("Events:", events.rows[0].c);
}

main().catch((e) => { console.error(e); process.exit(1); });
