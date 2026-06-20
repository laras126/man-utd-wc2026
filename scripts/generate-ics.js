import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PLAYERS, NATION_CODES } from "../src/players.js";
import { buildICS } from "../src/ics-utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MATCHES_URL = "https://wheniskickoff.com/data/v1/matches.json";

const CODE_TO_NATION = Object.fromEntries(
  Object.entries(NATION_CODES).map(([n, c]) => [c, n])
);

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

const res = await fetch(MATCHES_URL);
if (!res.ok) throw new Error(`Failed to fetch matches: ${res.status}`);
const json = await res.json();
const { data: matches } = json;

const jsonPath = join(__dirname, "../public/matches.json");
writeFileSync(jsonPath, JSON.stringify(json), "utf8");
console.log(`Saved ${jsonPath}`);

const cards = buildCards(matches);
const ics = buildICS(cards);

const outPath = join(__dirname, "../public/man-utd-wc2026.ics");
writeFileSync(outPath, ics, "utf8");
console.log(`Generated ${outPath} (${cards.length} events)`);
