const icsStamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const addHours = (iso, h) => new Date(new Date(iso).getTime() + h * 3600 * 1000).toISOString();
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const fold = (line) => {
  if (line.length <= 75) return line;
  let out = "", i = 0;
  while (i < line.length) {
    if (i === 0) { out += line.slice(0, 75); i = 75; }
    else { out += "\r\n " + line.slice(i, i + 74); i += 74; }
  }
  return out;
};

export function eventFor(card) {
  const summary = `${card.player.name} (${card.nation}) vs ${card.opponent} — 2026 World Cup`;
  const desc = card.player.bio.map((b) => "• " + b).join("\n");
  const lines = [
    "BEGIN:VEVENT",
    `UID:${card.id}@manutd-wc2026`,
    `DTSTAMP:${icsStamp(new Date().toISOString())}`,
    `DTSTART:${icsStamp(card.start)}`,
    `DTEND:${icsStamp(addHours(card.start, 2))}`,
    `SUMMARY:${esc(summary)}`,
    `LOCATION:${esc(card.stadium + ", " + card.city)}`,
    `DESCRIPTION:${esc(card.player.position + " · " + card.player.role + "\n\n" + desc)}`,
    "END:VEVENT",
  ];
  return lines.map(fold).join("\r\n");
}

export function buildICS(cards) {
  const head = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//Manchester United//World Cup 2026 Tracker//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Man Utd at the 2026 World Cup",
  ].map(fold).join("\r\n");
  return head + "\r\n" + cards.map(eventFor).join("\r\n") + "\r\nEND:VCALENDAR\r\n";
}
