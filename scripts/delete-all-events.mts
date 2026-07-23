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
  const events = await db.execute("SELECT id, name FROM Event");
  console.log(`Found ${events.rows.length} events to delete`);

  for (const e of events.rows) {
    const eid = e.id as string;
    console.log(`Deleting event: ${e.name} (${eid})`);

    const campaigns = await db.execute({ sql: "SELECT id FROM CallCampaign WHERE eventId = ?", args: [eid] });
    for (const c of campaigns.rows) {
      await db.execute({ sql: "DELETE FROM CallLog WHERE campaignId = ?", args: [c.id as string] });
    }

    await db.execute({ sql: "DELETE FROM QrCode WHERE eventId = ?", args: [eid] });
    await db.execute({ sql: "DELETE FROM Rsvp WHERE eventId = ?", args: [eid] });
    await db.execute({ sql: "DELETE FROM EventRecipient WHERE eventId = ?", args: [eid] });
    await db.execute({ sql: "DELETE FROM CommunicationLog WHERE eventId = ?", args: [eid] });
    await db.execute({ sql: "DELETE FROM CallCampaign WHERE eventId = ?", args: [eid] });
    await db.execute({ sql: "DELETE FROM Attendance WHERE eventId = ?", args: [eid] });
    await db.execute({ sql: "DELETE FROM FollowUp WHERE eventId = ?", args: [eid] });
    await db.execute({ sql: "DELETE FROM NotificationLog WHERE eventId = ?", args: [eid] });
    await db.execute({ sql: "DELETE FROM Event WHERE id = ?", args: [eid] });
  }

  const remaining = await db.execute("SELECT COUNT(*) as count FROM Event");
  console.log(`\nDone. Remaining events: ${remaining.rows[0].count}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
