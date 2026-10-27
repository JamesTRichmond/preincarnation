import type { ActivityDef, ActivityEvent, Pose } from "./types.ts";

/** Authored work. Each driver moves a tool; events fire on the loop. */
export const ACTIVITY_LIST: ActivityDef[] = [
  {
    id: "dress-millstone",
    label: "dressing the millstone",
    roleId: "role.miller",
    driver: "strike",
    tool: "pick",
    loopTicks: 8,
    events: [
      { tick: 3, id: "stone.score", text: "The pick scores a fresh furrow in the stone." },
      { tick: 7, id: "stone.dust", text: "Stone dust lifts off the dress." },
    ],
  },
  {
    id: "sound-the-race",
    label: "sounding the mill race",
    roleId: "role.miller",
    driver: "strike",
    tool: "staff",
    loopTicks: 8,
    events: [
      { tick: 2, id: "race.sound", text: "The staff knocks the race timber and the miller listens." },
      { tick: 6, id: "race.level", text: "They mark the water against the last notch." },
    ],
  },
  {
    id: "hoop-barrel",
    label: "hooping a barrel",
    roleId: "role.cooper",
    driver: "strike",
    tool: "hoop",
    loopTicks: 8,
    events: [
      { tick: 2, id: "hoop.seat", text: "The hoop seats against the staves." },
      { tick: 6, id: "hoop.tap", text: "The cooper taps the hoop true." },
    ],
  },
  {
    id: "sight-stave",
    label: "sighting a stave",
    roleId: "role.cooper",
    driver: "lift",
    tool: "stave",
    loopTicks: 8,
    events: [
      { tick: 4, id: "stave.sight", text: "They sight the stave down its length and set it aside." },
    ],
  },
  {
    id: "set-type",
    label: "setting type",
    roleId: "role.printer",
    driver: "press",
    tool: "stick",
    loopTicks: 8,
    events: [
      { tick: 3, id: "type.sort", text: "A sort drops into the stick." },
      { tick: 7, id: "type.lead", text: "They justify the line with a thin lead." },
    ],
  },
  {
    id: "pump-bellows",
    label: "pumping the bellows",
    roleId: "role.smith",
    driver: "press",
    tool: "bellows",
    loopTicks: 8,
    events: [
      { tick: 2, id: "bellows.draw", text: "The bellows draw." },
      { tick: 5, id: "bellows.breath", text: "The forge takes a breath and the coal brightens." },
    ],
  },
  {
    id: "weigh-grain",
    label: "weighing grain",
    roleId: "role.clerk",
    driver: "lift",
    tool: "sack",
    loopTicks: 8,
    events: [
      { tick: 4, id: "scale.balance", text: "The scale beam finds its balance." },
      { tick: 7, id: "scale.chalk", text: "The clerk chalks the weight on the board." },
    ],
  },
  {
    id: "turn-churn",
    label: "turning the churn",
    roleId: "role.dairy",
    driver: "strike",
    tool: "dasher",
    loopTicks: 8,
    events: [
      { tick: 2, id: "churn.knock", text: "The dasher knocks the cream." },
      { tick: 6, id: "churn.break", text: "The cream starts to break." },
    ],
  },
  {
    id: "wrap-cheese",
    label: "wrapping a cheese",
    roleId: "role.dairy",
    driver: "press",
    tool: "cloth",
    loopTicks: 8,
    events: [
      { tick: 4, id: "cheese.cloth", text: "The cloth is drawn tight over the cheese." },
    ],
  },
  {
    id: "sort-apples",
    label: "sorting apples",
    roleId: "role.orchard",
    driver: "press",
    tool: "apple",
    loopTicks: 8,
    events: [
      { tick: 3, id: "apple.keep", text: "A sound apple goes to the keep pile." },
      { tick: 6, id: "apple.cull", text: "A bruised one is culled for the press." },
    ],
  },
  {
    id: "pitch-hay",
    label: "pitching hay",
    roleId: "role.hay",
    driver: "lift",
    tool: "fork",
    loopTicks: 8,
    events: [
      { tick: 3, id: "hay.lift", text: "The fork takes a lap of hay." },
      { tick: 6, id: "hay.set", text: "The hay is set on the load." },
    ],
  },
  {
    id: "mend-fence",
    label: "mending fence",
    roleId: "role.fence",
    driver: "strike",
    tool: "maul",
    loopTicks: 8,
    events: [
      { tick: 3, id: "fence.set", text: "The maul sets the post." },
      { tick: 7, id: "fence.wire", text: "They draw the rail back into its notch." },
    ],
  },
  {
    id: "draw-well",
    label: "drawing the well",
    roleId: "role.well",
    driver: "lift",
    tool: "bucket",
    loopTicks: 8,
    events: [
      { tick: 2, id: "well.creak", text: "The sweep creaks." },
      { tick: 6, id: "well.pour", text: "The bucket comes up and is poured to the trough." },
    ],
  },
  {
    id: "mend-net",
    label: "mending a net",
    roleId: "role.net",
    driver: "loop",
    tool: "needle",
    loopTicks: 8,
    events: [
      { tick: 4, id: "net.mesh", text: "A mesh is knotted back into the net." },
    ],
  },
  {
    id: "caulk-seam",
    label: "caulking a seam",
    roleId: "role.caulker",
    driver: "strike",
    tool: "iron",
    loopTicks: 8,
    events: [
      { tick: 3, id: "seam.oakum", text: "Oakum is driven into the seam." },
      { tick: 7, id: "seam.pay", text: "The iron pays the seam along the hull." },
    ],
  },
  {
    id: "coil-line",
    label: "coiling a line",
    roleId: "role.ferry",
    driver: "turn",
    tool: "line",
    loopTicks: 8,
    events: [
      { tick: 4, id: "line.coil", text: "The line takes another coil on the bollard." },
      { tick: 7, id: "line.bitter", text: "They check the bitter end." },
    ],
  },
  {
    id: "ice-catch",
    label: "icing the catch",
    roleId: "role.fish",
    driver: "lift",
    tool: "ice",
    loopTicks: 8,
    events: [
      { tick: 3, id: "ice.break", text: "A shard of ice is broken off the block." },
      { tick: 6, id: "ice.lay", text: "Ice is laid over the catch." },
    ],
  },
  {
    id: "stitch-sail",
    label: "stitching a sail",
    roleId: "role.sailmaker",
    driver: "loop",
    tool: "palm",
    loopTicks: 8,
    events: [
      { tick: 4, id: "sail.stitch", text: "The palm drives the needle through the cloth." },
      { tick: 7, id: "sail.pull", text: "The stitch is pulled up even." },
    ],
  },
  {
    id: "mind-the-post",
    label: "keeping the open ground",
    roleId: "post",
    driver: "shift",
    tool: "none",
    loopTicks: 8,
    events: [
      { tick: 4, id: "post.wait", text: "They keep to the open ground until the way back is clear." },
    ],
  },
];

export const ACTIVITIES: Record<string, ActivityDef> = Object.fromEntries(
  ACTIVITY_LIST.map((a) => [a.id, a]),
);

/** Role work, not the recovery idle. */
export const ROLE_ACTIVITIES: ActivityDef[] = ACTIVITY_LIST.filter((a) => a.id !== "mind-the-post");

export function samplePose(def: ActivityDef, tick: number): Pose {
  const loop = Math.max(1, def.loopTicks);
  const t = (((tick % loop) + loop) % loop) / loop;
  const s = Math.sin(t * Math.PI * 2);
  const lift = (1 - Math.cos(t * Math.PI * 2)) / 2;
  const base = { tool: def.tool };
  switch (def.driver) {
    case "strike":
      return { ...base, arm: -0.2 + s * 1.1, reach: 0.35 + lift * 0.65, prop: t < 0.55 ? t / 0.55 : (1 - t) / 0.45, bob: Math.max(0, -s) * 0.25 };
    case "press":
      return { ...base, arm: 0.4 + s * 0.55, reach: 0.45 + lift * 0.4, prop: lift, bob: lift * 0.08 };
    case "lift":
      return { ...base, arm: -1.1 + lift * 1.6, reach: 0.3 + lift * 0.7, prop: lift, bob: lift * 0.2 };
    case "loop":
      return { ...base, arm: s * 0.7, reach: 0.55 + Math.sin(t * Math.PI * 4) * 0.15, prop: t, bob: 0.04 };
    case "turn":
      return { ...base, arm: s * 0.9, reach: 0.6, prop: t, bob: Math.abs(s) * 0.06 };
    case "shift":
      return { ...base, arm: s * 0.15, reach: 0.2, prop: 0, bob: s * 0.12 };
    default:
      return { ...base, arm: 0, reach: 0.4, prop: 0, bob: 0 };
  }
}

export function eventsOnTick(def: ActivityDef, activityTick: number): ActivityEvent[] {
  if (activityTick <= 0) return [];
  const local = activityTick % def.loopTicks;
  return def.events.filter((e) => e.tick === local);
}
