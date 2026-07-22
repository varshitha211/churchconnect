"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getDefaultTemplate, generateInvitation, formatDateRange } from "@/lib/invitation-generator";
import { getWhatsAppLink } from "@/lib/phone";

interface Member {
  id: string;
  fullName: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
}

interface Recipient {
  id: string;
  memberId: string;
  status: string;
  member: Member;
}

interface EventData {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  venue: string;
}

export default function InvitePage() {
  const params = useParams();
  const eventId = params.id as string;
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [event, setEvent] = useState<EventData | null>(null);
  const [template, setTemplate] = useState(getDefaultTemplate());
  const [preview, setPreview] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; prepared: number } | null>(null);
  const [search, setSearch] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number } | null>(null);
  const [selectMode, setSelectMode] = useState<"all" | "custom">("all");
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [eventRes, recipientsRes, membersRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/recipients`),
        fetch("/api/members?per_page=1000"),
      ]);

      const eventData = await eventRes.json();
      const recipientsData = await recipientsRes.json();
      const membersData = await membersRes.json();

      if (eventData.success) setEvent(eventData.data);
      if (recipientsData.success) setRecipients(recipientsData.data);
      if (membersData.success) setAllMembers(membersData.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (event && allMembers.length > 0) {
      const sampleMember = allMembers[0];
      const dateRange = event.endDate
        ? formatDateRange(new Date(event.startDate), new Date(event.endDate))
        : new Date(event.startDate).toLocaleDateString("en-IN", {
            year: "numeric", month: "long", day: "numeric",
          });

      const previewText = generateInvitation(template, {
        member_name: sampleMember?.fullName || "John",
        event_name: event.name,
        event_dates: dateRange,
        event_time: event.startTime,
        venue: event.venue,
        event_link: `${window.location.origin}/event/${event.slug}`,
        church_name: "Sion Holy Church",
      });
      setPreview(previewText);
    }
  }, [template, event, allMembers]);

  const recipientIds = new Set(recipients.map((r) => r.memberId));
  const filteredMembers = allMembers.filter(
    (m) =>
      !recipientIds.has(m.id) &&
      (m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search))
  );

  async function addRecipients() {
    const ids = selectMode === "all"
      ? filteredMembers.map((m) => m.id)
      : selectedMembers;
    if (ids.length === 0) return;
    const res = await fetch(`/api/events/${eventId}/recipients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberIds: ids }),
    });
    if (res.ok) {
      setSelectedMembers([]);
      loadData();
    }
  }

  async function removeRecipient(recipientId: string) {
    const res = await fetch(`/api/events/${eventId}/recipients`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientIds: [recipientId] }),
    });
    if (res.ok) loadData();
  }

  function buildPersonalMessage(memberName: string) {
    const dateRange = event?.endDate
      ? formatDateRange(new Date(event.startDate), new Date(event.endDate))
      : new Date(event!.startDate).toLocaleDateString("en-IN", {
          year: "numeric", month: "long", day: "numeric",
        });

    return generateInvitation(template, {
      member_name: memberName,
      event_name: event!.name,
      event_dates: dateRange,
      event_time: event!.startTime,
      venue: event!.venue,
      event_link: `${window.location.origin}/event/${event!.slug}`,
      church_name: "Sion Holy Church",
    });
  }

  async function sendWhatsAppBulk() {
    if (recipients.length === 0) return;
    setSending(true);
    let prepared = 0;

    for (const recipient of recipients) {
      const message = buildPersonalMessage(recipient.member.fullName);
      const phone = recipient.member.whatsappNumber || recipient.member.phone;
      const link = getWhatsAppLink(phone, message);
      window.open(link, "_blank");
      await new Promise((r) => setTimeout(r, 500));

      await fetch(`/api/events/${eventId}/communication-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: recipient.memberId,
          channel: "WHATSAPP",
          status: "PREPARED",
          messageContent: message,
        }),
      }).catch(() => {});

      prepared++;
    }

    setResult({ sent: 0, prepared });
    setSending(false);
  }

  async function copyAllMessages() {
    if (recipients.length === 0) return;
    const messages = recipients.map((r) => {
      const msg = buildPersonalMessage(r.member.fullName);
      return `--- ${r.member.fullName} (${r.member.phone}) ---\n${msg}`;
    }).join("\n\n");
    await navigator.clipboard.writeText(messages);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendEmailInvites() {
    if (recipients.length === 0) return;
    const membersWithEmail = recipients.filter((r) => r.member.email);
    if (membersWithEmail.length === 0) {
      alert("No recipients have email addresses");
      return;
    }
    setEmailSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          memberIds: membersWithEmail.map((r) => r.memberId),
          subject: `You're Invited: ${event?.name}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailResult({ sent: data.sent, failed: data.failed });
      } else {
        alert(data.error || "Failed to send emails");
      }
    } catch {
      alert("Failed to send emails");
    } finally {
      setEmailSending(false);
    }
  }

  function selectAllFiltered() {
    setSelectedMembers(filteredMembers.map((m) => m.id));
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Invite Members — {event?.name}</h1>
        <p className="text-sm text-muted-foreground">
          Select members, generate personalized messages, and send via WhatsApp or Email
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-3">Message Template</h3>
            <textarea
              className="input min-h-[200px] font-mono text-sm"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Variables: {"{{member_name}}"}, {"{{event_name}}"}, {"{{event_dates}}"}, {"{{event_time}}"}, {"{{venue}}"}, {"{{event_link}}"}, {"{{church_name}}"}
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Preview</h3>
            <div className="p-3 bg-muted rounded-lg whitespace-pre-wrap text-sm">{preview || "Select a member to preview"}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recipients ({recipients.length})</h3>
            </div>

            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={sendWhatsAppBulk}
                  disabled={sending}
                  className="btn btn-primary text-xs"
                >
                  {sending ? "Opening WhatsApp..." : `📱 WhatsApp All (${recipients.length})`}
                </button>
                <button onClick={copyAllMessages} className="btn btn-secondary text-xs">
                  {copied ? "✓ Copied!" : "📋 Copy All Messages"}
                </button>
                <button
                  onClick={sendEmailInvites}
                  disabled={emailSending}
                  className="btn btn-secondary text-xs"
                >
                  {emailSending ? "Sending..." : `✉️ Email All (${recipients.filter((r) => r.member.email).length})`}
                </button>
              </div>
            )}

            {emailResult && (
              <div className="p-2 rounded bg-success/10 text-success text-xs mb-3">
                ✓ {emailResult.sent} emails sent{emailResult.failed > 0 ? `, ${emailResult.failed} failed` : ""}
              </div>
            )}

            {recipients.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {recipients.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">{r.member.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.member.phone}
                        {r.member.email ? ` · ${r.member.email}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={getWhatsAppLink(
                          r.member.whatsappNumber || r.member.phone,
                          buildPersonalMessage(r.member.fullName)
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-success hover:underline"
                      >
                        WhatsApp
                      </a>
                      <button
                        onClick={() => removeRecipient(r.id)}
                        className="text-destructive text-xs hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recipients added yet
              </p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Add Members</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectMode(selectMode === "all" ? "custom" : "all")}
                  className="text-xs text-primary hover:underline"
                >
                  {selectMode === "all" ? "Custom Select" : "Select All Mode"}
                </button>
              </div>
            </div>
            <input
              type="text"
              className="input mb-3"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="space-y-1 max-h-[250px] overflow-y-auto">
              {filteredMembers.slice(0, 30).map((m) => (
                <label key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers((prev) => [...prev, m.id]);
                      } else {
                        setSelectedMembers((prev) => prev.filter((id) => id !== m.id));
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium">{m.fullName}</p>
                    <p className="text-xs text-muted-foreground">{m.phone}{m.email ? ` · ${m.email}` : ""}</p>
                  </div>
                </label>
              ))}
            </div>
            {selectMode === "all" ? (
              <button onClick={addRecipients} className="btn btn-primary w-full mt-3">
                Add All ({filteredMembers.length}) Members
              </button>
            ) : selectedMembers.length > 0 ? (
              <button onClick={addRecipients} className="btn btn-primary w-full mt-3">
                Add {selectedMembers.length} Members
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {result && (
        <div className="card bg-success/5 border-success/20">
          <p className="font-medium text-success">
            ✓ {result.prepared} WhatsApp messages opened. Each tab has a personalized message ready to send.
          </p>
        </div>
      )}
    </div>
  );
}
