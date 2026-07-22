export function generateInvitation(
  template: string,
  variables: Record<string, string>
): string {
  let message = template;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return message;
}

export function getDefaultTemplate(): string {
  return `🙏 Praise the Lord, {{member_name}}!

You are warmly invited to {{event_name}}, happening on {{event_dates}} at {{event_time}} at {{venue}}.

We would be blessed to have you with us!

View event details:
{{event_link}}`;
}

export function formatDateRange(startDate: Date, endDate?: Date | null): string {
  const start = new Date(startDate);
  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  const yearOptions: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };

  if (!endDate) {
    return start.toLocaleDateString("en-IN", yearOptions);
  }

  const end = new Date(endDate);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString("en-IN", options)}–${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${start.toLocaleDateString("en-IN", options)} – ${end.toLocaleDateString("en-IN", yearOptions)}`;
}
