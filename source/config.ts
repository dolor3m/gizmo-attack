export const CELL = 56;
export const COLS = 18;
export const ROWS = 11;
export const WORLD_W = COLS * CELL;
export const WORLD_H = ROWS * CELL;
export const START_GOLD = 200;
export const START_LIVES = 20;
export const WAVES_PER_LEVEL = 8;
export const SELL_RATE = 0.55;
export const DESTROY_RATE = 0.2;

export type EnemyId = "archer" | "warrior" | "mage" | "ork" | "cavalry" | "sorcerer" | "tyrant" | "warlord";

export type TowerId = "scratch" | "yarn" | "laser" | "mortar" | "catnip";
export type TowerKind = "melee" | "homing" | "beam" | "arc" | "spray";
export type AtkKind = "claw" | "arrow" | "spell" | "bomb" | "stab" | "smash" | "spear" | "blast";
export type LevelId = string;
export type DecorKind = "trees" | "hedge" | "stone" | "dune" | "rock" | "snow" | "village";

export type EnemyDef = {
  id: EnemyId;
  name: string;
  hp: number;
  speed: number;
  gold: number;
  scale: number;
  armor: number;
  blurb: string;
  atkKind: AtkKind;
  atkRange: number;
  atkDmg: number;
  atkRate: number;
  atkSplash: number;
  faceNative: 1 | -1;
};

export type TowerDef = {
  id: TowerId;
  name: string;
  cost: number;
  range: number;
  rate: number;
  damage: number;
  kind: TowerKind;
  splash: number;
  slow: number;
  slowTime: number;
  shotSpeed: number;
  hp: number;
  blurb: string;
};

export type WaveEntry = {
  type: EnemyId;
  count: number;
  interval: number;
  delay?: number;
};
export type WaveDef = { entries: WaveEntry[] };

export type HazardDef = {
  kind: "sand" | "fountain" | "lava";
  c: number;
  r: number;
  ampC?: number;
  ampR?: number;
  radius: number;
  period?: number;
};

export type LevelDef = {
  id: LevelId;
  name: string;
  blurb: string;
  tile: string;
  decor: DecorKind;
  pathTint: string;
  grass: string;
  path: string;
  waypoints: { c: number; r: number }[];
  blocked: string[];
  water: string[];
  lava: string[];
  hazards: HazardDef[];
  hpMult: number;
  speedMult: number;
  goldMult: number;
  atkMult: number;
  waves: WaveDef[];
};

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  archer: {
    id: "archer",
    name: "Archer",
    hp: 40,
    speed: 77,
    gold: 12,
    scale: 0.92,
    armor: 0.02,
    blurb: "Skirmisher. Longbow, paper hull, picks posts from the lane.",
    atkKind: "arrow",
    atkRange: 3.6,
    atkDmg: 8,
    atkRate: 0.56,
    atkSplash: 0,
    faceNative: -1,
  },
  warrior: {
    id: "warrior",
    name: "Warrior",
    hp: 32,
    speed: 68,
    gold: 10,
    scale: 0.88,
    armor: 0.02,
    blurb: "Warrior. Twin knives, no armor, cuts the nearest post.",
    atkKind: "stab",
    atkRange: 1.25,
    atkDmg: 6,
    atkRate: 0.92,
    atkSplash: 0,
    faceNative: 1,
  },
  mage: {
    id: "mage",
    name: "Mage",
    hp: 64,
    speed: 50,
    gold: 15,
    scale: 0.96,
    armor: 0.07,
    blurb: "Apprentice. Yellow-orb wand. Slow, glass, long starbolt.",
    atkKind: "spell",
    atkRange: 3.7,
    atkDmg: 15,
    atkRate: 0.33,
    atkSplash: 0,
    faceNative: 1,
  },
  ork: {
    id: "ork",
    name: "Ork",
    hp: 94,
    speed: 56,
    gold: 19,
    scale: 0.9,
    armor: 0.14,
    blurb: "Brute. Thick hide, club smash. Slow feet, stout stamina.",
    atkKind: "smash",
    atkRange: 1.3,
    atkDmg: 13,
    atkRate: 0.55,
    atkSplash: 0,
    faceNative: 1,
  },
  cavalry: {
    id: "cavalry",
    name: "Horseman",
    hp: 199,
    speed: 86,
    gold: 31,
    scale: 1.5,
    armor: 0.22,
    blurb: "Knight horseman. Fastest heavy. Lance poke as the horse blows by.",
    atkKind: "spear",
    atkRange: 2.1,
    atkDmg: 18,
    atkRate: 0.44,
    atkSplash: 0,
    faceNative: -1,
  },
  sorcerer: {
    id: "sorcerer",
    name: "Sorcerer",
    hp: 118,
    speed: 43,
    gold: 22,
    scale: 0.98,
    armor: 0.1,
    blurb: "Adept. Purple-orb staff. Heavier bolt than the yellow mage.",
    atkKind: "spell",
    atkRange: 4.0,
    atkDmg: 22,
    atkRate: 0.29,
    atkSplash: 0.18,
    faceNative: 1,
  },
  tyrant: {
    id: "tyrant",
    name: "Tyrant",
    hp: 292,
    speed: 35,
    gold: 40,
    scale: 1.14,
    armor: 0.32,
    blurb: "Tyrant. Plate, skull-shield, axe. Slow and stubborn.",
    atkKind: "smash",
    atkRange: 1.65,
    atkDmg: 24,
    atkRate: 0.38,
    atkSplash: 0.5,
    faceNative: 1,
  },
  warlord: {
    id: "warlord",
    name: "Warlord",
    hp: 510,
    speed: 26,
    gold: 61,
    scale: 1.48,
    armor: 0.38,
    blurb: "Commander. Twin royal swords. A blast that cooks a cluster.",
    atkKind: "blast",
    atkRange: 3.05,
    atkDmg: 32,
    atkRate: 0.25,
    atkSplash: 1.05,
    faceNative: 1,
  },
};

export const TOWERS: Record<TowerId, TowerDef> = {
  scratch: {
    id: "scratch",
    name: "Scratch Post",
    cost: 50,
    range: 1.65,
    rate: 2.3,
    damage: 11,
    kind: "melee",
    splash: 0.45,
    slow: 0,
    slowTime: 0,
    shotSpeed: 0,
    hp: 130,
    blurb: "Short claws. Cheap, rapid, and a small swipe.",
  },
  yarn: {
    id: "yarn",
    name: "Yarn Cannon",
    cost: 85,
    range: 2.85,
    rate: 1.15,
    damage: 19,
    kind: "homing",
    splash: 0,
    slow: 0,
    slowTime: 0,
    shotSpeed: 300,
    hp: 100,
    blurb: "Homing yarn. Solid mid range.",
  },
  laser: {
    id: "laser",
    name: "Laser Pointer",
    cost: 130,
    range: 4.35,
    rate: 0.72,
    damage: 44,
    kind: "beam",
    splash: 0,
    slow: 0,
    slowTime: 0,
    shotSpeed: 0,
    hp: 72,
    blurb: "Long beam. Leaves a burn.",
  },
  mortar: {
    id: "mortar",
    name: "Hairball Mortar",
    cost: 180,
    range: 3.35,
    rate: 0.46,
    damage: 38,
    kind: "arc",
    splash: 1.35,
    slow: 0,
    slowTime: 0,
    shotSpeed: 210,
    hp: 145,
    blurb: "Arcing splash. Stout and slow.",
  },
  catnip: {
    id: "catnip",
    name: "Catnip Fog",
    cost: 110,
    range: 2.1,
    rate: 1.05,
    damage: 8,
    kind: "spray",
    splash: 1.15,
    slow: 0.52,
    slowTime: 2.5,
    shotSpeed: 0,
    hp: 88,
    blurb: "Slows a cluster. Soft wood.",
  },
};

export const TOWER_ORDER: TowerId[] = ["scratch", "yarn", "laser", "catnip", "mortar"];
export const ENEMY_IDS: EnemyId[] = [
  "archer",
  "warrior",
  "mage",
  "ork",
  "cavalry",
  "sorcerer",
  "tyrant",
  "warlord",
];

/** One-shot upgrades: pricey, modest gains. */
export const ATK_UP_COST_MULT = 0.736;
export const ATK_DMG_MULT = 1.336;
export const DEF_UP_COST_MULT = 0.672;
export const DEF_HP_MULT = 1.384;
export const RNG_UP_COST_MULT = 0.704;
export const RNG_MULT = 1.216;
export const RATE_UP_COST_MULT = 0.704;
export const RATE_MULT = 1.264;
/** Two repairs max. Cost = buy × missingHP × 0.55 × visit (1st ×1, 2nd ×1.85). */
export const REPAIR_MAX = 2;
export const REPAIR_BASE = 0.55;
export const REPAIR_VISIT = [1, 1.85];

export function towerAtkCost(id: TowerId) {
  return Math.round(TOWERS[id].cost * ATK_UP_COST_MULT);
}
export function towerDefCost(id: TowerId) {
  return Math.round(TOWERS[id].cost * DEF_UP_COST_MULT);
}
export function towerRngCost(id: TowerId) {
  return Math.round(TOWERS[id].cost * RNG_UP_COST_MULT);
}
export function towerRateCost(id: TowerId) {
  return Math.round(TOWERS[id].cost * RATE_UP_COST_MULT);
}
export function towerRepairCost(id: TowerId, hp: number, maxHp: number, used: number) {
  if (used >= REPAIR_MAX) return null;
  if (maxHp <= 0) return 0;
  const missing = 1 - Math.max(0, hp) / maxHp;
  if (missing <= 0.008) return 0;
  const visit = REPAIR_VISIT[used] ?? REPAIR_VISIT[REPAIR_VISIT.length - 1]!;
  return Math.max(1, Math.round(TOWERS[id].cost * missing * REPAIR_BASE * visit));
}

export const ATK_COLOR: Record<AtkKind, string> = {
  claw: "#e6d3b3",
  arrow: "#6b8f5e",
  spell: "#8b6cc9",
  bomb: "#c45c4a",
  stab: "#7a5a8a",
  smash: "#9aa0a8",
  spear: "#c9a07a",
  blast: "#e0453a",
};

function E(type: EnemyId, count: number, interval: number, delay = 0): WaveEntry {
  return { type, count, interval, delay };
}
function W(entries: WaveEntry[]): WaveDef {
  return { entries };
}

const GARDEN_WAVES: WaveDef[] = [
  W([E("archer", 10, 0.72)]),
  W([E("warrior", 8, 0.55), E("archer", 4, 0.8, 1.2)]),
  W([E("mage", 4, 1.05), E("warrior", 6, 0.5, 0.8)]),
  W([E("ork", 8, 0.55), E("archer", 5, 0.7, 1)]),
  W([E("cavalry", 2, 2.0), E("warrior", 8, 0.42, 0.5)]),
  W([E("sorcerer", 3, 1.1), E("mage", 4, 0.85, 0.8)]),
  W([E("tyrant", 2, 1.8), E("ork", 6, 0.45, 0.6)]),
  W([E("warlord", 1, 1), E("archer", 5, 0.65, 2), E("warrior", 6, 0.4, 3)]),
];

const FOREST_WAVES: WaveDef[] = [
  W([E("archer", 8, 0.55), E("warrior", 8, 0.45, 0.4)]),
  W([E("mage", 5, 0.85), E("warrior", 8, 0.42, 0.5)]),
  W([E("ork", 8, 0.48), E("archer", 6, 0.6, 0.6)]),
  W([E("cavalry", 3, 1.5), E("warrior", 8, 0.4, 0.5)]),
  W([E("sorcerer", 4, 0.9), E("mage", 4, 0.75, 0.8)]),
  W([E("tyrant", 2, 1.5), E("ork", 8, 0.4, 0.4), E("archer", 5, 0.55)]),
  W([E("cavalry", 3, 1.35), E("sorcerer", 3, 0.9, 1)]),
  W([E("warlord", 1, 1), E("tyrant", 2, 1.6, 2), E("warrior", 8, 0.35, 1)]),
];

const MAZE_WAVES: WaveDef[] = [
  W([E("warrior", 10, 0.4), E("archer", 6, 0.55, 0.5)]),
  W([E("mage", 5, 0.75), E("ork", 6, 0.5, 0.6)]),
  W([E("cavalry", 3, 1.35), E("warrior", 8, 0.38, 0.4)]),
  W([E("sorcerer", 4, 0.8), E("mage", 4, 0.7, 0.5)]),
  W([E("tyrant", 3, 1.35), E("ork", 8, 0.38, 0.4)]),
  W([E("cavalry", 4, 1.15), E("archer", 7, 0.45, 0.4)]),
  W([E("tyrant", 3, 1.2), E("sorcerer", 4, 0.7, 0.8)]),
  W([E("warlord", 1, 1), E("cavalry", 3, 1.2, 2), E("mage", 5, 0.55, 3)]),
];

const CASTLE_WAVES: WaveDef[] = [
  W([E("archer", 8, 0.48), E("warrior", 8, 0.4, 0.3)]),
  W([E("ork", 8, 0.42), E("mage", 5, 0.7, 0.5)]),
  W([E("cavalry", 4, 1.2), E("warrior", 8, 0.35, 0.4)]),
  W([E("sorcerer", 5, 0.7), E("ork", 8, 0.38, 0.4)]),
  W([E("tyrant", 3, 1.2), E("cavalry", 3, 1.25, 1)]),
  W([E("warlord", 1, 1), E("archer", 6, 0.5, 2)]),
  W([E("tyrant", 3, 1.1), E("sorcerer", 4, 0.65, 0.6), E("warrior", 8, 0.32)]),
  W([E("warlord", 1, 1), E("cavalry", 4, 1.1, 2), E("mage", 5, 0.5, 3)]),
];

const DUNE_WAVES: WaveDef[] = [
  W([E("cavalry", 3, 1.15), E("archer", 8, 0.42, 0.4)]),
  W([E("ork", 10, 0.35), E("mage", 5, 0.65, 0.5)]),
  W([E("sorcerer", 5, 0.65), E("warrior", 10, 0.32, 0.3)]),
  W([E("tyrant", 4, 1.05), E("cavalry", 3, 1.15, 0.8)]),
  W([E("warlord", 1, 1), E("ork", 10, 0.3, 2)]),
  W([E("cavalry", 5, 1.0), E("sorcerer", 4, 0.6, 0.6)]),
  W([E("tyrant", 4, 0.95), E("mage", 6, 0.5, 0.5), E("archer", 6, 0.4)]),
  W([E("warlord", 1, 1), E("tyrant", 3, 1.0, 2), E("cavalry", 4, 1.0, 3)]),
];

const MAGMA_WAVES: WaveDef[] = [
  W([E("cavalry", 4, 1.05), E("ork", 10, 0.3, 0.3)]),
  W([E("sorcerer", 5, 0.6), E("warrior", 10, 0.28, 0.3)]),
  W([E("tyrant", 4, 1.0), E("mage", 6, 0.5, 0.5)]),
  W([E("warlord", 1, 1), E("archer", 8, 0.38, 2)]),
  W([E("cavalry", 5, 0.95), E("tyrant", 3, 1.0, 0.8)]),
  W([E("warlord", 1, 1), E("sorcerer", 5, 0.5, 2), E("ork", 10, 0.26, 3)]),
  W([E("warlord", 1, 1), E("tyrant", 4, 0.9, 1.5), E("cavalry", 4, 0.95, 3)]),
  W([E("warlord", 2, 5), E("tyrant", 3, 0.9, 2), E("cavalry", 4, 0.9, 3), E("sorcerer", 4, 0.45, 4)]),
];

function bump(waves: WaveDef[], t: number): WaveDef[] {
  if (t <= 0) return waves;
  const cm = 1 + t * 0.05;
  const im = Math.max(0.62, 1 - t * 0.012);
  return waves.map((w) => ({
    entries: w.entries.map((e) => ({
      ...e,
      count: Math.max(1, Math.round(e.count * cm)),
      interval: Math.max(0.22, Math.round(e.interval * im * 100) / 100),
    })),
  }));
}

function L(
  partial: Omit<LevelDef, "hpMult" | "speedMult" | "goldMult" | "atkMult"> & {
    tier: number;
  },
): LevelDef {
  const { tier: i, ...rest } = partial;
  return {
    ...rest,
    hpMult: 1,
    speedMult: 1,
    goldMult: 1,
    atkMult: 1,
    waves: bump(rest.waves, i),
  };
}

function rect(c0: number, r0: number, c1: number, r1: number): string[] {
  const out: string[] = [];
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) out.push(`${c},${r}`);
  return out;
}

export const LEVELS: LevelDef[] = [
  {
    id: "garden",
    name: "Moonlit Garden",
    blurb: "A winding dirt path, a stone fountain, and the village gate.",
    tile: "garden",
    decor: "trees",
    pathTint: "#8a6a48",
    grass: "#243326",
    path: "#8a6a48",
    waypoints: [
      { c: 0.15, r: 6 },
      { c: 4, r: 6 },
      { c: 4, r: 1.5 },
      { c: 9, r: 1.5 },
      { c: 9, r: 8.5 },
      { c: 13, r: 8.5 },
      { c: 13, r: 3.5 },
      { c: 17.4, r: 3.5 },
    ],
    blocked: ["0,0", "1,0", "0,1", "16,0", "17,0", "17,1", "0,9", "0,10", "1,10", "16,10", "17,10", "17,9", "7,5", "8,5"],
    water: ["7,4", "8,4"],
    lava: [],
    hazards: [{ kind: "fountain", c: 7.5, r: 4.6, radius: 0.85 }],
    hpMult: 1,
    speedMult: 1,
    goldMult: 1,
    atkMult: 1,
    waves: GARDEN_WAVES,
  },
  {
    id: "forest",
    name: "Whisperwood",
    blurb: "Old pines, a cold stream, and a path that doubles back.",
    tile: "forest",
    decor: "trees",
    pathTint: "#6a5340",
    grass: "#1a2a1c",
    path: "#6a5340",
    waypoints: [
      { c: 0.2, r: 1.5 },
      { c: 5, r: 1.5 },
      { c: 5, r: 5 },
      { c: 2, r: 5 },
      { c: 2, r: 9 },
      { c: 8, r: 9 },
      { c: 8, r: 3 },
      { c: 12, r: 3 },
      { c: 12, r: 8 },
      { c: 17.4, r: 8 },
    ],
    blocked: [
      "0,0",
      "1,0",
      "3,3",
      "3,4",
      "6,6",
      "6,7",
      "10,0",
      "10,1",
      "10,5",
      "10,6",
      "14,1",
      "15,1",
      "16,4",
      "17,4",
      "14,10",
      "15,10",
      "0,7",
      "0,8",
    ],
    water: ["9,6", "10,6", "11,6", "11,7", "13,5"],
    lava: [],
    hazards: [],
    hpMult: 1,
    speedMult: 1,
    goldMult: 1,
    atkMult: 1,
    waves: bump(FOREST_WAVES, 1),
  },
  {
    id: "maze",
    name: "Hedge Labyrinth",
    blurb: "Plantation walls. Only the pockets between hedges hold towers.",
    tile: "forest",
    decor: "hedge",
    pathTint: "#7a6848",
    grass: "#1e2c18",
    path: "#7a6848",
    waypoints: [
      { c: 0.2, r: 2 },
      { c: 3, r: 2 },
      { c: 3, r: 8 },
      { c: 6, r: 8 },
      { c: 6, r: 4 },
      { c: 9, r: 4 },
      { c: 9, r: 9 },
      { c: 13, r: 9 },
      { c: 13, r: 1.5 },
      { c: 17.4, r: 1.5 },
    ],
    blocked: [
      ...rect(0, 0, 17, 0),
      ...rect(0, 10, 17, 10),
      "1,4",
      "1,5",
      "1,6",
      "4,4",
      "4,5",
      "4,6",
      "5,1",
      "5,5",
      "7,6",
      "7,7",
      "8,1",
      "8,6",
      "10,2",
      "10,6",
      "11,6",
      "11,3",
      "14,4",
      "14,5",
      "14,6",
      "15,6",
      "16,4",
      "16,5",
      "16,8",
      "2,6",
    ],
    water: [],
    lava: [],
    hazards: [],
    hpMult: 1,
    speedMult: 1,
    goldMult: 1,
    atkMult: 1,
    waves: bump(MAZE_WAVES, 2),
  },
  {
    id: "castle",
    name: "Castle Bailey",
    blurb: "Cobble yard, battlements, a courtyard fountain and a moat.",
    tile: "castle",
    decor: "stone",
    pathTint: "#6e6458",
    grass: "#3a3732",
    path: "#6e6458",
    waypoints: [
      { c: 0.2, r: 9 },
      { c: 5, r: 9 },
      { c: 5, r: 2 },
      { c: 11, r: 2 },
      { c: 11, r: 9 },
      { c: 17.4, r: 9 },
    ],
    blocked: [
      ...rect(0, 0, 17, 0),
      "0,1",
      "4,1",
      "8,1",
      "12,1",
      "16,1",
      "17,1",
      "7,5",
      "8,5",
      "9,5",
      "7,6",
      "9,6",
    ],
    water: ["1,4", "2,4", "3,4", "14,4", "15,4", "16,4", "1,5", "16,5", "8,6"],
    lava: [],
    hazards: [{ kind: "fountain", c: 8, r: 5.6, radius: 0.9 }],
    hpMult: 1,
    speedMult: 1,
    goldMult: 1,
    atkMult: 1,
    waves: bump(CASTLE_WAVES, 3),
  },
  {
    id: "dunes",
    name: "Shifting Dunes",
    blurb: "Moving sand traps chew any tower they swallow.",
    tile: "dunes",
    decor: "dune",
    pathTint: "#b08958",
    grass: "#c4a06a",
    path: "#b08958",
    waypoints: [
      { c: 0.2, r: 8 },
      { c: 4, r: 8 },
      { c: 4, r: 3 },
      { c: 9, r: 3 },
      { c: 9, r: 9 },
      { c: 14, r: 9 },
      { c: 14, r: 4 },
      { c: 17.4, r: 4 },
    ],
    blocked: ["0,0", "1,0", "16,0", "17,0", "0,10", "1,10", "16,10", "17,10", "6,6", "11,1", "2,1", "16,7"],
    water: [],
    lava: [],
    hazards: [
      { kind: "sand", c: 6.5, r: 5.5, ampC: 2.2, ampR: 0.4, radius: 1.2, period: 5.5 },
      { kind: "sand", c: 11.5, r: 6.2, ampC: 0.6, ampR: 1.8, radius: 1.15, period: 4.2 },
      { kind: "sand", c: 2.5, r: 5, ampC: 0.8, ampR: 1.4, radius: 1.05, period: 6 },
    ],
    hpMult: 1,
    speedMult: 1,
    goldMult: 1,
    atkMult: 1,
    waves: bump(DUNE_WAVES, 4),
  },
  {
    id: "magma",
    name: "Magma Hollow",
    blurb: "Underground lava rivers. Heat bites towers. The warlord holds court.",
    tile: "magma",
    decor: "rock",
    pathTint: "#5a4038",
    grass: "#1a1210",
    path: "#5a4038",
    waypoints: [
      { c: 0.2, r: 5 },
      { c: 3, r: 5 },
      { c: 3, r: 1.5 },
      { c: 8, r: 1.5 },
      { c: 8, r: 8.5 },
      { c: 13, r: 8.5 },
      { c: 13, r: 4 },
      { c: 17.4, r: 4 },
    ],
    blocked: ["0,0", "1,0", "16,0", "17,0", "0,10", "17,10", "5,4", "5,5", "10,3", "10,4", "16,7", "1,8"],
    water: [],
    lava: [
      "0,7",
      "1,7",
      "2,7",
      "2,8",
      "4,6",
      "4,7",
      "5,7",
      "6,4",
      "6,5",
      "6,6",
      "10,6",
      "10,7",
      "11,6",
      "15,6",
      "15,7",
      "16,6",
      "17,6",
      "5,10",
      "6,10",
      "11,1",
      "12,1",
    ],
    hazards: [
      { kind: "lava", c: 6, r: 5.5, radius: 1.1 },
      { kind: "lava", c: 10.5, r: 6.5, radius: 1.05 },
    ],
    hpMult: 1,
    speedMult: 1,
    goldMult: 1,
    atkMult: 1,
    waves: bump(MAGMA_WAVES, 5),
  },
  L({
    id: "brook",
    name: "Willow Brook",
    blurb: "A lazy stream cuts the meadow. Towers hate wet feet.",
    tile: "garden",
    decor: "trees",
    pathTint: "#7a6848",
    grass: "#2a3a28",
    path: "#7a6848",
    waypoints: [
      { c: 0.2, r: 9 },
      { c: 7, r: 9 },
      { c: 7, r: 2 },
      { c: 12, r: 2 },
      { c: 12, r: 7 },
      { c: 17.4, r: 7 },
    ],
    blocked: ["0,0", "1,0", "16,0", "17,0", "0,10", "17,10", "3,4", "4,4", "9,5", "10,5", "14,3"],
    water: ["0,5", "1,5", "2,5", "3,5", "4,5", "5,5", "8,5", "9,4", "13,4", "14,4", "15,5", "16,5"],
    lava: [],
    hazards: [{ kind: "fountain", c: 4.5, r: 3.4, radius: 0.8 }],
    tier: 6,
    waves: FOREST_WAVES,
  }),
  L({
    id: "orchard",
    name: "Cider Orchard",
    blurb: "Fruit trees crowd the lanes. The path folds twice.",
    tile: "garden",
    decor: "trees",
    pathTint: "#8a6040",
    grass: "#2c3820",
    path: "#8a6040",
    waypoints: [
      { c: 0.2, r: 2 },
      { c: 4, r: 2 },
      { c: 4, r: 8 },
      { c: 8, r: 8 },
      { c: 8, r: 2 },
      { c: 13, r: 2 },
      { c: 13, r: 9 },
      { c: 17.4, r: 9 },
    ],
    blocked: ["0,0", "17,0", "0,10", "17,10", "2,4", "2,5", "6,4", "6,5", "10,5", "10,6", "15,4", "15,5"],
    water: ["6,0", "7,0"],
    lava: [],
    hazards: [],
    tier: 7,
    waves: MAZE_WAVES,
  }),
  L({
    id: "river",
    name: "Stoneford River",
    blurb: "Two crossings. Miss the banks and the current takes the post.",
    tile: "forest",
    decor: "trees",
    pathTint: "#5a4a38",
    grass: "#1a2820",
    path: "#5a4a38",
    waypoints: [
      { c: 0.2, r: 1.5 },
      { c: 3, r: 1.5 },
      { c: 3, r: 9 },
      { c: 8, r: 9 },
      { c: 8, r: 1.5 },
      { c: 14, r: 1.5 },
      { c: 14, r: 8 },
      { c: 17.4, r: 8 },
    ],
    blocked: ["0,0", "17,0", "5,3", "5,4", "11,5", "11,6", "16,3", "1,6"],
    water: [...rect(0, 5, 2, 5), ...rect(4, 5, 7, 5), ...rect(9, 4, 13, 4), ...rect(15, 5, 17, 5)],
    lava: [],
    hazards: [],
    tier: 8,
    waves: CASTLE_WAVES,
  }),
  L({
    id: "moat",
    name: "Outer Moat",
    blurb: "Water on three sides. The bailey waits beyond the last bend.",
    tile: "castle",
    decor: "stone",
    pathTint: "#6a6058",
    grass: "#32302c",
    path: "#6a6058",
    waypoints: [
      { c: 0.2, r: 5 },
      { c: 3, r: 5 },
      { c: 3, r: 1.5 },
      { c: 15, r: 1.5 },
      { c: 15, r: 9 },
      { c: 6, r: 9 },
      { c: 6, r: 5 },
      { c: 17.4, r: 5 },
    ],
    blocked: [...rect(0, 0, 17, 0), "8,4", "9,4", "8,6", "9,6", "12,3", "12,7"],
    water: [...rect(1, 3, 2, 7), ...rect(16, 2, 16, 8), ...rect(4, 7, 14, 7)],
    lava: [],
    hazards: [{ kind: "fountain", c: 9, r: 5, radius: 0.85 }],
    tier: 9,
    waves: CASTLE_WAVES,
  }),
  L({
    id: "pass",
    name: "Goat Pass",
    blurb: "A mountain switchback. Little room to plant, lots of sky to miss.",
    tile: "dunes",
    decor: "rock",
    pathTint: "#7a6848",
    grass: "#4a4034",
    path: "#7a6848",
    waypoints: [
      { c: 0.2, r: 10 },
      { c: 2, r: 10 },
      { c: 2, r: 7 },
      { c: 6, r: 7 },
      { c: 6, r: 3 },
      { c: 11, r: 3 },
      { c: 11, r: 8 },
      { c: 16, r: 8 },
      { c: 16, r: 2 },
      { c: 17.4, r: 2 },
    ],
    blocked: ["0,0", "1,0", "4,1", "4,2", "8,5", "8,6", "13,1", "13,2", "17,10"],
    water: [],
    lava: [],
    hazards: [],
    tier: 10,
    waves: DUNE_WAVES,
  }),
  L({
    id: "oasis",
    name: "Mirage Oasis",
    blurb: "Sand that walks. A pool in the middle, traps on the rim.",
    tile: "dunes",
    decor: "dune",
    pathTint: "#b08958",
    grass: "#c4a06a",
    path: "#b08958",
    waypoints: [
      { c: 0.2, r: 3 },
      { c: 5, r: 3 },
      { c: 5, r: 8 },
      { c: 10, r: 8 },
      { c: 10, r: 2 },
      { c: 15, r: 2 },
      { c: 15, r: 9 },
      { c: 17.4, r: 9 },
    ],
    blocked: ["0,0", "17,0", "0,10", "17,10", "7,4", "8,4", "12,5"],
    water: ["7,5", "8,5", "9,5", "8,6"],
    lava: [],
    hazards: [
      { kind: "sand", c: 3, r: 6, ampC: 1.6, ampR: 1.2, radius: 1.15, period: 4.8 },
      { kind: "sand", c: 12.5, r: 6.5, ampC: 1.4, ampR: 1.6, radius: 1.2, period: 5.2 },
    ],
    tier: 11,
    waves: DUNE_WAVES,
  }),
  L({
    id: "ruins",
    name: "Broken Keep",
    blurb: "Fallen walls. The path threads the rubble like a needle.",
    tile: "castle",
    decor: "stone",
    pathTint: "#5a5248",
    grass: "#2c2a26",
    path: "#5a5248",
    waypoints: [
      { c: 0.2, r: 8 },
      { c: 4, r: 8 },
      { c: 4, r: 2 },
      { c: 8, r: 2 },
      { c: 8, r: 9 },
      { c: 12, r: 9 },
      { c: 12, r: 3 },
      { c: 16, r: 3 },
      { c: 16, r: 8 },
      { c: 17.4, r: 8 },
    ],
    blocked: [...rect(0, 0, 17, 0), "2,4", "2,5", "6,5", "6,6", "10,5", "10,6", "14,5", "14,6"],
    water: ["1,3", "16,5"],
    lava: [],
    hazards: [],
    tier: 12,
    waves: MAZE_WAVES,
  }),
  L({
    id: "catacombs",
    name: "Catacombs",
    blurb: "Tight coils underground. Every corner is an ambush.",
    tile: "castle",
    decor: "stone",
    pathTint: "#4a4038",
    grass: "#1c1814",
    path: "#4a4038",
    waypoints: [
      { c: 0.2, r: 1.5 },
      { c: 16, r: 1.5 },
      { c: 16, r: 4 },
      { c: 2, r: 4 },
      { c: 2, r: 7 },
      { c: 16, r: 7 },
      { c: 16, r: 9.5 },
      { c: 0.2, r: 9.5 },
      { c: 0.2, r: 10 },
      { c: 17.4, r: 10 },
    ],
    blocked: ["8,2", "8,5", "8,8", "4,5", "12,5", "5,2", "13,8"],
    water: [],
    lava: [],
    hazards: [],
    tier: 13,
    waves: CASTLE_WAVES,
  }),
  L({
    id: "ember",
    name: "Ember Spiral",
    blurb: "Lava coils with the path. Heat never sleeps.",
    tile: "magma",
    decor: "rock",
    pathTint: "#5a3028",
    grass: "#160e0c",
    path: "#5a3028",
    waypoints: [
      { c: 0.2, r: 2 },
      { c: 14, r: 2 },
      { c: 14, r: 5 },
      { c: 3, r: 5 },
      { c: 3, r: 8 },
      { c: 16, r: 8 },
      { c: 16, r: 4 },
      { c: 17.4, r: 4 },
    ],
    blocked: ["0,0", "17,0", "7,3", "8,6", "11,6", "1,9"],
    water: [],
    lava: [...rect(0, 6, 2, 7), ...rect(5, 3, 6, 4), ...rect(9, 6, 10, 7), ...rect(15, 6, 17, 6)],
    hazards: [
      { kind: "lava", c: 6, r: 3.5, radius: 1.1 },
      { kind: "lava", c: 10, r: 6.5, radius: 1.05 },
    ],
    tier: 14,
    waves: MAGMA_WAVES,
  }),
  L({
    id: "frost",
    name: "Frost Hollow",
    blurb: "Ice pines and a black stream. Slow feet, hard shots.",
    tile: "forest",
    decor: "snow",
    pathTint: "#6a7a88",
    grass: "#1c2830",
    path: "#6a7a88",
    waypoints: [
      { c: 0.2, r: 8 },
      { c: 5, r: 8 },
      { c: 5, r: 2 },
      { c: 10, r: 2 },
      { c: 10, r: 9 },
      { c: 15, r: 9 },
      { c: 15, r: 3 },
      { c: 17.4, r: 3 },
    ],
    blocked: ["0,0", "1,0", "16,0", "17,0", "2,4", "3,4", "7,5", "8,5", "12,4", "13,5"],
    water: ["7,6", "8,6", "9,6", "9,7"],
    lava: [],
    hazards: [],
    tier: 15,
    waves: MAGMA_WAVES,
  }),
  L({
    id: "cliffs",
    name: "Storm Cliffs",
    blurb: "A long drop on both sides. One path, no shortcuts.",
    tile: "dunes",
    decor: "rock",
    pathTint: "#5a5048",
    grass: "#2a2420",
    path: "#5a5048",
    waypoints: [
      { c: 0.2, r: 9 },
      { c: 3, r: 9 },
      { c: 3, r: 1.5 },
      { c: 7, r: 1.5 },
      { c: 7, r: 9 },
      { c: 11, r: 9 },
      { c: 11, r: 1.5 },
      { c: 15, r: 1.5 },
      { c: 15, r: 8 },
      { c: 17.4, r: 8 },
    ],
    blocked: ["0,0", "17,0", "5,4", "5,5", "9,4", "9,5", "13,5", "13,6"],
    water: [],
    lava: [],
    hazards: [],
    tier: 16,
    waves: MAGMA_WAVES,
  }),
  L({
    id: "bazaar",
    name: "Night Bazaar",
    blurb: "Stalls and hedges make a maze. Gold is loud here.",
    tile: "forest",
    decor: "hedge",
    pathTint: "#6a5038",
    grass: "#1a2018",
    path: "#6a5038",
    waypoints: [
      { c: 0.2, r: 2 },
      { c: 2, r: 2 },
      { c: 2, r: 9 },
      { c: 5, r: 9 },
      { c: 5, r: 2 },
      { c: 9, r: 2 },
      { c: 9, r: 9 },
      { c: 13, r: 9 },
      { c: 13, r: 2 },
      { c: 17.4, r: 2 },
    ],
    blocked: [
      ...rect(0, 0, 17, 0),
      ...rect(0, 10, 17, 10),
      "3,4",
      "3,5",
      "3,6",
      "7,4",
      "7,5",
      "7,6",
      "11,4",
      "11,5",
      "11,6",
      "15,5",
      "15,6",
    ],
    water: [],
    lava: [],
    hazards: [],
    tier: 17,
    waves: MAGMA_WAVES,
  }),
  L({
    id: "warroad",
    name: "War Road",
    blurb: "The last march before home. Every turn is heavier.",
    tile: "castle",
    decor: "stone",
    pathTint: "#5a4038",
    grass: "#241c18",
    path: "#5a4038",
    waypoints: [
      { c: 0.2, r: 1.5 },
      { c: 6, r: 1.5 },
      { c: 6, r: 5 },
      { c: 1.5, r: 5 },
      { c: 1.5, r: 9 },
      { c: 10, r: 9 },
      { c: 10, r: 3 },
      { c: 15, r: 3 },
      { c: 15, r: 9 },
      { c: 17.4, r: 9 },
    ],
    blocked: ["0,0", "17,0", "3,3", "4,3", "8,6", "8,7", "12,6", "13,6", "16,5"],
    water: ["8,1"],
    lava: ["12,8", "13,8"],
    hazards: [{ kind: "lava", c: 13, r: 8, radius: 0.9 }],
    tier: 18,
    waves: MAGMA_WAVES,
  }),
  L({
    id: "village",
    name: "The Village",
    blurb: "Home. Hold the gate. If they reach the cottages, the round is lost.",
    tile: "garden",
    decor: "village",
    pathTint: "#8a6a48",
    grass: "#243326",
    path: "#8a6a48",
    waypoints: [
      { c: 0.2, r: 6 },
      { c: 3, r: 6 },
      { c: 3, r: 1.5 },
      { c: 8, r: 1.5 },
      { c: 8, r: 9 },
      { c: 4, r: 9 },
      { c: 4, r: 4 },
      { c: 13, r: 4 },
      { c: 13, r: 9 },
      { c: 17.4, r: 9 },
    ],
    blocked: ["0,0", "1,0", "16,0", "17,0", "0,10", "17,10", "6,6", "7,6", "10,6", "11,6", "15,5"],
    water: ["6,3", "7,3"],
    lava: [],
    hazards: [{ kind: "fountain", c: 6.5, r: 6.5, radius: 0.8 }],
    tier: 19,
    waves: MAGMA_WAVES,
  }),
];

export const MAX_WAVES = WAVES_PER_LEVEL;
export const WAYPOINTS = LEVELS[0]!.waypoints;

export function cellCenter(c: number, r: number) {
  return { x: (c + 0.5) * CELL, y: (r + 0.5) * CELL };
}

export function levelAdvanceGold(levelIndex: number) {
  return 55 + levelIndex * 28;
}
