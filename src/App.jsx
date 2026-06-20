import React, { useState, useEffect, useMemo, useRef } from "react";
import { PLAYERS, NATION_CODES } from "./players.js";
import { buildICS, eventFor } from "./ics-utils.js";

const MATCHES_URL = import.meta.env.BASE_URL + "matches.json";

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
    const { num, datetime_utc, home, away, home_name, away_name, venue_name, venue_city, phase, score_home, score_away, status } = match;
    if (!home || !away) return;
    const homeNation = CODE_TO_NATION[home] || null;
    const awayNation = CODE_TO_NATION[away] || null;
    if (!homeNation && !awayNation) return;
    [
      homeNation && { nation: homeNation, opponent: away_name, scoreFor: score_home, scoreAgainst: score_away },
      awayNation && { nation: awayNation, opponent: home_name, scoreFor: score_away, scoreAgainst: score_home },
    ].filter(Boolean).forEach(({ nation, opponent, scoreFor, scoreAgainst }) => {
      PLAYERS.filter((p) => p.nation === nation).forEach((player) => {
        cards.push({ id: `${player.id}-${num}`, num, player, nation, opponent, start: datetime_utc, stadium: venue_name, city: venue_city, phase, scoreFor, scoreAgainst, status });
      });
    });
  });
  cards.sort((a, b) => new Date(a.start) - new Date(b.start) || a.player.name.localeCompare(b.player.name));
  return cards;
}

function buildMatchGroups(matches, cards) {
  const byNum = {};
  cards.forEach((card) => {
    if (!byNum[card.num]) byNum[card.num] = [];
    byNum[card.num].push(card);
  });
  return matches
    .filter((m) => byNum[m.num])
    .map((m) => ({
      num: m.num,
      start: m.datetime_utc,
      home_name: m.home_name,
      away_name: m.away_name,
      stadium: m.venue_name,
      city: m.venue_city,
      phase: m.phase,
      score_home: m.score_home,
      score_away: m.score_away,
      status: m.status,
      cards: byNum[m.num],
    }))
    .sort((a, b) => new Date(a.start) - new Date(b.start));
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
.muwc .topbar{position:relative;color:#fff;padding:18px 22px;flex:0 0 auto;
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
.muwc .back-btn{display:none;align-items:center;gap:6px;width:100%;padding:13px 18px;font:inherit;font-size:14px;font-weight:600;color:var(--pitch-dark);background:#fff;border:none;border-bottom:1px solid #e4eae5;cursor:pointer;text-align:left;flex-shrink:0}
.muwc .back-btn:hover{background:#f3f8f3}
@media(max-width:720px){
  .muwc .main{flex-direction:column}
  .muwc .list{width:100%;max-width:none;border-right:none;border-bottom:none;flex:1 1 auto}
  .muwc .detail{position:fixed;inset:0;z-index:200;transform:translateX(100%);transition:transform .25s cubic-bezier(.4,0,.2,1);overflow-y:auto;display:flex;flex-direction:column}
  .muwc .detail.open{transform:translateX(0)}
  .muwc .back-btn{display:flex}
}
.muwc .tabs{display:flex;gap:4px;margin-right:4px}
.muwc .tab{font:inherit;font-size:12.5px;font-weight:600;padding:6px 12px;border:1px solid #d7e0d8;border-radius:8px;background:#fff;color:var(--muted);cursor:pointer}
.muwc .tab.active{background:var(--pitch);color:#fff;border-color:var(--pitch)}
.muwc .mhead{margin:0 0 4px;font-size:17px;font-weight:700;letter-spacing:-.2px}
.muwc .mcard-players{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
.muwc .result{font-size:11px;font-weight:700;border-radius:999px;padding:2px 7px;letter-spacing:.3px;flex-shrink:0}
.muwc .result-W{color:#0a5c2b;background:#d4edda}
.muwc .result-D{color:#5d6b62;background:#e8eceb}
.muwc .result-L{color:#8b1a1a;background:#fde8e8}
.muwc .past-toggle{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--muted);cursor:pointer;user-select:none;white-space:nowrap}
.muwc .past-toggle input{cursor:pointer;accent-color:var(--pitch)}
.muwc .sub-wrap{position:relative}
.muwc .sub-menu{position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid #e4eae5;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.14);min-width:192px;z-index:1000;overflow:hidden}
.muwc .sub-item{display:flex;align-items:center;gap:9px;width:100%;padding:10px 14px;font:inherit;font-size:13px;color:var(--ink);background:none;border:none;cursor:pointer;text-decoration:none;text-align:left;white-space:nowrap}
.muwc .sub-item:hover{background:#f3f8f3}
.muwc .sub-item+.sub-item{border-top:1px solid #f0f4f0}
.muwc .sub-chevron{font-size:10px;margin-left:3px;opacity:.7}
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
        <div className="csub">
          <span>{shortDate(card.start)}</span>
          {card.status === "FINISHED" && (() => {
            const r = card.scoreFor > card.scoreAgainst ? "W" : card.scoreFor < card.scoreAgainst ? "L" : "D";
            return <span className={`result result-${r}`}>{r} {card.scoreFor}–{card.scoreAgainst}</span>;
          })()}
        </div>
        <div className="csub"><span className="pill">{FLAG[card.nation]} {card.nation}</span><span>{card.stadium}, {card.city}</span></div>
      </div>
    </div>
  );
}

function Detail({ card, onClose }) {
  if (!card) return <div className="empty">Select a match on the left to see the player profile, venue details, and a per-match calendar download.</div>;
  const p = card.player;
  const phaseLabel = PHASE_LABEL[card.phase] || card.phase;
  return (
    <>
    <button className="back-btn" onClick={onClose}>‹ Back</button>
    <div className="detailwrap">
      <div className="dhead">
        <Avatar player={p} size={74} />
        <div><h2>{p.name}</h2><div className="meta">{FLAG[card.nation]} {card.nation} · {p.position}</div></div>
      </div>
      <div className="matchbox">
        <div className="pitchline" />
        <div className="vs"><span className="nat">{p.name} ({card.nation})</span> vs {card.opponent}</div>
        <div className="mrow"><span className="k">Kick-off</span><span>{fmtDate(card.start)}</span></div>
        {card.status === "FINISHED" && (() => {
          const r = card.scoreFor > card.scoreAgainst ? "W" : card.scoreFor < card.scoreAgainst ? "L" : "D";
          return <div className="mrow"><span className="k">Result</span><span className={`result result-${r}`}>{r} {card.scoreFor}–{card.scoreAgainst}</span></div>;
        })()}
        <div className="mrow"><span className="k">Stadium</span><span>{card.stadium}</span></div>
        <div className="mrow"><span className="k">City</span><span>{card.city}</span></div>
        <div className="mrow"><span className="k">Fixture</span><span>2026 FIFA World Cup · {phaseLabel}</span></div>
      </div>
      <div className="biocard">
        <h3>Player profile</h3>
        <div className="role">{p.role}</div>
        <ul>{p.bio.map((b, i) => <li key={i}>{b}</li>)}</ul>
      </div>

      <div className="foot">Kick-off times shown in ET (Eastern Time). Knockout-stage opponents appear automatically once results are known. Headshots load live from the Wikipedia REST API.</div>
    </div>
    </>
  );
}

function MatchCard({ group, active, onClick }) {
  return (
    <div className={"card" + (active ? " active" : "")} onClick={onClick}>
      <div className="ctext">
        <div className="ctitle">
          {group.status === "FINISHED"
            ? <>{group.home_name} <span style={{ fontVariantNumeric: "tabular-nums" }}>{group.score_home}–{group.score_away}</span> {group.away_name}</>
            : <>{group.home_name} vs {group.away_name}</>}
        </div>
        <div className="csub">
          <span>{shortDate(group.start)}</span>
          <span>{group.stadium}, {group.city}</span>
        </div>
        <div className="mcard-players">
          {group.cards.map((c) => (
            <span key={c.player.id} className="pill">{FLAG[c.nation] || ""} {c.player.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchDetail({ group, onClose }) {
  if (!group) return <div className="empty">Select a match on the left to see the fixture details and Man Utd players involved.</div>;
  const phaseLabel = PHASE_LABEL[group.phase] || group.phase;
  return (
    <>
    <button className="back-btn" onClick={onClose}>‹ Back</button>
    <div className="detailwrap">
      <div className="dhead" style={{ alignItems: "flex-start" }}>
        <div>
          <p className="mhead">
            {group.status === "FINISHED"
              ? <>{group.home_name} <span style={{ fontVariantNumeric: "tabular-nums" }}>{group.score_home}–{group.score_away}</span> {group.away_name}</>
              : <>{group.home_name} vs {group.away_name}</>}
          </p>
          <div className="meta">{fmtDate(group.start)}</div>
        </div>
      </div>
      <div className="matchbox">
        <div className="pitchline" />
        <div className="mrow"><span className="k">Stadium</span><span>{group.stadium}</span></div>
        <div className="mrow"><span className="k">City</span><span>{group.city}</span></div>
        <div className="mrow"><span className="k">Fixture</span><span>2026 FIFA World Cup · {phaseLabel}</span></div>
      </div>
      {group.cards.map((c) => (
        <div key={c.player.id} className="biocard" style={{ marginTop: 16 }}>
          <div className="pitchline" />
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <Avatar player={c.player} size={46} />
            <div>
              <div style={{ fontWeight: 650, fontSize: 14 }}>{c.player.name}</div>
              <div className="role">{FLAG[c.nation] || ""} {c.nation} · {c.player.position}</div>
            </div>
          </div>
          <ul>{c.player.bio.map((b, i) => <li key={i}>{b}</li>)}</ul>
        </div>
      ))}

      <div className="foot">Kick-off times shown in ET (Eastern Time). Knockout-stage opponents appear automatically once results are known.</div>
    </div>
    </>
  );
}

function SubscribeDropdown({ icsUrl, webcalUrl }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const copy = () => {
    navigator.clipboard.writeText(icsUrl).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    });
  };

  const googleUrl = `https://calendar.google.com/calendar/r/settings/addbyurl?url=${encodeURIComponent(icsUrl)}`;

  return (
    <div className="sub-wrap" ref={ref}>
      <button className="dlbtn" onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Subscribe <span className="sub-chevron">▾</span>
      </button>
      {open && (
        <div className="sub-menu">
          <a className="sub-item" href={webcalUrl} onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Apple Calendar
          </a>
          <a className="sub-item" href={googleUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Google Calendar
          </a>
          <button className="sub-item" onClick={copy}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {copied ? "Copied!" : "Copy URL"}
          </button>
        </div>
      )}
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
  const [view, setView] = useState("players");
  const [sel, setSel] = useState(null);
  const [selMatch, setSelMatch] = useState(null);
  const [nation, setNation] = useState("All");
  const [showPast, setShowPast] = useState(false);
  const nations = useMemo(() => ["All", ...Array.from(new Set(allCards.map((c) => c.nation))).sort()], [allCards]);
  const cards = useMemo(() => {
    let result = nation === "All" ? allCards : allCards.filter((c) => c.nation === nation);
    if (!showPast) result = result.filter((c) => new Date(c.start) >= new Date());
    return result;
  }, [allCards, nation, showPast]);
  const selectedCard = allCards.find((c) => c.id === sel) || null;
  const allMatchGroups = useMemo(() => (matchData ? buildMatchGroups(matchData, allCards) : []), [matchData, allCards]);
  const matchGroups = useMemo(() => {
    let result = nation === "All" ? allMatchGroups : allMatchGroups.filter((g) => g.cards.some((c) => c.nation === nation));
    if (!showPast) result = result.filter((g) => new Date(g.start) >= new Date());
    return result;
  }, [allMatchGroups, nation, showPast]);
  const selectedGroup = allMatchGroups.find((g) => g.num === selMatch) || null;

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
            {icsSubscribeUrl && <SubscribeDropdown icsUrl={icsSubscribeUrl} webcalUrl={webcalUrl} />}
          </div>
        </div>
      </div>
      <div className="main">
        <div className="list">
          <div className="filterbar">
            <div className="tabs">
              <button className={"tab" + (view === "players" ? " active" : "")} onClick={() => setView("players")}>Players</button>
              <button className={"tab" + (view === "matches" ? " active" : "")} onClick={() => setView("matches")}>Matches</button>
            </div>
            <label style={{ fontSize: "12px", color: "#5d6b62" }}>Nation</label>
            <select value={nation} onChange={(e) => setNation(e.target.value)}>
              {nations.map((n) => <option key={n} value={n}>{n === "All" ? "All nations" : n}</option>)}
            </select>
            <label className="past-toggle">
              <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
              Past
            </label>
            <span className="count">{view === "players" ? `${cards.length} appearances` : `${matchGroups.length} matches`}</span>
          </div>
          {loading
            ? <div className="empty" style={{ height: 200 }}>Loading…</div>
            : view === "players"
              ? cards.map((c) => <Card key={c.id} card={c} active={c.id === sel} onClick={() => setSel(c.id)} />)
              : matchGroups.map((g) => <MatchCard key={g.num} group={g} active={g.num === selMatch} onClick={() => setSelMatch(g.num)} />)}
        </div>
        <div className={"detail" + ((view === "players" ? !!selectedCard : !!selectedGroup) ? " open" : "")}>
          {view === "players"
            ? <Detail card={selectedCard} onClose={() => setSel(null)} />
            : <MatchDetail group={selectedGroup} onClose={() => setSelMatch(null)} />}
        </div>
      </div>
    </div>
  );
}
