import React, { useState, useEffect, useMemo } from "react";

/**
 * Manchester United at the 2026 FIFA World Cup
 * - Left: scrollable list of every group-stage match featuring a current United player.
 * - Right: player profile + match info, with a per-match .ics download.
 * - Top right: download a full .ics calendar of all matches (primary deliverable).
 * Only React + useState/useEffect. Headshots fetched live from the Wikipedia REST API
 * with a graceful initials fallback. All fixture data hardcoded from research.
 * Kick-off times are stored and shown in UTC.
 */

// Each nation's three group-stage fixtures (opponent from this team's POV).
const FIXTURES = {
  Portugal: [
    { opp: "DR Congo", start: "2026-06-17T17:00:00Z", stadium: "NRG Stadium", city: "Houston, TX" },
    { opp: "Uzbekistan", start: "2026-06-23T17:00:00Z", stadium: "NRG Stadium", city: "Houston, TX" },
    { opp: "Colombia", start: "2026-06-27T23:30:00Z", stadium: "Hard Rock Stadium", city: "Miami, FL" },
  ],
  Brazil: [
    { opp: "Morocco", start: "2026-06-13T22:00:00Z", stadium: "MetLife Stadium", city: "East Rutherford, NJ" },
    { opp: "Haiti", start: "2026-06-20T00:30:00Z", stadium: "Lincoln Financial Field", city: "Philadelphia, PA" },
    { opp: "Scotland", start: "2026-06-24T22:00:00Z", stadium: "Hard Rock Stadium", city: "Miami, FL" },
  ],
  Morocco: [
    { opp: "Brazil", start: "2026-06-13T22:00:00Z", stadium: "MetLife Stadium", city: "East Rutherford, NJ" },
    { opp: "Scotland", start: "2026-06-19T22:00:00Z", stadium: "Gillette Stadium", city: "Foxborough, MA" },
    { opp: "Haiti", start: "2026-06-24T22:00:00Z", stadium: "Mercedes-Benz Stadium", city: "Atlanta, GA" },
  ],
  Netherlands: [
    { opp: "Japan", start: "2026-06-14T20:00:00Z", stadium: "AT&T Stadium", city: "Arlington, TX" },
    { opp: "Sweden", start: "2026-06-20T17:00:00Z", stadium: "NRG Stadium", city: "Houston, TX" },
    { opp: "Tunisia", start: "2026-06-25T23:00:00Z", stadium: "Arrowhead Stadium", city: "Kansas City, MO" },
  ],
  England: [
    { opp: "Croatia", start: "2026-06-17T20:00:00Z", stadium: "AT&T Stadium", city: "Arlington, TX" },
    { opp: "Ghana", start: "2026-06-23T20:00:00Z", stadium: "Gillette Stadium", city: "Foxborough, MA" },
    { opp: "Panama", start: "2026-06-27T21:00:00Z", stadium: "MetLife Stadium", city: "East Rutherford, NJ" },
  ],
  Argentina: [
    { opp: "Algeria", start: "2026-06-17T01:00:00Z", stadium: "Arrowhead Stadium", city: "Kansas City, MO" },
    { opp: "Austria", start: "2026-06-22T17:00:00Z", stadium: "AT&T Stadium", city: "Arlington, TX" },
    { opp: "Jordan", start: "2026-06-28T02:00:00Z", stadium: "AT&T Stadium", city: "Arlington, TX" },
  ],
  France: [
    { opp: "Senegal", start: "2026-06-16T19:00:00Z", stadium: "MetLife Stadium", city: "East Rutherford, NJ" },
    { opp: "Iraq", start: "2026-06-22T21:00:00Z", stadium: "Lincoln Financial Field", city: "Philadelphia, PA" },
    { opp: "Norway", start: "2026-06-26T19:00:00Z", stadium: "Gillette Stadium", city: "Foxborough, MA" },
  ],
  "Ivory Coast": [
    { opp: "Ecuador", start: "2026-06-14T23:00:00Z", stadium: "Lincoln Financial Field", city: "Philadelphia, PA" },
    { opp: "Germany", start: "2026-06-20T20:00:00Z", stadium: "BMO Field", city: "Toronto, ON" },
    { opp: "Curaçao", start: "2026-06-25T20:00:00Z", stadium: "Lincoln Financial Field", city: "Philadelphia, PA" },
  ],
  Uruguay: [
    { opp: "Saudi Arabia", start: "2026-06-15T22:00:00Z", stadium: "Hard Rock Stadium", city: "Miami, FL" },
    { opp: "Cape Verde", start: "2026-06-21T22:00:00Z", stadium: "Hard Rock Stadium", city: "Miami, FL" },
    { opp: "Spain", start: "2026-06-27T00:00:00Z", stadium: "Estadio Akron", city: "Guadalajara, MX" },
  ],
  Turkey: [
    { opp: "Australia", start: "2026-06-13T04:00:00Z", stadium: "BC Place", city: "Vancouver, BC" },
    { opp: "Paraguay", start: "2026-06-19T04:00:00Z", stadium: "Levi's Stadium", city: "Santa Clara, CA" },
    { opp: "USA", start: "2026-06-26T02:00:00Z", stadium: "SoFi Stadium", city: "Inglewood, CA" },
  ],
  Belgium: [
    { opp: "Egypt", start: "2026-06-15T19:00:00Z", stadium: "Lumen Field", city: "Seattle, WA" },
    { opp: "Iran", start: "2026-06-21T19:00:00Z", stadium: "SoFi Stadium", city: "Inglewood, CA" },
    { opp: "New Zealand", start: "2026-06-27T03:00:00Z", stadium: "BC Place", city: "Vancouver, BC" },
  ],
};

const FLAG = {
  Portugal: "🇵🇹", Brazil: "🇧🇷", Netherlands: "🇳🇱", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Argentina: "🇦🇷",
  Morocco: "🇲🇦", France: "🇫🇷", "Ivory Coast": "🇨🇮", Uruguay: "🇺🇾", Turkey: "🇹🇷", Belgium: "🇧🇪",
};

const PLAYERS = [
  { id: "bruno", name: "Bruno Fernandes", nation: "Portugal", wiki: "Bruno_Fernandes",
    position: "Attacking midfielder", role: "Manchester United captain and creative talisman",
    bio: [
      "United's captain since 2023 and the team's heartbeat; joined from Sporting CP in January 2020.",
      "Broke the Premier League single-season assist record (21) in 2025–26 and won both the FWA and Premier League Player of the Season.",
      "Elite penalty taker and set-piece deliverer with a habit of scoring spectacular long-range goals.",
      "A Portugal mainstay with 80+ caps, long playing alongside Cristiano Ronaldo.",
      "Style: relentless energy, vision and visible leadership — when he plays well, United usually do.",
    ] },
  { id: "dalot", name: "Diogo Dalot", nation: "Portugal", wiki: "Diogo_Dalot",
    position: "Full-back", role: "First-choice right-back, can fill in at left-back",
    bio: [
      "Versatile full-back comfortable on either flank; United's regular right-back.",
      "A Porto academy product who joined United in 2018.",
      "Tireless up and down the touchline with much-improved defending.",
      "An established Portugal international valued for stamina and tactical flexibility.",
      "Style: attacking, high-energy, dependable two-way output.",
    ] },
  { id: "casemiro", name: "Casemiro", nation: "Brazil", wiki: "Casemiro",
    position: "Defensive midfielder", role: "United's midfield anchor and enforcer",
    bio: [
      "Holding midfielder who shields the back line; joined United from Real Madrid in 2022.",
      "Five-time Champions League winner — one of the most decorated midfielders of his era.",
      "Surprisingly prolific in 2025–26, scoring nine league goals from deep.",
      "Hugely experienced Brazil international and on-field leader.",
      "Style: positional discipline, ferocious tackling, late runs — but picks up plenty of cards.",
    ] },
  { id: "cunha", name: "Matheus Cunha", nation: "Brazil", wiki: "Matheus_Cunha",
    position: "Forward / attacking midfielder", role: "Club-record-fee signing, creative front-man",
    bio: [
      "Versatile forward who can play as a 9, a 10 or off the left; a £62.5m signing from Wolves in 2025.",
      "One of United's top scorers in 2025–26 (10 league goals) in his debut season.",
      "An Olympic gold medallist with Brazil at the Tokyo 2020 Games.",
      "Brings flair, fight and fan-favourite energy.",
      "Style: creative, press-resistant and combative in tight spaces.",
    ] },
  { id: "deligt", name: "Matthijs de Ligt", nation: "Netherlands", wiki: "Matthijs_de_Ligt",
    position: "Centre-back", role: "Senior central defender and organiser",
    bio: [
      "Commanding centre-back who joined United from Bayern Munich in 2024.",
      "Former Ajax captain who reached a Champions League semi-final as a teenager and won the 2018 Golden Boy award.",
      "Scored a dramatic stoppage-time equaliser at Tottenham in November 2025.",
      "A long-serving Netherlands international and natural leader.",
      "Style: aggressive front-foot defending, strong in the air, composed in possession.",
    ] },
  { id: "zirkzee", name: "Joshua Zirkzee", nation: "Netherlands", wiki: "Joshua_Zirkzee",
    position: "Forward", role: "Rotation centre-forward / link striker",
    bio: [
      "Technical centre-forward and squad option, signed from Bologna in 2024.",
      "Developed at Bayern Munich before breaking out in Serie A.",
      "Chipped in important goals from the bench in 2025–26.",
      "Capped by the Netherlands, though his World Cup squad place is not guaranteed.",
      "Style: hold-up play, a soft first touch and clever combination football.",
    ] },
  { id: "maguire", name: "Harry Maguire", nation: "England", wiki: "Harry_Maguire",
    position: "Centre-back", role: "Experienced defender and former captain",
    bio: [
      "Experienced central defender and a former United captain.",
      "Signed for £80m in 2019 — once the world's most expensive defender.",
      "Reinvented himself as a dependable leader; scored the winner at Liverpool in October 2025.",
      "An England regular since the 2018 World Cup with a strong tournament record.",
      "Style: aerial dominance at both ends, a set-piece threat, and an occasional emergency striker.",
    ] },
  { id: "shaw", name: "Luke Shaw", nation: "England", wiki: "Luke_Shaw",
    position: "Left-back / centre-back", role: "First-choice left-sided defender",
    bio: [
      "Left-sided defender who was ever-present across the 2025–26 league season.",
      "Joined United from Southampton back in 2014.",
      "Scored in the Euro 2020 final — the fastest goal in a European Championship final.",
      "Battled back from years of injuries to reclaim a key role for club and country.",
      "Style: overlapping runs, a quality left foot and the ability to cover centre-back.",
    ] },
  { id: "mainoo", name: "Kobbie Mainoo", nation: "England", wiki: "Kobbie_Mainoo",
    position: "Central midfielder", role: "Academy graduate, ball-progressing midfielder",
    bio: [
      "Composed central midfielder and a homegrown academy graduate.",
      "Burst onto the scene in 2023–24 and scored in the FA Cup final win over Manchester City.",
      "Found the net against Liverpool in May 2026.",
      "A young England international tipped for a long career at the top.",
      "Style: calm under pressure, smart ball progression and maturity beyond his years.",
    ] },
  { id: "mount", name: "Mason Mount", nation: "England", wiki: "Mason_Mount",
    position: "Attacking midfielder", role: "Versatile midfielder / forward",
    bio: [
      "Versatile attacking midfielder who joined from Chelsea in 2023.",
      "Two-time Chelsea Player of the Year and a 2021 Champions League winner.",
      "After an injury-disrupted spell, contributed goals in 2025–26 (Sunderland, Crystal Palace, Wolves).",
      "An England international from the Southgate era.",
      "Style: tireless pressing, late runs and two-footed finishing — fitness is key to his involvement.",
    ] },
  { id: "licha", name: "Lisandro Martínez", nation: "Argentina", wiki: "Lisandro_Martínez",
    position: "Centre-back", role: "Combative ball-playing defender",
    bio: [
      "Aggressive left-footed centre-back nicknamed 'The Butcher' (El Carnicero).",
      "Joined United from Ajax in 2022.",
      "A 2022 World Cup winner with Argentina.",
      "Returned from a long knee injury during the 2025–26 season.",
      "Style: ferocious in duels and excellent on the ball despite a smaller frame for a defender.",
    ] },
  { id: "mazraoui", name: "Noussair Mazraoui", nation: "Morocco", wiki: "Noussair_Mazraoui",
    position: "Full-back", role: "Versatile defender across the back line",
    bio: [
      "Versatile right-back who can also play left-back or in midfield; signed from Bayern in 2024.",
      "A key figure in Morocco's historic run to the 2022 World Cup semi-finals.",
      "An Ajax academy product with Champions League pedigree.",
      "Reliable two-way full-back for club and country.",
      "Style: tidy in possession, tactically intelligent and defensively solid.",
    ] },
  { id: "yoro", name: "Leny Yoro", nation: "France", wiki: "Leny_Yoro",
    position: "Centre-back", role: "Highly-rated young central defender",
    bio: [
      "Young centre-back signed from Lille in 2024 as one of Europe's brightest prospects.",
      "Overcame an early foot injury to establish himself in the side in 2025–26.",
      "A France youth standout now pushing into the senior set-up.",
      "Style: pace, sharp recovery defending, composure and aerial ability — a very high ceiling.",
    ] },
  { id: "amad", name: "Amad Diallo", nation: "Ivory Coast", wiki: "Amad_Diallo",
    position: "Winger / wing-back", role: "Direct, creative wide attacker",
    bio: [
      "Right winger or attacking wing-back who joined from Atalanta in 2021.",
      "Scored a dramatic late FA Cup winner in the Manchester derby — an instant fan favourite.",
      "An Ivory Coast international full of flair and unpredictability.",
      "Productive in 2025–26 with goals against Nottingham Forest and Bournemouth.",
      "Style: low centre of gravity, fearless dribbling and creativity in tight areas.",
    ] },
  { id: "ugarte", name: "Manuel Ugarte", nation: "Uruguay", wiki: "Manuel_Ugarte",
    position: "Defensive midfielder", role: "Ball-winning holding midfielder",
    bio: [
      "Holding midfielder who joined from Paris Saint-Germain in 2024.",
      "A Uruguay international known for aggressive ball-winning.",
      "Developed at Sporting CP before his move to PSG.",
      "Provides bite, energy and defensive cover in midfield.",
      "Style: tackles, interceptions and high pressing — a classic destroyer at the base of midfield.",
    ] },
  { id: "bayindir", name: "Altay Bayındır", nation: "Turkey", wiki: "Altay_Bayındır",
    position: "Goalkeeper", role: "Squad goalkeeper",
    bio: [
      "Goalkeeper who pushed for United's number one shirt before Senne Lammens' arrival.",
      "Signed from Fenerbahçe in 2023.",
      "An experienced Turkey international keeper.",
      "Style: a strong shot-stopper who is comfortable with the ball at his feet.",
      "Likely a backup option for Turkey at the tournament.",
    ] },
  { id: "lammens", name: "Senne Lammens", nation: "Belgium", wiki: "Senne_Lammens",
    position: "Goalkeeper", role: "First-choice goalkeeper",
    bio: [
      "Goalkeeper who became United's first choice during 2025–26 after a move from Royal Antwerp.",
      "A young Belgian shot-stopper who settled quickly at Old Trafford.",
      "Tall and commanding in his box.",
      "Style: sharp reflexes and modern, ball-playing distribution.",
      "An emerging option in the Belgium goalkeeping pool.",
    ] },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtDate = (iso) => {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} · ${hh}:${mm} UTC`;
};
const shortDate = (iso) => {
  const d = new Date(iso);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} · ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
};
const initials = (n) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

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

function buildCards() {
  const cards = [];
  PLAYERS.forEach((p) => {
    (FIXTURES[p.nation] || []).forEach((fx, idx) => {
      cards.push({ id: `${p.id}-${idx}`, player: p, nation: p.nation, opponent: fx.opp, start: fx.start, stadium: fx.stadium, city: fx.city });
    });
  });
  cards.sort((a, b) => new Date(a.start) - new Date(b.start) || a.player.name.localeCompare(b.player.name));
  return cards;
}

function eventFor(card) {
  const summary = `${card.player.name} (${card.nation}) vs ${card.opponent} — 2026 World Cup`;
  const desc = card.player.bio.map((b) => "• " + b).join("\n");
  const lines = [
    "BEGIN:VEVENT",
    `UID:${card.id}@manutd-wc2026`,
    `DTSTAMP:${icsStamp("2026-06-10T00:00:00Z")}`,
    `DTSTART:${icsStamp(card.start)}`,
    `DTEND:${icsStamp(addHours(card.start, 2))}`,
    `SUMMARY:${esc(summary)}`,
    `LOCATION:${esc(card.stadium + ", " + card.city)}`,
    `DESCRIPTION:${esc(card.player.position + " · " + card.player.role + "\n\n" + desc)}`,
    "END:VEVENT",
  ];
  return lines.map(fold).join("\r\n");
}

function buildICS(cards) {
  const head = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//Manchester United//World Cup 2026 Tracker//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Man Utd at the 2026 World Cup",
  ].map(fold).join("\r\n");
  return head + "\r\n" + cards.map(eventFor).join("\r\n") + "\r\nEND:VCALENDAR\r\n";
}

function download(filename, text) {
  const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const CSS = `
.muwc *{box-sizing:border-box}
.muwc{--pitch:#1f8a4c;--pitch-dark:#12592f;--ink:#16241c;--muted:#5d6b62;--bg:#f4f7f4;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  color:var(--ink);display:flex;flex-direction:column;height:100vh;max-width:1180px;margin:0 auto;background:var(--bg)}
.muwc .topbar{position:relative;color:#fff;padding:18px 22px;overflow:hidden;flex:0 0 auto;
  background:linear-gradient(135deg,#1f8a4c,#12592f)}
.muwc .stripes{position:absolute;inset:0;opacity:.5;background:repeating-linear-gradient(90deg,transparent 0 64px,rgba(255,255,255,.045) 64px 128px)}
.muwc .midline{position:absolute;left:0;right:0;bottom:0;height:2px;background:rgba(255,255,255,.22)}
.muwc .row{position:relative;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.muwc h1{margin:0;font-size:19px;font-weight:700;letter-spacing:-.2px}
.muwc .brand p{margin:3px 0 0;font-size:12.5px;color:rgba(255,255,255,.82)}
.muwc .dlbtn{border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.12);color:#fff;font-weight:600;
  font-size:13px;padding:9px 14px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
.muwc .dlbtn:hover{background:rgba(255,255,255,.22)}
.muwc .dlbtn svg{width:15px;height:15px}
.muwc .main{display:flex;min-height:0;flex:1 1 auto}
.muwc .list{width:42%;max-width:480px;min-width:300px;border-right:1px solid #e4eae5;overflow-y:auto;background:#fff}
.muwc .detail{flex:1 1 auto;overflow-y:auto;background:var(--bg)}
.muwc .filterbar{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid #e9efe9;padding:10px 14px;
  display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.muwc .count{font-size:12px;color:var(--muted);margin-left:auto}
.muwc select{font:inherit;font-size:12.5px;padding:6px 8px;border:1px solid #d7e0d8;border-radius:8px;background:#fff;color:var(--ink)}
.muwc .card{display:flex;gap:12px;align-items:center;padding:13px 14px;cursor:pointer;border-bottom:1px solid #eef2ee;background:#fff}
.muwc .card:hover{background:#f3f8f3}
.muwc .card.active{background:#eaf5ec;box-shadow:inset 3px 0 0 var(--pitch)}
.muwc .avatar{width:46px;height:46px;border-radius:50%;flex:0 0 auto;object-fit:cover;background:var(--pitch);color:#fff;
  display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;border:2px solid #fff;box-shadow:0 0 0 1px #dfe7e0;overflow:hidden}
.muwc .ctext{min-width:0;flex:1}
.muwc .ctitle{font-size:14px;font-weight:650;line-height:1.25}
.muwc .csub{font-size:12px;color:var(--muted);margin-top:3px;display:flex;gap:8px;flex-wrap:wrap}
.muwc .pill{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--pitch-dark);background:#e7f3ea;border-radius:999px;padding:2px 7px}
.muwc .detailwrap{padding:24px 28px 60px;max-width:680px}
.muwc .empty{display:flex;height:100%;align-items:center;justify-content:center;color:var(--muted);font-size:14px;text-align:center;padding:40px}
.muwc .dhead{display:flex;gap:16px;align-items:center}
.muwc .dhead .avatar{width:74px;height:74px;font-size:24px}
.muwc .dhead h2{margin:0;font-size:22px;letter-spacing:-.3px}
.muwc .meta{font-size:13px;color:var(--muted);margin-top:4px}
.muwc .matchbox,.muwc .biocard{margin-top:20px;background:#fff;border:1px solid #e4eae5;border-radius:14px;padding:16px 18px;
  box-shadow:0 1px 3px rgba(16,40,24,.10),0 6px 18px rgba(16,40,24,.06);position:relative;overflow:hidden}
.muwc .pitchline{position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(#1f8a4c,#12592f)}
.muwc .vs{font-size:17px;font-weight:700}
.muwc .vs .nat{color:var(--pitch-dark)}
.muwc .mrow{display:flex;gap:9px;font-size:13.5px;margin-top:9px;color:#28342c}
.muwc .mrow .k{color:var(--muted);min-width:74px;flex:0 0 auto}
.muwc .biocard h3{margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:var(--pitch-dark)}
.muwc .biocard .role{font-size:12.5px;color:var(--muted);margin-bottom:10px}
.muwc .biocard ul{margin:0;padding-left:18px}
.muwc .biocard li{font-size:13.5px;line-height:1.5;margin-bottom:7px}
.muwc .dactions{margin-top:18px;display:flex;gap:10px;flex-wrap:wrap}
.muwc .dlbtn.alt{border-color:var(--pitch);background:var(--pitch);color:#fff}
.muwc .dlbtn.alt:hover{background:var(--pitch-dark)}
.muwc .foot{font-size:11px;color:var(--muted);margin-top:26px;line-height:1.5}
@media(max-width:720px){.muwc .main{flex-direction:column}.muwc .list{width:100%;max-width:none;border-right:none;border-bottom:1px solid #e4eae5;max-height:42vh}}
`;

const avatarCache = {};
function Avatar({ player, size }) {
  const [src, setSrc] = useState(avatarCache[player.wiki] || null);
  const [failed, setFailed] = useState(avatarCache[player.wiki] === null);
  useEffect(() => {
    let alive = true;
    if (avatarCache[player.wiki]) { setSrc(avatarCache[player.wiki]); return; }
    if (avatarCache[player.wiki] === null) { setFailed(true); return; }
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(player.wiki)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        const t = j && j.thumbnail && j.thumbnail.source;
        if (!alive) return;
        if (t) { avatarCache[player.wiki] = t; setSrc(t); }
        else { avatarCache[player.wiki] = null; setFailed(true); }
      })
      .catch(() => { if (alive) { avatarCache[player.wiki] = null; setFailed(true); } });
    return () => { alive = false; };
  }, [player.wiki]);
  const style = size ? { width: size, height: size, fontSize: Math.round(size * 0.33) } : undefined;
  if (src && !failed) return <img className="avatar" style={style} src={src} alt={player.name} onError={() => setFailed(true)} />;
  return <div className="avatar" style={style} title={player.name}>{initials(player.name)}</div>;
}

function Card({ card, active, onClick }) {
  return (
    <div className={"card" + (active ? " active" : "")} onClick={onClick}>
      <Avatar player={card.player} />
      <div className="ctext">
        <div className="ctitle">{card.player.name} <span style={{ color: "#1f8a4c" }}>({card.nation})</span> vs {card.opponent}</div>
        <div className="csub"><span>{shortDate(card.start)}</span></div>
        <div className="csub"><span className="pill">{FLAG[card.nation]} {card.nation}</span><span>{card.stadium}, {card.city}</span></div>
      </div>
    </div>
  );
}

function Detail({ card }) {
  if (!card) return <div className="empty">Select a match on the left to see the player profile, venue details, and a per-match calendar download.</div>;
  const p = card.player;
  return (
    <div className="detailwrap">
      <div className="dhead">
        <Avatar player={p} size={74} />
        <div><h2>{p.name}</h2><div className="meta">{FLAG[card.nation]} {card.nation} · {p.position}</div></div>
      </div>
      <div className="matchbox">
        <div className="pitchline" />
        <div className="vs"><span className="nat">{p.name} ({card.nation})</span> vs {card.opponent}</div>
        <div className="mrow"><span className="k">Kick-off</span><span>{fmtDate(card.start)}</span></div>
        <div className="mrow"><span className="k">Stadium</span><span>{card.stadium}</span></div>
        <div className="mrow"><span className="k">City</span><span>{card.city}</span></div>
        <div className="mrow"><span className="k">Fixture</span><span>2026 FIFA World Cup · Group stage</span></div>
      </div>
      <div className="biocard">
        <h3>Player profile</h3>
        <div className="role">{p.role}</div>
        <ul>{p.bio.map((b, i) => <li key={i}>{b}</li>)}</ul>
      </div>
      <div className="dactions">
        <button className="dlbtn alt" onClick={() => download(`${p.id}-vs-${card.opponent.toLowerCase().replace(/\s+/g, "-")}.ics`, buildICS([card]))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
          Download this match (.ics)
        </button>
      </div>
      <div className="foot">Kick-off times shown in UTC. Group-stage fixtures are confirmed; knockout opponents depend on results and are not included. Headshots load live from the Wikipedia REST API.</div>
    </div>
  );
}

export default function ManUtdWorldCup2026() {
  const allCards = useMemo(buildCards, []);
  const [sel, setSel] = useState(null);
  const [nation, setNation] = useState("All");
  const nations = useMemo(() => ["All", ...Array.from(new Set(allCards.map((c) => c.nation))).sort()], [allCards]);
  const cards = useMemo(() => (nation === "All" ? allCards : allCards.filter((c) => c.nation === nation)), [allCards, nation]);
  const selectedCard = allCards.find((c) => c.id === sel) || null;

  return (
    <div className="muwc">
      <style>{CSS}</style>
      <div className="topbar">
        <div className="stripes" /><div className="midline" />
        <div className="row">
          <div className="brand">
            <h1>Manchester United at the 2026 World Cup</h1>
            <p>{allCards.length} group-stage matches featuring a current United player · 17 players · 11 nations</p>
          </div>
          <button className="dlbtn" onClick={() => download("man-utd-world-cup-2026.ics", buildICS(allCards))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
            Download .ics
          </button>
        </div>
      </div>
      <div className="main">
        <div className="list">
          <div className="filterbar">
            <label style={{ fontSize: "12px", color: "#5d6b62" }}>Nation</label>
            <select value={nation} onChange={(e) => setNation(e.target.value)}>
              {nations.map((n) => <option key={n} value={n}>{n === "All" ? "All nations" : n}</option>)}
            </select>
            <span className="count">{cards.length} matches</span>
          </div>
          {cards.map((c) => <Card key={c.id} card={c} active={c.id === sel} onClick={() => setSel(c.id)} />)}
        </div>
        <div className="detail"><Detail card={selectedCard} /></div>
      </div>
    </div>
  );
}
