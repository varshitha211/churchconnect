import webPush from "web-push";
import { prisma } from "./prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@sionholychurch.com";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function sendPushNotification(
  title: string,
  body: string,
  url?: string,
  options?: { memberId?: string; eventId?: string }
) {
  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  const payload = JSON.stringify({ title, body, url: url || "/" });

  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );

  if (options?.eventId) {
    await prisma.notificationLog.create({
      data: {
        title,
        body,
        eventId: options.eventId,
        sentBy: "system",
        totalSent: sent,
        totalDelivered: sent,
      },
    });
  }

  return { sent, failed, total: subscriptions.length };
}

export { webPush };
