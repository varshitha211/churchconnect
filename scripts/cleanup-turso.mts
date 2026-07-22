import "dotenv/config";
import { createClient } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const db = createClient({ url: tursoUrl, authToken: tursoToken });

async function main() {
  // Get seeded church id (admin@church.com's church)
  const adminUser = await db.execute({sql: 'SELECT churchId FROM User WHERE email = ?', args: ['admin@church.com']});
  const seededChurchId = adminUser.rows[0].churchId as string;
  console.log('Seeded church:', seededChurchId);

  // Move varshithaamara020@gmail.com to seeded church (both User and Member)
  await db.execute({sql: 'UPDATE User SET churchId = ? WHERE email = ?', args: [seededChurchId, 'varshithaamara020@gmail.com']});
  await db.execute({sql: 'UPDATE Member SET churchId = ? WHERE email = ?', args: [seededChurchId, 'varshithaamara020@gmail.com']});
  console.log('Moved varshithaamara020@gmail.com to seeded church');

  // Delete test/duplicate data - clean up all relations first
  for (const email of ['test@example.com', '23pa1a4553@vishnu.edu.in', 'kusumasaisrikambala@gmail.com']) {
    const user = await db.execute({sql: 'SELECT id FROM User WHERE email = ?', args: [email]});
    const member = await db.execute({sql: 'SELECT id FROM Member WHERE email = ?', args: [email]});

    for (const u of user.rows) {
      await db.execute({sql: 'DELETE FROM UserNotification WHERE memberId IN (SELECT id FROM Member WHERE email = ?)', args: [email]});
      await db.execute({sql: 'DELETE FROM Attendance WHERE checkedInBy = ?', args: [u.id]});
    }
    for (const m of member.rows) {
      await db.execute({sql: 'DELETE FROM Attendance WHERE memberId = ?', args: [m.id]});
      await db.execute({sql: 'DELETE FROM Rsvp WHERE memberId = ?', args: [m.id]});
      await db.execute({sql: 'DELETE FROM QrCode WHERE memberId = ?', args: [m.id]});
      await db.execute({sql: 'DELETE FROM EventRecipient WHERE memberId = ?', args: [m.id]});
      await db.execute({sql: 'DELETE FROM CommunicationLog WHERE memberId = ?', args: [m.id]});
      await db.execute({sql: 'DELETE FROM FollowUp WHERE memberId = ?', args: [m.id]});
      await db.execute({sql: 'DELETE FROM PrayerRequest WHERE memberId = ?', args: [m.id]});
      await db.execute({sql: 'DELETE FROM BibleReading WHERE memberId = ?', args: [m.id]});
      await db.execute({sql: 'DELETE FROM SermonBookmark WHERE memberId = ?', args: [m.id]});
    }
    await db.execute({sql: 'DELETE FROM Member WHERE email = ?', args: [email]});
    await db.execute({sql: 'DELETE FROM User WHERE email = ?', args: [email]});
    console.log('Deleted:', email);
  }

  // Now delete extra church - first delete all data referencing it
  const extraChurches = await db.execute({sql: 'SELECT id FROM Church WHERE id != ?', args: [seededChurchId]});
  for (const c of extraChurches.rows) {
    const cid = c.id as string;
    // Delete everything that references this church
    await db.execute({sql: 'DELETE FROM Attendance WHERE eventId IN (SELECT id FROM Event WHERE churchId = ?)', args: [cid]});
    await db.execute({sql: 'DELETE FROM Rsvp WHERE eventId IN (SELECT id FROM Event WHERE churchId = ?)', args: [cid]});
    await db.execute({sql: 'DELETE FROM QrCode WHERE eventId IN (SELECT id FROM Event WHERE churchId = ?)', args: [cid]});
    await db.execute({sql: 'DELETE FROM EventRecipient WHERE eventId IN (SELECT id FROM Event WHERE churchId = ?)', args: [cid]});
    await db.execute({sql: 'DELETE FROM CommunicationLog WHERE eventId IN (SELECT id FROM Event WHERE churchId = ?)', args: [cid]});
    await db.execute({sql: 'DELETE FROM FollowUp WHERE eventId IN (SELECT id FROM Event WHERE churchId = ?)', args: [cid]});
    await db.execute({sql: 'DELETE FROM CallCampaign WHERE eventId IN (SELECT id FROM Event WHERE churchId = ?)', args: [cid]});
    await db.execute({sql: 'DELETE FROM NotificationLog WHERE eventId IN (SELECT id FROM Event WHERE churchId = ?)', args: [cid]});
    await db.execute({sql: 'DELETE FROM Event WHERE churchId = ?', args: [cid]});
    await db.execute({sql: 'DELETE FROM Member WHERE churchId = ?', args: [cid]});
    await db.execute({sql: 'DELETE FROM User WHERE churchId = ?', args: [cid]});
    await db.execute({sql: 'DELETE FROM Announcement WHERE churchId = ?', args: [cid]});
    await db.execute({sql: 'DELETE FROM Sermon WHERE churchId = ?', args: [cid]});
    await db.execute({sql: 'DELETE FROM MessageTemplate WHERE churchId = ?', args: [cid]});
    await db.execute({sql: 'DELETE FROM PrayerRequest WHERE churchId = ?', args: [cid]});
    await db.execute({sql: 'DELETE FROM Church WHERE id = ?', args: [cid]});
    console.log('Deleted extra church:', cid);
  }

  // Create Member record for varshithaamara020@gmail.com if missing
  const existingMember = await db.execute({sql: 'SELECT id FROM Member WHERE email = ?', args: ['varshithaamara020@gmail.com']});
  if (existingMember.rows.length === 0) {
    const { v4: uuid } = await import("uuid");
    const memberId = uuid();
    await db.execute({sql: 'INSERT INTO Member (id, churchId, fullName, phone, email, isSubscribed) VALUES (?, ?, ?, ?, ?, ?)', args: [memberId, seededChurchId, 'Admin', '+910000000000', 'varshithaamara020@gmail.com', 1]});
    console.log('Created member record for varshithaamara020@gmail.com');
  }

  // Verify
  const members = await db.execute('SELECT fullName, email FROM Member');
  console.log('\nFinal members:');
  for (const m of members.rows) console.log(' -', m.fullName, m.email);
  const users = await db.execute('SELECT email, role FROM User');
  console.log('Final users:');
  for (const u of users.rows) console.log(' -', u.email, u.role);
  const churches = await db.execute('SELECT id, name FROM Church');
  console.log('Churches:', churches.rows.length);
}

main().catch(e => { console.error(e); process.exit(1); });
