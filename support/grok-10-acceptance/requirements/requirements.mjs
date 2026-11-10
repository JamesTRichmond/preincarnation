export const requirements = [
  {
    id: "REQ-START-01",
    statement: "A fresh start reaches a playable title or new game without an account and without leftover progress.",
  },
  {
    id: "REQ-START-02",
    statement: "The only protagonist is Ellis Perch, including after reincarnation.",
  },
  {
    id: "REQ-START-03",
    statement: "The game does not require login or an account.",
  },
  {
    id: "REQ-MOVE-01",
    statement: "Ellis moves in four screen-relative cardinal directions from the keyboard.",
  },
  {
    id: "REQ-MOVE-02",
    statement: "Solids and the playfield edge stop Ellis. Opposing keys do not throw the protagonist out of bounds.",
  },
  {
    id: "REQ-ATK-01",
    statement: "A blade tap is one swing. A hold becomes a spin only after the hold, and release clears it.",
  },
  {
    id: "REQ-VERB-01",
    statement: "The interact control is contextual: empty ground, signs, locked doors, and shrines do different things.",
  },
  {
    id: "REQ-TOOL-01",
    statement: "The off-hand tool is a separate control from the blade and is safe when empty.",
  },
  {
    id: "REQ-MENU-01",
    statement: "Pause freezes the simulation, restores cleanly, and keeps menu text legible.",
  },
  {
    id: "REQ-MENU-02",
    statement: "Volume is a local control and survives pause.",
  },
  {
    id: "REQ-TOUCH-01",
    statement: "Every essential action also works from touch controls with separate targets.",
  },
  {
    id: "REQ-TOUCH-02",
    statement: "Move and blade can be held at the same time, and releasing a pointer does not leave movement latched.",
  },
  {
    id: "REQ-VIEW-01",
    statement: "A narrow viewport and a resize back to desktop do not clip the playfield or add horizontal page scroll.",
  },
  {
    id: "REQ-VIEW-02",
    statement: "Visible UI text stays at least 14px and is not clipped at the default and narrow layouts.",
  },
  {
    id: "REQ-SAVE-01",
    statement: "Save and load are local, do not require an account, and a corrupt save cannot brick startup.",
  },
  {
    id: "REQ-DEATH-01",
    statement: "Death offers a recovery path and does not silently erase the local profile.",
  },
  {
    id: "REQ-DEATH-02",
    statement: "Shrine Release is an explicit confirm, not a side effect of dragging.",
  },
  {
    id: "REQ-REINC-01",
    statement: "Confirmed Release reincarnates Ellis fourteen years later and keeps at least one world consequence.",
  },
  {
    id: "REQ-DUNGEON-01",
    statement: "An implemented dungeon has an entrance, a key check, a once-only reward, and an exit to that entrance.",
  },
  {
    id: "REQ-LIFE-01",
    statement: "Hiding the document suspends the simulation. Showing it again does not leave attack or movement latched.",
  },
  {
    id: "REQ-AUDIO-01",
    statement: "The Strange Device is optional, plays a chosen local audio file, does not upload it, and can be silenced.",
  },
  {
    id: "REQ-END-01",
    statement: "An implemented ending does not require a compass or geolocation, and post-completion keeps the clear flag.",
  },
  {
    id: "REQ-SCOPE-01",
    statement: "Planned scope (16 dungeons, 12 districts, 6 eras, 4 endings) is not reported as playable unless those ids exist.",
  },
  {
    id: "REQ-NEG-01",
    statement: "No procedural campaign layout, quest compass, or mandatory precise-location collection.",
  },
];
