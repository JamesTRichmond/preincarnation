import assert from "node:assert/strict";
import test from "node:test";
import { createSession } from "./session.js";

test("screen-relative strafe and the chisel door", () => {
  const session = createSession();
  session.setEngaged(true);
  const x0 = session.getX();
  session.setKeys(["KeyA"]);
  for (let i = 0; i < 20; i++) session.step(1 / 60);
  assert.ok(session.getX() < x0 - 0.15, `A moved left ${x0} -> ${session.getX()}`);
  const x1 = session.getX();
  session.setKeys(["KeyD"]);
  for (let i = 0; i < 20; i++) session.step(1 / 60);
  assert.ok(session.getX() > x1 + 0.15, `D moved right ${x1} -> ${session.getX()}`);
  const y0 = session.getY();
  session.setKeys(["KeyW"]);
  for (let i = 0; i < 12; i++) session.step(1 / 60);
  assert.ok(session.getY() < y0 - 0.05, `W moved up ${y0} -> ${session.getY()}`);
  session.setKeys([]);

  session.state.player.x = 12.5;
  session.state.player.y = 5.5;
  session.state.player.facing = { x: 1, y: 0 };
  session.press("KeyC");
  for (let i = 0; i < 40; i++) session.step(1 / 60);
  assert.equal(session.state.door.open, false);
  assert.equal(session.state.cairns.length, 0);
  session.press("KeyF");
  assert.equal(session.state.door.open, true);
  assert.equal(session.state.toolUsed, true);

  session.state.player.verdictStored = 2;
  session.state.fissure = { tiles: [{ x: 3, y: 2 }], until: 99 };
  session.resetLoadout();
  assert.equal(session.state.player.verdictStored, 0);
  assert.equal(session.state.fissure, null);
  assert.equal(session.state.door.open, true);
});
