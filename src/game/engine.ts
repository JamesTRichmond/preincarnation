import { DIALOGUE, INCARNATIONS, INTRO_BEATS, LIMBO_UPGRADES, NPC_NODE, OBJECTIVES } from "./content";
import { createAudio } from "./audio";
import { boneFlashAlpha } from "./a11y";
import { bedFor, type AudioBed } from "./audio-bed";
import { FLOAT_CAP, PARTICLE_CAP, SLASH_CAP, trimCapped, unstickSpot } from "./fx";
import { createDeck, EMPTY_DECK } from "./ipod";
import { TOWN_BY_ID } from "./geography";
import { isInterior } from "./interiors";
import { createInput, type Actions } from "./input";
import {
  lipStep,
  noteAttackDuringHitstop,
  releaseAttackBuffer,
  resolveFacing,
  scaleHitstop,
  stepCamera,
  type AxisMem,
} from "./feel";
import { T, buildMap, isSolid, type PropSpec } from "./maps";
import { crackRole, stepSentinel, strikeMarble, type SentinelBeat } from "./marble";
import { liveObjective } from "./quest";
import { TELL_S, countyTell, placeUnderfoot, tellPixels } from "./place";
import { BELL_SLUICE } from "./bell";
import { HUD_H, SNES_H, SNES_W, TILE, VIEW_H } from "./snes";
import { applyUpgrade, bodyStats, cycleLedger, cycleReturnNode, enemyMaxHp, fillDialogueText, grantBondKeepsake, isIncarnationUnlocked, quarryHammerLands, resolveDeath, sheetSpeedMul, slashDamage, soloverseReady, spendSkillPoint, spinDamage, stepSouthOffStoop } from "./rules";
import {
  paintCache,
  paintBearFallback,
  paintBobcatFallback,
  paintFisherFallback,
} from "./tileset";
import {
  makeTileCache,
  makePropCache,
  paintShadow,
  paintHudALttP,
  paintBuilding16,
  paintRock16,
  paintPot16,
  paintSheep16,
  paintNpc16,
  paintGrave16,
  paintKey16,
  paintLock16,
  paintCave16,
} from "./pix";
import { sipIndex, weaponFromGrave } from "./bag";
import { clearSave, defaultSave, exportLifeBlob, importLifeBlob, loadSave, undoLastSave, writeSave } from "./save";
import { readKit, wearNextWeapon } from "./kit-compare";
import { applyDeath } from "./cooking/reduce.ts";
import { summarizeWeapon, rollWeapon, starterWeapon, weaponMoveMod, type Weapon } from "./weapons";
import { erodeGrave, RELIC_BY_ID, type RelicId, type LifePath } from "./items";
import type { BottleKind, DialogueNode, Dir, EnemyKind, IncarnationId, MapId, Mode, SaveData, UiSnapshot } from "./types";

type Actor = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: Dir;
  hp: number;
  maxHp: number;
  kind: "player" | EnemyKind;
  hurt: number;
  frame: number;
  alive: boolean;
  slow: number;
  burn: number;
  stoned: number;
  beat: SentinelBeat;
  tell: number;
  warned: boolean;
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; g?: number };
type SlashFx = { x: number; y: number; dir: Dir; t: number };
type Floating = { x: number; y: number; t: number; text: string; color: string };
type Shot = { x: number; y: number; vx: number; vy: number; life: number; dmg: number; burn: number; slow: number; stoned: number };

const DIRS: Record<Dir, { x: number; y: number }> = {
  0: { x: 0, y: 1 },
  1: { x: -1, y: 0 },
  2: { x: 1, y: 0 },
  3: { x: 0, y: -1 },
};

const ENEMY_HP: Record<EnemyKind, number> = {
  crow: 2,
  wraith: 3,
  sentinel: 10,
  bear: 7,
  bobcat: 3,
  fisher: 3,
  resident: 12,
};



function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(src));
    im.crossOrigin = "anonymous";
    im.src = src;
  });
}

export function createGame(canvas: HTMLElement, onUi: (ui: UiSnapshot) => void) {
  const cvs = canvas as HTMLCanvasElement;
  const ctx = cvs.getContext("2d")!;
  const buf = document.createElement("canvas");
  buf.width = SNES_W;
  buf.height = SNES_H;
  const bctx = buf.getContext("2d")!;
  cvs.tabIndex = 0;
  cvs.setAttribute("role", "application");
  const input = createInput(cvs);
  const audio = createAudio();
  const deck = createDeck();
  deck.setDuck((on) => audio.setDuck(on));

  let save: SaveData = loadSave();
  let mode: Mode = "title";
  let introBeat = 0;
  let mapId: MapId = save.mapId;
  let world = buildMap(mapId, save.flags, save.cycle, {
    homeX: save.flags.homeX,
    homeY: save.flags.homeY,
    geoTown: save.flags.geoTown,
    returnMap: save.flags.returnMap,
    returnX: save.flags.returnX,
    returnY: save.flags.returnY,
  });
  let props: PropSpec[] = world.props;
  const player: Actor = {
    id: "player",
    x: save.x,
    y: save.y,
    vx: 0,
    vy: 0,
    dir: 0,
    hp: save.hp,
    maxHp: save.maxHp,
    kind: "player",
    hurt: 0,
    frame: 0,
    alive: true,
    slow: 0,
    burn: 0,
    stoned: 0,
    beat: "still",
    tell: 0,
    warned: false,
  };
  let enemies: Actor[] = [];
  let particles: Particle[] = [];
  let slashes: SlashFx[] = [];
  let floats: Floating[] = [];
  let shots: Shot[] = [];
  let animT = 0;
  let attackT = 0;
  let comboLeft = 0;
  let comboGap = 0;
  let attackBuf = 0;
  let charge = 0;
  let zoom = 1;
  let shoveT = 0;
  let hook: { x: number; y: number; vx: number; vy: number; life: number; latched: boolean } | null = null;
  const vtHour = () => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }).formatToParts(new Date());
      const h = Number(parts.find((p) => p.type === "hour")?.value ?? new Date().getHours());
      return h === 24 ? 0 : h;
    } catch {
      return new Date().getHours();
    }
  };
  let localHour = vtHour();
  let debugHour: number | null = null;
  let invuln = 0;
  let ritual = 0;
  let dashT = 0;
  let hitstop = 0;
  let attackQueued = false;
  let faceMem: AxisMem = null;
  let trauma = 0;
  let camX = save.x;
  let camY = save.y;
  let message: string | null = null;
  let messageT = 0;
  let dialogue: DialogueNode | null = null;
  let interactHint: string | null = null;
  let endingBeat = 0;
  let endingT = 0;
  let showHelp = false;
  let last = performance.now();
  let acc = 0;
  let running = true;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  let shakeOn = !reduced;
  let probeYaw = 0;
  let playerStoned = 0;
  let flash = 0;
  let reducedFlash = false;
  let audioBed: AudioBed = "county";
  const images = new Map<string, HTMLImageElement>();
  let ready = false;
  let showControls = false;
  try {
    showControls = localStorage.getItem("preincarnation.ui.controls") === "1";
  } catch {
    showControls = false;
  }
  const blit = { ox: 0, oy: 0, scale: 1, viewX: 0, viewY: 0, zoom: 1 };
  let mouseHeld = false;
  let mouseBtn = 0;
  let mouseWorldX = 0;
  let mouseWorldY = 0;
  let walkTarget: { x: number; y: number } | null = null;
  let pendingProp: PropSpec | null = null;
  let downAt = 0;
  let downX = 0;
  let downY = 0;
  let mouseAttack = false;
  let warpLock = 0;
  let beacon: { x: number; y: number; label: string } | null = null;
  let stepAcc = 0;
  let moteAcc = 0;

  const sheets: Record<string, string> = {
    wanderer: "/game/wanderer-walk/snes.png?v=3",
    smuggler: "/game/smuggler-walk/snes.png",
    officer: "/game/officer-walk/snes.png",
    embryo: "/game/embryo-walk/snes.png",
    wraith: "/game/wraith-walk/snes.png",
    crow: "/game/crow/snes.png",
    sentinel: "/game/sentinel/snes.png",
    bear: "/game/bear-walk/snes.png",
    bobcat: "/game/bobcat-walk/snes.png",
    fisher: "/game/fisher-walk/snes.png",
    resident: "/game/resident/snes.png",
    relics: "/game/relics/snes.png",
  };
  const tileCache = makeTileCache();
  const propCache = makePropCache();

  void Promise.all(
    Object.entries(sheets).map(async ([k, url]) => {
      try {
        images.set(k, await loadImg(url));
      } catch {
        /* procedural fallback */
      }
    }),
  ).then(() => {
    ready = true;
  });

  const equipped = (): Weapon => {
    const w = save.inventory.find((i) => i.id === save.equippedId);
    return w ?? save.inventory[0] ?? starterWeapon();
  };

  const spawnEnemies = () => {
    enemies = [];
    for (const p of props) {
      if (p.kind !== "enemy" || !p.enemy) continue;
      const hp = enemyMaxHp(ENEMY_HP[p.enemy] ?? 2, save.flags.tropoverse);
      enemies.push({
        id: p.id,
        x: p.x * TILE + 8,
        y: p.y * TILE + 8,
        vx: 0,
        vy: 0,
        dir: 0,
        hp,
        maxHp: hp,
        kind: p.enemy,
        hurt: 0,
        frame: 0,
        alive: true,
        slow: 0,
        burn: 0,
        stoned: 0,
        beat: "still",
        tell: 0,
        warned: false,
      });
    }
  };

  const loadWorld = (id: MapId, px?: number, py?: number) => {
    mapId = id;
    world = buildMap(id, save.flags, save.cycle, {
      homeX: save.flags.homeX,
      homeY: save.flags.homeY,
      geoTown: save.flags.geoTown,
      returnMap: save.flags.returnMap,
      returnX: save.flags.returnX,
      returnY: save.flags.returnY,
    });
    props = world.props;
    const spawn = props.find((p) => p.kind === "spawn");
    player.x = px ?? (spawn ? spawn.x * TILE + 8 : player.x);
    player.y = py ?? (spawn ? spawn.y * TILE + 8 : player.y);
    const foot = unstick(player.x, player.y);
    player.x = foot.x;
    player.y = foot.y;
    spawnEnemies();
    invuln = 1.8;
    warpLock = 0.55;
    camX = player.x;
    camY = player.y;
    tileCache.swap(id + ":" + save.cycle);
  };

  const say = (text: string) => {
    message = text;
    messageT = 3.2;
  };

  const addKarma = (n: number) => {
    const m = save.upgrades.echo ? n * (n > 0 ? 2 : 1) : n;
    save.karma += m;
    floats.push({
      x: player.x,
      y: player.y - 10,
      t: 0.9,
      text: (m >= 0 ? "+" : "") + m + " k",
      color: m >= 0 ? "#7ec8a3" : "#c45c4a",
    });
  };

  const applyIncarnation = (id: IncarnationId) => {
    save.incarnation = id;
    const stats = bodyStats(id, save.upgrades.vitality);
    save.maxHp = stats.maxHp;
    save.hp = stats.maxHp;
    save.maxMp = stats.maxMp;
    save.mp = stats.maxMp;
    player.maxHp = save.maxHp;
    player.hp = save.hp;
  };

  const persist = () => {
    save.x = player.x;
    save.y = player.y;
    save.mapId = isInterior(mapId) ? save.flags.returnMap ?? "middlebury" : mapId;
    save.hp = player.hp;
    save.flags.deck = deck.snapshot();
    writeSave(save);
  };

  const enterLimbo = (_reason: string) => {
    audio.die();
    audio.winter();
    save = resolveDeath(save, { mapId, x: player.x, y: player.y });
    save.kitchen = applyDeath(save.kitchen);
    mode = "limbo";
    audio.startDrone(true);
    persist();
    lastUi = "";
    const host = save.flags.afterlifeHost === "devil" ? "The Other Voice" : "The Voice";
    say(host + " has you. " + save.flags.year + ". Finish the job.");
  };

  const reincarnate = () => {
    applyIncarnation(save.incarnation);
    save = grantBondKeepsake(save);
    const ready = soloverseReady(save);
    const walkSpectrum =
      ready && (save.incarnation === "embryo" || save.upgrades.soloverseKey || save.flags.lifePath === "adventurer");
    save.flags.tropoverse = walkSpectrum;
    save.flags.afterlifeHost = null;
    if (walkSpectrum) {
      mode = "play";
      loadWorld("soloverse");
      audio.startDrone(true);
      persist();
      lastUi = "";
      say("Vermont folds. The job followed you. The Heart is the middle.");
      return;
    }
    birthIntoWorld();
  };

  const birthIntoWorld = () => {
    mode = "play";
    const path = save.flags.lifePath;
    const start =
      path === "farmer"
        ? "salisbury"
        : path === "fisher"
          ? "ferrisburgh"
          : path === "shepherd"
            ? "bristol"
            : path === "tender"
              ? "middlebury"
              : (save.flags.geoTown ?? "middlebury");
    loadWorld(isInterior(start) ? "middlebury" : start);
    audio.startDrone(false);
    persist();
    lastUi = "";
    say("Fourteen winters. " + save.flags.year + ". Same hands. The county aged. The job did not.");
  };

  const senseWorld = () => {
    /* The county is authored. No device location, no forecast. */
  };

  const startNew = () => {
    save = defaultSave();
    void deck.hydrate(EMPTY_DECK);
    applyIncarnation("wanderer");
    introBeat = 0;
    mode = "create";
    showHelp = false;
    loadWorld("middlebury");
    audio.unlock();
    audio.startDrone(false);
    persist();
    lastUi = "";
    try {
      cvs.focus();
    } catch {
      /* ignore */
    }
  };

  const continueGame = () => {
    save = loadSave();
    void deck.hydrate(save.flags.deck);
    applyIncarnation(save.incarnation);
    player.hp = save.hp;
    introBeat = 0;
    if (save.flags.afterlifeHost) {
      mode = "limbo";
      showHelp = false;
    } else if (!save.character.created) {
      mode = "create";
      showHelp = false;
    } else {
      mode = save.flags.tutorialDone ? "play" : "intro";
      showHelp = false;
    }
    loadWorld(save.mapId, save.x, save.y);
    audio.unlock();
    audio.startDrone(mode === "limbo");
    lastUi = "";
    try {
      cvs.focus();
    } catch {
      /* ignore */
    }
  };

  const commitCreate = (draft: {
    name: string;
    backgroundId: string;
    bondId: string;
    idealId: string;
    flawId: string;
    spends: Partial<Record<"vitality" | "edge" | "stride" | "sight" | "shadowStep" | "wraithBond", number>>;
  }) => {
    const name = draft.name.trim() || "Ellis Perch";
    let points = 3;
    const upgrades = { ...save.upgrades };
    const keys = ["vitality", "edge", "stride", "sight", "shadowStep", "wraithBond"] as const;
    for (const k of keys) {
      const n = Math.max(0, Math.min(3, draft.spends[k] ?? 0));
      upgrades[k] = n;
      points -= n;
    }
    save.character = {
      name,
      backgroundId: draft.backgroundId,
      bondId: draft.bondId,
      idealId: draft.idealId,
      flawId: draft.flawId,
      skillPoints: Math.max(0, points),
      created: true,
    };
    save.upgrades = upgrades;
    applyIncarnation("wanderer");
    introBeat = 0;
    mode = "intro";
    showHelp = false;
    persist();
    lastUi = "";
  };

  const advanceIntro = () => {
    if (introBeat < INTRO_BEATS.length - 1) {
      introBeat += 1;
      lastUi = "";
      return;
    }
    save.flags.tutorialDone = true;
    mode = "play";
    showHelp = false;
    persist();
    lastUi = "";
    say(OBJECTIVES.job);
    try {
      cvs.focus();
    } catch {
      /* ignore */
    }
  };

  const spendSkill = (key: (typeof LIMBO_UPGRADES)[number]["key"]) => {
    const next = spendSkillPoint(save, key);
    if (!next) return;
    save = next;
    if (key === "vitality") applyIncarnation(save.incarnation);
    audio.pickup();
    persist();
    lastUi = "";
  };

  const objective = () =>
    liveObjective({
      mode,
      mapId,
      talkedElder: save.flags.talked.includes("elder"),
      hasShovel: save.flags.relics.includes("shovel"),
      hasLantern: save.flags.relics.includes("lantern"),
      lanternOn: !!save.flags.lanternOn,
      hasKey: save.flags.chests.includes("q-key"),
      lockOpen: save.flags.chests.includes("q-lock-a"),
      hasHammer: save.flags.relics.includes("hammer"),
      quarryQuiet: save.flags.townsCleared.includes("quarry"),
      sentinelFaced: save.flags.sentinelFate != null,
      cycle: save.cycle,
      seamThin: mapId === "middlebury" && save.cycle >= 1 && !save.flags.tropoverse && !soloverseReady(save),
      graveWaiting: (save.flags.graves ?? []).some((g) => !g.excavated),
    });

  const atProp = (p: PropSpec, label: string) => ({ x: p.x * TILE + 8, y: p.y * TILE + 8, label });

  const questBeacon = () => {
    const byId = (id: string) => props.find((p) => p.id === id);
    const byRelic = (id: string) => props.find((p) => p.kind === "relic" && p.relic === id);
    const exit = () =>
      props.find((p) => p.kind === "warp" && p.warp?.map === "middlebury") ??
      props.find((p) => p.kind === "warp" && (p.id === "to-overworld" || p.id.includes("middlebury")));

    if (mapId === "quarry") {
      if (!save.flags.relics.includes("lantern")) {
        const p = byRelic("lantern");
        if (p) return atProp(p, "Lamp");
      }
      if (!save.flags.chests.includes("q-key")) {
        const p = byId("q-key");
        if (p) return atProp(p, "Key");
      }
      if (!save.flags.chests.includes("q-lock-a")) {
        const p = byId("q-lock-a");
        if (p) return atProp(p, "Lock");
      }
      if (!save.flags.relics.includes("hammer")) {
        const p = byRelic("hammer");
        if (p) return atProp(p, "Hammer");
      }
      if (!save.flags.townsCleared.includes("quarry") && save.flags.sentinelFate == null) {
        const sen = enemies.find((e) => e.alive && e.kind === "sentinel");
        if (sen) return { x: sen.x, y: sen.y, label: "Sentinel" };
        for (let y = 0; y < world.h; y++) {
          const row = world.tiles[y];
          for (let x = 0; x < world.w; x++) {
            if (row?.[x] === T.cracked) return { x: x * TILE + 8, y: y * TILE + 8, label: "Cracked marble" };
          }
        }
      }
      const back = byId("to-middlebury-q");
      if (back) return atProp(back, "West");
      return null;
    }

    if (mapId === "soloverse") {
      const heart = props.find((p) => p.npc === "heart" || p.id === "heart");
      if (heart) return atProp(heart, "Heart");
      return null;
    }

    if (!save.flags.talked.includes("elder")) {
      const p = byId("elder");
      if (p) return atProp(p, "Maeve");
      const door = exit();
      if (door) return atProp(door, "Maeve");
    }
    if (!save.flags.relics.includes("shovel")) {
      const p = byRelic("shovel");
      if (p) return atProp(p, "Shovel");
      const door = exit();
      if (door) return atProp(door, "Shovel");
    }
    if (!save.flags.townsCleared.includes("quarry") && save.flags.sentinelFate == null) {
      const q = byId("to-quarry");
      if (q) return atProp(q, "Marble Vein");
      const door = exit();
      if (door) return atProp(door, "Toward the Vein");
    }
    if ((save.flags.graves ?? []).some((g) => !g.excavated)) {
      const gp = props.find((p) => p.kind === "grave");
      if (gp) return atProp(gp, "Your grave");
    }
    return null;
  };

  const cardinal = (dx: number, dy: number) => {
    const names = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];
    const i = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    return names[((i % 8) + 8) % 8];
  };

  const beaconLine = () => {
    if (!beacon || mode !== "play") return null;
    const dx = beacon.x - player.x;
    const dy = beacon.y - player.y;
    const paces = Math.max(0, Math.round(Math.hypot(dx, dy) / TILE));
    if (paces <= 1) return beacon.label + " · here";
    return cardinal(dx, dy) + " · " + beacon.label + " · " + paces;
  };

  const unlocked = (id: IncarnationId) => isIncarnationUnlocked(id, save.cycle, save.flags, save.crowns);

  const buyUpgrade = (key: (typeof LIMBO_UPGRADES)[number]["key"]) => {
    const next = applyUpgrade(save, key);
    if (!next) return;
    save = next;
    audio.pickup();
    persist();
  };

  const openDialogue = (id: string) => {
    const node = DIALOGUE[id];
    if (!node) return;
    const fill = (s: string) =>
      fillDialogueText(
        s,
        save.character.name,
        save.flags.year,
        save.cycle,
        save.flags.lastDeed,
        (save.flags.graves ?? []).length,
      );
    dialogue = {
      ...node,
      speaker: fill(node.speaker),
      text: fill(node.text),
      choices: node.choices?.map((c) => ({ ...c, label: fill(c.label) })),
    };
    mode = "dialogue";
    audio.talk();
  };

  const noteDeed = (s: string) => {
    save.flags.lastDeed = s;
  };

  const fillBottle = (kind: BottleKind) => {
    const i = save.flags.bottles.findIndex((b) => b === "empty");
    if (i < 0) return false;
    const next = save.flags.bottles.slice();
    next[i] = kind;
    save.flags.bottles = next;
    return true;
  };

  const sip = () => {
    const i = sipIndex(save.flags.bottles, player.hp, player.maxHp, save.mp, save.maxMp);
    if (i < 0) {
      say("No bottles.");
      return;
    }
    const k = save.flags.bottles[i];
    const next = save.flags.bottles.slice();
    next[i] = "empty";
    save.flags.bottles = next;
    if (k === "syrup" || k === "deluxe") {
      player.hp = Math.min(player.maxHp, player.hp + 4);
      save.hp = player.hp;
    }
    if (k === "creemee" || k === "deluxe") save.mp = save.maxMp;
    audio.pickup();
    say(k === "syrup" ? "Grade A dark. The blood remembers sugar." : "Extra fat. Mana floods back.");
    persist();
  };

  const enterDoor = (p: PropSpec) => {
    if (!p.warp) return;
    if (isInterior(mapId)) {
      const back = save.flags.returnMap ?? p.warp.map;
      const rx = save.flags.returnX || p.warp.x * TILE + 8;
      const ry = save.flags.returnY || p.warp.y * TILE + 8;
      loadWorld(back, rx, ry);
      plantSouthOfStoop();
      say("Back to the county air.");
    } else {
      save.flags.returnMap = mapId;
      save.flags.returnX = player.x;
      save.flags.returnY = player.y;
      loadWorld(p.warp.map, p.warp.x * TILE + 8, p.warp.y * TILE + 8);
      say("The door takes you in.");
    }
    persist();
  };

  const choose = (index: number) => {
    if (!dialogue?.choices) return;
    const c = dialogue.choices[index];
    if (!c) return;
    if (c.flag?.syrupStash && !save.flags.bottles.includes("empty")) {
      say("Both bottles are full. The tin stays on the shelf.");
      dialogue = null;
      mode = "play";
      persist();
      return;
    }
    if (c.karma) addKarma(c.karma);
    if (c.crowns) {
      save.crowns += c.crowns;
      audio.crown();
      say("Heavenly Crown obtained.");
    }
    if (c.flag) {
      save.flags = { ...save.flags, ...c.flag };
      if (c.flag.bombs) save.flags.bombs = Math.max(save.flags.bombs, c.flag.bombs);
      if (c.flag.quarryOpen) save.flags.quarryOpen = true;
      if (c.flag.syrupStash) {
        fillBottle("syrup");
        player.hp = Math.min(player.maxHp, player.hp + 2);
        save.hp = player.hp;
        say("Grade A dark. Bottled.");
      }
      if (c.flag.residentFate) {
        if (!save.flags.townsCleared.includes(mapId)) save.flags.townsCleared = [...save.flags.townsCleared, mapId];
        enemies = enemies.filter((e) => e.kind !== "resident");
        props = props.filter((p) => p.enemy !== "resident");
      }
      if (c.flag.elderFate === "release") noteDeed("You released Maeve");
      if (c.flag.elderFate === "bind") noteDeed("You bound Maeve to the Green");
      if (c.flag.millFate === "spare") noteDeed("You spared the mill");
      if (c.flag.millFate === "condemn") noteDeed("You condemned the mill");
      if (c.flag.sentinelFate) {
        noteDeed("You faced the Sentinel");
        save.flags.townsCleared = [...new Set([...(save.flags.townsCleared ?? []), "quarry"])];
        enemies = enemies.filter((e) => e.kind !== "sentinel");
        if (!save.flags.relics.includes("cape")) {
          save.flags.relics = [...save.flags.relics, "cape"];
          save.flags.ySlot = "cape";
          say("The marble yields a cape. The Vein is yours.");
        }
      }
    }
    if (c.next && c.next !== "end") {
      openDialogue(c.next);
      return;
    }
    dialogue = null;
    mode = "play";
    if (save.flags.sheepFound) props = props.filter((p) => p.kind !== "sheep");
    if (save.flags.elderFate === "release") props = props.filter((p) => p.id !== "elder");
    persist();
  };

  const phaseOpen = () => save.cycle >= 1 || save.flags.townsCleared.length > 0 || save.flags.residentFate != null;

  const interactWith = (p: PropSpec) => {
    if (p.kind === "npc") {
      if (!save.flags.talked.includes(p.id)) save.flags.talked = [...save.flags.talked, p.id];
      save.flags.returnedFromDeath = false;
      if (p.npc === "elder") {
        if (save.flags.elderFate) openDialogue(save.flags.elderFate === "release" ? "elder_release" : "elder_bind");
        else {
          const remembered = cycleReturnNode("elder", save.cycle);
          if (remembered) openDialogue(remembered);
          else if (save.character.bondId === "maeve") openDialogue("elder_bond");
          else openDialogue("elder_1");
        }
        noteDeed("You spoke with Maeve on the Green");
      } else if (p.npc === "farmer") {
        if (save.flags.farmerHelped) openDialogue("farmer_done");
        else if (save.flags.sheepFound) openDialogue("farmer_sheep");
        else {
          const remembered = cycleReturnNode("farmer", save.cycle);
          if (remembered) openDialogue(remembered);
          else if (save.character.bondId === "perch") openDialogue("farmer_bond");
          else openDialogue("farmer_1");
        }
        noteDeed("You spoke with Cal Perch");
      } else if (p.npc === "mayor") {
        if (save.flags.millFate) openDialogue(save.flags.millFate === "spare" ? "mayor_spare" : "mayor_condemn");
        else {
          const remembered = cycleReturnNode("mayor", save.cycle);
          if (remembered) openDialogue(remembered);
          else openDialogue("mayor_1");
        }
        noteDeed("You stood in Voss's square");
      } else if (p.npc === "shop") {
        openDialogue(save.flags.bombs > 0 ? "shop_buy" : "shop_1");
      } else if (p.npc === "sentinel") {
        if (save.flags.sentinelFate) openDialogue(save.flags.sentinelFate === "release" ? "sentinel_release" : "sentinel_crown");
        else openDialogue("sentinel_1");
      } else if (p.npc === "resident") {
        if (save.flags.residentFate) openDialogue(save.flags.residentFate === "release" ? "resident_release" : "resident_bind");
        else openDialogue("resident_1");
      } else if (p.npc === "sugar") {
        openDialogue(save.flags.syrupStash ? "sugar_tin" : "sugar_1");
      } else if (p.npc === "heart") {
        if (save.flags.spectrumFate) openDialogue(save.flags.spectrumFate === "release" ? "heart_release" : "heart_bind");
        else {
          const remembered = cycleReturnNode("heart", save.cycle);
          if (remembered) openDialogue(remembered);
          else openDialogue("heart_1");
        }
      } else if (p.npc && NPC_NODE[p.npc]) {
        openDialogue(NPC_NODE[p.npc]);
      }
    } else if (p.kind === "sheep") {
      openDialogue("sheep_1");
    } else if (p.kind === "shrine") {
      openDialogue("shrine_1");
    } else if (p.kind === "rock") {
      openDialogue("rock_1");
    } else if (p.kind === "home") {
      const door = props.find((x) => x.kind === "door" && x.id.includes(p.id));
      if (door) enterDoor(door);
      else {
        player.hp = player.maxHp;
        save.hp = player.hp;
        say("You rest at the homestead. It is a shrine, not a fight.");
      }
    } else if (p.kind === "door" || p.kind === "cave") {
      if (warpLock > 0) return;
      enterDoor(p);
    } else if (p.kind === "rifle") {
      const w = rollWeapon(p.id, "farmhouse", save.cycle);
      w.ammo = 1 + Math.floor(Math.random() * 3);
      save.inventory = [...save.inventory, w];
      save.equippedId = w.id;
      save.flags.riflesTaken = [...save.flags.riflesTaken, p.id];
      props = props.filter((x) => x.id !== p.id);
      audio.pickup();
      say(w.name + " — " + w.ammo + " rounds. That is all they kept.");
      persist();
    } else if (p.kind === "relic") {
      const id = (p.relic ?? "shovel") as RelicId;
      if (!save.flags.relics.includes(id)) save.flags.relics = [...save.flags.relics, id];
      if (RELIC_BY_ID[id].slot === "Y") save.flags.ySlot = id;
      if (id === "shovel") noteDeed("You took the shovel by the stone");
      if (id === "lantern") save.flags.lanternOn = true;
      if (id === "hammer") say("Marble hammer. Smash the cracked wall north of here.");
      if (id === "bow") save.flags.arrows += 8;
      if (id === "bombs") save.flags.bombs += 4;
      props = props.filter((x) => x.id !== p.id);
      audio.pickup();
      say(RELIC_BY_ID[id].name + " — " + RELIC_BY_ID[id].desc);
      persist();
    } else if (p.kind === "key") {
      save.flags.keys += 1;
      save.flags.chests = [...save.flags.chests, p.id];
      props = props.filter((x) => x.id !== p.id);
      audio.pickup();
      say("A small key.");
      persist();
    } else if (p.kind === "lock") {
      if (save.flags.keys <= 0) {
        say("Locked.");
        return;
      }
      save.flags.keys -= 1;
      save.flags.chests = [...save.flags.chests, p.id];
      props = props.filter((x) => x.id !== p.id);
      if (world.tiles[p.y]) world.tiles[p.y][p.x] = T.marble;
      tileCache.dirty(p.x, p.y);
      say("The lock gives.");
      persist();
    } else if (p.kind === "wheel") {
      if (!save.flags.chests.includes(p.id)) save.flags.chests = [...save.flags.chests, p.id];
      props = props.filter((x) => x.id !== p.id);
      for (const cell of BELL_SLUICE) {
        if (world.tiles[cell.y]) world.tiles[cell.y][cell.x] = T.wood;
      }
      say("The race turns. The sluice lifts. The clapper is still not yours.");
      persist();
    } else if (p.kind === "grave") {
      if (!save.flags.relics.includes("shovel")) {
        say("A mound. Your last skin. You need a shovel.");
        return;
      }
      save.flags.ySlot = "shovel";
      dig();
    } else if (p.kind === "syrup") {
      if (!fillBottle("syrup")) {
        say("Both bottles are full. The tin stays.");
        return;
      }
      props = props.filter((x) => x.id !== p.id);
      audio.pickup();
      say("Maple tin. Red bottle. V to drink.");
      persist();
    } else if (p.kind === "creemee") {
      if (!fillBottle("creemee")) {
        say("Both bottles are full. The cup stays.");
        return;
      }
      save.flags.caches = [...save.flags.caches, p.id];
      props = props.filter((x) => x.id !== p.id);
      audio.pickup();
      say("Maple creemee. Extra fat. Mana.");
      persist();
    } else if (p.kind === "cache") {
      const w = rollWeapon(p.id, p.cache ?? "downtown", save.cycle);
      save.inventory = [...save.inventory, w];
      save.equippedId = w.id;
      save.flags.caches = [...save.flags.caches, p.id];
      props = props.filter((x) => x.id !== p.id);
      audio.pickup();
      say(w.name + " — " + w.flavor);
      persist();
    } else if (p.kind === "chest") {
      save.flags.chests = [...save.flags.chests, p.id];
      props = props.filter((x) => x.id !== p.id);
      const roll = p.id.includes("quarry") ? "heart" : Math.random() < 0.5 ? "karma" : "heart";
      if (roll === "heart") {
        save.maxHp += 1;
        player.maxHp = save.maxHp;
        player.hp = save.maxHp;
        say("A spare heart, hidden in the county.");
      } else {
        addKarma(5);
        say("A knot of stored merit.");
      }
      audio.pickup();
      persist();
    } else if (p.kind === "warp") {
      if (warpLock > 0) return;
      const dest = p.warp?.map;
      if (dest === "soloverse" && !soloverseReady(save)) {
        say("The seam is thin. Die louder — three winters, or an embryo's skin.");
        return;
      }
      const locked = dest === "rutland" || dest === "quarry" || dest === "montpelier" || dest === "whiteriver" || dest === "chittenden" || dest === "windsor";
      if (locked && !phaseOpen() && dest !== "quarry" && dest !== "chittenden") {
        say("Neighbor counties open after a cycle — or after you settle the homestead.");
        return;
      }
      if (p.warp) loadWorld(p.warp.map, p.warp.x * TILE + 8, p.warp.y * TILE + 8);
    }
  };

  const tileAt = (px: number, py: number) => {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (ty < 0 || tx < 0 || ty >= world.h || tx >= world.w) return T.wall;
    return world.tiles[ty][tx];
  };

  const blocked = (px: number, py: number, r = 5) => {
    const pts = [
      [px - r, py],
      [px + r, py],
      [px, py - r * 0.6],
      [px, py + r],
    ];
    if (pts.some(([x, y]) => isSolid(tileAt(x, y), save.incarnation, save.flags.relics?.includes("flippers")))) return true;
    for (const p of props) {
      if (p.kind === "lock") {
        const bx = p.x * TILE + 8;
        const by = p.y * TILE + 8;
        if (Math.abs(px - bx) < 10 && Math.abs(py - by) < 10) return true;
      }
      if (p.kind !== "barn" && p.kind !== "inn" && p.kind !== "hall" && p.kind !== "college" && p.kind !== "capitol" && p.kind !== "sugar" && p.kind !== "disp") continue;
      const bx = p.x * TILE + 8;
      const by = p.y * TILE + 8;
      if (Math.abs(px - bx) < 14 && py < by + 2 && py > by - 12) return true;
    }
    return false;
  };

  const unstick = (px: number, py: number) => unstickSpot(px, py, (x, y) => blocked(x, y, 4));

  const plantSouthOfStoop = () => {
    const tx = Math.floor(player.x / TILE);
    const ty = Math.floor(player.y / TILE);
    const spot = stepSouthOffStoop(
      tx,
      ty,
      (x, y) => world.tiles[y]?.[x],
      (x, y) => blocked(x * TILE + 8, y * TILE + 8, 4),
    );
    if (spot) {
      player.x = spot.tx * TILE + 8;
      player.y = spot.ty * TILE + 8;
    } else {
      const foot = unstick(player.x, player.y + TILE);
      player.x = foot.x;
      player.y = foot.y;
    }
    camX = player.x;
    camY = player.y;
  };

  const shoveFree = (px: number, py: number, dx: number, dy: number) => {
    const tx0 = Math.floor(px / TILE);
    const ty0 = Math.floor(py / TILE);
    const sx = Math.sign(dx) || 0;
    const sy = Math.sign(dy) || 1;
    const tries: [number, number][] = [
      [sx, sy],
      [sx, 0],
      [0, sy],
      [sx, sy + (sy === 0 ? 1 : 0)],
      [sx === 0 ? 1 : -sx, sy],
      [0, 1],
      [1, 1],
      [-1, 1],
    ];
    for (const [ox, oy] of tries) {
      const x = (tx0 + ox) * TILE + 8;
      const y = (ty0 + oy) * TILE + 8;
      if (!blocked(x, y, 4)) return { x, y };
    }
    return unstick(px, py);
  };

  const moveActor = (a: Actor, dx: number, dy: number) => {
    const next = lipStep(a.x, a.y, dx, dy, (x, y) => blocked(x, y));
    a.x = next.x;
    a.y = next.y;
  };

  const burst = (x: number, y: number, color: string, n = 8) => {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * 50;
      particles.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0.3 + Math.random() * 0.25,
        color,
        size: 1 + Math.random() * 2,
      });
    }
  };

  const hitEnemy = (e: Actor, dmg: number, dir: Dir, aff?: { burn: number; slow: number; stoned: number; karmaOnKill: number; lifesteal: number }) => {
    if (!e.alive || e.hurt > 0) return;
    e.hp -= dmg;
    e.hurt = 0.22;
    const k = DIRS[dir];
    moveActor(e, k.x * 10, k.y * 10);
    burst(e.x, e.y, "#f4efe2", 10);
    floats.push({ x: e.x, y: e.y - 10, t: 0.55, text: String(Math.max(1, Math.round(dmg))), color: "#f4efe2" });
    audio.hit();
    hitstop = scaleHitstop(0.07, reduced);
    trauma = Math.min(1, trauma + 0.32);
    if (aff?.lifesteal) {
      player.hp = Math.min(player.maxHp, player.hp + aff.lifesteal);
      save.hp = player.hp;
    }
    if (aff?.burn) e.burn = Math.max(e.burn, aff.burn);
    if (aff?.slow) e.slow = Math.max(e.slow, aff.slow);
    if (aff?.stoned) e.stoned = Math.max(e.stoned, aff.stoned);
    if (e.hp <= 0) {
      e.alive = false;
      burst(e.x, e.y, "#c45c4a", 22);
      hitstop = scaleHitstop(0.11, reduced);
      trauma = Math.min(1, trauma + 0.45);
      noteDeed("You killed a " + e.kind + " in " + mapId);
      if (save.character.idealId !== "mercy") addKarma(aff?.karmaOnKill ? 2 + aff.karmaOnKill : 1);
      if (e.kind === "bear" || e.kind === "sentinel") addKarma(3);
      if (e.kind === "sentinel") {
        save.flags.townsCleared = [...new Set([...(save.flags.townsCleared ?? []), "quarry"])];
        if (!save.flags.relics.includes("cape")) {
          save.flags.relics = [...save.flags.relics, "cape"];
          save.flags.ySlot = "cape";
          say("The marble yields a cape. The Vein is yours.");
        } else {
          say("The Sentinel falls. The Vein remembers you.");
        }
        persist();
      }
    }
  };

  const hurtPlayer = (amt: number, fromX = player.x, fromY = player.y) => {
    if (invuln > 0) return;
    player.hp -= amt;
    save.hp = player.hp;
    invuln = 0.85;
    const away = Math.hypot(player.x - fromX, player.y - fromY) || 1;
    moveActor(player, ((player.x - fromX) / away) * 8, ((player.y - fromY) / away) * 8);
    audio.hurt();
    trauma = Math.min(1, trauma + 0.55);
    hitstop = scaleHitstop(Math.max(hitstop, 0.05), reduced);
    if (player.hp <= 0) enterLimbo("The body fails. The cycle completes. You will be louder.");
  };

  const fireSlash = () => {
    const w = equipped();
    const k = DIRS[player.dir];
    const spec = INCARNATIONS[save.incarnation];
    const dmg = slashDamage({
      weaponDmg: w.dmg,
      incarnationDamage: spec.damage,
      edge: save.upgrades.edge,
      tropoverse: save.flags.tropoverse,
      flawId: save.character.flawId,
    });
    const aff = {
      burn: w.affixes.reduce((s, a) => s + (a.burn ?? 0), 0),
      slow: w.affixes.reduce((s, a) => s + (a.slow ?? 0), 0),
      stoned: w.affixes.reduce((s, a) => s + (a.stoned ?? 0), 0),
      karmaOnKill: w.affixes.reduce((s, a) => s + (a.karmaOnKill ?? 0), 0),
      lifesteal: w.affixes.reduce((s, a) => s + (a.lifesteal ?? 0), 0),
    };
    audio.slash();
    if (w.projectile) {
      if (w.kind === "staff" && save.mp < 1) {
        say("The staff wants mana. Find a creemee.");
        return;
      }
      if (w.kind === "staff") save.mp = Math.max(0, save.mp - 1);
      shots.push({
        x: player.x + k.x * 10,
        y: player.y + k.y * 10,
        vx: k.x * (w.kind === "rifle" ? 220 : 160),
        vy: k.y * (w.kind === "rifle" ? 220 : 160),
        life: 0.55,
        dmg,
        burn: aff.burn,
        slow: aff.slow,
        stoned: aff.stoned,
      });
      return;
    }
    slashes.push({ x: player.x + k.x * 12, y: player.y + k.y * 12, dir: player.dir, t: 0.14 });
    for (const e of enemies) {
      if (!e.alive) continue;
      if (Math.hypot(e.x - (player.x + k.x * 12), e.y - (player.y + k.y * 12)) < w.reach + 6) {
        hitEnemy(e, dmg, player.dir, aff);
      }
    }
    const drain = w.affixes.reduce((s, a) => s + (a.drain ?? 0), 0);
    if (drain) {
      player.hp = Math.max(0.25, player.hp - drain);
      save.hp = player.hp;
    }
  };

  const cutGrass = () => {
    const k = DIRS[player.dir];
    const tx = Math.floor((player.x + k.x * 12) / TILE);
    const ty = Math.floor((player.y + k.y * 12) / TILE);
    for (const p of [...props]) {
      if (p.kind !== "bush" && p.kind !== "pot") continue;
      if (Math.abs(p.x - tx) > 1 || Math.abs(p.y - ty) > 1) continue;
      if (Math.hypot(p.x * TILE + 8 - player.x, p.y * TILE + 8 - player.y) < 22) {
        save.flags.bushes = [...save.flags.bushes, p.id];
        props = props.filter((x) => x.id !== p.id);
        burst(p.x * TILE + 8, p.y * TILE + 8, "#3d7a40", 8);
        if (Math.random() < 0.22) {
          player.hp = Math.min(player.maxHp, player.hp + 0.5);
          save.hp = player.hp;
          floats.push({ x: player.x, y: player.y - 8, t: 0.7, text: "+½", color: "#d45d5d" });
        } else if (Math.random() < 0.12 && save.flags.arrows < 30) {
          save.flags.arrows += 1;
        }
      }
    }
  };

  const noteBladeOnMarble = () => {
    const k = DIRS[player.dir];
    const tx = Math.floor((player.x + k.x * 12) / TILE);
    const ty = Math.floor((player.y + k.y * 12) / TILE);
    if (world.tiles[ty]?.[tx] !== T.cracked) return;
    say(strikeMarble("blade", crackRole(mapId, tx, ty)).line);
  };

  const startCombo = () => {
    fireSlash();
    cutGrass();
    noteBladeOnMarble();
    attackT = 0.1;
  };

  const fireSpin = () => {
    const spec = INCARNATIONS[save.incarnation];
    const dmg = spinDamage(spec.damage, save.upgrades.edge);
    audio.slash();
    burst(player.x, player.y, "#e8c36a", 18);
    trauma = Math.min(1, trauma + 0.4);
    slashes.push({ x: player.x, y: player.y, dir: player.dir, t: 0.22 });
    for (const e of enemies) {
      if (e.alive && Math.hypot(e.x - player.x, e.y - player.y) < 28) {
        hitEnemy(e, dmg, player.dir);
      }
    }
    cutGrass();
    noteBladeOnMarble();
    attackT = 0.18;
    charge = 0;
  };

  const fireBow = (power: number) => {
    const y = save.flags.ySlot;
    const rifle = equipped().kind === "rifle" && (y == null || y === "bow");
    if (rifle) {
      if ((equipped().ammo ?? 0) <= 0 && save.flags.arrows <= 0) {
        say("The rifle is empty. Cartridges are scarce.");
        return;
      }
    } else if (save.flags.arrows <= 0 && save.flags.ySlot === "bow") {
      say("No arrows.");
      return;
    }
    if (rifle) {
      const w = equipped();
      if (w.ammo && w.ammo > 0) w.ammo -= 1;
      else save.flags.arrows = Math.max(0, save.flags.arrows - 1);
    } else {
      save.flags.arrows -= 1;
    }
    const k = DIRS[player.dir];
    const sp = 160 + power * 140;
    const w = equipped();
    shots.push({
      x: player.x + k.x * 10,
      y: player.y + k.y * 10,
      vx: k.x * sp,
      vy: k.y * sp,
      life: 0.7,
      dmg: (rifle ? w.dmg : 1.3) * (0.7 + power) * (1 + save.upgrades.edge * 0.1),
      burn: 0,
      slow: 0,
      stoned: 0,
    });
    audio.slash();
    attackT = 0.16;
    charge = 0;
  };

  const fireHook = () => {
    if (hook) return;
    const k = DIRS[player.dir];
    hook = { x: player.x, y: player.y, vx: k.x * 220, vy: k.y * 220, life: 0.45, latched: false };
    audio.slash();
    attackT = 0.2;
  };

  const smash = () => {
    const k = DIRS[player.dir];
    const tx = Math.floor((player.x + k.x * 14) / TILE);
    const ty = Math.floor((player.y + k.y * 14) / TILE);
    const lands = quarryHammerLands(mapId === "quarry", save.flags.relics.includes("lantern"), save.flags.lanternOn);
    let opened = false;
    let blind = false;
    let decoy = false;
    for (const [ox, oy] of [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const x = tx + ox;
      const y = ty + oy;
      if (world.tiles[y]?.[x] !== T.cracked) continue;
      if (crackRole(mapId, x, y) === "decoy") {
        decoy = true;
        continue;
      }
      if (!lands) {
        blind = true;
        continue;
      }
      world.tiles[y][x] = T.marble;
      tileCache.dirty(x, y);
      const cid = "crack-" + mapId + "-" + x + "-" + y;
      if (!save.flags.chests.includes(cid)) save.flags.chests = [...save.flags.chests, cid];
      burst(x * TILE + 8, y * TILE + 8, "#c4bba8", 12);
      opened = true;
    }
    if (opened) {
      say(strikeMarble("hammer", "true").line);
      persist();
    } else if (blind) say("The marble is blind. Open the lamp, then the hammer.");
    else if (decoy) say(strikeMarble("hammer", "decoy").line);
    fireSlash();
    attackT = 0.2;
  };

  const dig = () => {
    const near = props.find((p) => p.kind === "grave" && Math.hypot(p.x * TILE + 8 - player.x, p.y * TILE + 8 - player.y) < 20);
    if (!near) {
      say("Nothing to dig. Graves of your last skins hold what weather spared.");
      attackT = 0.2;
      return;
    }
    const g0 = save.flags.graves.find((g) => g.id === near.id);
    if (!g0 || g0.excavated) {
      say("Empty earth.");
      return;
    }
    const g = erodeGrave(g0, save.flags.year);
    g0.excavated = true;
    props = props.filter((p) => p.id !== near.id);
    for (const w of g.weapons) {
      const remembered = weaponFromGrave(w);
      const rolled = remembered ?? rollWeapon(w.id, w.kind === "rifle" ? "farmhouse" : "woods", save.cycle);
      if (!remembered) {
        rolled.id = w.id;
        rolled.name = w.name;
      }
      save.inventory = [...save.inventory, rolled];
    }
    for (const r of g.relics) {
      if (!save.flags.relics.includes(r)) save.flags.relics = [...save.flags.relics, r];
    }
    save.flags.arrows += g.arrows;
    say("You uncover what fourteen winters left.");
    audio.pickup();
    persist();
    attackT = 0.25;
  };

  const swingNet = () => {
    attackT = 0.16;
    for (const e of enemies) {
      if (!e.alive || e.kind !== "crow") continue;
      if (Math.hypot(e.x - player.x, e.y - player.y) < 22) {
        if (!fillBottle("deluxe")) {
          say("Both bottles are full. The crow keeps the light.");
          continue;
        }
        e.alive = false;
        say("A light in the net. Bottled.");
        audio.pickup();
      }
    }
  };

  const warpHome = () => {
    const m = save.flags.homeMap ?? save.flags.geoTown ?? "middlebury";
    const x = (save.flags.homeTileX || 12) * TILE + 8;
    const y = (save.flags.homeTileY || 10) * TILE + 8;
    loadWorld(m, x, y);
    say("The glass takes you home.");
    persist();
  };

  const nearestProp = () => {
    let best: PropSpec | null = null;
    let bd = 22;
    for (const p of props) {
      if (p.kind === "enemy" || p.kind === "spawn") continue;
      if (warpLock > 0 && (p.kind === "warp" || p.kind === "door")) continue;
      const d = Math.hypot(p.x * TILE + 8 - player.x, p.y * TILE + 8 - player.y);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  };

  const sim = (dt: number, actions: Actions) => {
    if (mode === "ending") {
      endingT += dt;
      if (
        actions.attackPressed ||
        actions.interactPressed ||
        actions.pausePressed ||
        actions.usePressed ||
        endingT > 2.4
      ) {
        if (endingBeat < 5) {
          endingBeat += 1;
          endingT = 0;
        } else {
          birthIntoWorld();
        }
      }
      return;
    }
    if (mode !== "play") return;

    animT += dt;
    if (warpLock > 0) warpLock -= dt;
    if (attackT > 0) attackT -= dt;
    if (comboGap > 0) comboGap -= dt;
    if (invuln > 0) invuln -= dt;
    if (dashT > 0) dashT -= dt;
    if (playerStoned > 0) playerStoned -= dt;
    if (flash > 0) flash -= dt;
    if (messageT > 0) {
      messageT -= dt;
      if (messageT <= 0) message = null;
    }
    trauma = Math.max(0, trauma - dt * 1.8);

    if (comboLeft > 0 && comboGap <= 0) {
      comboLeft = 0;
    }
    if (attackBuf > 0) {
      attackBuf -= dt;
      if (attackT <= 0) {
        startCombo();
        attackBuf = 0;
      }
    }

    const spec = INCARNATIONS[save.incarnation];
    const wpn = equipped();
    const wx = 1 + weaponMoveMod(wpn);
    const stonedMul = playerStoned > 0 ? 0.82 : 1;
    const speed = spec.speed * (1 + save.upgrades.stride * 0.12) * wx * stonedMul * sheetSpeedMul(save.character.flawId);
    let mx = actions.moveX;
    let my = actions.moveY;
    if (actions.scheme === "keyboard" || actions.scheme === "gamepad") {
      walkTarget = null;
      pendingProp = null;
    } else if (mouseHeld && mouseBtn === 0) {
      const dx = mouseWorldX - player.x;
      const dy = mouseWorldY - player.y;
      const d = Math.hypot(dx, dy);
      if (d > 5) {
        mx = dx / d;
        my = dy / d;
      } else {
        mx = 0;
        my = 0;
      }
    } else if (walkTarget) {
      const dx = walkTarget.x - player.x;
      const dy = walkTarget.y - player.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) {
        walkTarget = null;
        if (pendingProp) {
          const still = props.find((p) => p.id === pendingProp?.id);
          if (still) interactWith(still);
          pendingProp = null;
        }
        mx = 0;
        my = 0;
      } else {
        mx = dx / d;
        my = dy / d;
      }
    }
    if (playerStoned > 0) {
      mx += Math.sin(animT * 3) * 0.15;
      my += Math.cos(animT * 2.2) * 0.1;
    }
    if (mx || my) {
      if (actions.fromKeys) {
        if (Math.abs(mx) > Math.abs(my)) {
          player.dir = mx < 0 ? 1 : 2;
          faceMem = "x";
        } else {
          player.dir = my < 0 ? 3 : 0;
          faceMem = "y";
        }
      } else {
        const faced = resolveFacing(mx, my, player.dir, faceMem);
        player.dir = faced.dir;
        faceMem = faced.mem;
      }
    } else faceMem = null;

    const ySlot = save.flags.ySlot;
    const rifleOut = equipped().kind === "rifle";
    if (actions.attack) {
      if (rifleOut) {
        charge = Math.min(1, charge + dt * 1.6);
      } else if (attackT <= 0) {
        charge = Math.min(1, charge + dt);
        if (charge >= 0.45) fireSpin();
      }
    } else if (actions.item && ySlot === "bow") {
      charge = Math.min(1, charge + dt * 1.6);
    } else if (charge > 0.12 && ySlot === "bow") {
      fireBow(charge);
    } else if (charge > 0.12 && rifleOut && !actions.attack) {
      fireBow(charge);
    } else if (!actions.attack && !actions.item) {
      charge = Math.max(0, charge - dt * 2);
    }

    if (actions.attackPressed) {
      if (rifleOut) {
        /* charge on hold */
      } else if (attackT <= 0) {
        startCombo();
      } else {
        attackBuf = 0.08;
      }
    }

    if (actions.itemPressed) {
      if (ySlot === "hookshot") {
        fireHook();
      } else if (ySlot === "hammer") {
        smash();
      } else if (ySlot === "net") {
        swingNet();
      } else if (ySlot === "shovel") {
        dig();
      } else if (ySlot === "lantern") {
        save.flags.lanternOn = !save.flags.lanternOn;
        say(save.flags.lanternOn ? "Lamp open." : "Lamp shut.");
      } else if (ySlot === "mirror") {
        warpHome();
      } else if (ySlot === "cape") {
        const k = DIRS[player.dir];
        moveActor(player, k.x * 28, k.y * 28);
        invuln = 0.45;
        save.mp = Math.max(0, save.mp - 1);
      } else if (ySlot === "cane") {
        if (save.mp >= 1) {
          save.mp -= 1;
          const k = DIRS[player.dir];
          props.push({ kind: "pot", x: Math.floor(player.x / TILE) + k.x, y: Math.floor(player.y / TILE) + k.y, id: "cane-" + Date.now() });
        }
      } else if (ySlot === "ipod") {
        mode = "ipod";
        showHelp = false;
      }
    }

    if (mouseAttack && attackT <= 0 && equipped().kind !== "rifle") startCombo();
    if (dashT <= 0 && actions.dashPressed && (save.upgrades.shadowStep || save.incarnation === "smuggler" || save.flags.relics.includes("boots"))) {
      const k = DIRS[player.dir];
      moveActor(player, k.x * 26, k.y * 26);
      dashT = save.flags.relics.includes("boots") ? 0.28 : 0.55;
      burst(player.x, player.y, "#b07ad6", 5);
    }
    const spd = speed * (attackT > 0 ? 0.55 : 1);
    player.vx = mx * spd;
    player.vy = my * spd;
    moveActor(player, player.vx * dt, player.vy * dt);
    const pushing = Math.hypot(mx, my) > 0.25;
    if (pushing && blocked(player.x, player.y, 4)) {
      shoveT += dt;
      if (shoveT >= 0.4) {
        shoveT = 0;
        const place = shoveFree(player.x, player.y, mx, my);
        if (!blocked(place.x, place.y, 4)) {
          player.x = place.x;
          player.y = place.y;
          say("The ground lets you out.");
        }
      }
    } else {
      shoveT = 0;
    }
    if (mapId === "soloverse") {
      const W = world.w * TILE;
      const H = world.h * TILE;
      if (player.x < TILE) player.x += W - TILE * 2;
      else if (player.x > W - TILE) player.x -= W - TILE * 2;
      if (player.y < TILE) player.y += H - TILE * 2;
      else if (player.y > H - TILE) player.y -= H - TILE * 2;
    }
    if (mx < 0) probeYaw += 2.4 * dt;
    if (mx > 0) probeYaw -= 2.4 * dt;
    player.frame = animT * 8;

    if (actions.cyclePressed) {
      const yable = save.flags.relics.filter((r) => RELIC_BY_ID[r]?.slot === "Y");
      if (yable.length) {
        const i = yable.indexOf(save.flags.ySlot as RelicId);
        const next = yable[(i + 1) % yable.length];
        save.flags.ySlot = next;
        say(RELIC_BY_ID[next].name + " — " + RELIC_BY_ID[next].verb);
      } else if (save.inventory.length > 1) {
        const next = wearNextWeapon(save.inventory, save.equippedId);
        if (next) {
          save.equippedId = next.id;
          say(next.name);
        }
      }
    }
    if (actions.weaponCyclePressed) {
      const next = wearNextWeapon(save.inventory, save.equippedId);
      if (next) {
        save.equippedId = next.id;
        say(next.name);
      }
    }
    if (actions.usePressed) sip();
    if (actions.bombPressed && save.flags.bombs > 0) {
      save.flags.bombs -= 1;
      const k = DIRS[player.dir];
      const bx = player.x + k.x * 16;
      const by = player.y + k.y * 16;
      burst(bx, by, "#e8c36a", 16);
      trauma = Math.min(1, trauma + 0.6);
      audio.hit();
      const tx = Math.floor(bx / TILE);
      const ty = Math.floor(by / TILE);
      if (world.tiles[ty]?.[tx] === T.cracked) {
        const verdict = strikeMarble("bomb", crackRole(mapId, tx, ty));
        if (verdict.open) {
          world.tiles[ty][tx] = T.gravel;
          tileCache.dirty(tx, ty);
          save.flags.quarryOpen = true;
        }
        say(verdict.line);
      }
      for (const e of enemies) {
        if (e.alive && Math.hypot(e.x - bx, e.y - by) < 22) hitEnemy(e, 2, player.dir);
      }
    }

    const near = nearestProp();
    interactHint = near
      ? near.kind === "warp"
        ? near.id.includes("quarry")
          ? "Marble Vein"
          : near.warp?.map === "bell"
            ? "The bell"
          : near.id.includes("soloverse") || near.id.includes("seam")
            ? "Soloverse"
            : "Enter"
        : near.kind === "door"
          ? "Enter"
        : near.kind === "cave"
          ? "Cave"
        : near.kind === "chest" || near.kind === "cache"
          ? "Open"
          : near.kind === "rifle"
            ? "Take rifle"
            : near.kind === "syrup" || near.kind === "creemee"
              ? "Take"
              : near.kind === "shrine"
                ? "Hold Release"
                : near.kind === "grave"
              ? "Dig"
              : near.kind === "relic"
                ? "Take"
                : near.kind === "key"
                  ? "Key"
                  : near.kind === "lock"
                    ? "Unlock"
                    : near.kind === "wheel"
                      ? "Turn"
                    : near.kind === "home"
                  ? "The homestead"
                  : "Talk"
      : null;
    if (actions.interactPressed && near) interactWith(near);
    if (near?.kind === "door" && player.dir === 3 && my < -0.15) {
      const d = Math.hypot(near.x * TILE + 8 - player.x, near.y * TILE + 8 - player.y);
      if (d < 12) enterDoor(near);
    }
    if (near?.kind === "cave" && my < -0.15) {
      const d = Math.hypot(near.x * TILE + 8 - player.x, near.y * TILE + 8 - player.y);
      if (d < 14) enterDoor(near);
    }

    if (actions.release) {
      ritual += dt;
      if (ritual >= 1.35) {
        ritual = 0;
        enterLimbo("You released the skin on purpose.");
        return;
      }
    } else ritual = Math.max(0, ritual - dt * 1.5);

    const bond = save.upgrades.wraithBond ? 0.65 : 1;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (e.hurt > 0) e.hurt -= dt;
      if (e.slow > 0) e.slow -= dt;
      if (e.stoned > 0) e.stoned -= dt;
      if (e.burn > 0) {
        e.burn -= dt;
        if (Math.floor(e.burn * 4) !== Math.floor((e.burn + dt) * 4)) {
          e.hp -= 0.25;
          burst(e.x, e.y, "#c45c4a", 2);
          if (e.hp <= 0) hitEnemy(e, 0.1, player.dir);
        }
      }
      e.frame += dt * (e.kind === "fisher" ? 10 : e.kind === "bobcat" ? 9 : 6);
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      let sp = e.kind === "crow" ? 40 : e.kind === "sentinel" ? 22 : e.kind === "bear" ? 26 : e.kind === "bobcat" ? 58 : e.kind === "fisher" ? 68 : e.kind === "resident" ? 30 : 32;
      sp *= bond;
      if (e.slow > 0) sp *= 0.45;
      const aggro = e.kind === "bear" ? 64 : e.kind === "resident" ? 52 : 78;
      if (e.kind === "sentinel" && dist >= aggro) {
        e.beat = "still";
        e.tell = 0;
      }
      if (e.stoned > 0) {
        if (e.kind !== "sentinel") {
          e.tell = 0;
          e.warned = false;
        }
        e.vx = Math.sin(animT * 2 + e.x) * sp * 0.4;
        e.vy = Math.cos(animT * 1.7 + e.y) * sp * 0.4;
        moveActor(e, e.vx * dt, e.vy * dt);
      } else if (dist < aggro) {
        const sentinel =
          e.kind === "sentinel"
            ? stepSentinel({
                hp: e.hp,
                maxHp: e.maxHp,
                inRange: true,
                beat: e.beat,
                tell: e.tell,
                dt,
              })
            : null;
        if (sentinel) {
          e.beat = sentinel.beat;
          e.tell = sentinel.tell;
        }
        if (sentinel && !sentinel.moves) {
          e.vx = 0;
          e.vy = 0;
        } else if (sentinel) {
          const ix = dx / dist;
          const iy = dy / dist;
          moveActor(e, ix * sp * dt, iy * sp * dt);
          if (Math.abs(ix) > Math.abs(iy)) e.dir = ix < 0 ? 1 : 2;
          else e.dir = iy < 0 ? 3 : 0;
          if (dist < 12 && e.hurt <= 0) {
            hurtPlayer(1, e.x, e.y);
            e.hurt = 0.4;
          }
        } else {
          const beforeTell = e.tell;
          const step = countyTell(e.kind, dist, e.tell, e.warned, dt);
          e.tell = step.tell;
          e.warned = step.warned;
          if (beforeTell === 0 && step.step === "tell") audio.tell();
          if (Math.abs(dx) > Math.abs(dy)) e.dir = dx < 0 ? 1 : 2;
          else e.dir = dy < 0 ? 3 : 0;
          if (step.step === "tell") {
            e.vx = 0;
            e.vy = 0;
          } else {
            let ix = dx / dist;
            let iy = dy / dist;
            if (e.kind === "fisher") {
              ix += Math.sin(animT * 8) * 0.45;
              iy += Math.cos(animT * 6) * 0.45;
            }
            moveActor(e, ix * sp * dt, iy * sp * dt);
            if (step.step === "bite" && dist < 12 && e.hurt <= 0) {
              const dmg = e.kind === "bear" ? 1.5 : e.kind === "resident" ? 1.2 : 1;
              hurtPlayer(dmg, e.x, e.y);
              e.hurt = 0.4;
              e.warned = false;
            }
          }
        }
      } else if (e.kind !== "sentinel") {
        e.tell = 0;
        e.warned = false;
      }
    }

    for (const s of shots) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (isSolid(tileAt(s.x, s.y), save.incarnation)) s.life = 0;
      for (const e of enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - s.x, e.y - s.y) < 10) {
          hitEnemy(e, s.dmg, player.dir, { burn: s.burn, slow: s.slow, stoned: s.stoned, karmaOnKill: 0, lifesteal: 0 });
          s.life = 0;
        }
      }
    }
    shots = shots.filter((s) => s.life > 0);
    if (hook) {
      hook.life -= dt;
      hook.x += hook.vx * dt;
      hook.y += hook.vy * dt;
      if (isSolid(tileAt(hook.x, hook.y), save.incarnation, true) || hook.life <= 0) {
        const dx = hook.x - player.x;
        const dy = hook.y - player.y;
        const d = Math.hypot(dx, dy) || 1;
        moveActor(player, (dx / d) * 18, (dy / d) * 18);
        hook = null;
      } else {
        for (const e of enemies) {
          if (e.alive && Math.hypot(e.x - hook.x, e.y - hook.y) < 12) {
            hitEnemy(e, 1.2, player.dir);
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const d = Math.hypot(dx, dy) || 1;
            moveActor(player, (dx / d) * 16, (dy / d) * 16);
            hook = null;
            break;
          }
        }
      }
    }
    if (input.keys.has("Minus") || input.keys.has("BracketLeft")) zoom = 0.5;
    if (input.keys.has("Equal") || input.keys.has("BracketRight")) zoom = 1;
    localHour = debugHour ?? vtHour();
    slashes = slashes.filter((s) => {
      s.t -= dt;
      return s.t > 0;
    });
    particles = particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g ?? 30) * dt;
      return p.life > 0;
    });
    floats = floats.filter((f) => {
      f.t -= dt;
      f.y -= 12 * dt;
      return f.t > 0;
    });

    const fighting = enemies.some((e) => e.alive && Math.hypot(e.x - player.x, e.y - player.y) < 78);
    const nextBed = bedFor({ mode, mapId, fighting });
    if (nextBed !== audioBed) {
      audioBed = nextBed;
      audio.startDrone(nextBed);
    }

    beacon = questBeacon();
    trimCapped(slashes, SLASH_CAP);
    trimCapped(particles, PARTICLE_CAP);
    trimCapped(floats, FLOAT_CAP);
    if (particles.length < PARTICLE_CAP && !reduced && mapId !== "soloverse") {
      const moving = Math.abs(mx) + Math.abs(my) > 0.2;
      if (moving) {
        stepAcc += dt;
        if (stepAcc > 0.2) {
          stepAcc = 0;
          particles.push({
            x: player.x + (Math.random() - 0.5) * 4,
            y: player.y + 5,
            vx: -mx * 8,
            vy: -6,
            life: 0.28,
            color: "#c4b48a",
            size: 1,
            g: 18,
          });
        }
      }
      const outdoors = !isInterior(mapId) && mapId !== "quarry";
      if (outdoors) {
        moteAcc += dt;
        if (moteAcc > 0.45) {
          moteAcc = 0;
          const roofs = props.filter(
            (p) =>
              p.kind === "home" ||
              p.kind === "barn" ||
              p.kind === "inn" ||
              p.kind === "hall" ||
              p.kind === "college" ||
              p.kind === "capitol" ||
              p.kind === "sugar" ||
              p.kind === "disp",
          );
          if (roofs.length) {
            const b = roofs[Math.floor(animT * 2) % roofs.length];
            const night = localHour < 6 || localHour >= 20;
            particles.push({
              x: b.x * TILE + 5,
              y: b.y * TILE + 1,
              vx: (Math.random() - 0.4) * 6,
              vy: -12 - Math.random() * 6,
              life: 1.3,
              color: night ? "#6a5a48" : "#e4dcc8",
              size: Math.random() < 0.35 ? 2 : 1,
              g: 0,
            });
          }
          const night = localHour < 6 || localHour >= 20;
          particles.push({
            x: player.x + (Math.random() - 0.5) * 120,
            y: player.y + (Math.random() - 0.5) * 80,
            vx: (Math.random() - 0.5) * (night ? 8 : 4),
            vy: night ? (Math.random() - 0.5) * 6 : -3,
            life: night ? 2.4 : 1.5,
            color: night ? "#e8c36a" : "#f4efe2",
            size: 1,
            g: 0,
          });
        }
      }
    }

    const look = DIRS[player.dir];
    const cam = stepCamera(camX, camY, player.x + look.x * 16, player.y + look.y * 10, dt, {
      deadX: 4,
      deadY: 3,
      stiffness: reduced ? 18 : 10,
    });
    camX = cam.x;
    camY = cam.y;
  };

  const drawSheet = (
    img: HTMLImageElement | undefined,
    sx: number,
    sy: number,
    cols: number,
    rows: number,
    dx: number,
    dy: number,
    dw: number,
    dh = dw,
  ) => {
    if (!img) return false;
    const cw = img.width / cols;
    const ch = img.height / rows;
    bctx.drawImage(img, sx * cw, sy * ch, cw, ch, dx, dy, dw, dh);
    return true;
  };

  const hudLayer = document.createElement("canvas");
  hudLayer.width = SNES_W;
  hudLayer.height = 36;
  const hudCtx = hudLayer.getContext("2d")!;
  hudCtx.imageSmoothingEnabled = false;
  let hudSig = "";
  const drawHudBar = () => {
    const town = TOWN_BY_ID[mapId]?.name ?? (isInterior(mapId) ? "Inside" : mapId);
    const clock = String(localHour).padStart(2, "0") + "h";
    const wx = "";
    const sig = [
      player.hp,
      player.maxHp,
      save.mp,
      save.maxMp,
      save.karma,
      save.flags.arrows,
      save.flags.bombs,
      save.flags.keys,
      save.flags.year,
      town,
      clock,
      wx,
      save.flags.ySlot,
      save.character.name,
    ].join("|");
    if (sig !== hudSig) {
      hudSig = sig;
      hudCtx.clearRect(0, 0, SNES_W, 36);
      paintHudALttP(hudCtx, {
        hp: player.hp,
        maxHp: player.maxHp,
        mp: save.mp,
        maxMp: save.maxMp,
        karma: save.karma,
        arrows: save.flags.arrows,
        bombs: save.flags.bombs,
        keys: save.flags.keys,
        year: save.flags.year,
        town,
        clock,
        weather: wx,
        ySlot: save.flags.ySlot,
        name: save.character.name,
      });
    }
    bctx.drawImage(hudLayer, 0, 0);
  };

  const draw = (_t: number) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cvs.clientWidth || 640;
    const h = cvs.clientHeight || 480;
    if (cvs.width !== Math.floor(w * dpr) || cvs.height !== Math.floor(h * dpr)) {
      cvs.width = Math.floor(w * dpr);
      cvs.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    bctx.fillStyle = "#143c28";
    bctx.fillRect(0, 0, SNES_W, SNES_H);

    const shake = trauma * trauma;
    const ox = shakeOn ? (Math.random() - 0.5) * shake * 8 : 0;
    const oy = shakeOn ? (Math.random() - 0.5) * shake * 8 : 0;
    const visW = SNES_W / zoom;
    const visH = VIEW_H / zoom;
    const maxX = Math.max(0, world.w * TILE - visW);
    const maxY = Math.max(0, world.h * TILE - visH);
    const snap = zoom >= 1 ? 1 : 2;
    let viewX = Math.round((camX - visW / 2 + ox) / snap) * snap;
    let viewY = Math.round((camY - visH / 2 + oy) / snap) * snap;
    viewX = Math.max(0, Math.min(maxX, viewX));
    viewY = Math.max(0, Math.min(maxY, viewY));
    const ts = TILE * zoom;
    const frame = Math.floor(animT * 4) % 4;

    tileCache.blitView(bctx, world.tiles, viewX, viewY, visW, visH, zoom, frame);

    const worldX = (wx: number) => Math.round((wx - viewX) * zoom);
    const worldY = (wy: number) => Math.round((wy - viewY) * zoom);
    const spr = (wx: number, wy: number) => ({
      dx: worldX(wx) - Math.round(8 * zoom),
      dy: worldY(wy) - Math.round(12 * zoom),
    });

    type Layer = { y: number; draw: () => void };
    const layers: Layer[] = [];

    const drawProp = (p: PropSpec) => {
      const dx = worldX(p.x * TILE);
      const dy = worldY(p.y * TILE);
      const glow = save.upgrades.sight > 0;
      if (p.kind === "bush") propCache.bush(bctx, dx, dy, glow);
      else if (p.kind === "chest") propCache.chest(bctx, dx, dy, glow);
      else if (p.kind === "cache") paintCache(bctx, dx, dy, glow);
      else if (p.kind === "shrine") propCache.shrine(bctx, dx, dy, ritual > 0);
      else if (p.kind === "well") propCache.well(bctx, dx, dy);
      else if (p.kind === "home" || p.kind === "barn" || p.kind === "inn" || p.kind === "hall" || p.kind === "college" || p.kind === "capitol" || p.kind === "sugar" || p.kind === "disp") {
        paintBuilding16(bctx, p.kind === "home" ? "home" : p.kind, dx, dy);
        if (localHour < 6 || localHour >= 20) {
          bctx.fillStyle = "#f0d090";
          bctx.fillRect(dx + 5, dy + 7, 1, 1);
          bctx.fillRect(dx + 10, dy + 7, 1, 1);
        }
      } else if (p.kind === "rock") paintRock16(bctx, dx, dy);
      else if (p.kind === "pot") paintPot16(bctx, dx, dy);
      else if (p.kind === "sheep") {
        const hop = reduced ? 0 : Math.floor(animT * 2 + p.x) % 5 === 0 ? -1 : 0;
        paintSheep16(bctx, dx, dy + hop);
      }
      else if (p.kind === "npc") {
        const bob = reduced ? 0 : Math.sin(animT * 2.4 + p.x * 0.7) > 0.92 ? -1 : 0;
        paintNpc16(bctx, dx, dy + bob, p.npc ?? "elder");
        const mark =
          (p.npc === "elder" && !save.flags.talked.includes("elder")) ||
          (p.npc === "elder" && save.cycle >= 1 && save.flags.returnedFromDeath);
        if (mark) {
          const a = 0.4 + 0.3 * Math.sin(animT * 6);
          bctx.strokeStyle = "rgba(232,195,106," + a.toFixed(2) + ")";
          bctx.strokeRect(dx + 1, dy + 1, 14, 14);
        }
      }
      else if (p.kind === "door") {
        bctx.fillStyle = "#1a100c";
        bctx.fillRect(dx + 4, dy + 2, 8, 14);
      } else if (p.kind === "rifle") {
        bctx.fillStyle = "#5a3f28";
        bctx.fillRect(dx, dy + 6, 16, 3);
      } else if (p.kind === "syrup") {
        bctx.fillStyle = "#8a3a12";
        bctx.fillRect(dx + 5, dy + 4, 6, 10);
      } else if (p.kind === "creemee") {
        bctx.fillStyle = "#efe6d2";
        bctx.fillRect(dx + 5, dy + 4, 6, 8);
      } else if (p.kind === "warp") {
        bctx.fillStyle = "rgba(232,195,106,0.4)";
        bctx.fillRect(dx + 5, dy + 5, 6, 6);
      } else if (p.kind === "grave") paintGrave16(bctx, dx, dy);
      else if (p.kind === "key") paintKey16(bctx, dx, dy);
      else if (p.kind === "lock") paintLock16(bctx, dx, dy);
      else if (p.kind === "wheel") {
        bctx.strokeStyle = "#8a5a2a";
        bctx.strokeRect(dx + 3, dy + 3, 10, 10);
        bctx.fillStyle = "#c4a574";
        bctx.fillRect(dx + 7, dy + 4, 2, 8);
        bctx.fillRect(dx + 4, dy + 7, 8, 2);
      }
      else if (p.kind === "cave") paintCave16(bctx, dx, dy);
      else if (p.kind === "relic") {
        const sheet = images.get("relics");
        const ids: RelicId[] = ["shovel","hookshot","boots","flippers","lantern","hammer","net","mirror","cape","cane","bow","ipod","bombs","sword"];
        const idx = Math.max(0, ids.indexOf((p.relic as RelicId) ?? "shovel"));
        if (!drawSheet(sheet, idx % 4, Math.floor(idx / 4), 4, 4, dx, dy, ts)) {
          bctx.fillStyle = "#e8c36a";
          bctx.fillRect(dx + 4, dy + 4, 8, 8);
        }
        if (p.relic === "shovel" && !save.flags.relics.includes("shovel")) {
          const a = 0.4 + 0.3 * Math.sin(animT * 6);
          bctx.strokeStyle = "rgba(232,195,106," + a.toFixed(2) + ")";
          bctx.strokeRect(dx + 1, dy + 1, 14, 14);
        }
      }
    };

    for (const p of props) {
      if (p.kind === "enemy" || p.kind === "spawn") continue;
      const isBldg = p.kind === "home" || p.kind === "barn" || p.kind === "inn" || p.kind === "hall" || p.kind === "college" || p.kind === "capitol" || p.kind === "sugar" || p.kind === "disp";
      layers.push({
        y: p.y * TILE + (isBldg ? 18 : 10),
        draw: () => drawProp(p),
      });
    }

    for (const a of enemies) {
      if (!a.alive) continue;
      layers.push({
        y: a.y,
        draw: () => {
          const { dx, dy } = spr(a.x, a.y);
          paintShadow(bctx, dx, dy);
          if (a.hurt > 0) {
            bctx.globalAlpha = 0.7;
            bctx.fillStyle = "#ffffff";
            bctx.fillRect(dx + 2, dy + 2, 12, 14);
            bctx.globalAlpha = 0.55;
          }
          const row = a.dir;
          const col = Math.floor(a.frame) % 4;
          const drawn =
            a.kind === "crow"
              ? drawSheet(images.get("crow"), col % 2, Math.floor(col / 2) % 2, 2, 2, dx, dy, ts)
              : a.kind === "wraith"
                ? drawSheet(images.get("wraith"), col, row, 4, 4, dx, dy, ts)
                : a.kind === "sentinel"
                  ? drawSheet(images.get("sentinel"), 0, 0, 1, 1, dx, dy, ts)
                  : a.kind === "bear"
                    ? drawSheet(images.get("bear"), col, row, 4, 4, dx, dy, ts)
                    : a.kind === "bobcat"
                      ? drawSheet(images.get("bobcat"), col, row, 4, 4, dx, dy, ts)
                      : a.kind === "fisher"
                        ? drawSheet(images.get("fisher"), col, row, 4, 4, dx, dy, ts)
                        : drawSheet(images.get("resident"), col, row, 4, 4, dx, dy, ts);
          if (!drawn) {
            if (a.kind === "bear") paintBearFallback(bctx, dx, dy);
            else if (a.kind === "bobcat") paintBobcatFallback(bctx, dx, dy);
            else if (a.kind === "fisher") paintFisherFallback(bctx, dx, dy);
            else {
              bctx.fillStyle = a.kind === "wraith" ? "#b07ad6" : "#c4bba8";
              bctx.fillRect(dx + 4, dy + 4, 8, 10);
            }
          }
          bctx.globalAlpha = 1;
          if (a.kind === "sentinel" && a.beat === "gold") {
            bctx.globalAlpha = 0.95;
            bctx.fillStyle = "#e8c36a";
            bctx.fillRect(dx + 2, dy + 1, 12, 3);
            bctx.globalAlpha = 1;
          }
          if (a.tell > 0 && a.kind !== "sentinel") {
            bctx.fillStyle = "#f4efe2";
            for (const [mx, my] of tellPixels(a.x, a.y, player.x, player.y, a.tell, TELL_S)) {
              bctx.fillRect(worldX(mx), worldY(my), 1, 1);
            }
          }
          if (a.hp < a.maxHp) {
            bctx.fillStyle = "#2a2018";
            bctx.fillRect(dx, dy - 3, 16, 2);
            bctx.fillStyle = "#d45d5d";
            bctx.fillRect(dx, dy - 3, 16 * (a.hp / a.maxHp), 2);
          }
        },
      });
    }

    layers.push({
      y: player.y,
      draw: () => {
        const k = DIRS[player.dir];
        const lunge = attackT > 0 ? Math.round(2 * zoom) : 0;
        const dx = worldX(player.x) - Math.round(8 * zoom) + k.x * lunge;
        const dy = worldY(player.y) - Math.round(12 * zoom) + k.y * lunge;
        paintShadow(bctx, dx, worldY(player.y) - Math.round(14 * zoom));
        if (invuln > 0 && Math.floor(invuln * 12) % 2 === 0) bctx.globalAlpha = 0.4;
        const col = attackT > 0 ? 2 : Math.floor(player.frame) % 4;
        const sheet = images.get(save.incarnation) ?? images.get("wanderer");
        if (!drawSheet(sheet, col, player.dir, 4, 4, dx, dy, ts)) {
          const fill =
            save.incarnation === "smuggler"
              ? "#6a7a3a"
              : save.incarnation === "officer"
                ? "#2c3a6e"
                : save.incarnation === "embryo"
                  ? "#c9b06a"
                  : "#b02424";
          bctx.fillStyle = fill;
          bctx.fillRect(dx + 5, dy + 4, 6, 10);
        }
        bctx.globalAlpha = 1;
      },
    });

    layers.sort((a, b) => a.y - b.y);
    for (const L of layers) L.draw();

    for (const s of shots) {
      bctx.fillStyle = "#e8c36a";
      bctx.fillRect(Math.round((s.x - viewX) * zoom) - 1, Math.round((s.y - viewY) * zoom) - 1, 3, 3);
    }
    for (const s of slashes) {
      const k = DIRS[s.dir];
      const sx = Math.round((s.x - viewX) * zoom);
      const sy = Math.round((s.y - viewY) * zoom);
      bctx.fillStyle = "#f4efe2";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI - 0.4;
        bctx.fillRect(sx + Math.round(Math.cos(a + k.x) * 8), sy + Math.round(Math.sin(a + k.y) * 8), 2, 2);
      }
      bctx.fillStyle = "#e8c36a";
      bctx.fillRect(sx + k.x * 4, sy + k.y * 4, 3, 3);
    }
    for (const p of particles) {
      bctx.fillStyle = p.color;
      const s = p.g === 0 ? Math.max(1, Math.min(2, Math.round(p.size))) : 1;
      bctx.fillRect(Math.round((p.x - viewX) * zoom), Math.round((p.y - viewY) * zoom), s, s);
    }
    for (const f of floats) {
      bctx.fillStyle = f.color;
      bctx.fillText(f.text, Math.round((f.x - viewX) * zoom) - 10, Math.round((f.y - viewY) * zoom));
    }

    if (boneFlashAlpha(flash, reducedFlash) > 0) {
      bctx.fillStyle = "rgba(244,239,226,0.25)";
      bctx.fillRect(0, 0, SNES_W, SNES_H);
    }
    const night = localHour < 6 || localHour >= 20;
    if (mapId === "soloverse" || save.flags.tropoverse) {
      const px = (player.x - viewX) * zoom;
      const py = (player.y - viewY) * zoom;
      const g = bctx.createRadialGradient(px, py, 48, px, py, 150);
      g.addColorStop(0, "rgba(20,12,40,0)");
      g.addColorStop(1, "rgba(8,6,18,0.28)");
      bctx.fillStyle = g;
      bctx.fillRect(0, 0, SNES_W, SNES_H);
      bctx.fillStyle = "rgba(208,176,255,0.7)";
      for (let i = 0; i < 18; i++) {
        const sx = Math.floor((i * 53 + animT * 4) % SNES_W);
        const sy = Math.floor((i * 97 + 11) % SNES_H);
        if (sy > 16) bctx.fillRect(sx, sy, 1, 1);
      }
    } else if (mapId === "quarry") {
      const px = (player.x - viewX) * zoom;
      const py = (player.y - viewY) * zoom;
      const on = save.flags.lanternOn && save.flags.relics.includes("lantern");
      const g = bctx.createRadialGradient(px, py, on ? 28 : 10, px, py, on ? 96 : 28);
      g.addColorStop(0, "rgba(6,10,24,0)");
      g.addColorStop(1, on ? "rgba(6,10,24,0.62)" : "rgba(4,6,14,0.92)");
      bctx.fillStyle = g;
      bctx.fillRect(0, 0, SNES_W, SNES_H);
    } else if (night) {
      const lamp = save.flags.lanternOn ? 0.1 : 0.2;
      bctx.fillStyle = "rgba(12,18,48," + lamp + ")";
      bctx.fillRect(0, 0, SNES_W, SNES_H);
    }
    if (charge > 0.05) {
      bctx.fillStyle = "#2a2018";
      bctx.fillRect(SNES_W / 2 - 20, 8, 40, 3);
      bctx.fillStyle = charge >= 0.45 ? "#e8c36a" : "#f4efe2";
      bctx.fillRect(SNES_W / 2 - 20, 8, 40 * charge, 3);
    }
    if (hook) {
      bctx.fillStyle = "#c4bba8";
      const hx0 = Math.round((player.x - viewX) * zoom);
      const hy0 = Math.round((player.y - viewY) * zoom);
      const hx1 = Math.round((hook.x - viewX) * zoom);
      const hy1 = Math.round((hook.y - viewY) * zoom);
      const steps = Math.max(1, Math.hypot(hx1 - hx0, hy1 - hy0) | 0);
      for (let i = 0; i <= steps; i += 2) {
        const t = i / steps;
        bctx.fillRect(hx0 + (hx1 - hx0) * t, hy0 + (hy1 - hy0) * t, 1, 1);
      }
    }
    if (walkTarget || (mouseHeld && mouseBtn === 0)) {
      const tx = mouseHeld ? mouseWorldX : walkTarget!.x;
      const ty = mouseHeld ? mouseWorldY : walkTarget!.y;
      const mx = Math.round((tx - viewX) * zoom);
      const my = Math.round((ty - viewY) * zoom);
      bctx.fillStyle = "#e8c36a";
      bctx.fillRect(mx - 2, my, 5, 1);
      bctx.fillRect(mx, my - 2, 1, 5);
    }

    if (mode === "play" && beacon) {
      const sx = worldX(beacon.x);
      const sy = worldY(beacon.y);
      const on = sx > 12 && sx < SNES_W - 12 && sy > 28 && sy < SNES_H - 14;
      if (on) {
        const bob = reduced ? 0 : Math.sin(animT * 6) > 0 ? 0 : 1;
        const mx = sx;
        const my = sy - 14 - bob;
        bctx.fillStyle = "#1a120c";
        bctx.fillRect(mx - 2, my - 1, 5, 5);
        bctx.fillStyle = "#e8c36a";
        bctx.fillRect(mx, my, 1, 1);
        bctx.fillRect(mx - 1, my + 1, 3, 1);
        bctx.fillRect(mx, my + 2, 1, 1);
      } else {
        const ang = Math.atan2(beacon.y - player.y, beacon.x - player.x);
        const oct = Math.round(ang / (Math.PI / 4));
        const dirs: Array<[number, number]> = [
          [1, 0],
          [1, 1],
          [0, 1],
          [-1, 1],
          [-1, 0],
          [-1, -1],
          [0, -1],
          [1, -1],
        ];
        const [ax, ay] = dirs[((oct % 8) + 8) % 8];
        const ix = Math.round(Math.max(18, Math.min(SNES_W - 18, SNES_W / 2 + Math.cos(ang) * (SNES_W / 2 - 24))));
        const iy = Math.round(Math.max(34, Math.min(SNES_H - 18, SNES_H / 2 + Math.sin(ang) * (SNES_H / 2 - 30))));
        bctx.fillStyle = "#1a120c";
        bctx.fillRect(ix - 4, iy - 4, 9, 9);
        bctx.fillStyle = "#e8c36a";
        bctx.fillRect(ix, iy, 1, 1);
        bctx.fillRect(ix + ax, iy + ay, 1, 1);
        bctx.fillRect(ix + ax * 2, iy + ay * 2, 1, 1);
        bctx.fillRect(ix - ay, iy + ax, 1, 1);
        bctx.fillRect(ix + ay, iy - ax, 1, 1);
        const line = cardinal(beacon.x - player.x, beacon.y - player.y) + " " + beacon.label;
        bctx.font = "8px monospace";
        const tw = Math.min(SNES_W - 8, bctx.measureText(line).width);
        let tx = ix - tw / 2;
        tx = Math.max(4, Math.min(SNES_W - tw - 4, tx));
        const ty = Math.max(40, Math.min(SNES_H - 6, iy + (ay >= 0 ? 14 : -8)));
        bctx.fillStyle = "#1a120c";
        bctx.fillRect(tx - 1, ty - 7, tw + 2, 9);
        bctx.fillStyle = "#f4efe2";
        bctx.fillText(line, tx, ty);
      }
    }

    if (mode === "play") {
      const line = placeUnderfoot(tileAt(player.x, player.y), mapId);
      bctx.font = "8px monospace";
      const tw = Math.min(140, bctx.measureText(line).width);
      bctx.fillStyle = "#14100c";
      bctx.fillRect(4, 40, tw + 4, 9);
      bctx.fillStyle = "#f4efe2";
      bctx.fillText(line, 6, 47);
    }

    drawHudBar();
    bctx.fillStyle = "#e8c36a";
    bctx.font = "8px monospace";
    if (interactHint) bctx.fillText(interactHint.toUpperCase(), 6, SNES_H - 6);
    else if (message) bctx.fillText(message.slice(0, 52), 6, SNES_H - 6);

    const fit = Math.min(w / SNES_W, h / SNES_H);
    const scale = Math.max(1, Math.floor(fit));
    const dw = SNES_W * scale;
    const dh = SNES_H * scale;
    blit.ox = Math.floor((w - dw) / 2);
    blit.oy = Math.floor((h - dh) / 2);
    blit.scale = scale;
    blit.viewX = viewX;
    blit.viewY = viewY;
    blit.zoom = zoom;
    ctx.fillStyle = "#070b18";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buf, 0, 0, SNES_W, SNES_H, blit.ox, blit.oy, dw, dh);
  };

  let lastUi = "";
  deck.setOnChange(() => {
    lastUi = "";
    save.flags.deck = deck.snapshot();
    if (mode !== "title") persist();
  });
  void deck.hydrate(save.flags.deck);
  const emitUi = () => {
    const wpn = equipped();
    const town = TOWN_BY_ID[mapId];
    const ds = deck.status();
    const snap: UiSnapshot = {
      mode,
      hp: player.hp,
      maxHp: player.maxHp,
      mp: save.mp,
      maxMp: save.maxMp,
      karma: save.karma,
      crowns: save.crowns,
      cycle: save.cycle,
      incarnation: save.incarnation,
      bombs: save.flags.bombs,
      objective: objective(),
      interactHint,
      dialogue,
      shake: shakeOn,
      reducedMotion: reduced,
      message,
      flags: save.flags,
      upgrades: save.upgrades,
      endingBeat,
      muted: audio.muted,
      showHelp,
      townName: isInterior(mapId)
        ? "Inside · " + (TOWN_BY_ID[save.flags.returnMap ?? "middlebury"]?.name ?? "house")
        : mapId === "soloverse"
          ? "Soloverse"
          : (town?.name ?? mapId),
      weatherName: "…",
      tempF: null,
      weaponName: wpn.name,
      weaponTags: summarizeWeapon(wpn),
      bag: [
        ...save.inventory.map((weapon) => weapon.name),
        ...save.flags.relics
          .filter((id) => id !== "sword")
          .map((id) => RELIC_BY_ID[id]?.name)
          .filter((name): name is string => !!name),
        ...save.flags.bottles
          .filter((bottle) => bottle !== "empty")
          .map((bottle) => (bottle === "deluxe" ? "Deluxe creemee" : bottle === "creemee" ? "Creemee" : "Syrup")),
        ...(save.flags.arrows > 0 ? [`Arrows ×${save.flags.arrows}`] : []),
        ...(save.flags.bombs > 0 ? [`Powder kegs ×${save.flags.bombs}`] : []),
        ...(save.flags.keys > 0 ? [`Keys ×${save.flags.keys}`] : []),
      ].join(" · ") || "Nothing",
      kit: readKit(
        save.inventory,
        save.equippedId,
        {
          incarnationDamage: INCARNATIONS[save.incarnation].damage,
          edge: save.upgrades.edge,
          tropoverse: save.flags.tropoverse,
          flawId: save.character.flawId,
        },
        save.flags.ySlot,
      ),
      geoLine: save.flags.geoTown
        ? save.flags.geoTown === mapId
          ? "You are here"
          : "Home: " + (TOWN_BY_ID[save.flags.geoTown]?.name ?? "")
        : null,
      bottles: save.flags.bottles,
      tropoverse: save.flags.tropoverse,
      year: save.flags.year,
      clock: String(localHour).padStart(2, "0") + ":00",
      yName: save.flags.ySlot ? RELIC_BY_ID[save.flags.ySlot]?.name ?? "—" : "—",
      arrows: save.flags.arrows,
      keys: save.flags.keys,
      zoom,
      lifePath: save.flags.lifePath,
      night: localHour < 6 || localHour >= 20,
      charge,
      showControls,
      spectrumReady: soloverseReady(save),
      deckTitle: ds.track?.title ?? null,
      deckPlaying: ds.playing,
      deckHasTrack: !!ds.track,
      deckPosition: ds.position,
      deckDuration: ds.duration,
      character: save.character,
      afterlifeHost: save.flags.afterlifeHost,
      introBeat,
      job: objective(),
      beacon: beaconLine(),
      lastDeed: save.flags.lastDeed,
      cycleLedger: mode === "limbo" ? cycleLedger(save) : { thisLife: "", youKeep: "", theGround: "" },
    };
    const sig = [
      mode,
      snap.hp,
      snap.mp,
      snap.karma,
      snap.crowns,
      snap.cycle,
      snap.incarnation,
      snap.bombs,
      snap.objective,
      snap.job,
      snap.interactHint,
      snap.message,
      snap.job,
      dialogue?.id,
      endingBeat,
      showHelp,
      snap.muted,
      snap.townName,
      snap.weatherName,
      snap.weaponName,
      snap.bag,
      snap.kit.handName,
      snap.kit.lead,
      snap.showControls,
      snap.tropoverse,
      snap.spectrumReady,
      snap.lifePath,
      snap.deckTitle,
      snap.deckPlaying ? 1 : 0,
      snap.deckHasTrack ? 1 : 0,
      Math.floor(snap.deckPosition * 4),
      snap.character.name,
      snap.character.skillPoints,
      snap.afterlifeHost,
      snap.lastDeed,
      introBeat,
      snap.job,
      snap.beacon,
      snap.cycleLedger.thisLife,
      snap.cycleLedger.youKeep,
      snap.cycleLedger.theGround,
    ].join("|");
    if (sig === lastUi) return;
    lastUi = sig;
    onUi(snap);
  };

  const tick = (now: number) => {
    if (!running) return;
    const raw = Math.min(0.1, (now - last) / 1000);
    last = now;
    const actions = input.sample();
    if (mode === "play" && actions.pausePressed) {
      mode = "pause";
      persist();
    } else if (mode === "kitchen" && actions.pausePressed) {
      mode = "play";
    } else if (mode === "pause" && actions.pausePressed && !showHelp) {
      mode = "play";
    } else if (mode === "ipod" && actions.pausePressed) {
      mode = "play";
    }
    if (mode === "play") attackQueued = noteAttackDuringHitstop(attackQueued, actions.attackPressed, hitstop);
    if (hitstop > 0) {
      hitstop = Math.max(0, hitstop - raw);
      const released = releaseAttackBuffer(attackQueued, hitstop, attackBuf);
      attackQueued = released.queued;
      attackBuf = released.buffer;
    } else {
      acc += raw;
      const step = 1 / 60;
      while (acc >= step) {
        sim(step, actions);
        acc -= step;
      }
    }
    draw(now / 1000);
    emitUi();
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);

  const onHide = () => {
    if (document.hidden) persist();
  };
  document.addEventListener("visibilitychange", onHide);

  const eventToWorld = (e: PointerEvent) => {
    const r = cvs.getBoundingClientRect();
    const cssX = ((e.clientX - r.left) / r.width) * (cvs.clientWidth || r.width);
    const cssY = ((e.clientY - r.top) / r.height) * (cvs.clientHeight || r.height);
    const bufX = (cssX - blit.ox) / (blit.scale || 1);
    const bufY = (cssY - blit.oy) / (blit.scale || 1);
    return {
      bufX,
      bufY,
      x: blit.viewX + bufX / (blit.zoom || 1),
      y: blit.viewY + (bufY - HUD_H) / (blit.zoom || 1),
      onWorld: bufX >= 0 && bufX <= SNES_W && bufY >= HUD_H && bufY <= SNES_H,
    };
  };

  const hoverCursor = (e: PointerEvent) => {
    const w = eventToWorld(e);
    if (!w.onWorld || mode !== "play") {
      cvs.style.cursor = "default";
      return;
    }
    const near = props.find((p) => {
      if (p.kind === "enemy" || p.kind === "spawn") return false;
      return Math.hypot(p.x * TILE + 8 - w.x, p.y * TILE + 8 - w.y) < 14;
    });
    cvs.style.cursor = near ? "pointer" : "crosshair";
  };

  const onPointerDown = (e: PointerEvent) => {
    if (mode !== "play") return;
    const w = eventToWorld(e);
    if (!w.onWorld) return;
    e.preventDefault();
    try {
      cvs.focus();
    } catch {
      /* ignore */
    }
    mouseBtn = e.button;
    downAt = performance.now();
    downX = e.clientX;
    downY = e.clientY;
    mouseWorldX = w.x;
    mouseWorldY = w.y;
    input.notePointer(e, "started");
    if (e.button === 2) {
      mouseAttack = true;
      return;
    }
    if (e.button !== 0) return;
    mouseHeld = true;
    walkTarget = null;
    pendingProp = null;
    const hit = props.find((p) => {
      if (p.kind === "enemy" || p.kind === "spawn") return false;
      return Math.hypot(p.x * TILE + 8 - w.x, p.y * TILE + 8 - w.y) < 16;
    });
    if (hit && Math.hypot(hit.x * TILE + 8 - player.x, hit.y * TILE + 8 - player.y) < 20) {
      interactWith(hit);
      mouseHeld = false;
    } else if (hit) {
      pendingProp = hit;
      walkTarget = { x: hit.x * TILE + 8, y: hit.y * TILE + 8 };
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    hoverCursor(e);
    if (!mouseHeld && !mouseAttack) return;
    const w = eventToWorld(e);
    if (!w.onWorld) {
      mouseHeld = false;
      mouseAttack = false;
      walkTarget = null;
      pendingProp = null;
      input.cancelAnalog();
      return;
    }
    mouseWorldX = w.x;
    mouseWorldY = w.y;
  };

  const onPointerUp = (e: PointerEvent) => {
    if (e.button === 2) mouseAttack = false;
    const heldFor = performance.now() - downAt;
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    const wasHold = mouseHeld && heldFor >= 400;
    mouseHeld = false;
    if (e.button !== 0) return;
    if (mode !== "play") return;
    input.notePointer(e, "canceled");
    if (heldFor < 220 && moved < 12) {
      const w = eventToWorld(e);
      if (w.onWorld) {
        walkTarget = pendingProp ? walkTarget : { x: w.x, y: w.y };
        mouseWorldX = w.x;
        mouseWorldY = w.y;
      }
    } else if (wasHold) {
      walkTarget = pendingProp ? walkTarget : null;
    }
  };

  const onPointerLeave = () => {
    mouseHeld = false;
    mouseAttack = false;
    walkTarget = null;
    pendingProp = null;
    input.cancelAnalog();
    cvs.style.cursor = "default";
  };

  const onContext = (e: Event) => e.preventDefault();
  const onWheel = (e: WheelEvent) => {
    if (mode !== "play") return;
    e.preventDefault();
    zoom = e.deltaY > 0 ? 0.5 : 1;
  };

  cvs.addEventListener("pointerdown", onPointerDown);
  cvs.addEventListener("pointermove", onPointerMove);
  cvs.addEventListener("pointerup", onPointerUp);
  cvs.addEventListener("pointercancel", onPointerLeave);
  cvs.addEventListener("pointerleave", onPointerLeave);
  cvs.addEventListener("contextmenu", onContext);
  cvs.addEventListener("wheel", onWheel, { passive: false });

  if (import.meta.env.DEV) {
    window.__controlsTest = {
      getYaw: () => probeYaw,
      getSpeed: () => Math.hypot(player.vx, player.vy),
      setKeys: (codes: string[]) => input.setKeys(codes),
      getState: () => ({
        mode,
        mapId,
        x: Math.round(player.x),
        y: Math.round(player.y),
        tx: Math.floor(player.x / TILE),
        ty: Math.floor(player.y / TILE),
        incarnation: save.incarnation,
        name: save.character.name,
        skillPoints: save.character.skillPoints,
        afterlifeHost: save.flags.afterlifeHost,
        lastDeed: save.flags.lastDeed,
        returnedFromDeath: save.flags.returnedFromDeath,
        backgroundId: save.character.backgroundId,
        bondId: save.character.bondId,
        created: save.character.created,
        attackT,
        tile: tileAt(player.x, player.y),
        stuck: blocked(player.x, player.y, 4),
        hp: player.hp,
        relics: save.flags.relics.slice(),
        ySlot: save.flags.ySlot,
        lanternOn: save.flags.lanternOn,
        maxHp: save.maxHp,
        vitality: save.upgrades.vitality,
        ledger: mode === "limbo" ? cycleLedger(save) : null,
        keys: save.flags.keys,
        chests: save.flags.chests.slice(),
        townsCleared: (save.flags.townsCleared ?? []).slice(),
        year: save.flags.year,
        graves: (save.flags.graves ?? []).map((g) => ({ id: g.id, mapId: g.mapId, excavated: g.excavated })),
        objective: objective(),
        hint: interactHint,
        message,
        hour: localHour,
      }),
      setHour: (h: number | null) => {
        debugHour = h;
        if (h != null) localHour = h;
      },
      loadMap: (id: string, tx: number, ty: number) => {
        loadWorld(id as MapId, tx * TILE + 8, ty * TILE + 8);
        mode = "play";
        showHelp = false;
        lastUi = "";
      },
      setIncarnation: (id: string) => {
        applyIncarnation(id as IncarnationId);
        lastUi = "";
      },
      setKarma: (n: number) => {
        save.karma = n;
        lastUi = "";
      },
      kill: () => {
        player.hp = 0;
        save.hp = 0;
        enterLimbo("qa");
      },
      openSoloverse: () => {
        save.cycle = Math.max(save.cycle, 3);
        save.crowns = Math.max(save.crowns, 3);
        applyIncarnation("embryo");
        save.flags.tropoverse = true;
        save.upgrades.soloverseKey = true;
        save.flags.tutorialDone = true;
        loadWorld("soloverse");
        mode = "play";
        showHelp = false;
        lastUi = "";
        persist();
      },
      openIpod: () => {
        mode = "ipod";
        showHelp = false;
        lastUi = "";
      },
      feedDeck: (file: File) => deck.feedFile(file),
      deckStatus: () => deck.status(),
      playDeck: () => deck.play(),
      pauseDeck: () => deck.pause(),
    };
  }

  return {
    startNew,
    continueGame,
    hasSave: () => {
      try {
        return !!localStorage.getItem("preincarnation.save.v1");
      } catch {
        return false;
      }
    },
    choose,
    buyUpgrade,
    spendSkill,
    reincarnate,
    commitCreate,
    advanceIntro,
    pickLife: (id: LifePath) => {
      save.flags.lifePath = id;
      persist();
    },
    setZoom: (z: number) => {
      zoom = z < 0.75 ? 0.5 : 1;
    },
    setShowControls: (v: boolean) => {
      showControls = v;
      lastUi = "";
      try {
        localStorage.setItem("preincarnation.ui.controls", v ? "1" : "0");
      } catch {
        /* ignore */
      }
    },
    closeIpod: () => {
      if (mode === "ipod") mode = "play";
      lastUi = "";
    },
    openIpod: () => {
      mode = "ipod";
      showHelp = false;
      lastUi = "";
    },
    feedDeck: (file: File) => {
      audio.unlock();
      return deck.feedFile(file);
    },
    playDeck: () => {
      audio.unlock();
      return deck.play();
    },
    pauseDeck: () => deck.pause(),
    seekDeck: (t: number) => deck.seek(t),
    pickIncarnation: (id: IncarnationId) => {
      if (unlocked(id)) applyIncarnation(id);
    },
    unlocked,
    setVirtual: input.setVirtual,
    setShake: (v: boolean) => {
      shakeOn = v;
    },
    setReducedFlash: (v: boolean) => {
      reducedFlash = v;
    },
    setVolumes: (music: number, sfx: number) => audio.setVolumes(music, sfx),
    exportLife: () => exportLifeBlob(save),
    importLife: (raw: string) => {
      const next = importLifeBlob(raw);
      if (!next) return false;
      writeSave(next);
      return true;
    },
    toggleMute: () => audio.setMuted(!audio.muted),
    dismissHelp: () => {
      showHelp = false;
      save.flags.tutorialDone = true;
      mode = "play";
      persist();
      try {
        cvs.focus();
      } catch {
        /* ignore */
      }
    },
    reset: () => {
      clearSave();
      save = defaultSave();
      mode = "title";
      showHelp = false;
      void deck.hydrate(EMPTY_DECK);
    },
    pause: () => {
      if (mode === "play") mode = "pause";
    },
    openKitchen: () => {
      if (mode !== "pause") return;
      mode = "kitchen";
      showHelp = false;
      lastUi = "";
      audio.kitchen();
    },
    closeKitchen: () => {
      if (mode === "kitchen") {
        mode = "play";
        lastUi = "";
        try {
          cvs.focus();
        } catch {
          /* ignore */
        }
      }
    },
    getKitchen: () => save.kitchen,
    setKitchen: (kitchen: SaveData["kitchen"]) => {
      save.kitchen = kitchen;
      persist();
    },
    resume: () => {
      if (mode === "pause") {
        showHelp = false;
        save.flags.tutorialDone = true;
        mode = "play";
        try {
          cvs.focus();
        } catch {
          /* ignore */
        }
      }
    },
    senseWorld: () => senseWorld(),
    cycleWeapon: () => {
      if (save.inventory.length < 2) return false;
      const next = wearNextWeapon(save.inventory, save.equippedId);
      if (!next) return false;
      save.equippedId = next.id;
      say(next.name);
      return true;
    },
    undoLastSave: () => undoLastSave() !== null,
    sip,
    dispose: () => {
      running = false;
      audio.dispose();
      deck.dispose();
      input.dispose();
      document.removeEventListener("visibilitychange", onHide);
      cvs.removeEventListener("pointerdown", onPointerDown);
      cvs.removeEventListener("pointermove", onPointerMove);
      cvs.removeEventListener("pointerup", onPointerUp);
      cvs.removeEventListener("pointercancel", onPointerLeave);
      cvs.removeEventListener("pointerleave", onPointerLeave);
      cvs.removeEventListener("contextmenu", onContext);
      cvs.removeEventListener("wheel", onWheel);
    },
    audio,
    ready: () => ready,
  };
}

export type GameHandle = ReturnType<typeof createGame>;

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
      getState?: () => Record<string, unknown>;
      setHour?: (h: number | null) => void;
      loadMap?: (id: string, tx: number, ty: number) => void;
      setIncarnation?: (id: string) => void;
      setKarma?: (n: number) => void;
      kill?: () => void;
      openSoloverse?: () => void;
      openIpod?: () => void;
      feedDeck?: (file: File) => Promise<unknown>;
      deckStatus?: () => { track: { title: string } | null; playing: boolean; position: number; duration: number };
      playDeck?: () => Promise<void>;
      pauseDeck?: () => void;
    };
  }
}
