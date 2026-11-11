import type { SceneId, Session } from "../src/scenes.ts";
import type { World } from "../src/types.ts";

type Props = {
  scene: SceneId;
  world: World;
  session: Session;
  beat: number;
  shake: boolean;
};

export function Stage({ scene, world, session, beat, shake }: Props) {
  return (
    <div className={shake ? "stage-shake" : undefined} key={beat}>
      <svg viewBox="0 0 640 360" className="block h-auto w-full" role="img" aria-label="The place, as a plate">
        <rect width="640" height="360" fill="var(--color-paper)" />
        <rect x="16" y="16" width="608" height="328" fill="none" stroke="var(--color-ink)" strokeWidth="1.25" />
        {scene === "porch" && <Porch world={world} session={session} />}
        {scene === "vigil" && <Vigil world={world} />}
        {scene === "loft" && <Loft world={world} />}
        {scene === "counter" && <Counter world={world} />}
        {scene === "creek" && <Creek world={world} session={session} />}
        {scene === "orchard" && <Orchard world={world} />}
        {scene === "study" && <Study world={world} session={session} />}
      </svg>
    </div>
  );
}

function Porch({ world, session }: { world: World; session: Session }) {
  const dog = world.enemies.find((e) => e.id === "porch-dog");
  const distracted = dog?.alert === "distracted";
  const bird = session.kit.find((k) => k.lootId.endsWith("001"));
  const winds = bird?.winds ?? 0;
  const friend = world.flags.friendApproaching === true;
  const lane = world.enemies.find((e) => e.id === "lane");
  const kept = world.places.clock?.keptTime === true;
  return (
    <g>
      <rect x="40" y="250" width="560" height="8" fill="var(--color-ink)" />
      <rect x="70" y="120" width="18" height="130" fill="var(--color-brass)" />
      <rect x="540" y="120" width="18" height="130" fill="var(--color-brass)" />
      <rect x="88" y="168" width="220" height="70" fill="none" stroke="var(--color-ink)" />
      <line x1="198" y1="168" x2="198" y2="238" stroke="var(--color-ink)" />
      <line x1="88" y1="203" x2="308" y2="203" stroke="var(--color-ink)" />
      <g className={distracted ? "bird-hop" : undefined}>
        <path d={`M${150 + winds * 6} 156 l18 -6 l-4 10 z`} fill="var(--color-oxide)" />
        <circle cx={166 + winds * 6} cy="150" r="2" fill="var(--color-ink)" />
      </g>
      <g transform={distracted ? "translate(430 210) rotate(-18)" : "translate(400 220)"}>
        <ellipse cx="0" cy="0" rx="36" ry="16" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
        <circle cx="28" cy="-8" r="8" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
        <text x="-18" y="32" fill="var(--color-oxide)" fontSize="11" fontFamily="var(--font-sans)">
          {dog?.alert ?? "idle"}
          {dog && dog.timer > 0 ? ` ${dog.timer}s` : ""}
        </text>
      </g>
      <g transform={lane?.alert === "drawn" ? "translate(500 200)" : "translate(560 230)"}>
        <circle r="7" fill="none" stroke="var(--color-ink)" />
        <line y1="8" y2="28" stroke="var(--color-ink)" />
      </g>
      {friend && (
        <g transform="translate(250 214)">
          <circle r="7" fill="var(--color-pine)" />
          <line y1="8" y2="30" stroke="var(--color-pine)" />
          <text y="46" fill="var(--color-pine)" fontSize="11" fontFamily="var(--font-sans)">
            still in the county
          </text>
        </g>
      )}
      <text x="40" y="300" fill="var(--color-ink-soft)" fontSize="13" fontFamily="var(--font-display)">
        {winds} winds in the bird{kept ? " · the clock kept its time" : ""}
      </text>
    </g>
  );
}

function Vigil({ world }: { world: World }) {
  const lamp = world.lamps[0];
  const mode = lamp?.mode ?? "steady-pool";
  const revealed = world.documents.hymnal?.revealed === true;
  const brix = world.places.cider?.brix;
  return (
    <g>
      <rect x="250" y="70" width="28" height="150" fill="var(--color-brass)" />
      <rect x="236" y="210" width="56" height="10" fill="var(--color-ink)" />
      {mode === "steady-pool" && <ellipse cx="264" cy="150" rx="70" ry="28" fill="var(--color-brass)" opacity="0.35" />}
      {mode === "spectrum-stripe" && (
        <g>
          <polygon points="264,88 520,250 80,250" fill="var(--color-oxide)" opacity="0.18" />
          <polygon points="264,100 470,250 140,250" fill="var(--color-pine)" opacity="0.18" />
          <polygon points="264,112 420,250 200,250" fill="var(--color-brass)" opacity="0.45" />
        </g>
      )}
      {mode === "diffused-stripe" && <ellipse cx="300" cy="190" rx="140" ry="50" fill="var(--color-brass)" opacity="0.28" />}
      {mode === "baffled-warm" && <ellipse cx="264" cy="160" rx="40" ry="16" fill="var(--color-brass)" opacity="0.55" />}
      {lamp?.moths && (
        <g className="moth-drift">
          <circle cx="210" cy="120" r="3" fill="var(--color-ink)" />
          <circle cx="330" cy="110" r="2.5" fill="var(--color-ink)" />
          <circle cx="300" cy="140" r="2" fill="var(--color-ink)" />
        </g>
      )}
      <rect x="80" y="250" width="120" height="46" fill="none" stroke="var(--color-ink)" />
      <text x="90" y="270" fill="var(--color-ink)" fontSize="11" fontFamily="var(--font-sans)">
        hymnal
      </text>
      <text x="90" y="286" fill={revealed ? "var(--color-oxide)" : "var(--color-ink-soft)"} fontSize="11" fontFamily="var(--font-display)">
        {revealed ? "spectrum ink shows" : "page is blank"}
      </text>
      <rect x="470" y="230" width="70" height="40" fill="none" stroke="var(--color-pine)" />
      <text x="480" y="254" fill="var(--color-pine)" fontSize="12" fontFamily="var(--font-sans)">
        {typeof brix === "number" ? `${brix} brix` : "cider"}
      </text>
      <text x="40" y="330" fill="var(--color-ink-soft)" fontSize="13" fontFamily="var(--font-display)">
        {lamp?.kind} · {mode}
      </text>
    </g>
  );
}

function Loft({ world }: { world: World }) {
  const comp = world.compartments[0];
  const open = comp?.unlatched === true;
  const found = comp?.revealed === true;
  const sleeper = world.enemies[0];
  const creak = world.places.room?.creak !== false;
  const cracked = world.places.cup?.damped === true || world.places.cup?.cracked === true;
  return (
    <g>
      <rect x="70" y="70" width="360" height="200" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={90 + i * 40} y="100" width="16" height={90 - (i % 3) * 12} fill="var(--color-brass)" />
      ))}
      <rect
        x="250"
        y={found ? 200 : 210}
        width="90"
        height={open ? 40 : 18}
        fill={found ? "var(--color-paper-deep)" : "var(--color-ink)"}
        stroke="var(--color-oxide)"
      />
      <text x="70" y="300" fill="var(--color-ink)" fontSize="13" fontFamily="var(--font-display)">
        {open ? "bolt drawn" : found ? "located, not opened" : "board shut"}
        {sleeper?.alert === "drawn" ? " · the sleeper woke" : ""}
        {creak ? " · the bed creaks" : " · the bed is quiet"}
      </text>
      <circle cx="520" cy="180" r="28" fill="none" stroke={cracked ? "var(--color-oxide)" : "var(--color-pine)"} strokeWidth="3" />
      <text x="490" y="230" fill="var(--color-ink-soft)" fontSize="12" fontFamily="var(--font-sans)">
        cup
      </text>
    </g>
  );
}

function Counter({ world }: { world: World }) {
  const bal = world.balances[0];
  const tilt = bal ? Math.max(-16, Math.min(16, (bal.targetOz - bal.currentOz) * 1.6)) : 8;
  const held = bal?.held === true;
  const door = world.places.door?.travelInches;
  const short = world.merchant.shortFlagged;
  return (
    <g>
      <line x1="80" y1="250" x2="560" y2="250" stroke="var(--color-ink)" />
      {bal?.hanger && <line x1="320" y1="70" x2="320" y2="150" stroke="var(--color-brass)" strokeWidth="3" />}
      <g transform={`rotate(${held ? 0 : tilt} 320 160)`}>
        <rect x="180" y="154" width="280" height="8" fill="var(--color-ink)" />
        <circle cx="470" cy="158" r="16" fill="var(--color-brass)" stroke="var(--color-ink)" />
      </g>
      <polygon points="320,160 308,190 332,190" fill="var(--color-pine)" />
      <text x="80" y="290" fill="var(--color-ink)" fontSize="14" fontFamily="var(--font-display)">
        {bal ? `${bal.currentOz} oz of ${bal.targetOz}` : "no balance"}
        {bal?.hanger ? " · chain hung" : " · no hanger"}
        {typeof door === "number" ? ` · door ${door} in` : ""}
      </text>
      <text x="80" y="314" fill={short ? "var(--color-oxide)" : "var(--color-ink-soft)"} fontSize="13" fontFamily="var(--font-sans)">
        {short ? "merchant short, marked" : `marked ${world.merchant.markedOz} oz · actual ${world.merchant.actualOz}`}
        {world.merchant.ledgerRead ? " · ledger read" : ""}
      </text>
    </g>
  );
}

function Creek({ world, session }: { world: World; session: Session }) {
  const ferry = world.places.basin?.ferry === "approaching";
  const geese = world.enemies.find((e) => e.id === "geese");
  const wax = session.kit.find((k) => k.lootId.endsWith("034"));
  const pitch = world.places.drum?.pitch;
  const rain = world.puzzles.weather?.solved === true;
  const lock = world.puzzles["creek-lock"]?.solved === true;
  const shift = geese?.alert === "startled" ? 70 : geese?.alert === "drawn" ? -30 : 0;
  return (
    <g>
      <path d="M40 230 C160 200, 260 260, 400 220 C480 196, 540 240, 610 210" fill="none" stroke="var(--color-pine)" strokeWidth="3" />
      <path d="M40 250 C180 230, 300 280, 460 240" fill="none" stroke="var(--color-pine)" strokeWidth="1.5" />
      <g className={ferry ? "ferry-near" : "ferry-far"}>
        <rect x="0" y="0" width="54" height="16" fill="var(--color-brass)" stroke="var(--color-ink)" />
        <polygon points="8,0 20,-16 32,0" fill="var(--color-paper)" stroke="var(--color-ink)" />
      </g>
      <g transform={`translate(${360 + shift} 180)`}>
        <polygon points="0,0 14,-10 10,6" fill="var(--color-ink)" />
        <polygon points="18,4 32,-6 28,10" fill="var(--color-ink)" />
        <polygon points="36,0 50,-10 46,6" fill="var(--color-ink)" />
      </g>
      <rect x="80" y="150" width="70" height="28" rx="14" fill="none" stroke="var(--color-oxide)" strokeWidth="2" />
      <text x="80" y="200" fill="var(--color-oxide)" fontSize="12" fontFamily="var(--font-sans)">
        {wax?.recorded ? `${wax.recorded} · ${wax.plays}` : "wax blank"}
      </text>
      <circle cx="200" cy="150" r="22" fill="none" stroke="var(--color-brass)" strokeWidth="3" />
      <text x="176" y="200" fill="var(--color-ink-soft)" fontSize="12" fontFamily="var(--font-sans)">
        {typeof pitch === "string" ? pitch : "drum"}
      </text>
      <text x="40" y="310" fill="var(--color-ink)" fontSize="13" fontFamily="var(--font-display)">
        {geese?.alert ?? "flock"}
        {lock ? " · lock takes the riffle" : ""}
        {rain ? " · rain is a fact" : ""}
        {world.flags.conchUsed === true ? " · breath spent" : ""}
      </text>
    </g>
  );
}

function Orchard({ world }: { world: World }) {
  const level = world.flags.lineLevel === true;
  const yards = world.places.line?.yards;
  const bearing = world.places.mark?.bearing;
  const balk = world.enemies[0]?.alert === "balked";
  const pin = world.places.crack?.pinRetrieved === true;
  return (
    <g>
      <line x1="60" y1={level ? 200 : 230} x2="420" y2="200" stroke="var(--color-brass)" strokeWidth="3" />
      <circle cx="500" cy="150" r="46" fill="none" stroke="var(--color-ink)" />
      <circle cx="500" cy="150" r="4" fill="var(--color-oxide)" />
      <line
        x1="500"
        y1="150"
        x2={bearing ? 532 : 500}
        y2={bearing ? 118 : 104}
        stroke="var(--color-oxide)"
        strokeWidth="2"
      />
      <text x="470" y="214" fill="var(--color-ink)" fontSize="13" fontFamily="var(--font-sans)">
        {typeof bearing === "string" ? bearing : "no bearing"}
      </text>
      <g transform={balk ? "translate(80 150)" : "translate(140 120)"}>
        <polygon points="0,20 16,0 32,20" fill="none" stroke="var(--color-ink)" />
        <polygon points="28,20 44,0 60,20" fill="none" stroke="var(--color-ink)" />
      </g>
      <text x="60" y="280" fill="var(--color-ink)" fontSize="14" fontFamily="var(--font-display)">
        {level ? "line declared level" : "the chain will lie until a level speaks"}
        {typeof yards === "number" ? ` · ${yards} ft` : ""}
      </text>
      <text x="60" y="304" fill="var(--color-ink-soft)" fontSize="13" fontFamily="var(--font-sans)">
        {pin ? "pin lifted from the crack" : "a pin still sits in the crack"}
      </text>
    </g>
  );
}

function Study({ world, session }: { world: World; session: Session }) {
  const changed = world.places.site?.changed === true;
  return (
    <g>
      <line x1="70" y1="120" x2="560" y2="120" stroke="var(--color-brass)" strokeWidth="4" />
      {[0, 1, 2, 3].map((i) => {
        const id = session.shelf[i];
        const label = id ? id.slice(-3) : "";
        return (
          <g key={i} transform={`translate(${110 + i * 110} 80)`}>
            <circle cy="40" r="6" fill="var(--color-brass)" />
            <rect x="-18" y="48" width="36" height="70" fill={id ? "var(--color-paper-deep)" : "none"} stroke="var(--color-ink)" />
            <text y="90" textAnchor="middle" fill="var(--color-ink)" fontSize="12" fontFamily="var(--font-sans)">
              {label}
            </text>
          </g>
        );
      })}
      <text x="70" y="250" fill="var(--color-ink)" fontSize="14" fontFamily="var(--font-display)">
        {changed ? `the ground disagrees: ${String(world.places.site?.delta ?? "")}` : "the old page has not been asked"}
      </text>
      <text x="70" y="276" fill="var(--color-ink-soft)" fontSize="13" fontFamily="var(--font-sans)">
        {world.flags.autoLog === true ? "auto-log armed" : "the book is not copying readings"}
        {session.notes.length ? ` · ${session.notes.length} notes` : ""}
      </text>
    </g>
  );
}
