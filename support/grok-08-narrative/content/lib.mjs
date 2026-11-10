/** Authoring helpers. Data only — not a game runtime. */

export function flagSet(pairs) {
  const out = {};
  for (const [k, v] of Object.entries(pairs)) out[k] = v;
  return out;
}

export function choice(id, text, next, setsFlags, requires) {
  const c = { id, text, next };
  if (setsFlags && Object.keys(setsFlags).length) c.setsFlags = setsFlags;
  if (requires) c.requires = requires;
  return c;
}

export function say(speakerId, text, choices, textVariants) {
  const node = { speakerId, text, choices };
  if (textVariants?.length) node.textVariants = textVariants;
  return node;
}

export function line(speakerId, text, next, textVariants) {
  const node = { speakerId, text, next };
  if (textVariants?.length) node.textVariants = textVariants;
  return node;
}

export function ending(speakerId, text, branchId, setsFlags, status = "completed") {
  return {
    speakerId,
    text,
    end: {
      branchId,
      status,
      setsFlags: setsFlags || {},
    },
  };
}

export function prereq({ all = [], any = [], none = [] } = {}) {
  return { all, any, none };
}

export function flagEq(flag, eq) {
  return { flag, eq };
}

export function characterGate(partial) {
  return { all: [], any: [], none: [], character: partial };
}

export function variant(when, text) {
  return { when, text };
}
