# Supported-device matrix

Checked on 2026-10-18 in this workspace. "Pass" means the automated case or the
in-browser bench exercised that path. It does **not** mean a physical
controller or a physical phone was in the room.

| Surface | Support in this build | How it was checked | Not claimed |
| --- | --- | --- | --- |
| Keyboard, `event.code` | Full action set, rebinding, F8 recovery | 54 synthetic cases plus the bench | A particular physical keyboard layout beyond `code` |
| Mouse on the touch controls | Same actions as touch | Bench uses pointer events | — |
| Touch / multi-touch | Stick, blade, tool, offer, pause, shrine, safe area, handedness | Synthetic pointer ids, including cancel and a second finger | A physical handset or a real safe-area inset from a device |
| Gamepad API present | Standard mapping, deadzone, chord shrine, hot-plug, disconnect | Synthetic `PadSnap` values fed to `pollGamepads` | Any physical Xbox, PlayStation, or other pad |
| Gamepad API missing | Polls are ignored, keyboard and touch still run | One case with `gamepadApi: false` | — |
| Non-standard mapping | Generic face names, not Xbox letters | Synthetic id and empty mapping string | — |
| PlayStation glyphs | When the reported id contains DualSense, DualShock, Sony, or `054c` and mapping is `standard` | String classification plus a synthetic pad | A real DualSense |
| Xbox glyphs | When the id contains Xbox, XInput, or Microsoft | Synthetic id | A real Xbox pad |
| Emulated on-screen pad | Optional bench control, index 7, labeled emulated | UI only, not part of the 53 cases | Physical hardware |
| Blur, hide, page hide | Releases holds, cancels an unfinished rite, gates pad buttons until they come up | Synthetic `blur` / `visibility` | An OS-level app switch on a phone |

Keyboard and touch cover every required action: move, blade tap, blade spin,
interact, off-hand, pause, and held shrine release. Gamepad covers the same
set when `navigator.getGamepads` exists.
