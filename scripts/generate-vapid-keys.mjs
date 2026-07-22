import webPush from "web-push";
import { readFileSync, appendFileSync, existsSync } from "fs";

const vapidKeys = webPush.generateVAPIDKeys();

const envPath = ".env";
const publicKeyLine = `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
const privateKeyLine = `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
const subjectLine = `VAPID_SUBJECT=mailto:admin@sionholychurch.com`;

if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  if (!content.includes("NEXT_PUBLIC_VAPID_PUBLIC_KEY")) {
    appendFileSync(envPath, `\n${publicKeyLine}\n${privateKeyLine}\n${subjectLine}\n`);
  }
}

console.log("VAPID Public Key:", vapidKeys.publicKey);
console.log("VAPID Private Key:", vapidKeys.privateKey);
console.log("\nKeys written to .env");
