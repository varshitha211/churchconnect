import QRCodeLib from "qrcode";
import { prisma } from "./prisma";
import { v4 as uuidv4 } from "uuid";

export async function generateQrForEvent(eventId: string, memberId: string) {
  const existing = await prisma.qrCode.findFirst({
    where: { eventId, memberId },
  });
  if (existing) return existing;

  const token = uuidv4();
  const qr = await prisma.qrCode.create({
    data: { eventId, memberId, token },
  });
  return qr;
}

export async function generateQrDataUrl(token: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/scan?token=${token}`;
  return QRCodeLib.toDataURL(url, { width: 256, margin: 2 });
}

export async function generateBulkQr(eventId: string, memberIds: string[]) {
  const results = [];
  for (const memberId of memberIds) {
    const qr = await generateQrForEvent(eventId, memberId);
    const dataUrl = await generateQrDataUrl(qr.token);
    results.push({ memberId, qrId: qr.id, token: qr.token, dataUrl });
  }
  return results;
}
