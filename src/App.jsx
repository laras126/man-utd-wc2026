import React, { useState, useEffect, useMemo } from "react";
import { PLAYERS, NATION_CODES } from "./players.js";
import { buildICS, eventFor } from "./ics-utils.js";

const MATCHES_URL = "https://wheniskickoff.com/data/v1/matches.json";

const CODE_TO_NATION = Object.fromEntries(
  Object.entries(NATION_CODES).map(([n, c]) => [c, n])
);

const PHASE_LABEL = {
  group: "Group stage",
  "last-32": "Round of 32",
  "round-of-16": "Round of 16",
  "quarter-final": "Quarter-final",
  "semi-final": "Semi-final",
  final: "Final",
};

const FLAG = {
  Portugal: "🇵🇹", Brazil: "🇧🇷", Netherlands: "🇳🇱", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Argentina: "🇦🇷",
  Morocco: "🇲🇦", France: "🇫🇷", "Ivory Coast": "🇨🇮", Uruguay: "🇺🇾", Turkey: "🇹🇷", Belgium: "🇧🇪",
};

const ET_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short", day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
});

const getETParts = (iso) =>
  Object.fromEntries(ET_FMT.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));

const fmtDate = (iso) => {
  const p = getETParts(iso);
  const hh = p.hour === "24" ? "00" : p.hour;
  return `${p.weekday} ${p.day} ${p.month} ${p.year} · ${hh}:${p.minute} ET`;
};
const shortDate = (iso) => {
  const p = getETParts(iso);
  const hh = p.hour === "24" ? "00" : p.hour;
  return `${p.weekday} ${p.day} ${p.month} · ${hh}:${p.minute} ET`;
};
const initials = (n) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

function buildCards(matches) {
  const cards = [];
  matches.forEach((match) => {
    const { num, datetime_utc, home, away, home_name, away_name, venue_name, venue_city, phase } = match;
    if (!home || !away) return;
    const homeNation = CODE_TO_NATION[home] || null;
    const awayNation = CODE_TO_NATION[away] || null;
    if (!homeNation && !awayNation) return;
    [
      homeNation && { nation: homeNation, opponent: away_name },
      awayNation && { nation: awayNation, opponent: home_name },
    ].filter(Boolean).forEach(({ nation, opponent }) => {
      PLAYERS.filter((p) => p.nation === nation).forEach((player) => {
        cards.push({ id: `${player.id}-${num}`, player, nation, opponent, start: datetime_utc, stadium: venue_name, city: venue_city, phase });
      });
    });
  });
  cards.sort((a, b) => new Date(a.start) - new Date(b.start) || a.player.name.localeCompare(b.player.name));
  return cards;
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
.muwc .btns{display:flex;gap:8px;flex-wrap:wrap}
.muwc .dlbtn{border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.12);color:#fff;font-weight:600;
  font-size:13px;padding:9px 14px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;text-decoration:none}
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
  const phaseLabel = PHASE_LABEL[card.phase] || card.phase;
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
        <div className="mrow"><span className="k">Fixture</span><span>2026 FIFA World Cup · {phaseLabel}</span></div>
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
      <div className="foot">Kick-off times shown in ET (Eastern Time). Knockout-stage opponents appear automatically once results are known. Headshots load live from the Wikipedia REST API.</div>
    </div>
  );
}

export default function ManUtdWorldCup2026() {
  const [matchData, setMatchData] = useState(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch(MATCHES_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setMatchData(j.data))
      .catch(() => setFetchError(true));
  }, []);

  const allCards = useMemo(() => (matchData ? buildCards(matchData) : []), [matchData]);
  const [sel, setSel] = useState(null);
  const [nation, setNation] = useState("All");
  const nations = useMemo(() => ["All", ...Array.from(new Set(allCards.map((c) => c.nation))).sort()], [allCards]);
  const cards = useMemo(() => (nation === "All" ? allCards : allCards.filter((c) => c.nation === nation)), [allCards, nation]);
  const selectedCard = allCards.find((c) => c.id === sel) || null;

  const icsSubscribeUrl = typeof window !== "undefined"
    ? window.location.href.split("?")[0].replace(/\/?$/, "/") + "man-utd-wc2026.ics"
    : "";
  const webcalUrl = icsSubscribeUrl.replace(/^https?:\/\//, "webcal://");

  if (fetchError) {
    return (
      <div className="muwc">
        <style>{CSS}</style>
        <div className="empty" style={{ height: "100vh" }}>Failed to load fixture data — please try refreshing.</div>
      </div>
    );
  }

  const loading = !matchData;

  return (
    <div className="muwc">
      <style>{CSS}</style>
      <div className="topbar">
        <div className="stripes" /><div className="midline" />
        <div className="row">
          <div className="brand">
            <h1>Manchester United at the 2026 World Cup</h1>
            {loading
              ? <p>Loading fixtures…</p>
              : <p>{allCards.length} match appearances · {PLAYERS.length} players · {Object.keys(NATION_CODES).length} nations</p>}
          </div>
          <div className="btns">
            <button className="dlbtn" disabled={loading} onClick={() => download("man-utd-world-cup-2026.ics", buildICS(allCards))}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
              Download .ics
            </button>
            {icsSubscribeUrl && (
              <a className="dlbtn" href={webcalUrl}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Subscribe
              </a>
            )}
          </div>
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
          {loading
            ? <div className="empty" style={{ height: 200 }}>Loading…</div>
            : cards.map((c) => <Card key={c.id} card={c} active={c.id === sel} onClick={() => setSel(c.id)} />)}
        </div>
        <div className="detail"><Detail card={selectedCard} /></div>
      </div>
    </div>
  );
}
