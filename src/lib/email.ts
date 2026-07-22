import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmailInvite(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const from = options.from || process.env.SMTP_FROM || `"ChurchConnect" <${process.env.SMTP_USER}>`;
  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  return info;
}

export function buildInviteEmailHtml(opts: {
  eventName: string;
  date: string;
  time: string;
  venue: string;
  eventLink: string;
  churchName: string;
  rsvpLink: string;
  memberName: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#6b21a8;color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="margin:0;font-size:24px;">${opts.churchName}</h1>
    <p style="margin:8px 0 0;opacity:0.9;">You're Invited!</p>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
    <h2 style="margin:0 0 16px;color:#1f2937;">${opts.eventName}</h2>
    <div style="color:#4b5563;margin-bottom:16px;">
      <p>📅 <strong>Date:</strong> ${opts.date}</p>
      <p>⏰ <strong>Time:</strong> ${opts.time}</p>
      <p>📍 <strong>Venue:</strong> ${opts.venue}</p>
    </div>
    <p style="color:#6b7280;">Dear ${opts.memberName},</p>
    <p style="color:#6b7280;">We warmly invite you to join us for this blessed event. Your presence would be a wonderful blessing to our congregation.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${opts.rsvpLink}" style="background:#6b21a8;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">RSVP Now</a>
    </div>
    <p style="text-align:center;"><a href="${opts.eventLink}" style="color:#6b21a8;">View Event Details</a></p>
  </div>
  <div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px;">
    Sent via ChurchConnect — ${opts.churchName}
  </div>
</body>
</html>`;
}
