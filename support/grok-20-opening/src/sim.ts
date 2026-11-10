import { step } from "./engine.ts";
import { routeToEntity, routeToTile } from "./route.ts";
import type { Command, MapId, Speech, State } from "./types.ts";

export class Player {
  state: State;
  cmds: Command[] = [];
  captions: string[] = [];
  speeches: Speech[] = [];
  events: string[] = [];

  constructor(state: State) {
    this.state = state;
  }

  act(cmd: Command, opts?: { allowBump?: boolean }): void {
    const before = this.state;
    const r = step(before, cmd);
    const rejected = r.events.some((e) => e.startsWith("rejected"));
    if (rejected) {
      throw new Error(
        "rejected " + r.events.join(",") + " from " + before.map + " " + before.x + "," + before.y + " " + JSON.stringify(cmd),
      );
    }
    if (!opts?.allowBump && r.events.includes("bump")) {
      throw new Error("bump at " + before.map + " " + before.x + "," + before.y + " " + JSON.stringify(cmd));
    }
    this.state = r.state;
    this.cmds.push(cmd);
    this.captions.push(...r.captions);
    this.events.push(...r.events);
    if (r.speech) this.speeches.push(r.speech);
  }

  walk(id: string): void {
    const dirs = routeToEntity(this.state, id);
    if (!dirs) {
      throw new Error("no route to " + id + " from " + this.state.map + " " + this.state.x + "," + this.state.y + " veinOpen=" + this.state.seam.veinOpen);
    }
    for (const dir of dirs) this.act({ type: "move", dir });
  }

  to(map: MapId, x: number, y: number, allowLethal = false): void {
    const dirs = routeToTile(this.state, map, x, y, { allowLethal });
    if (!dirs) throw new Error("no route to tile " + map + " " + x + "," + y + " from " + this.state.map + " " + this.state.x + "," + this.state.y);
    for (const dir of dirs) this.act({ type: "move", dir });
  }

  verb(id: string): void {
    this.act({ type: "verb", id });
  }

  /** Hear a conversation through. Leaving early is a different call. */
  say(id: string): void {
    this.verb(id);
    let guard = 0;
    while (this.state.talk && guard++ < 40) this.act({ type: "advance" });
  }
}
