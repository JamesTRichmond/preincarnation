import {
  anim,
  chargeAttack,
  finish,
  forms,
  FOOL_FRONT,
  life,
  meleeAttack,
  shotAttack,
  tools,
} from "./author.js";

const TOOL_KEYS = [
  "shovel",
  "sugar_line",
  "boots",
  "fins",
  "lamp",
  "hammer",
  "net",
  "homestead_glass",
  "cape",
  "block_rod",
  "ash_bow",
  "powder_keg",
];

function toolMap(noun, specials) {
  const base = {
    shovel: `The shovel finds no useful lip on ${noun}.`,
    sugar_line: `The sugar-line cannot hitch ${noun}.`,
    boots: `Boots only change how fast Ellis leaves ${noun}'s reach.`,
    fins: `${noun} is not fought in swimming water.`,
    lamp: `The lamp does not rewrite ${noun}.`,
    hammer: `The hammer is the wrong weight for ${noun}.`,
    net: `The net cannot hold ${noun}.`,
    homestead_glass: `${noun} does not answer the homestead glass.`,
    cape: `The cape's i-frames cover one clean pass through ${noun}.`,
    block_rod: `The block rod can catch a frontal blow from ${noun} but is not the intended solve.`,
    ash_bow: `An ash arrow is a poor answer to ${noun}.`,
    powder_keg: `A keg will scar the ground around ${noun}. Use it only if the record says so.`,
  };
  for (const key of TOOL_KEYS) {
    if (specials[key]) base[key] = specials[key];
  }
  return tools(base);
}

function formMap(noun, lines) {
  return forms({
    mortal: lines.mortal || `Mortal Ellis meets ${noun} with the recorded solve.`,
    smuggler: lines.smuggler || `The smuggler is quicker around ${noun} and is not required.`,
    officer: lines.officer || `The officer is the slowest walk. ${noun} is timed for that walk.`,
    god: lines.god || `The embryonic god does not skip ${noun}'s tell or forfeit.`,
  });
}

function silhouette(record, animations) {
  return {
    footprint_px: record.footprint || [16, 16],
    read: record.read,
    palette: record.palette,
    must_read_distance_px: 48,
    animations,
  };
}

function lifeOf(record) {
  return life({
    death: {
      persist: record.deathPersist || "this_life",
      remnant: `${record.id}_remnant`,
      drop: record.deathDrop || null,
      forfeit: record.forfeit || null,
    },
    spare: {
      persist: record.sparePersist || "fourteen_years",
      remnant: `${record.id}_spared`,
      drop: record.spareDrop || null,
      flag: record.spareFlag || null,
    },
    ages: record.ages || 1,
  });
}

function terrain(record) {
  return {
    home: record.home,
    enters: record.enters || ["floor"],
    refuses: record.refuses || ["water", "pit"],
    on_ice: record.on_ice,
    on_mud: record.on_mud,
    on_water: record.on_water,
    forced_plunge: false,
  };
}

function meleeStates(tag, tellName, recoverName, opener, superarmor = false) {
  return [
    opener,
    {
      id: `${tag}_approach`,
      kind: "move",
      anim: `${tag}_approach`,
      frames: null,
      move: { type: "seek", speed: 0.35 },
      transitions: [
        { to: tellName, when: "dist_lt", value: 34 },
        { to: opener.id, when: "lost" },
      ],
    },
    {
      id: tellName,
      kind: "telegraph",
      anim: tellName,
      frames: 36,
      attack: tag,
      on_done: `${tag}_active`,
    },
    {
      id: `${tag}_active`,
      kind: "active",
      anim: `${tag}_active`,
      frames: 6,
      attack: tag,
      superarmor,
      on_done: recoverName,
    },
    { id: recoverName, kind: "recover", anim: recoverName, frames: 70, on_done: `${tag}_approach` },
  ];
}

function animSet(tag, tellRead, recoverRead, deathRead) {
  return [
    anim(`${tag}_idle`, 8, `${tellRead} has not started.`, true),
    anim(`${tag}_approach`, 6, `Closing in. ${tellRead} is not yet shown.`, true),
    anim(`${tag}_tell`, 36, tellRead),
    anim(`${tag}_active`, 6, `The committed hit of ${tag}.`),
    anim(`${tag}_recover`, 8, recoverRead, true),
    anim("hyperarmor", 6, `Hyperarmor. ${tag} will not be stunlocked.`, true),
    anim("death", 8, deathRead),
    anim("spare", 6, `Nonlethal end for ${tag}.`, true),
  ];
}

function compile(record) {
  const tag = record.attack;
  const noun = record.noun;
  let states = [];
  let attacks = {};
  let trials = [];
  let mercy = { available: false, reason: record.mercyReason || `${record.name} has no talk.` };
  let defeat = { windows: [`${tag}_recover`], block_goto: record.blockGoto || null };
  const animations =
    record.animations || animSet(tag, record.tellRead, record.recoverRead, record.deathRead);

  if (record.pattern === "seek" || record.pattern === "still") {
    attacks[tag] = meleeAttack(record.damage || 1);
    const opener = {
      id: record.opener,
      kind: "idle",
      anim: `${tag}_idle`,
      frames: record.openerFrames ?? 10,
      on_done: record.pattern === "seek" ? `${tag}_approach` : `${tag}_tell`,
      transitions:
        record.pattern === "still"
          ? [{ to: `${tag}_tell`, when: "dist_lt", value: 36 }]
          : undefined,
    };
    if (record.pattern === "seek") {
      states = meleeStates(
        tag,
        `${tag}_tell`,
        `${tag}_recover`,
        { ...opener, on_done: `${tag}_approach`, frames: record.openerFrames ?? 12 },
        !!record.superarmor,
      );
      if (record.branch) {
        const approach = states.find((s) => s.id === `${tag}_approach`);
        approach.transitions.unshift(record.branch);
      }
    } else {
      states = [
        { ...opener, frames: null },
        {
          id: `${tag}_tell`,
          kind: "telegraph",
          anim: `${tag}_tell`,
          frames: 36,
          attack: tag,
          on_done: `${tag}_active`,
        },
        {
          id: `${tag}_active`,
          kind: "active",
          anim: `${tag}_active`,
          frames: 6,
          attack: tag,
          on_done: `${tag}_recover`,
        },
        {
          id: `${tag}_recover`,
          kind: "recover",
          anim: `${tag}_recover`,
          frames: 70,
          on_done: record.opener,
        },
      ];
    }
    defeat.windows = [`${tag}_recover`];
    trials = [
      {
        id: "fair",
        mode: "blade",
        form: "officer",
        frames: 720,
        bladeOut: true,
        expect: { maxDamage: 0, minHits: 1 },
      },
      {
        id: "fool",
        mode: "foolish",
        form: "officer",
        frames: 420,
        start: record.fool || FOOL_FRONT,
        bladeOut: true,
        expect: { minDamage: 1, hitBy: tag },
      },
    ];
  }

  if (record.pattern === "mark") {
    attacks[tag] = {
      kind: "melee",
      damage: record.damage || 1,
      active: 8,
      anchor: "ellis_at_tell",
      knockback_px: 4,
      shape: { w: 22, h: 22 },
    };
    states = [
      {
        id: record.opener,
        kind: "idle",
        anim: `${tag}_idle`,
        frames: null,
        transitions: [{ to: `${tag}_tell`, when: "dist_lt", value: record.markRange || 72 }],
      },
      {
        id: `${tag}_tell`,
        kind: "telegraph",
        anim: `${tag}_tell`,
        frames: 36,
        attack: tag,
        on_done: `${tag}_active`,
      },
      {
        id: `${tag}_active`,
        kind: "active",
        anim: `${tag}_active`,
        frames: 8,
        attack: tag,
        on_done: `${tag}_recover`,
      },
      {
        id: `${tag}_recover`,
        kind: "recover",
        anim: `${tag}_recover`,
        frames: 70,
        on_done: record.opener,
      },
    ];
    defeat.windows = [`${tag}_recover`];
    trials = [
      {
        id: "fair",
        mode: "blade",
        form: "officer",
        frames: 720,
        expect: { maxDamage: 0, minHits: 1 },
      },
      {
        id: "fool",
        mode: "foolish",
        form: "officer",
        frames: 320,
        start: record.fool || FOOL_FRONT,
        expect: { minDamage: 1, hitBy: tag },
      },
    ];
  }

  if (record.pattern === "charge" || record.pattern === "blockcharge") {
    attacks[tag] = chargeAttack(record.damage || 2);
    states = [
      {
        id: record.opener,
        kind: "idle",
        anim: `${tag}_idle`,
        frames: null,
        transitions: [{ to: `${tag}_tell`, when: "dist_lt", value: 70 }],
      },
      {
        id: `${tag}_tell`,
        kind: "telegraph",
        anim: `${tag}_tell`,
        frames: 36,
        attack: tag,
        face: record.lockFace || null,
        on_done: `${tag}_active`,
      },
      {
        id: `${tag}_active`,
        kind: "active",
        anim: `${tag}_active`,
        frames: 28,
        attack: tag,
        superarmor: !!record.superarmor,
        move: { type: "charge", speed: 2.2 },
        on_done: `${tag}_recover`,
      },
      {
        id: `${tag}_recover`,
        kind: "recover",
        anim: `${tag}_recover`,
        frames: 70,
        on_done: record.opener,
      },
    ];
    defeat.windows = [`${tag}_recover`];
    defeat.block_goto = `${tag}_recover`;
    trials = [
      {
        id: "fair",
        mode: "blade",
        form: "officer",
        frames: 720,
        expect: { maxDamage: 0, minHits: 1 },
      },
      {
        id: "fool",
        mode: "foolish",
        form: "officer",
        frames: 320,
        start: record.fool || { x: 120, y: 130 },
        expect: { minDamage: 1, hitBy: tag },
      },
    ];
    if (record.pattern === "blockcharge") {
      trials.push({
        id: "block",
        mode: "block",
        form: "officer",
        frames: 220,
        start: record.fool || { x: 120, y: 130 },
        point: record.fool || { x: 120, y: 130 },
        expect: { maxDamage: 0, flag: "blocked" },
      });
    }
  }

  if (record.pattern === "lane" || record.pattern === "laneblood") {
    attacks[tag] = {
      kind: "melee",
      damage: record.damage || 2,
      active: record.active || 16,
      knockback_px: 8,
      blockable: !!record.blockable,
      shape: { absolute: true, ...record.rect },
    };
    states = [
      { id: record.opener, kind: "idle", anim: `${tag}_idle`, frames: 16, on_done: `${tag}_tell` },
      {
        id: `${tag}_tell`,
        kind: "telegraph",
        anim: `${tag}_tell`,
        frames: 36,
        attack: tag,
        on_done: `${tag}_active`,
      },
      {
        id: `${tag}_active`,
        kind: "active",
        anim: `${tag}_active`,
        frames: record.active || 16,
        attack: tag,
        on_done: record.opener,
      },
      {
        id: `${tag}_solved`,
        kind: "recover",
        anim: `${tag}_recover`,
        frames: null,
        set_flag: record.solveFlag,
      },
    ];
    const act = record.act;
    defeat.windows = [];
    trials = [
      {
        id: "fair",
        mode: record.blockable ? "block" : "tool",
        form: "officer",
        frames: 220,
        tool: act.tool,
        start: record.fairStart,
        point: record.fairStart,
        expect: { maxDamage: 0, flag: record.blockable ? "blocked" : record.solveFlag },
      },
      {
        id: "fool",
        mode: "foolish",
        form: "officer",
        frames: 220,
        start: record.fool,
        expect: { minDamage: 1, hitBy: tag },
      },
    ];
    if (record.blockable) defeat.block_goto = `${tag}_solved`;
  }

  if (
    record.pattern === "mercy-shot" ||
    record.pattern === "mercy-melee" ||
    record.pattern === "mercy-mark"
  ) {
    mercy = {
      available: true,
      method: record.method,
      ready: record.ready,
      reason: record.mercyReason,
    };
    if (record.pattern === "mercy-shot") attacks[tag] = shotAttack(record.damage || 1);
    if (record.pattern === "mercy-melee") attacks[tag] = meleeAttack(record.damage || 1);
    if (record.pattern === "mercy-mark") {
      attacks[tag] = {
        kind: "melee",
        damage: 1,
        active: 8,
        anchor: "ellis_at_tell",
        shape: { w: 22, h: 22 },
      };
    }
    const attackTransition =
      record.attackWhen === "lamp"
        ? { to: `${tag}_tell`, when: "lamp" }
        : record.attackWhen === "blade"
          ? { to: `${tag}_tell`, when: "blade" }
          : record.attackWhen === "away"
            ? { to: `${tag}_tell`, when: "facing_away" }
            : {
                to: `${tag}_tell`,
                when: "dist_lt",
                value: record.pattern === "mercy-shot" ? 96 : 40,
              };
    states = [
      {
        id: record.opener,
        kind: "idle",
        anim: `${tag}_idle`,
        frames: null,
        transitions: [{ to: "spared", when: "mercy_ready" }, attackTransition],
      },
      {
        id: `${tag}_tell`,
        kind: "telegraph",
        anim: `${tag}_tell`,
        frames: 36,
        attack: tag,
        on_done: `${tag}_active`,
      },
      {
        id: `${tag}_active`,
        kind: "active",
        anim: `${tag}_active`,
        frames: record.pattern === "mercy-shot" ? 4 : 6,
        attack: tag,
        on_done: `${tag}_recover`,
      },
      {
        id: `${tag}_recover`,
        kind: "recover",
        anim: `${tag}_recover`,
        frames: 48,
        on_done: record.opener,
      },
    ];
    defeat.windows = [`${tag}_recover`];
    trials = [
      {
        id: "fair",
        mode: "mercy",
        form: record.ready.form || "officer",
        frames: 200,
        tool: record.ready.tool || null,
        lamp: !!record.ready.lamp,
        face: !!record.ready.face,
        expect: { maxDamage: 0, flag: "spared" },
      },
      {
        id: "fool",
        mode: "foolish",
        form: "officer",
        frames: 360,
        start: record.fool || FOOL_FRONT,
        bladeOut: !!record.foolBlade,
        lamp: !!record.foolLamp,
        facing: record.foolFacing || null,
        expect: { minDamage: 1, hitBy: tag },
      },
    ];
  }

  if (record.pattern === "steal") {
    mercy = {
      available: true,
      method: record.method,
      ready: { no_blade: true, idle: 0 },
      reason: record.mercyReason,
    };
    states = [
      {
        id: record.opener,
        kind: "move",
        anim: `${tag}_idle`,
        frames: null,
        move: { type: "orbit" },
        transitions: [
          { to: "spared", when: "mercy_ready" },
          { to: `${tag}_stolen`, when: "blade" },
        ],
      },
      { id: `${tag}_stolen`, kind: "idle", anim: `${tag}_tell`, frames: null, set_flag: "stole" },
    ];
    attacks = {};
    defeat.windows = [];
    trials = [
      {
        id: "fair",
        mode: "mercy",
        form: "officer",
        frames: 120,
        expect: { maxDamage: 0, flag: "spared" },
      },
      {
        id: "fool",
        mode: "foolish",
        form: "officer",
        frames: 120,
        bladeOut: true,
        start: FOOL_FRONT,
        expect: { maxDamage: 0, flag: "stole" },
      },
      {
        id: "god",
        mode: "greedy",
        form: "god",
        frames: 400,
        bladeOut: true,
        expect: { maxDamage: 0, flag: record.forfeit },
      },
    ];
  }

  if (record.pattern === "timer-lane") {
    attacks[tag] = chargeAttack(record.damage || 1, { blockable: false });
    states = [
      { id: record.opener, kind: "idle", anim: `${tag}_idle`, frames: 20, on_done: `${tag}_tell` },
      {
        id: `${tag}_tell`,
        kind: "telegraph",
        anim: `${tag}_tell`,
        frames: 36,
        attack: tag,
        face: record.lockFace,
        on_done: `${tag}_active`,
      },
      {
        id: `${tag}_active`,
        kind: "active",
        anim: `${tag}_active`,
        frames: 28,
        attack: tag,
        move: { type: "charge", speed: 2.2 },
        on_done: `${tag}_recover`,
      },
      {
        id: `${tag}_recover`,
        kind: "recover",
        anim: `${tag}_recover`,
        frames: 40,
        set_flag: record.solveFlag,
        on_done: record.opener,
      },
    ];
    defeat.windows = [];
    trials = [
      {
        id: "fair",
        mode: "nonlethal",
        form: "officer",
        frames: 240,
        start: record.fairStart,
        expect: { maxDamage: 0, flag: record.solveFlag },
      },
      {
        id: "fool",
        mode: "foolish",
        form: "officer",
        frames: 240,
        start: record.fool,
        expect: { minDamage: 1, hitBy: tag },
      },
    ];
  }

  if (record.pattern === "rear") {
    attacks[tag] = meleeAttack(1, { shape: { ox: -22, along: 18, across: 16 } });
    mercy = {
      available: true,
      method: record.method,
      ready: { no_blade: true, idle: 0, front: true },
      reason: record.mercyReason,
    };
    states = [
      {
        id: record.opener,
        kind: "idle",
        anim: `${tag}_idle`,
        frames: null,
        transitions: [
          { to: "spared", when: "mercy_ready" },
          { to: `${tag}_tell`, when: "behind" },
        ],
      },
      {
        id: `${tag}_tell`,
        kind: "telegraph",
        anim: `${tag}_tell`,
        frames: 36,
        attack: tag,
        keep_facing: true,
        on_done: `${tag}_active`,
      },
      {
        id: `${tag}_active`,
        kind: "active",
        anim: `${tag}_active`,
        frames: 6,
        attack: tag,
        on_done: `${tag}_recover`,
      },
      {
        id: `${tag}_recover`,
        kind: "recover",
        anim: `${tag}_recover`,
        frames: 40,
        on_done: record.opener,
      },
    ];
    trials = [
      {
        id: "fair",
        mode: "mercy",
        form: "officer",
        frames: 160,
        start: { x: 120, y: 152 },
        expect: { maxDamage: 0, flag: "spared" },
      },
      {
        id: "fool",
        mode: "foolish",
        form: "officer",
        frames: 240,
        start: { x: 120, y: 66 },
        expect: { minDamage: 1, hitBy: tag },
      },
    ];
  }

  if (record.pattern === "flag-only") {
    states = [
      {
        id: record.opener,
        kind: "idle",
        anim: `${tag}_idle`,
        frames: 30,
        set_flag: record.fairFlag,
        on_done: `${tag}_next`,
      },
      {
        id: `${tag}_next`,
        kind: "idle",
        anim: `${tag}_recover`,
        frames: null,
        set_flag: record.fairFlag,
      },
    ];
    if (record.foolFlag) {
      states[0].transitions = [
        {
          to: `${tag}_bad`,
          when: record.foolWhen,
          tool: record.foolWhen === "tool" ? record.foolTool : undefined,
        },
      ];
      states.push({
        id: `${tag}_bad`,
        kind: "idle",
        anim: `${tag}_tell`,
        frames: null,
        set_flag: record.foolFlag,
      });
    }
    attacks = {};
    defeat.windows = [];
    trials = [
      {
        id: "fair",
        mode: "nonlethal",
        form: "officer",
        frames: 80,
        expect: { maxDamage: 0, flag: record.fairFlag },
      },
    ];
    if (record.foolFlag) {
      trials.push({
        id: "fool",
        mode: "foolish",
        form: "officer",
        frames: 80,
        lamp: !!record.foolLamp,
        bladeOut: !!record.foolBlade,
        tool: record.foolTool || null,
        expect: { maxDamage: 0, flag: record.foolFlag },
      });
    }
  }

  if (record.pattern === "shovel-clock") {
    states = [
      {
        id: record.opener,
        kind: "move",
        anim: `${tag}_idle`,
        frames: 90,
        move: { type: "seek", speed: 0.25 },
        on_done: `${tag}_arrive`,
        transitions: [{ to: `${tag}_diverted`, when: "tool", tool: "shovel" }],
      },
      { id: `${tag}_arrive`, kind: "idle", anim: `${tag}_tell`, frames: null, set_flag: "woke" },
      {
        id: `${tag}_diverted`,
        kind: "idle",
        anim: `${tag}_recover`,
        frames: null,
        set_flag: "diverted",
      },
    ];
    attacks = {};
    defeat.windows = [];
    trials = [
      {
        id: "fair",
        mode: "tool",
        form: "officer",
        frames: 40,
        tool: "shovel",
        expect: { maxDamage: 0, flag: "diverted" },
      },
      {
        id: "fool",
        mode: "foolish",
        form: "officer",
        frames: 140,
        expect: { maxDamage: 0, flag: "woke" },
      },
    ];
  }

  if (record.halt) {
    mercy = {
      available: true,
      method: record.halt,
      ready: { form: "officer", no_blade: true, idle: 0 },
      reason: record.halt,
    };
    const opener = states.find((state) => state.id === record.opener);
    opener.transitions = [{ to: "spared", when: "mercy_ready" }, ...(opener.transitions || [])];
    trials.push({
      id: "halt",
      mode: "mercy",
      form: "officer",
      frames: 80,
      expect: { maxDamage: 0, flag: "spared" },
    });
  }

  if (!states.length) throw new Error(`No pattern for ${record.id}`);

  const specials = {};
  for (const act of record.acts || []) {
    specials[act.tool] = {
      effect: act.effect,
      damage: act.damage || 0,
      states: act.states,
      goto: act.goto,
      flag: act.flag,
      range: act.range || 100,
      note: act.note,
    };
  }

  return finish({
    id: record.id,
    name: record.name,
    family: record.family,
    county_anchor: record.county,
    summary: record.summary,
    god_may_shorten: record.god_may_shorten,
    objective: record.objective,
    silhouette: silhouette(record, animations),
    stats: {
      hp: record.hp,
      knockback_px: record.knock || 8,
      weight: record.weight,
      speed: record.speed || 0.35,
    },
    detection: {
      sight_px: record.sight || 120,
      arc_deg: record.arc || 360,
      initial: record.opener,
      aggro: record.aggro || "sight",
    },
    return_state: record.opener,
    attacks,
    states,
    defeat,
    trials,
    mercy,
    tools: toolMap(noun, specials),
    forms: formMap(noun, record.formLines || {}),
    terrain: terrain(record),
    lifecycle: lifeOf(record),
    facing: record.facing || "S",
  });
}

export function compileRoster(records) {
  const enemies = records.map(compile);
  const ids = new Set();
  for (const enemy of enemies) {
    if (ids.has(enemy.id)) throw new Error(`Duplicate ${enemy.id}`);
    ids.add(enemy.id);
  }
  return enemies;
}
