/**
 * Player-facing chrome for PREINCARNATION.
 * Dialogue, intro beats, endings, and trait blurbs stay in content.ts (English).
 * French and Spanish need a human linguistic review — this is not native approval.
 * The choice is stored at LOCALE_KEY, outside the save blob, so SAVE_VERSION stays put.
 */

export const LOCALES = ["en", "fr", "es"] as const;
export type LocaleId = (typeof LOCALES)[number];

export const LOCALE_KEY = "preincarnation.locale";

export const LOCALE_REVIEW = {
  needsHumanLinguisticReview: true,
  nativeSpeakerApproved: false,
  campaignLocalized: false,
} as const;

/** Do not translate these when they appear in a source line. */
export const LOCKED_NAMES = [
  "PREINCARNATION",
  "Vermont",
  "Addison County",
  "Middlebury",
  "Maeve",
  "Marble Vein",
  "Crowns",
  "Ellis",
] as const;

type Leaf = string | { one: string; other: string };
type Row = Record<LocaleId, Leaf>;

export const CATALOG: Record<string, Row> = {
  "lang.group": { en: "Language", fr: "Langue", es: "Idioma" },
  "lang.en": { en: "English", fr: "English", es: "English" },
  "lang.fr": { en: "Français", fr: "Français", es: "Français" },
  "lang.es": { en: "Español", fr: "Español", es: "Español" },
  "lang.review": {
    en: "A person still has to read the French and the Spanish.",
    fr: "Une personne doit encore lire le français et l'espagnol.",
    es: "Una persona todavía tiene que leer el francés y el español.",
  },
  "canvas.label": {
    en: "PREINCARNATION game world",
    fr: "Monde de jeu PREINCARNATION",
    es: "Mundo de juego de PREINCARNATION",
  },
  "title.kicker": {
    en: "Vermont · never ending",
    fr: "Vermont · sans fin",
    es: "Vermont · sin final",
  },
  "title.pitch": {
    en: "You will die. God, or the other one, will send you back. The Marble Vein is the job.",
    fr: "Vous mourrez. Dieu, ou l'autre, vous renverra. La Marble Vein est le travail.",
    es: "Usted morirá. Dios, o el otro, lo devolverá. La Marble Vein es el trabajo.",
  },
  "title.steps": {
    en: "Addison County. One life, one name. Speak with Maeve. Take the shovel. Walk east until the temple answers.",
    fr: "Addison County. Une vie, un nom. Parlez à Maeve. Prenez la pelle. Marchez vers l'est jusqu'à ce que le temple réponde.",
    es: "Addison County. Una vida, un nombre. Hable con Maeve. Tome la pala. Camine al este hasta que el templo conteste.",
  },
  "title.begin": {
    en: "Begin first life",
    fr: "Commencer la première vie",
    es: "Empezar la primera vida",
  },
  "title.continue": {
    en: "Continue cycle",
    fr: "Continuer le cycle",
    es: "Continuar el ciclo",
  },
  "title.then": {
    en: "First you make the person. Then the county tells you the job.",
    fr: "D'abord vous faites la personne. Ensuite le comté vous dit le travail.",
    es: "Primero usted hace a la persona. Después el condado le dice el trabajo.",
  },
  menu: { en: "Menu", fr: "Menu", es: "Menú" },
  "pause.help": { en: "How to play", fr: "Comment jouer", es: "Cómo jugar" },
  "pause.paused": { en: "Paused", fr: "Pause", es: "Pausa" },
  "pause.who": {
    en: "{name} · {background} · {town} · Cycle {cycle}",
    fr: "{name} · {background} · {town} · Cycle {cycle}",
    es: "{name} · {background} · {town} · Ciclo {cycle}",
  },
  "label.bond": { en: "Bond", fr: "Lien", es: "Vínculo" },
  "label.ideal": { en: "Ideal", fr: "Idéal", es: "Ideal" },
  "label.flaw": { en: "Flaw", fr: "Défaut", es: "Defecto" },
  "label.skill": { en: "Skill", fr: "Compétence", es: "Habilidad" },
  "pause.pts": {
    en: { one: "{count} pt", other: "{count} pts" },
    fr: { one: "{count} pt", other: "{count} pts" },
    es: { one: "{count} punto", other: "{count} puntos" },
  },
  "heading.move": { en: "Move", fr: "Marcher", es: "Caminar" },
  "move.keys": {
    en: "Arrows or WASD. Keyboard always wins — leftover analog is cancelled.",
    fr: "Flèches ou WASD. Le clavier gagne toujours — l'analogique restant est annulé.",
    es: "Flechas o WASD. El teclado siempre gana — lo analógico que quede se cancela.",
  },
  "move.pointer": {
    en: "Mouse / trackpad: click a spot to walk there. Hold to follow the cursor. Let go or leave the map — you stop.",
    fr: "Souris ou pavé : cliquez un endroit pour y marcher. Maintenez pour suivre le curseur. Relâchez ou quittez la carte — vous vous arrêtez.",
    es: "Ratón o trackpad: haga clic en un punto para caminar hasta allí. Mantenga para seguir el cursor. Suelte o salga del mapa — usted se detiene.",
  },
  "move.click": {
    en: "Right-click slashes. Scroll zooms.",
    fr: "Le clic droit tranche. La molette zoome.",
    es: "El clic derecho corta. La rueda acerca o aleja.",
  },
  "move.pad": {
    en: "Gamepad: left stick or D-pad. Switching devices cancels the last one.",
    fr: "Manette : stick gauche ou croix. Changer d'appareil annule le précédent.",
    es: "Mando: stick izquierdo o cruceta. Cambiar de aparato cancela el anterior.",
  },
  "heading.act": { en: "Act", fr: "Agir", es: "Actuar" },
  "table.action": { en: "Action", fr: "Action", es: "Acción" },
  "table.key": { en: "Key", fr: "Touche", es: "Tecla" },
  "table.touch": { en: "Touch", fr: "Toucher", es: "Toque" },
  "act.slash": {
    en: "Slash now / hold spin",
    fr: "Trancher / maintenir pour tournoyer",
    es: "Cortar ahora / mantener para girar",
  },
  "act.y": {
    en: "Use Y-tool (lamp, hammer, shovel)",
    fr: "Utiliser l'outil Y (lampe, marteau, pelle)",
    es: "Usar la herramienta Y (lámpara, martillo, pala)",
  },
  "act.talk": {
    en: "Talk / enter / take",
    fr: "Parler / entrer / prendre",
    es: "Hablar / entrar / tomar",
  },
  "act.sip": {
    en: "Drink syrup / creemee",
    fr: "Boire le sirop / creemee",
    es: "Beber el jarabe / creemee",
  },
  "act.cycle": { en: "Cycle Y-tool", fr: "Changer d'outil Y", es: "Cambiar la herramienta Y" },
  "act.zoom": { en: "Zoom out / in", fr: "Éloigner / rapprocher", es: "Alejar / acercar" },
  "act.release": {
    en: "Release soul (win the cycle)",
    fr: "Relâcher l'âme (gagner le cycle)",
    es: "Soltar el alma (ganar el ciclo)",
  },
  "act.bomb": { en: "Bomb", fr: "Bombe", es: "Bomba" },
  "act.dash": { en: "Dash", fr: "Élan", es: "Carrera" },
  "act.pause": {
    en: "Pause / this screen",
    fr: "Pause / cet écran",
    es: "Pausa / esta pantalla",
  },
  "key.space": { en: "Space / Z", fr: "Espace / Z", es: "Espacio / Z" },
  "key.y": { en: "Y", fr: "Y", es: "Y" },
  "key.talk": { en: "E / Enter / walk in", fr: "E / Entrée / entrer", es: "E / Enter / entrar" },
  "key.v": { en: "V", fr: "V", es: "V" },
  "key.q": { en: "Q", fr: "Q", es: "Q" },
  "key.zoom": { en: "- / =", fr: "- / =", es: "- / =" },
  "key.release": { en: "hold R", fr: "maintenir R", es: "mantener R" },
  "key.bomb": { en: "F / X", fr: "F / X", es: "F / X" },
  "key.shift": { en: "Shift", fr: "Maj", es: "Mayús" },
  "key.pause": { en: "Esc / P", fr: "Échap / P", es: "Esc / P" },
  "touch.slash": { en: "Slash", fr: "Couper", es: "Cortar" },
  "touch.talk": { en: "Talk", fr: "Parler", es: "Hablar" },
  "touch.sip": { en: "Sip", fr: "Sirop", es: "Sorbo" },
  "touch.bomb": { en: "Bomb", fr: "Bombe", es: "Bomba" },
  "touch.arm": { en: "Arm", fr: "Outil", es: "Arma" },
  "touch.release": { en: "Release", fr: "Lâcher", es: "Soltar" },
  "touch.far": { en: "Far", fr: "Loin", es: "Lejos" },
  "touch.near": { en: "Near", fr: "Près", es: "Cerca" },
  "touch.pause": { en: "Pause", fr: "Pause", es: "Pausa" },
  "touch.holdRelease": {
    en: "hold Release",
    fr: "maintenir Lâcher",
    es: "mantener Soltar",
  },
  "touch.zoom": { en: "Far / Near", fr: "Loin / Près", es: "Lejos / Cerca" },
  "touch.dash": { en: "—", fr: "—", es: "—" },
  "touch.none": { en: "—", fr: "—", es: "—" },
  "pause.note": {
    en: "Space is always the sword — even with the lamp in hand. Y uses the tool in the HUD (shovel, lamp, hammer, cape). Q cycles tools. Minus pulls the camera back over the town. Dying leaves a grave — come back with the shovel in 14–18 years. The Marble Vein east of Middlebury is the county temple. There is no credits sequence.",
    fr: "Espace est toujours l'épée — même avec la lampe en main. Y utilise l'outil affiché (pelle, lampe, marteau, cape). Q change d'outil. Moins recule la caméra sur la ville. Mourir laisse une tombe — revenez avec la pelle dans 14–18 ans. La Marble Vein à l'est de Middlebury est le temple du comté. Il n'y a pas de générique.",
    es: "Espacio es siempre la espada — incluso con la lámpara en la mano. Y usa la herramienta del visor (pala, lámpara, martillo, capa). Q cambia de herramienta. Menos aleja la cámara sobre el pueblo. Morir deja una tumba — vuelva con la pala en 14–18 años. La Marble Vein al este de Middlebury es el templo del condado. No hay créditos.",
  },
  "heading.settings": { en: "Settings", fr: "Réglages", es: "Ajustes" },
  "settings.touch.on": {
    en: "On-screen buttons on",
    fr: "Boutons à l'écran : oui",
    es: "Botones en pantalla: sí",
  },
  "settings.touch.off": {
    en: "On-screen buttons off",
    fr: "Boutons à l'écran : non",
    es: "Botones en pantalla: no",
  },
  "settings.weapon": { en: "Next weapon", fr: "Arme suivante", es: "Siguiente arma" },
  "settings.shake.on": {
    en: "Screen shake on",
    fr: "Tremblement d'écran : oui",
    es: "Vibración de pantalla: sí",
  },
  "settings.shake.off": {
    en: "Screen shake off",
    fr: "Tremblement d'écran : non",
    es: "Vibración de pantalla: no",
  },
  "settings.sound.on": { en: "Sound on", fr: "Son actif", es: "Sonido activo" },
  "settings.sound.muted": { en: "Sound muted", fr: "Son coupé", es: "Sonido en silencio" },
  "settings.forget": {
    en: "Forget all lives",
    fr: "Oublier toutes les vies",
    es: "Olvidar todas las vidas",
  },
  "pause.resume": { en: "Resume", fr: "Reprendre", es: "Seguir" },
  "pause.walk": {
    en: "I understand — walk",
    fr: "J'ai compris — marcher",
    es: "Entendido — caminar",
  },
  "dialogue.continue": { en: "Continue", fr: "Continuer", es: "Continuar" },
  "dialogue.entropy": {
    en: "Entropy {percent}%",
    fr: "Entropie {percent} %",
    es: "Entropía {percent} %",
  },
  "create.kicker": { en: "First life", fr: "Première vie", es: "Primera vida" },
  "create.title": { en: "Make the person", fr: "Faire la personne", es: "Hacer a la persona" },
  "create.lead": {
    en: "One name. One set of debts. You do not come back as someone else. You come back as this, louder, until the Vein answers.",
    fr: "Un nom. Un ensemble de dettes. Vous ne revenez pas en quelqu'un d'autre. Vous revenez en ceci, plus fort, jusqu'à ce que la Vein réponde.",
    es: "Un nombre. Un conjunto de deudas. Usted no vuelve como otra persona. Usted vuelve como esto, más fuerte, hasta que la Vein conteste.",
  },
  "create.name": { en: "Name", fr: "Nom", es: "Nombre" },
  "create.background": { en: "Background", fr: "Origine", es: "Origen" },
  "create.skills": {
    en: "Skill points",
    fr: "Points de compétence",
    es: "Puntos de habilidad",
  },
  "create.left": {
    en: { one: "{count} left of {max}", other: "{count} left of {max}" },
    fr: { one: "{count} restant sur {max}", other: "{count} restants sur {max}" },
    es: { one: "{count} restante de {max}", other: "{count} restantes de {max}" },
  },
  "create.walk": {
    en: "Walk into the story",
    fr: "Entrer dans l'histoire",
    es: "Entrar en la historia",
  },
  "intro.begin": { en: "Begin the job", fr: "Commencer le travail", es: "Empezar el trabajo" },
  "intro.progress": {
    en: "{beat} / {total} · Enter or tap",
    fr: "{beat} / {total} · Entrée ou toucher",
    es: "{beat} / {total} · Enter o toque",
  },
  "limbo.karma": { en: "Karma", fr: "Karma", es: "Karma" },
  "limbo.cycleYear": {
    en: "Cycle {cycle} · Year {year}",
    fr: "Cycle {cycle} · An {year}",
    es: "Ciclo {cycle} · Año {year}",
  },
  "limbo.spectrum": {
    en: "You have died loud enough. The sphere is open after you finish walking back.",
    fr: "Vous êtes mort assez fort. La sphère s'ouvre une fois que vous avez fini de revenir à pied.",
    es: "Usted ha muerto lo bastante fuerte. La esfera se abre cuando termine de volver a pie.",
  },
  "limbo.chapter": { en: "This chapter", fr: "Ce chapitre", es: "Este capítulo" },
  "limbo.life": { en: "This life", fr: "Cette vie", es: "Esta vida" },
  "limbo.keep": { en: "You keep", fr: "Vous gardez", es: "Usted guarda" },
  "limbo.ground": { en: "The ground kept", fr: "Le sol a gardé", es: "El suelo guardó" },
  "limbo.spend": {
    en: "Spend what you were given",
    fr: "Dépensez ce qu'on vous a donné",
    es: "Gaste lo que le dieron",
  },
  "ending.door": {
    en: "This is not an ending. It is a door. Power stacks. The county is still under your feet.",
    fr: "Ce n'est pas une fin. C'est une porte. La puissance s'empile. Le comté est encore sous vos pieds.",
    es: "Esto no es un final. Es una puerta. El poder se acumula. El condado sigue bajo sus pies.",
  },
  "ending.walk": {
    en: "Keep walking — louder",
    fr: "Continuer à marcher — plus fort",
    es: "Siga caminando — más fuerte",
  },
  "deck.device": { en: "Strange device", fr: "Appareil étrange", es: "Aparato extraño" },
  "deck.play": { en: "Play", fr: "Lecture", es: "Oír" },
  "deck.pause": { en: "Pause", fr: "Pause", es: "Pausa" },
  "deck.lid": { en: "Lid", fr: "Couvercle", es: "Tapa" },
  "deck.emptyTitle": {
    en: "A pocket of other music",
    fr: "Une poche d'autre musique",
    es: "Un bolsillo de otra música",
  },
  "deck.seated": {
    en: "Pocketing keeps it playing. Pause is a different button. One bay — a new song replaces this one.",
    fr: "Le mettre en poche le laisse jouer. Pause est un autre bouton. Une seule baie — une nouvelle chanson remplace celle-ci.",
    es: "Guardarlo en el bolsillo lo deja sonando. Pausa es otro botón. Una sola bahía — una canción nueva reemplaza esta.",
  },
  "deck.empty": {
    en: "Feed it a song from your own library. Towns already hum; this is yours. Pocketing will not empty the bay.",
    fr: "Donnez-lui une chanson de votre bibliothèque. Les villes murmurent déjà ; ceci est à vous. Le mettre en poche ne vide pas la baie.",
    es: "Déle una canción de su biblioteca. Los pueblos ya zumban; esto es suyo. Guardarlo en el bolsillo no vacía la bahía.",
  },
  "deck.seek": { en: "Seek", fr: "Position", es: "Posición" },
  "deck.replace": { en: "Replace", fr: "Remplacer", es: "Reemplazar" },
  "deck.feed": { en: "Feed a song", fr: "Donner une chanson", es: "Dar una canción" },
  "deck.pocket": { en: "Pocket it", fr: "Le mettre en poche", es: "Guardarlo" },
};

export type MessageVars = Record<string, string | number>;
export type Translate = (id: string, vars?: MessageVars, count?: number) => string;

/** French: 0 and 1 are "one". English and Spanish: only 1 is "one". */
export function pluralCategory(locale: LocaleId, count: number): "one" | "other" {
  const n = Math.abs(count);
  if (locale === "fr") return n === 0 || n === 1 ? "one" : "other";
  return n === 1 ? "one" : "other";
}

export function formatMessage(template: string, vars: MessageVars = {}): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (full, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : full,
  );
}

export function message(
  locale: LocaleId,
  id: string,
  vars: MessageVars = {},
  count?: number,
): string {
  const row = CATALOG[id];
  if (!row) return id;
  const leaf = row[locale] ?? row.en;
  const filled = count === undefined ? vars : { count, ...vars };
  const template =
    typeof leaf === "string"
      ? leaf
      : leaf[pluralCategory(locale, count ?? Number(filled.count ?? 0))];
  return formatMessage(template, filled);
}

export function leaves(locale: LocaleId, id: string): string[] {
  const leaf = CATALOG[id]?.[locale];
  if (!leaf) return [];
  return typeof leaf === "string" ? [leaf] : [leaf.one, leaf.other];
}

export function placeholders(template: string): string[] {
  return [...template.matchAll(/\{([a-zA-Z]+)\}/g)].map((m) => m[1]).sort();
}

const GLYPH = /[^\n\r\t\u0020-\u007E\u00A0-\u00FF\u0100-\u017F\u2013\u2014·]/u;

export function unsupportedGlyphs(input: string): string[] {
  const bad = new Set<string>();
  for (const ch of input) {
    if (GLYPH.test(ch)) bad.add(ch);
  }
  return [...bad];
}

export function pseudolocalize(input: string): string {
  const accent: Record<string, string> = {
    a: "à",
    e: "é",
    i: "ï",
    o: "ö",
    u: "ü",
    A: "À",
    E: "É",
    I: "Ï",
    O: "Ö",
    U: "Ü",
    c: "ç",
    n: "ñ",
  };
  const body = input
    .split(/(\{[a-zA-Z]+\})/g)
    .map((part) => (part.startsWith("{") ? part : [...part].map((ch) => accent[ch] ?? ch).join("")))
    .join("");
  return `[${body}~~]`;
}

export function readLocale(storage: Pick<Storage, "getItem"> | null | undefined): LocaleId {
  if (!storage) return "en";
  const raw = storage.getItem(LOCALE_KEY);
  return raw === "fr" || raw === "es" ? raw : "en";
}

export function writeLocale(locale: LocaleId, storage: Pick<Storage, "setItem">): void {
  storage.setItem(LOCALE_KEY, locale);
}
