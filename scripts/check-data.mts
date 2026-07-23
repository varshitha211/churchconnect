import "dotenv/config";
import { createClient } from "@libsql/client";

const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });

async function main() {
  const users = await db.execute("SELECT id, email, name, role FROM User");
  console.log("USERS:");
  for (const r of users.rows) console.log(r);

  const members = await db.execute("SELECT id, email, fullName, phone FROM Member");
  console.log("\nMEMBERS:");
  for (const r of members.rows) console.log(r);

  const events = await db.execute("SELECT id, name, status, createdBy FROM Event");
  console.log("\nEVENTS:", events.rows.length);
  for (const r of events.rows) console.log(" ", r);

  const churches = await db.execute("SELECT id, name FROM Church");
  console.log("\nCHURCHES:");
  for (const r of churches.rows) console.log(" ", r);

  const attendance = await db.execute("SELECT COUNT(*) as c FROM Attendance");
  console.log("\nAttendance records:", attendance.rows[0].c);

  const qrCodes = await db.execute("SELECT COUNT(*) as c FROM QrCode");
  console.log("QrCode records:", qrCodes.rows[0].c);
}

main().catch(e => { console.error(e); process.exit(1); });
