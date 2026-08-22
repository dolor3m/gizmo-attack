import {
  CELL,
  COLS,
  ROWS,
  WORLD_W,
  WORLD_H,
  START_GOLD,
  START_LIVES,
  WAVES_PER_LEVEL,
  SELL_RATE,
  DESTROY_RATE,
  ENEMIES,
  TOWERS,
  TOWER_ORDER,
  ENEMY_IDS,
  LEVELS,
  towerAtkCost,
  towerDefCost,
  towerRngCost,
  towerRateCost,
  towerRepairCost,
  ATK_DMG_MULT,
  DEF_HP_MULT,
  RNG_MULT,
  RATE_MULT,
  ATK_COLOR,
  cellCenter,
  levelAdvanceGold,
  type EnemyId,
  type TowerId,
  type LevelDef,
  type AtkKind,
} from "./config";
import { AudioBus } from "./audio";

const SAVE_KEY = "gizmo-attack-save-v1";
const SAVE_VER = 1;

type SaveBlob = {
  v: number;
  phase: Phase;
  paused: boolean;
  gold: number;
  lives: number;
  wave: number;
  levelIndex: number;
  speed: 1 | 2;
  kills: number;
  leaks: number;
  nid: number;
  time: number;
  spawning: boolean;
  spawners: { type: EnemyId; left: number; cd: number; interval: number }[];
  occ: string[];
  towers: Tower[];
  enemies: Enemy[];
};

function readSave(): SaveBlob | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveBlob;
    if (!data || data.v !== SAVE_VER) return null;
    if (typeof data.gold !== "number" || typeof data.levelIndex !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export type Phase = "title" | "build" | "combat" | "paused" | "defeat" | "victory" | "advance";

export type Hud = {
  phase: Phase;
  gold: number;
  lives: number;
  wave: number;
  waves: number;
  remaining: number;
  shop: TowerId | null;
  selectedId: number | null;
  selected: {
    id: number;
    type: TowerId;
    name: string;
    dmgLv: number;
    defLv: number;
    rngLv: number;
    rateLv: number;
    dmgCost: number | null;
    defCost: number | null;
    rngCost: number | null;
    rateCost: number | null;
    repairCost: number | null;
    repairsUsed: number;
    sell: number;
    hp: number;
    maxHp: number;
  } | null;
  speed: 1 | 2;
  kills: number;
  leaks: number;
  canStart: boolean;
  level: number;
  levels: number;
  levelName: string;
  nextName: string | null;
  ready: boolean;
  loadProgress: number;
  hasSave: boolean;
};

type Enemy = {
  id: number;
  type: EnemyId;
  x: number;
  y: number;
  wp: number;
  hp: number;
  maxHp: number;
  speed: number;
  gold: number;
  scale: number;
  armor: number;
  alive: boolean;
  progress: number;
  slowUntil: number;
  flash: number;
  death: number;
  bob: number;
  atkCd: number;
  face: number;
  burn: number;
};

type Tower = {
  id: number;
  type: TowerId;
  col: number;
  row: number;
  x: number;
  y: number;
  cd: number;
  dmgLv: number;
  defLv: number;
  rngLv: number;
  rateLv: number;
  repairsUsed: number;
  invested: number;
  angle: number;
  hp: number;
  maxHp: number;
  flash: number;
  hexRate: number;
  hexRange: number;
  hexVuln: number;
  hexAtkUntil: number;
};

type Shot = {
  team: "ally" | "foe";
  kind: "homing" | "arc" | "bolt";
  x: number;
  y: number;
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  t: number;
  dur: number;
  targetId: number;
  towerId: number;
  dmg: number;
  splash: number;
  color: string;
  alive: boolean;
};

type Beam = { x1: number; y1: number; x2: number; y2: number; life: number; color: string };
type Puff = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string };
type Floater = { x: number; y: number; text: string; life: number; color: string };
type AttackFx = {
  kind: "spell" | "crack" | "swipe" | "quake" | "slash" | "mist" | "boom" | "yarn";
  x: number;
  y: number;
  x2: number;
  y2: number;
  r: number;
  ang: number;
  life: number;
  max: number;
};
type Hazard = {
  kind: "sand" | "fountain" | "lava";
  ox: number;
  oy: number;
  x: number;
  y: number;
  ampC: number;
  ampR: number;
  radius: number;
  period: number;
};

type Assets = {
  enemies: Partial<Record<EnemyId, HTMLImageElement>>;
  towers: Partial<Record<TowerId, HTMLImageElement>>;
  tiles: Record<string, HTMLImageElement | null>;
  pad: HTMLImageElement | null;
  yarn: HTMLImageElement[];
  hairball: HTMLImageElement[];
  gate: HTMLImageElement | null;
  village: HTMLImageElement | null;
};

function assetBases() {
  const extra =
    typeof window !== "undefined"
      ? (window as unknown as { __GIZMO_ASSETS?: string }).__GIZMO_ASSETS
      : undefined;
  return [...new Set([extra, "./gizmo-attack", ".", "/gizmo-attack"].filter(Boolean) as string[])];
}

function assetUrl(path: string, base?: string) {
  const root = (base || assetBases()[0] || "/gizmo-attack").replace(/\/$/, "");
  return `${root}/${path.replace(/^\//, "")}`;
}

function tryImg(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 ? img : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadImg(path: string) {
  const clean = path.replace(/^\//, "");
  for (const base of assetBases()) {
    const img = await tryImg(assetUrl(clean, base));
    if (img) return img;
  }
  return null;
}

function hypot2(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function rasterPath(waypoints: { c: number; r: number }[]) {
  const set = new Set<string>();
  const pts = waypoints.map((w) => cellCenter(w.c, w.r));
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const steps = Math.max(8, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      if (c >= 0 && r >= 0 && c < COLS && r < ROWS) set.add(`${c},${r}`);
    }
  }
  return { set, pts };
}

export class GizmoEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHud: (h: Hud) => void;
  private audio = new AudioBus();
  private raf = 0;
  private acc = 0;
  private last = 0;
  private alive = true;
  private dpr = 1;
  private cssW = 1;
  private cssH = 1;
  private scale = 1;
  private offX = 0;
  private offY = 0;

  private phase: Phase = "title";
  private prePause: Phase = "build";
  private gold = START_GOLD;
  private lives = START_LIVES;
  private wave = 1;
  private levelIndex = 0;
  private speed: 1 | 2 = 1;
  private kills = 0;
  private leaks = 0;
  private shop: TowerId | null = null;
  private selectedId: number | null = null;
  private hoverC = -1;
  private hoverR = -1;
  private nid = 1;
  private time = 0;
  private shake = 0;
  private spawners: { type: EnemyId; left: number; cd: number; interval: number }[] = [];
  private spawning = false;
  private hudAcc = 0;
  private ready = false;
  private loadProgress = 0;
  private looping = false;
  private saveTimer = 0;

  private level: LevelDef = LEVELS[0]!;
  private path = rasterPath(LEVELS[0]!.waypoints);
  private blocked = new Set<string>(LEVELS[0]!.blocked);
  private water = new Set<string>(LEVELS[0]!.water);
  private lava = new Set<string>(LEVELS[0]!.lava);
  private hazards: Hazard[] = [];
  private occ = new Set<string>();
  private enemies: Enemy[] = [];
  private towers: Tower[] = [];
  private shots: Shot[] = [];
  private beams: Beam[] = [];
  private puffs: Puff[] = [];
  private floats: Floater[] = [];
  private fx: AttackFx[] = [];
  private assets: Assets = {
    enemies: {},
    towers: {},
    tiles: {},
    pad: null,
    yarn: [],
    hairball: [],
    gate: null,
    village: null,
  };

  constructor(canvas: HTMLCanvasElement, onHud: (h: Hud) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    this.ctx = ctx;
    this.onHud = onHud;
    this.bind();
    this.applyLevel(0);
    void this.loadAssets();
    this.resize();
    this.emit();
    if (typeof window !== "undefined") {
      (window as unknown as { __gizmo?: GizmoEngine }).__gizmo = this;
    }
  }

  start() {
    if (this.looping) return;
    this.looping = true;
    this.alive = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.alive) return;
      this.raf = requestAnimationFrame(loop);
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 0.1) dt = 0.1;
      this.acc += dt;
      const step = 1 / 60;
      let guard = 0;
      while (this.acc >= step && guard++ < 5) {
        try {
          this.tick(step * (this.phase === "combat" ? this.speed : 1));
        } catch (err) {
          console.error("gizmo tick", err);
          this.acc = 0;
          break;
        }
        this.acc -= step;
      }
      try {
        this.draw();
      } catch (err) {
        console.error("gizmo draw", err);
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    this.alive = false;
    this.looping = false;
    cancelAnimationFrame(this.raf);
    this.unbind();
  }

  play() {
    this.audio.unlock();
    if (!this.ready) return;
    if (this.phase !== "title") return;
    if (readSave()) {
      this.continueRun();
      return;
    }
    this.phase = "build";
    this.persist();
    this.emit();
  }

  continueRun() {
    this.audio.unlock();
    if (!this.ready) return;
    if (!this.restore()) {
      this.phase = "build";
    }
    this.emit();
  }

  newGame() {
    this.audio.unlock();
    clearSave();
    this.restart();
  }

  attachCanvas(canvas: HTMLCanvasElement, onHud: (h: Hud) => void) {
    this.unbind();
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    this.ctx = ctx;
    this.onHud = onHud;
    this.alive = true;
    this.bind();
    this.resize();
    this.start();
    this.emit();
  }

  isLive() {
    return this.alive;
  }

  restart() {
    this.audio.unlock();
    this.gold = START_GOLD;
    this.lives = START_LIVES;
    this.wave = 1;
    this.speed = 1;
    this.kills = 0;
    this.leaks = 0;
    this.shop = null;
    this.selectedId = null;
    this.nid = 1;
    this.time = 0;
    this.shake = 0;
    this.spawners = [];
    this.spawning = false;
    this.occ.clear();
    this.enemies = [];
    this.towers = [];
    this.shots = [];
    this.beams = [];
    this.puffs = [];
    this.fx = [];
    this.floats = [];
    this.applyLevel(0);
    this.phase = "build";
    this.persist();
    this.emit();
  }

  setShop(id: TowerId | null) {
    this.audio.unlock();
    if (id && this.gold < TOWERS[id].cost) {
      this.audio.deny();
      return;
    }
    this.shop = this.shop === id ? null : id;
    this.selectedId = null;
    this.emit();
  }

  startWave() {
    this.audio.unlock();
    if (this.phase !== "build") return;
    const def = this.level.waves[this.wave - 1];
    if (!def) return;
    const m = this.mercy();
    this.spawners = def.entries.map((e) => ({
      type: e.type,
      left: Math.max(1, Math.round(e.count * m)),
      cd: e.delay ?? 0,
      interval: Math.round(e.interval * (2 - m) * 100) / 100,
    }));
    this.spawning = true;
    this.phase = "combat";
    this.shop = null;
    if (m < 0.94) {
      this.floats.push({
        x: WORLD_W / 2,
        y: 42,
        text: "the path thins — rebuild",
        life: 1.5,
        color: "#7d9a78",
      });
    }
    this.emit();
  }

  private boardStrength() {
    const hull = this.towers.reduce((n, t) => n + t.invested * (Math.max(0, t.hp) / Math.max(1, t.maxHp)), 0);
    return this.towers.length * 55 + this.gold * 0.45 + hull * 0.3;
  }

  /** 1 = full wave. Drops toward 0.62 when towers/gold are thin so a wipe is recoverable. */
  private mercy() {
    const need = 190 + this.levelIndex * 32 + (this.wave - 1) * 10;
    const have = this.boardStrength();
    if (have >= need) return 1;
    const ratio = Math.max(0, have / need);
    return Math.max(0.62, 0.62 + ratio * 0.38);
  }

  togglePause() {
    if (this.phase === "paused") {
      this.phase = this.prePause;
    } else if (this.phase === "build" || this.phase === "combat") {
      this.prePause = this.phase;
      this.phase = "paused";
    }
    this.emit();
  }

  setSpeed(s: 1 | 2) {
    this.speed = s;
    this.emit();
  }

  advance() {
    this.audio.unlock();
    if (this.phase !== "advance") return;
    const next = this.levelIndex + 1;
    if (next >= LEVELS.length) {
      this.phase = "victory";
      this.emit();
      return;
    }
    const bonus = levelAdvanceGold(this.levelIndex);
    const scrap = this.towers.reduce((n, t) => {
      const hpRatio = Math.max(0, Math.min(1, t.hp / Math.max(1, t.maxHp)));
      return n + Math.floor(t.invested * 0.33 * hpRatio);
    }, 0);
    this.gold += bonus + scrap;
    const floor = 260 + next * 30;
    if (this.gold < floor) this.gold = floor;
    this.lives = Math.min(START_LIVES + 6, this.lives + 3);
    this.wave = 1;
    this.shop = null;
    this.selectedId = null;
    this.occ.clear();
    this.towers = [];
    this.enemies = [];
    this.shots = [];
    this.beams = [];
    this.puffs = [];
    this.fx = [];
    this.floats = [];
    this.applyLevel(next);
    this.phase = "build";
    this.floats.push({
      x: WORLD_W / 2,
      y: 48,
      text:
        scrap > 0
          ? `${this.level.name} · purse +${bonus}g · scrap +${scrap}g`
          : `${this.level.name} · purse +${bonus}g`,
      life: 1.8,
      color: "#e6d3b3",
    });
    this.emit();
  }

  upgradeDamage() {
    const t = this.selected();
    if (!t || t.dmgLv >= 1) return;
    const cost = towerAtkCost(t.type);
    if (this.gold < cost) {
      this.audio.deny();
      return;
    }
    this.gold -= cost;
    t.dmgLv = 1;
    t.invested += cost;
    this.audio.place();
    this.emit();
  }

  upgradeDefense() {
    const t = this.selected();
    if (!t || t.defLv >= 1) return;
    const cost = towerDefCost(t.type);
    if (this.gold < cost) {
      this.audio.deny();
      return;
    }
    this.gold -= cost;
    t.defLv = 1;
    t.invested += cost;
    const bonus = Math.round(TOWERS[t.type].hp * (DEF_HP_MULT - 1));
    t.maxHp += bonus;
    t.hp = Math.min(t.maxHp, t.hp + bonus);
    this.audio.place();
    this.emit();
  }

  upgradeRange() {
    const t = this.selected();
    if (!t || t.rngLv >= 1) return;
    const cost = towerRngCost(t.type);
    if (this.gold < cost) {
      this.audio.deny();
      return;
    }
    this.gold -= cost;
    t.rngLv = 1;
    t.invested += cost;
    this.audio.place();
    this.emit();
  }

  upgradeRate() {
    const t = this.selected();
    if (!t || t.rateLv >= 1) return;
    const cost = towerRateCost(t.type);
    if (this.gold < cost) {
      this.audio.deny();
      return;
    }
    this.gold -= cost;
    t.rateLv = 1;
    t.invested += cost;
    this.audio.place();
    this.emit();
  }

  repairSelected() {
    const t = this.selected();
    if (!t) return;
    const cost = towerRepairCost(t.type, t.hp, t.maxHp, t.repairsUsed);
    if (cost === null || cost <= 0) return;
    if (this.gold < cost) {
      this.audio.deny();
      return;
    }
    this.gold -= cost;
    t.hp = t.maxHp;
    t.repairsUsed++;
    this.audio.place();
    this.floats.push({
      x: t.x,
      y: t.y - 22,
      text: t.repairsUsed >= 2 ? "last patch" : "repaired",
      life: 0.7,
      color: "#7d9a78",
    });
    this.emit();
  }

  sellSelected() {
    const t = this.selected();
    if (!t) return;
    const refund = Math.floor(t.invested * SELL_RATE);
    this.gold += refund;
    this.occ.delete(`${t.col},${t.row}`);
    this.towers = this.towers.filter((x) => x.id !== t.id);
    this.selectedId = null;
    this.audio.hit();
    this.emit();
  }

  cancel() {
    this.shop = null;
    this.selectedId = null;
    this.emit();
  }

  /** QA helper: jump to a land with extra gold. */
  debugLevel(i: number) {
    this.restart();
    this.gold = 420;
    this.applyLevel(Math.max(0, Math.min(LEVELS.length - 1, i)));
    this.phase = "build";
    this.emit();
  }

  private selected() {
    return this.towers.find((t) => t.id === this.selectedId) ?? null;
  }

  private applyLevel(i: number) {
    this.levelIndex = i;
    this.level = LEVELS[i]!;
    this.path = rasterPath(this.level.waypoints);
    this.blocked = new Set(this.level.blocked.filter((k) => !this.path.set.has(k)));
    this.water = new Set(this.level.water.filter((k) => !this.path.set.has(k)));
    this.lava = new Set(this.level.lava.filter((k) => !this.path.set.has(k)));
    this.hazards = this.level.hazards.map((h) => {
      const p = cellCenter(h.c, h.r);
      return {
        kind: h.kind,
        ox: p.x,
        oy: p.y,
        x: p.x,
        y: p.y,
        ampC: (h.ampC ?? 0) * CELL,
        ampR: (h.ampR ?? 0) * CELL,
        radius: h.radius * CELL,
        period: h.period ?? 4,
      };
    });
  }

  private bind() {
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerleave", this.onLeave);
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pagehide", this.onPageHide);
    document.addEventListener("visibilitychange", this.onVisibility);
  }
  private unbind() {
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerleave", this.onLeave);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pagehide", this.onPageHide);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  private onResize = () => this.resize();
  private onPageHide = () => this.persist(true);
  private onVisibility = () => {
    if (document.visibilityState === "hidden") this.persist(true);
  };
  private onLeave = () => {
    this.hoverC = -1;
    this.hoverR = -1;
  };

  private worldFromEvent(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offX) / this.scale;
    const y = (e.clientY - rect.top - this.offY) / this.scale;
    return { x, y };
  }

  private onMove = (e: PointerEvent) => {
    const { x, y } = this.worldFromEvent(e);
    this.hoverC = Math.floor(x / CELL);
    this.hoverR = Math.floor(y / CELL);
  };

  private onDown = (e: PointerEvent) => {
    this.audio.unlock();
    if (this.phase === "title") {
      this.play();
      return;
    }
    if (this.phase === "defeat" || this.phase === "victory" || this.phase === "paused" || this.phase === "advance")
      return;
    const { x, y } = this.worldFromEvent(e);
    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);
    const hit = this.towers.find((t) => t.col === c && t.row === r);
    if (this.shop) {
      this.tryPlace(c, r, this.shop);
      return;
    }
    if (hit) {
      this.selectedId = hit.id;
      this.emit();
      return;
    }
    this.selectedId = null;
    this.emit();
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") this.cancel();
    if (e.key === "p" || e.key === "P") this.togglePause();
    if (e.key === " ") {
      e.preventDefault();
      if (this.phase === "advance") this.advance();
      else this.startWave();
    }
    if (e.key === "f" || e.key === "F") this.setSpeed(this.speed === 1 ? 2 : 1);
    const idx = ["1", "2", "3", "4", "5"].indexOf(e.key);
    if (idx >= 0) this.setShop(TOWER_ORDER[idx]!);
  };

  private canBuild(c: number, r: number) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return false;
    const k = `${c},${r}`;
    if (this.path.set.has(k) || this.occ.has(k) || this.blocked.has(k)) return false;
    if (this.water.has(k) || this.lava.has(k)) return false;
    return true;
  }

  private tryPlace(c: number, r: number, type: TowerId) {
    const def = TOWERS[type];
    if (!this.canBuild(c, r)) {
      this.audio.deny();
      return;
    }
    if (this.gold < def.cost) {
      this.audio.deny();
      return;
    }
    this.gold -= def.cost;
    const { x, y } = cellCenter(c, r);
    this.towers.push({
      id: this.nid++,
      type,
      col: c,
      row: r,
      x,
      y,
      cd: 0.15,
      dmgLv: 0,
      defLv: 0,
      rngLv: 0,
      rateLv: 0,
      repairsUsed: 0,
      invested: def.cost,
      angle: 0,
      hp: def.hp,
      maxHp: def.hp,
      flash: 0,
      hexRate: 1,
      hexRange: 1,
      hexVuln: 0,
      hexAtkUntil: 0,
    });
    this.occ.add(`${c},${r}`);
    this.audio.place();
    this.selectedId = this.nid - 1;
    this.shop = null;
    this.emit();
  }

  private async loadAssets() {
    const tids: TowerId[] = ["scratch", "yarn", "laser", "mortar", "catnip"];
    const tileNames = ["garden", "forest", "castle", "dunes", "magma", "path", "grass", "pad", "water", "lava"];
    const jobs: Promise<HTMLImageElement | null>[] = [
      loadImg("tiles/pad.jpg"),
      ...ENEMY_IDS.map((id) => loadImg(`enemies/${id}.png?v=11`)),
      ...tids.map((id) => loadImg(`towers/${id}.png`)),
      ...[0, 1, 2, 3].map((i) => loadImg(`fx/yarn-${i}.png`)),
      ...[0, 1, 2, 3].map((i) => loadImg(`fx/hairball-${i}.png`)),
      ...tileNames.map((n) => loadImg(`tiles/${n}.jpg`)),
      loadImg("fx/gate.png"),
      loadImg("fx/village.png"),
    ];
    const total = jobs.length;
    let done = 0;
    const tracked = jobs.map((p) =>
      p.then((img) => {
        done += 1;
        if (this.alive) {
          this.loadProgress = done / total;
          this.emit();
        }
        return img;
      }),
    );
    const [pad, ...rest] = await Promise.all(tracked);
    this.assets.pad = pad;
    ENEMY_IDS.forEach((id, i) => {
      const img = rest[i];
      if (img) this.assets.enemies[id] = img;
    });
    tids.forEach((id, i) => {
      const img = rest[ENEMY_IDS.length + i];
      if (img) this.assets.towers[id] = img;
    });
    const fx0 = ENEMY_IDS.length + tids.length;
    this.assets.yarn = rest.slice(fx0, fx0 + 4).filter(Boolean) as HTMLImageElement[];
    this.assets.hairball = rest.slice(fx0 + 4, fx0 + 8).filter(Boolean) as HTMLImageElement[];
    tileNames.forEach((n, i) => {
      this.assets.tiles[n] = rest[fx0 + 8 + i] ?? null;
    });
    this.assets.gate = rest[fx0 + 8 + tileNames.length] ?? null;
    this.assets.village = rest[fx0 + 8 + tileNames.length + 1] ?? null;
    if (!this.alive) return;
    this.ready = true;
    this.loadProgress = 1;
    this.emit();
  }

  resize() {
    const w = Math.max(1, this.canvas.clientWidth || this.canvas.parentElement?.clientWidth || 1);
    const h = Math.max(1, this.canvas.clientHeight || this.canvas.parentElement?.clientHeight || 1);
    this.dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    this.cssW = w;
    this.cssH = h;
    const bw = Math.floor(w * this.dpr);
    const bh = Math.floor(h * this.dpr);
    if (this.canvas.width !== bw) this.canvas.width = bw;
    if (this.canvas.height !== bh) this.canvas.height = bh;
    this.scale = Math.min(w / WORLD_W, h / WORLD_H);
    this.offX = (w - WORLD_W * this.scale) / 2;
    this.offY = (h - WORLD_H * this.scale) / 2;
  }

  private tick(dt: number) {
    if (this.phase === "title" || this.phase === "paused" || this.phase === "defeat" || this.phase === "victory" || this.phase === "advance") {
      this.time += dt;
      this.shake *= 0.88;
      return;
    }
    this.time += dt;
    this.shake *= 0.88;
    this.hudAcc += dt;
    if (this.hudAcc > 0.2) {
      this.hudAcc = 0;
      this.emit();
    }

    this.tickHazards(dt);
    if (this.phase === "combat") {
      this.tickSpawn(dt);
      this.tickEnemies(dt);
      this.tickTowers(dt);
      this.tickShots(dt);
      this.tickFx(dt);
      this.checkWaveEnd();
    }
  }

  private tickSpawn(dt: number) {
    if (!this.spawning) return;
    let any = false;
    for (const s of this.spawners) {
      if (s.left <= 0) continue;
      any = true;
      s.cd -= dt;
      if (s.cd <= 0) {
        this.spawn(s.type);
        s.left--;
        s.cd = s.interval;
      }
    }
    if (!any) this.spawning = false;
  }

  private spawn(type: EnemyId) {
    const def = ENEMIES[type];
    const p = this.path.pts[0];
    if (!def || !p) return;
    const L = this.level;
    const n = this.path.pts[1] ?? p;
    const ndx = n.x - p.x;
    this.enemies.push({
      id: this.nid++,
      type,
      x: p.x,
      y: p.y,
      wp: 1,
      hp: def.hp * L.hpMult,
      maxHp: def.hp * L.hpMult,
      speed: def.speed * L.speedMult,
      gold: Math.round(def.gold * L.goldMult),
      scale: def.scale,
      armor: def.armor,
      alive: true,
      progress: 0,
      slowUntil: 0,
      flash: 0,
      death: 0,
      bob: Math.random() * Math.PI * 2,
      atkCd: 0.4 + Math.random() * 0.5,
      face: (ndx < 0 ? 1 : -1) * def.faceNative,
      burn: 0,
    });
  }

  private tickEnemies(dt: number) {
    const pts = this.path.pts;
    for (const e of this.enemies) {
      e.flash = Math.max(0, e.flash - dt);
      if (!e.alive) {
        e.death = Math.max(0, e.death - dt);
        continue;
      }
      e.bob += dt * 8;
      e.atkCd -= dt;
      if (e.burn > 0) {
        e.burn -= dt;
        e.hp -= 16 * dt * (1 - e.armor);
        if (e.hp <= 0) this.hurt(e, 1, e.x, e.y);
        if (Math.random() < dt * 8) {
          this.puffs.push({
            x: e.x + (Math.random() - 0.5) * 10,
            y: e.y - 18,
            vx: 0,
            vy: -30,
            life: 0.28,
            max: 0.28,
            size: 4,
            color: "#d4785a",
          });
        }
      }
      const cell = `${Math.floor(e.x / CELL)},${Math.floor(e.y / CELL)}`;
      const wet = this.water.has(cell) ? 0.62 : 1;
      const slow = (this.time < e.slowUntil ? 0.5 : 1) * wet;
      if (e.wp >= pts.length) {
        this.leak(e);
        continue;
      }
      const t = pts[e.wp]!;
      const dx = t.x - e.x;
      const dy = t.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const step = e.speed * slow * dt;
      if (d <= step + 1.5) {
        e.x = t.x;
        e.y = t.y;
        e.wp++;
      } else {
        const mx = (dx / d) * step;
        e.x += mx;
        e.y += (dy / d) * step;
        if (Math.abs(dx) >= 4) e.face = (dx < 0 ? 1 : -1) * ENEMIES[e.type].faceNative;
      }
      e.progress = e.wp + (1 - Math.min(1, d / 80));
      if (this.phase === "combat") this.tryEnemyAttack(e);
    }
  }

  private tryEnemyAttack(e: Enemy) {
    if (e.atkCd > 0) return;
    const def = ENEMIES[e.type];
    const range = def.atkRange * CELL;
    const target = this.nearestTower(e.x, e.y, range);
    if (!target) return;
    e.atkCd = 1 / def.atkRate;
    const dmg = def.atkDmg * this.level.atkMult;
    if (e.type === "sorcerer") this.sorcererCast(e, target, dmg, range);
    else if (e.type === "ork") this.orkCrack(e, target, dmg);
    else if (e.type === "tyrant") this.tyrantSwipe(e, target, dmg, range);
    else if (e.type === "warlord") this.warlordQuake(e, dmg, range);
    else this.enemyFire(e, target, dmg, def.atkKind, def.atkSplash * CELL);
  }

  private nearestTower(x: number, y: number, range: number) {
    const r2 = range * range;
    let best: Tower | null = null;
    let bestD = Infinity;
    for (const t of this.towers) {
      const d = hypot2(x, y, t.x, t.y);
      if (d > r2) continue;
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  private pushFx(kind: AttackFx["kind"], x: number, y: number, extra: Partial<AttackFx> = {}) {
    const max = extra.max ?? 0.55;
    this.fx.push({
      kind,
      x,
      y,
      x2: extra.x2 ?? x,
      y2: extra.y2 ?? y,
      r: extra.r ?? CELL,
      ang: extra.ang ?? 0,
      life: max,
      max,
    });
  }

  private sorcererCast(e: Enemy, target: Tower, dmg: number, range: number) {
    this.audio.foeShoot("spell");
    this.pushFx("spell", e.x, e.y, { r: range, max: 0.7 });
    for (const t of [...this.towers]) {
      if (hypot2(e.x, e.y, t.x, t.y) > range * range) continue;
      t.hexRate = Math.max(0.67, (t.hexRate || 1) * 0.92);
      t.hexRange = Math.max(0.67, (t.hexRange || 1) * 0.92);
      this.hurtTower(t, t.id === target.id ? dmg : dmg * 0.22);
      this.floats.push({ x: t.x, y: t.y - 28, text: "hexed", life: 0.55, color: "#b48cff" });
    }
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      this.puffs.push({
        x: e.x + Math.cos(a) * 12,
        y: e.y + Math.sin(a) * 8,
        vx: Math.cos(a) * 70,
        vy: Math.sin(a) * 70,
        life: 0.4,
        max: 0.4,
        size: 5,
        color: i % 2 ? "#8b6cc9" : "#d8c4ff",
      });
    }
  }

  private orkCrack(e: Enemy, target: Tower, dmg: number) {
    this.audio.foeShoot("smash");
    this.pushFx("crack", e.x, e.y, { x2: target.x, y2: target.y, max: 0.65 });
    this.hurtTower(target, dmg);
    for (const t of [...this.towers]) {
      if (distToSeg(t.x, t.y, e.x, e.y, target.x, target.y) > 32) continue;
      t.hexVuln = Math.min(0.4, (t.hexVuln || 0) + 0.08);
      if (t.id !== target.id) this.hurtTower(t, dmg * 0.2);
      this.floats.push({ x: t.x, y: t.y - 26, text: "cracked", life: 0.5, color: "#c4a06a" });
    }
    for (let i = 0; i < 8; i++) {
      const u = i / 7;
      this.puffs.push({
        x: e.x + (target.x - e.x) * u,
        y: e.y + (target.y - e.y) * u,
        vx: (Math.random() - 0.5) * 40,
        vy: -20 - Math.random() * 30,
        life: 0.35,
        max: 0.35,
        size: 6,
        color: "#6a4a2e",
      });
    }
  }

  private tyrantSwipe(e: Enemy, target: Tower, dmg: number, range: number) {
    this.audio.foeShoot("smash");
    const ang = Math.atan2(target.y - e.y, target.x - e.x);
    this.pushFx("swipe", e.x, e.y, { r: range * 0.95, ang, max: 0.48 });
    this.hurtTower(target, dmg);
    if (ENEMIES.tyrant.atkSplash > 0) {
      const splash = ENEMIES.tyrant.atkSplash * CELL;
      for (const t of [...this.towers]) {
        if (t.id === target.id) continue;
        if (hypot2(target.x, target.y, t.x, t.y) <= splash * splash) this.hurtTower(t, dmg * 0.45);
      }
    }
    for (const t of this.towers) {
      if (hypot2(e.x, e.y, t.x, t.y) > range * range) continue;
      const a = Math.atan2(t.y - e.y, t.x - e.x);
      let d = Math.abs(a - ang);
      if (d > Math.PI) d = Math.PI * 2 - d;
      if (d > 1.05) continue;
      t.hexAtkUntil = this.time + 4;
      this.floats.push({ x: t.x, y: t.y - 28, text: "weakened", life: 0.55, color: "#c45c4a" });
    }
  }

  private warlordQuake(e: Enemy, dmg: number, range: number) {
    this.audio.foeShoot("blast");
    this.pushFx("quake", e.x, e.y, { r: range, max: 0.75 });
    this.shake = 12;
    const heavy = dmg * 1.72;
    for (const t of [...this.towers]) {
      if (hypot2(e.x, e.y, t.x, t.y) > range * range) continue;
      this.hurtTower(t, heavy);
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      this.puffs.push({
        x: e.x + Math.cos(a) * range * 0.35,
        y: e.y + Math.sin(a) * range * 0.25,
        vx: Math.cos(a) * 90,
        vy: Math.sin(a) * 50 - 20,
        life: 0.5,
        max: 0.5,
        size: 8,
        color: i % 2 ? "#5a4030" : "#8a6a48",
      });
    }
  }

  private enemyFire(e: Enemy, tower: Tower, dmg: number, kind: AtkKind, splash: number) {
    const color = ATK_COLOR[kind];
    this.audio.foeShoot(kind);
    if (kind === "claw" || kind === "stab" || kind === "smash") {
      this.hurtTower(tower, dmg);
      if (splash > 0) {
        for (const t of this.towers) {
          if (t.id === tower.id) continue;
          if (hypot2(tower.x, tower.y, t.x, t.y) <= splash * splash) this.hurtTower(t, dmg * 0.45);
        }
      }
      this.puffs.push({
        x: tower.x,
        y: tower.y - 10,
        vx: 0,
        vy: -30,
        life: 0.22,
        max: 0.22,
        size: kind === "smash" ? 16 : 8,
        color,
      });
      return;
    }
    const dist = Math.hypot(tower.x - e.x, tower.y - e.y);
    const speed = kind === "arrow" ? 280 : kind === "spear" ? 340 : kind === "bomb" ? 180 : 240;
    const dur = Math.max(0.16, dist / speed);
    this.shots.push({
      team: "foe",
      kind: kind === "bomb" ? "arc" : "bolt",
      x: e.x,
      y: e.y - 10,
      tx: tower.x,
      ty: tower.y - 12,
      sx: e.x,
      sy: e.y - 10,
      t: 0,
      dur,
      targetId: 0,
      towerId: tower.id,
      dmg,
      splash,
      color,
      alive: true,
    });
  }

  private leak(e: Enemy) {
    e.alive = false;
    e.death = 0;
    this.lives = Math.max(0, this.lives - 1);
    this.leaks++;
    this.shake = 10;
    this.audio.leak();
    const refund = Math.max(1, Math.round(e.gold * 0.25));
    this.gold += refund;
    this.floats.push({ x: e.x, y: e.y - 20, text: "-1 life", life: 0.9, color: "#c45c4a" });
    this.floats.push({ x: e.x, y: e.y - 38, text: `+${refund}g`, life: 0.9, color: "#e6d3b3" });
    if (this.lives <= 0) {
      this.phase = "defeat";
      this.audio.lose();
    }
    this.emit();
  }

  private tickTowers(dt: number) {
    for (const t of this.towers) {
      t.cd -= dt;
      t.flash = Math.max(0, t.flash - dt);
      const def = TOWERS[t.type];
      const range = def.range * (t.rngLv ? RNG_MULT : 1) * (t.hexRange || 1) * CELL;
      const target = this.firstInRange(t.x, t.y, range);
      if (target) t.angle = Math.atan2(target.y - t.y, target.x - t.x);
      if (t.cd > 0 || !target) continue;
      const rate = def.rate * (t.rateLv ? RATE_MULT : 1) * (t.hexRate || 1);
      t.cd = 1 / Math.max(0.12, rate);
      const weak = this.time < (t.hexAtkUntil || 0) ? 0.72 : 1;
      const dmg = def.damage * (t.dmgLv ? ATK_DMG_MULT : 1) * weak;
      this.fire(t, target, dmg);
    }
  }

  private firstInRange(x: number, y: number, range: number) {
    const r2 = range * range;
    let best: Enemy | null = null;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (hypot2(x, y, e.x, e.y) > r2) continue;
      if (!best || e.progress > best.progress) best = e;
    }
    return best;
  }

  private fire(t: Tower, target: Enemy, dmg: number) {
    const def = TOWERS[t.type];
    this.audio.shoot(def.kind);
    if (def.kind === "beam") {
      this.hurt(target, dmg, t.x, t.y);
      target.burn = Math.max(target.burn, 1.35);
      this.beams.push({ x1: t.x, y1: t.y - 18, x2: target.x, y2: target.y - 8, life: 0.16, color: "#d4785a" });
      this.beams.push({ x1: t.x + 3, y1: t.y - 16, x2: target.x + 2, y2: target.y - 6, life: 0.1, color: "#f0c4a0" });
      return;
    }
    if (def.kind === "melee") {
      this.hurt(target, dmg, t.x, t.y);
      const ang = Math.atan2(target.y - t.y, target.x - t.x);
      this.pushFx("slash", t.x, t.y, { r: CELL * 1.15, ang, max: 0.22 });
      if (def.splash > 0) {
        const r = def.splash * CELL;
        for (const e of this.enemies) {
          if (!e.alive || e.id === target.id) continue;
          if (hypot2(target.x, target.y, e.x, e.y) <= r * r) this.hurt(e, dmg * 0.4, t.x, t.y);
        }
      }
      this.puffs.push({
        x: target.x,
        y: target.y,
        vx: 0,
        vy: -20,
        life: 0.2,
        max: 0.2,
        size: 10,
        color: "#e6d3b3",
      });
      return;
    }
    if (def.kind === "spray") {
      const r = def.splash * CELL;
      this.pushFx("mist", target.x, target.y, { r: r * 2.1, max: 0.95 });
      this.pushFx("mist", target.x + 10, target.y - 6, { r: r * 1.4, max: 0.8 });
      this.pushFx("mist", target.x - 8, target.y + 8, { r: r * 1.2, max: 0.75 });
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        this.puffs.push({
          x: target.x,
          y: target.y,
          vx: Math.cos(a) * (30 + Math.random() * 40),
          vy: Math.sin(a) * (20 + Math.random() * 28) - 12,
          life: 0.55 + Math.random() * 0.25,
          max: 0.8,
          size: 10 + Math.random() * 10,
          color: i % 3 === 0 ? "#5a9a4a" : i % 3 === 1 ? "#8fbf6a" : "#3d6e32",
        });
      }
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (hypot2(target.x, target.y, e.x, e.y) <= r * r) {
          this.hurt(e, dmg, t.x, t.y);
          e.slowUntil = Math.max(e.slowUntil, this.time + def.slowTime);
        }
      }
      return;
    }
    const dist = Math.hypot(target.x - t.x, target.y - t.y);
    const dur = Math.max(0.18, dist / def.shotSpeed);
    if (def.kind === "homing") {
      this.pushFx("yarn", t.x, t.y - 16, { x2: target.x, y2: target.y - 8, r: 10, max: 0.28 });
    }
    this.shots.push({
      team: "ally",
      kind: def.kind === "arc" ? "arc" : "homing",
      x: t.x,
      y: t.y - 16,
      tx: target.x,
      ty: target.y,
      sx: t.x,
      sy: t.y - 16,
      t: 0,
      dur,
      targetId: target.id,
      towerId: 0,
      dmg,
      splash: def.splash * CELL,
      color: def.kind === "arc" ? "#8a5a3a" : "#d4785a",
      alive: true,
    });
  }

  private tickShots(dt: number) {
    for (const s of this.shots) {
      if (!s.alive) continue;
      if (s.team === "ally" && s.kind === "homing") {
        const tgt = this.enemies.find((e) => e.id === s.targetId && e.alive);
        if (tgt) {
          s.tx = tgt.x;
          s.ty = tgt.y;
        }
      }
      if (s.team === "foe") {
        const tw = this.towers.find((t) => t.id === s.towerId);
        if (tw) {
          s.tx = tw.x;
          s.ty = tw.y - 12;
        }
      }
      s.t += dt / s.dur;
      const u = Math.min(1, s.t);
      s.x = s.sx + (s.tx - s.sx) * u;
      s.y = s.sy + (s.ty - s.sy) * u;
      if (s.kind === "arc") s.y -= Math.sin(u * Math.PI) * 46;
      if (s.team === "ally" && s.kind === "homing" && Math.random() < dt * 22) {
        this.puffs.push({
          x: s.x + (Math.random() - 0.5) * 6,
          y: s.y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 18,
          vy: (Math.random() - 0.5) * 18,
          life: 0.28,
          max: 0.28,
          size: 4,
          color: Math.random() > 0.5 ? "#d4785a" : "#e6d3b3",
        });
      }
      if (u >= 1) {
        s.alive = false;
        this.impact(s);
      }
    }
  }

  private impact(s: Shot) {
    if (s.team === "foe") {
      if (s.splash > 0) {
        for (const t of this.towers) {
          if (hypot2(s.x, s.y, t.x, t.y) <= s.splash * s.splash) this.hurtTower(t, s.dmg);
        }
      } else {
        const tw = this.towers.find((t) => t.id === s.towerId);
        if (tw) this.hurtTower(tw, s.dmg);
      }
      this.puffs.push({
        x: s.x,
        y: s.y,
        vx: 0,
        vy: -16,
        life: 0.28,
        max: 0.28,
        size: 9,
        color: s.color,
      });
      return;
    }
    if (s.splash > 0) {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (hypot2(s.x, s.y, e.x, e.y) <= s.splash * s.splash) this.hurt(e, s.dmg, s.x, s.y);
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        this.puffs.push({
          x: s.x,
          y: s.y,
          vx: Math.cos(a) * 40,
          vy: Math.sin(a) * 40,
          life: 0.35,
          max: 0.35,
          size: 7,
          color: "#b08968",
        });
      }
      this.pushFx("boom", s.x, s.y, { r: Math.max(18, s.splash), max: 0.38 });
    } else {
      const tgt = this.enemies.find((e) => e.id === s.targetId && e.alive);
      if (tgt) this.hurt(tgt, s.dmg, s.x, s.y);
      if (s.kind === "homing") {
        this.pushFx("yarn", s.x, s.y, { x2: s.x + 8, y2: s.y - 10, r: 16, max: 0.4 });
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          this.puffs.push({
            x: s.x,
            y: s.y,
            vx: Math.cos(a) * 50,
            vy: Math.sin(a) * 50 - 10,
            life: 0.32,
            max: 0.32,
            size: 5,
            color: i % 2 ? "#d4785a" : "#c45c4a",
          });
        }
      }
    }
  }

  private hurt(e: Enemy, raw: number, _sx: number, _sy: number) {
    if (!e.alive) return;
    const dmg = raw * (1 - e.armor);
    e.hp -= dmg;
    e.flash = 0.12;
    this.audio.hit();
    if (e.hp <= 0) {
      e.alive = false;
      e.death = 0.42;
      e.flash = 0.1;
      this.kills++;
      this.gold += e.gold;
      this.audio.kill();
      this.floats.push({ x: e.x, y: e.y - 16, text: `+${e.gold}`, life: 0.7, color: "#e6d3b3" });
      if (e.type === "warlord") {
        const gain = 2;
        const cap = START_LIVES + 10;
        const before = this.lives;
        this.lives = Math.min(cap, this.lives + gain);
        const got = this.lives - before;
        if (got > 0) {
          this.floats.push({
            x: e.x,
            y: e.y - 34,
            text: `+${got} ${got === 1 ? "life" : "lives"}`,
            life: 1.1,
            color: "#c45c4a",
          });
        }
      }
      const n = 10 + Math.floor(e.scale * 6);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 30 + Math.random() * 90;
        this.puffs.push({
          x: e.x,
          y: e.y - 8,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 40,
          life: 0.35 + Math.random() * 0.25,
          max: 0.55,
          size: 3 + Math.random() * 7,
          color: i % 3 === 0 ? "#1a1512" : "#c9a07a",
        });
      }
      this.emit();
    }
  }

  private hurtTower(t: Tower, raw: number) {
    const taken = raw * (1 + (t.hexVuln || 0));
    t.hp -= taken;
    t.flash = 0.14;
    this.audio.towerHit();
    if (t.hp <= 0) this.destroyTower(t);
  }

  private destroyTower(t: Tower) {
    if (!this.towers.some((x) => x.id === t.id)) return;
    let refund = Math.floor(TOWERS[t.type].cost * DESTROY_RATE);
    const left = this.towers.length - 1;
    const after = this.gold + refund;
    let aid = 0;
    if (left <= 1 && after < 90) aid = 90 - after;
    this.gold += refund + aid;
    this.towers = this.towers.filter((x) => x.id !== t.id);
    this.occ.delete(`${t.col},${t.row}`);
    if (this.selectedId === t.id) this.selectedId = null;
    this.shake = 7;
    this.audio.towerDown();
    this.floats.push({
      x: t.x,
      y: t.y - 18,
      text: aid > 0 ? `salvage +${refund} · aid +${aid}` : refund > 0 ? `salvage +${refund}` : "tower lost",
      life: 1.05,
      color: "#e6d3b3",
    });
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      this.puffs.push({
        x: t.x,
        y: t.y,
        vx: Math.cos(a) * 70,
        vy: Math.sin(a) * 70 - 20,
        life: 0.4,
        max: 0.4,
        size: 5,
        color: "#8a6a48",
      });
    }
    this.emit();
  }

  private tickHazards(dt: number) {
    for (const h of this.hazards) {
      if (h.kind === "sand") {
        const a = (this.time / h.period) * Math.PI * 2;
        h.x = h.ox + Math.sin(a) * h.ampC;
        h.y = h.oy + Math.cos(a * 0.85) * h.ampR;
        const r2 = h.radius * h.radius;
        for (const t of [...this.towers]) {
          if (hypot2(h.x, h.y, t.x, t.y) <= r2) this.hurtTower(t, 16 * dt);
        }
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (hypot2(h.x, h.y, e.x, e.y) <= r2) e.slowUntil = Math.max(e.slowUntil, this.time + 0.25);
        }
      }
      if (h.kind === "fountain") {
        const r2 = h.radius * h.radius;
        for (const t of this.towers) {
          if (hypot2(h.x, h.y, t.x, t.y) <= r2 * 2.2) t.hp = Math.min(t.maxHp, t.hp + 7 * dt);
        }
      }
      if (h.kind === "lava") {
        const r2 = h.radius * h.radius;
        for (const t of [...this.towers]) {
          if (hypot2(h.x, h.y, t.x, t.y) <= r2) this.hurtTower(t, 10 * dt);
        }
      }
    }
    if (this.lava.size) {
      for (const t of [...this.towers]) {
        const n = [
          `${t.col + 1},${t.row}`,
          `${t.col - 1},${t.row}`,
          `${t.col},${t.row + 1}`,
          `${t.col},${t.row - 1}`,
        ];
        if (n.some((k) => this.lava.has(k))) this.hurtTower(t, 5 * dt);
      }
    }
  }

  private tickFx(dt: number) {
    for (const b of this.beams) b.life -= dt;
    this.beams = this.beams.filter((b) => b.life > 0);
    for (const p of this.puffs) {
      p.life -= dt;
      p.vy += 140 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.puffs = this.puffs.filter((p) => p.life > 0);
    for (const f of this.floats) {
      f.life -= dt;
      f.y -= 22 * dt;
    }
    this.floats = this.floats.filter((f) => f.life > 0);
    for (const f of this.fx) f.life -= dt;
    this.fx = this.fx.filter((f) => f.life > 0);
    this.shots = this.shots.filter((s) => s.alive);
    this.enemies = this.enemies.filter((e) => e.alive || e.death > 0);
  }

  private clearVfx() {
    this.shots = [];
    this.beams = [];
    this.puffs = [];
    this.fx = [];
  }

  private checkWaveEnd() {
    if (this.phase !== "combat") return;
    if (this.spawning) return;
    if (this.enemies.some((e) => e.alive || e.death > 0)) return;
    if (this.lives <= 0) return;
    if (this.wave >= WAVES_PER_LEVEL) {
      if (this.levelIndex >= LEVELS.length - 1) {
        this.phase = "victory";
        this.audio.win();
        this.emit();
        return;
      }
      this.phase = "advance";
      this.audio.win();
      this.clearVfx();
      this.emit();
      return;
    }
    const bonus = 12 + this.wave * 4 + this.levelIndex * 3;
    const rebuild = this.towers.length <= 2 ? (3 - this.towers.length) * 24 : 0;
    this.gold += bonus + rebuild;
    this.wave += 1;
    this.phase = "build";
    this.clearVfx();
    this.floats.push({
      x: WORLD_W / 2,
      y: 40,
      text: rebuild > 0 ? `Wave clear +${bonus}g · rebuild +${rebuild}g` : `Wave clear +${bonus}g`,
      life: 1.4,
      color: "#e6d3b3",
    });
    this.emit();
  }

  private emit() {
    if (!this.alive) return;
    const t = this.selected();
    const remaining =
      this.enemies.filter((e) => e.alive).length + this.spawners.reduce((n, s) => n + s.left, 0);
    const next = LEVELS[this.levelIndex + 1];
    this.onHud({
      phase: this.phase,
      gold: this.gold,
      lives: this.lives,
      wave: this.wave,
      waves: WAVES_PER_LEVEL,
      remaining,
      shop: this.shop,
      selectedId: this.selectedId,
      selected: t
        ? {
            id: t.id,
            type: t.type,
            name: TOWERS[t.type].name,
            dmgLv: t.dmgLv,
            defLv: t.defLv,
            rngLv: t.rngLv,
            rateLv: t.rateLv,
            dmgCost: t.dmgLv < 1 ? towerAtkCost(t.type) : null,
            defCost: t.defLv < 1 ? towerDefCost(t.type) : null,
            rngCost: t.rngLv < 1 ? towerRngCost(t.type) : null,
            rateCost: t.rateLv < 1 ? towerRateCost(t.type) : null,
            repairCost: towerRepairCost(t.type, t.hp, t.maxHp, t.repairsUsed),
            repairsUsed: t.repairsUsed,
            sell: Math.floor(t.invested * SELL_RATE),
            hp: Math.max(0, Math.round(t.hp)),
            maxHp: t.maxHp,
          }
        : null,
      speed: this.speed,
      kills: this.kills,
      leaks: this.leaks,
      canStart: this.phase === "build",
      level: this.levelIndex + 1,
      levels: LEVELS.length,
      levelName: this.level.name,
      nextName: next?.name ?? null,
      ready: this.ready,
      loadProgress: this.loadProgress,
      hasSave: Boolean(readSave()),
    });
    if (
      this.phase === "build" ||
      this.phase === "combat" ||
      this.phase === "paused" ||
      this.phase === "advance"
    ) {
      this.scheduleSave();
    }
    if (this.phase === "defeat" || this.phase === "victory") {
      clearSave();
    }
  }

  private scheduleSave() {
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.persist(), 280);
  }

  private persist(immediate = false) {
    if (immediate) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = 0;
    }
    if (
      this.phase !== "build" &&
      this.phase !== "combat" &&
      this.phase !== "paused" &&
      this.phase !== "advance"
    ) {
      return;
    }
    const blob: SaveBlob = {
      v: SAVE_VER,
      phase: this.phase === "paused" ? this.prePause : this.phase,
      paused: this.phase === "paused",
      gold: this.gold,
      lives: this.lives,
      wave: this.wave,
      levelIndex: this.levelIndex,
      speed: this.speed,
      kills: this.kills,
      leaks: this.leaks,
      nid: this.nid,
      time: this.time,
      spawning: this.spawning,
      spawners: this.spawners.map((s) => ({ ...s })),
      occ: [...this.occ],
      towers: this.towers.map((t) => ({ ...t })),
      enemies: this.enemies
        .filter((e) => e.alive || e.death > 0)
        .map((e) => ({ ...e })),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
    } catch {
      /* ignore quota */
    }
  }

  private restore() {
    const data = readSave();
    if (!data) return false;
    const idx = Math.max(0, Math.min(LEVELS.length - 1, data.levelIndex | 0));
    this.applyLevel(idx);
    this.gold = data.gold;
    this.lives = data.lives;
    this.wave = Math.max(1, Math.min(WAVES_PER_LEVEL, data.wave | 0));
    this.speed = data.speed === 2 ? 2 : 1;
    this.kills = data.kills | 0;
    this.leaks = data.leaks | 0;
    this.nid = Math.max(1, data.nid | 0);
    this.time = data.time || 0;
    this.spawning = Boolean(data.spawning);
    this.spawners = Array.isArray(data.spawners) ? data.spawners.map((s) => ({ ...s })) : [];
    this.towers = Array.isArray(data.towers)
      ? data.towers.map((t) => ({
          ...t,
          hexRate: t.hexRate ?? 1,
          hexRange: t.hexRange ?? 1,
          hexVuln: t.hexVuln ?? 0,
          hexAtkUntil: t.hexAtkUntil ?? 0,
        }))
      : [];
    this.enemies = Array.isArray(data.enemies)
      ? data.enemies.map((e) => ({ ...e, burn: e.burn ?? 0 }))
      : [];
    this.occ = new Set(data.occ || []);
    this.shots = [];
    this.beams = [];
    this.puffs = [];
    this.fx = [];
    this.floats = [];
    this.shop = null;
    this.selectedId = null;
    this.shake = 0;
    const phase = data.phase;
    if (phase === "combat" || phase === "build" || phase === "advance") {
      this.phase = data.paused ? "paused" : phase;
      this.prePause = phase;
    } else {
      this.phase = "build";
    }
    return true;
  }

  private draw() {
    const cw = this.canvas.clientWidth;
    const ch = this.canvas.clientHeight;
    if (cw !== this.cssW || ch !== this.cssH) this.resize();
    if (this.scale <= 0.01) this.resize();
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = "#0c0a09";
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    ctx.save();
    ctx.translate(this.offX + (Math.random() - 0.5) * this.shake, this.offY + (Math.random() - 0.5) * this.shake);
    ctx.scale(this.scale, this.scale);
    this.drawWorld();
    ctx.restore();
  }

  private drawWorld() {
    const ctx = this.ctx;
    const L = this.level;
    const ground = this.assets.tiles[L.tile] || this.assets.tiles.grass;
    const pathImg = this.assets.tiles.path;
    const waterImg = this.assets.tiles.water;
    const lavaImg = this.assets.tiles.lava;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * CELL;
        const y = r * CELL;
        const key = `${c},${r}`;
        if (this.lava.has(key)) {
          if (lavaImg) ctx.drawImage(lavaImg, x, y, CELL + 1, CELL + 1);
          else {
            ctx.fillStyle = "#c45c18";
            ctx.fillRect(x, y, CELL + 1, CELL + 1);
          }
          continue;
        }
        if (this.water.has(key)) {
          if (waterImg) ctx.drawImage(waterImg, x, y, CELL + 1, CELL + 1);
          else {
            ctx.fillStyle = "#2a5a68";
            ctx.fillRect(x, y, CELL + 1, CELL + 1);
          }
          const ripple = 0.12 + Math.sin(this.time * 2 + c + r) * 0.06;
          ctx.fillStyle = `rgba(180,230,240,${ripple})`;
          ctx.fillRect(x, y, CELL + 1, CELL + 1);
          continue;
        }
        if (this.path.set.has(key)) {
          if (pathImg) {
            ctx.drawImage(pathImg, x, y, CELL + 1, CELL + 1);
            ctx.fillStyle = L.pathTint + "55";
            ctx.fillRect(x, y, CELL + 1, CELL + 1);
          } else {
            ctx.fillStyle = L.path;
            ctx.fillRect(x, y, CELL + 1, CELL + 1);
          }
        } else if (ground) {
          ctx.drawImage(ground, x, y, CELL + 1, CELL + 1);
        } else {
          ctx.fillStyle = L.grass;
          ctx.fillRect(x, y, CELL + 1, CELL + 1);
        }
      }
    }

    ctx.strokeStyle = L.pathTint + "99";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    this.path.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    this.drawHazards();
    this.drawDecor();
    this.drawPortal();
    this.drawVault();
    this.drawAttackFx();

    if (this.shop && this.hoverC >= 0) {
      const ok = this.canBuild(this.hoverC, this.hoverR) && this.gold >= TOWERS[this.shop].cost;
      const { x, y } = cellCenter(this.hoverC, this.hoverR);
      ctx.fillStyle = ok ? "rgba(125,154,120,0.28)" : "rgba(196,92,74,0.28)";
      ctx.fillRect(this.hoverC * CELL, this.hoverR * CELL, CELL, CELL);
      ctx.beginPath();
      ctx.arc(x, y, TOWERS[this.shop].range * CELL, 0, Math.PI * 2);
      ctx.strokeStyle = ok ? "rgba(212,120,90,0.7)" : "rgba(196,92,74,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const sel = this.selected();
    if (sel) {
      ctx.beginPath();
      ctx.arc(sel.x, sel.y, TOWERS[sel.type].range * (sel.rngLv ? RNG_MULT : 1) * (sel.hexRange || 1) * CELL, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(230,211,179,0.55)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const t of this.towers) this.drawTower(t);
    this.enemies.sort((a, b) => a.y - b.y);
    for (const e of this.enemies) this.drawEnemy(e);
    for (const s of this.shots) this.drawShot(s);
    for (const b of this.beams) {
      ctx.strokeStyle = `rgba(212,120,90,${Math.min(1, b.life * 8)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
    }
    for (const p of this.puffs) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.max), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.font = "600 13px Outfit, sans-serif";
    ctx.textAlign = "center";
    for (const f of this.floats) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  private drawDecor() {
    const ctx = this.ctx;
    const id = this.level.decor;
    for (const key of this.blocked) {
      const [cs, rs] = key.split(",");
      const c = Number(cs);
      const r = Number(rs);
      const x = c * CELL + CELL / 2;
      const y = r * CELL + CELL / 2;
      if (id === "hedge") {
        ctx.fillStyle = "#1c3318";
        ctx.fillRect(x - 22, y - 20, 44, 40);
        ctx.fillStyle = "#2f5a28";
        ctx.beginPath();
        ctx.ellipse(x, y - 4, 20, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3a6e30";
        ctx.beginPath();
        ctx.ellipse(x + 6, y - 10, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (id === "stone") {
        ctx.fillStyle = "#5a534c";
        ctx.fillRect(x - 20, y - 8, 40, 22);
        ctx.fillStyle = "#6e675e";
        for (let i = 0; i < 3; i++) ctx.fillRect(x - 18 + i * 13, y - 16, 10, 10);
      } else if (id === "dune") {
        ctx.fillStyle = "#8a6a40";
        ctx.beginPath();
        ctx.ellipse(x, y + 8, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#6a5038";
        ctx.beginPath();
        ctx.moveTo(x - 8, y + 4);
        ctx.lineTo(x, y - 14);
        ctx.lineTo(x + 9, y + 4);
        ctx.fill();
      } else if (id === "rock") {
        ctx.fillStyle = "#2a1c18";
        ctx.beginPath();
        ctx.moveTo(x - 16, y + 10);
        ctx.lineTo(x - 4, y - 18);
        ctx.lineTo(x + 14, y + 10);
        ctx.fill();
        ctx.fillStyle = "#c45c18";
        ctx.fillRect(x - 2, y - 4, 3, 10);
      } else if (id === "snow") {
        ctx.fillStyle = "rgba(200,210,220,0.35)";
        ctx.beginPath();
        ctx.ellipse(x, y + 12, 16, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4a6270";
        ctx.beginPath();
        ctx.moveTo(x, y - 22);
        ctx.lineTo(x - 14, y + 8);
        ctx.lineTo(x + 14, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#d8e4ec";
        ctx.beginPath();
        ctx.moveTo(x, y - 22);
        ctx.lineTo(x - 8, y - 4);
        ctx.lineTo(x + 8, y - 4);
        ctx.closePath();
        ctx.fill();
      } else if (id === "village") {
        ctx.fillStyle = "#6a4a32";
        ctx.fillRect(x - 14, y - 4, 28, 18);
        ctx.fillStyle = "#c45c4a";
        ctx.beginPath();
        ctx.moveTo(x - 18, y - 4);
        ctx.lineTo(x, y - 20);
        ctx.lineTo(x + 18, y - 4);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(20,28,18,0.55)";
        ctx.beginPath();
        ctx.ellipse(x, y + 10, 16, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.level.id === "forest" ? "#1e3a24" : "#2f4630";
        ctx.beginPath();
        ctx.ellipse(x, y, 15, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.level.id === "forest" ? "#2d5a36" : "#3a5a3c";
        ctx.beginPath();
        ctx.ellipse(x + 6, y - 8, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawHazards() {
    const ctx = this.ctx;
    for (const h of this.hazards) {
      if (h.kind === "fountain") {
        ctx.fillStyle = "#6a645c";
        ctx.beginPath();
        ctx.ellipse(h.x, h.y + 6, 26, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3a7080";
        ctx.beginPath();
        ctx.ellipse(h.x, h.y, 16, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(200,230,240,${0.35 + Math.sin(this.time * 3) * 0.15})`;
        ctx.beginPath();
        ctx.arc(h.x, h.y - 10 - Math.sin(this.time * 4) * 3, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (h.kind === "sand") {
        ctx.fillStyle = "rgba(196,160,90,0.35)";
        ctx.beginPath();
        ctx.ellipse(h.x, h.y, h.radius * 0.9, h.radius * 0.55, this.time, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(160,110,50,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius * 0.45, this.time * 2, this.time * 2 + 4);
        ctx.stroke();
      }
    }
  }

  private drawAttackFx() {
    const ctx = this.ctx;
    for (const f of this.fx) {
      const u = Math.max(0, f.life / f.max);
      const t = 1 - u;
      if (f.kind === "spell") {
        const r = f.r * (0.28 + t * 0.78);
        ctx.strokeStyle = `rgba(155,90,220,${u * 0.9})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(220,180,255,${u * 0.5})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r * 0.64, this.time * 4, this.time * 4 + 3.4);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + this.time * 2.4;
          ctx.fillStyle = `rgba(190,140,255,${u})`;
          ctx.beginPath();
          ctx.arc(f.x + Math.cos(ang) * r * 0.88, f.y + Math.sin(ang) * r * 0.88, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (f.kind === "crack") {
        ctx.strokeStyle = `rgba(72,42,22,${u})`;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
          const p = i / steps;
          const jx = (i % 2 === 0 ? -1 : 1) * 5 * (i === 0 || i === steps ? 0 : 1);
          const x = f.x + (f.x2 - f.x) * p + jx;
          const y = f.y + (f.y2 - f.y) * p + jx * 0.4;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.strokeStyle = `rgba(30,16,8,${u * 0.7})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (f.kind === "swipe") {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.ang);
        const sweep = 1.65;
        ctx.strokeStyle = `rgba(200,90,70,${u})`;
        ctx.lineWidth = 9;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, f.r * (0.7 + t * 0.3), -sweep / 2, sweep / 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(230,200,140,${u * 0.75})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, f.r * 0.78, -sweep / 2 + 0.1, sweep / 2 - 0.1);
        ctx.stroke();
        ctx.restore();
      } else if (f.kind === "quake") {
        const r = f.r * (0.38 + t * 0.7);
        ctx.strokeStyle = `rgba(90,70,50,${u * 0.9})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(40,28,18,${u * 0.6})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.arc(f.x, f.y, r * 0.72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2 + t * 0.4;
          const x = f.x + Math.cos(ang) * r;
          const y = f.y + Math.sin(ang) * r;
          ctx.fillStyle = `rgba(70,52,38,${u})`;
          ctx.beginPath();
          ctx.moveTo(x, y - 11);
          ctx.lineTo(x + 8, y + 7);
          ctx.lineTo(x - 8, y + 7);
          ctx.closePath();
          ctx.fill();
        }
      } else if (f.kind === "slash") {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.ang);
        ctx.strokeStyle = `rgba(230,211,179,${u})`;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(8, 0, f.r * 0.7, -0.9, 0.9);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${u * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(8, 0, f.r * 0.55, -0.7, 0.7);
        ctx.stroke();
        ctx.restore();
      } else if (f.kind === "mist") {
        const r = f.r * (0.55 + t * 0.85);
        ctx.fillStyle = `rgba(55, 120, 48, ${u * 0.42})`;
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, r, r * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(110, 180, 80, ${u * 0.38})`;
        ctx.beginPath();
        ctx.ellipse(f.x + Math.sin(this.time * 3) * 8, f.y - 6, r * 0.7, r * 0.5, this.time * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(170, 220, 120, ${u * 0.28})`;
        ctx.beginPath();
        ctx.ellipse(f.x - 10, f.y + 8, r * 0.55, r * 0.4, -this.time, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(200, 240, 160, ${u * 0.55})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, r * 0.82, r * 0.58, this.time * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      } else if (f.kind === "boom") {
        const r = f.r * (0.4 + t * 0.9);
        ctx.strokeStyle = `rgba(180,100,70,${u})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(200,140,90,${u * 0.2})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.kind === "yarn") {
        ctx.strokeStyle = `rgba(212,120,90,${u})`;
        ctx.lineWidth = 2.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        const steps = 18;
        for (let i = 0; i <= steps; i++) {
          const p = i / steps;
          const x = f.x + (f.x2 - f.x) * p + Math.sin(p * Math.PI * 5 + this.time * 12) * 6;
          const y = f.y + (f.y2 - f.y) * p + Math.cos(p * Math.PI * 4 + this.time * 10) * 5;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = `rgba(196,80,70,${u})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 4 + (1 - u) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawPortal() {
    const p = this.path.pts[0];
    if (!p) return;
    const ctx = this.ctx;
    const img = this.assets.gate;
    if (img) {
      const h = CELL * 1.85;
      const w = h * (img.width / img.height);
      ctx.drawImage(img, p.x - w * 0.52, p.y - h * 0.78, w, h);
      return;
    }
    ctx.fillStyle = "#6a645c";
    ctx.fillRect(p.x - 30, p.y - 38, 18, 52);
    ctx.fillRect(p.x + 12, p.y - 38, 18, 52);
    ctx.fillStyle = "#1a100c";
    ctx.beginPath();
    ctx.moveTo(p.x - 12, p.y + 14);
    ctx.lineTo(p.x - 12, p.y - 8);
    ctx.quadraticCurveTo(p.x, p.y - 28, p.x + 12, p.y - 8);
    ctx.lineTo(p.x + 12, p.y + 14);
    ctx.fill();
  }

  private drawVault() {
    const p = this.path.pts[this.path.pts.length - 1];
    if (!p) return;
    const ctx = this.ctx;
    const img = this.assets.village;
    if (img) {
      const h = CELL * 2.05;
      const w = h * (img.width / img.height);
      ctx.drawImage(img, p.x - w * 0.42, p.y - h * 0.78, w, h);
      return;
    }
    ctx.fillStyle = "#6a4a2e";
    ctx.fillRect(p.x - 22, p.y - 8, 44, 24);
    ctx.fillStyle = "#c45c4a";
    ctx.beginPath();
    ctx.moveTo(p.x - 28, p.y - 8);
    ctx.lineTo(p.x, p.y - 32);
    ctx.lineTo(p.x + 28, p.y - 8);
    ctx.fill();
  }

  private drawTower(t: Tower) {
    const ctx = this.ctx;
    const img = this.assets.towers[t.type];
    const pad = this.assets.pad;
    if (t.flash > 0) ctx.filter = "brightness(1.7)";
    if (pad) ctx.drawImage(pad, t.x - CELL * 0.42, t.y - CELL * 0.2, CELL * 0.84, CELL * 0.55);
    else {
      ctx.fillStyle = "#4a3728";
      ctx.fillRect(t.x - 18, t.y + 4, 36, 12);
    }
    if (img) {
      const h = CELL * 0.92;
      const w = h * (img.width / img.height);
      ctx.drawImage(img, t.x - w / 2, t.y - h + 16, w, h);
    } else {
      ctx.fillStyle = "#c9a07a";
      ctx.fillRect(t.x - 10, t.y - 28, 20, 36);
    }
    ctx.filter = "none";
    const ratio = Math.max(0, t.hp / t.maxHp);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(t.x - 16, t.y + 16, 32, 4);
    ctx.fillStyle = ratio > 0.4 ? "#7d9a78" : "#c45c4a";
    ctx.fillRect(t.x - 16, t.y + 16, 32 * ratio, 4);
    if ((t.hexRate || 1) < 0.98 || (t.hexRange || 1) < 0.98) {
      ctx.strokeStyle = "rgba(180,140,255,0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y - 8, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    if ((t.hexVuln || 0) > 0.02) {
      ctx.strokeStyle = "rgba(140,90,40,0.75)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(t.x - 10, t.y + 10);
      ctx.lineTo(t.x + 4, t.y + 18);
      ctx.lineTo(t.x + 12, t.y + 8);
      ctx.stroke();
    }
    if (this.time < (t.hexAtkUntil || 0)) {
      ctx.fillStyle = "rgba(196,92,74,0.45)";
      ctx.fillRect(t.x - 10, t.y - 34, 20, 3);
    }
  }

  private drawEnemy(e: Enemy) {
    const ctx = this.ctx;
    const img = this.assets.enemies[e.type];
    const dying = !e.alive;
    const dieT = dying ? Math.max(0, Math.min(1, e.death / 0.42)) : 1;
    const bob = dying ? 0 : Math.sin(e.bob) * 2.4;
    const facing = e.face;
    ctx.save();
    ctx.translate(e.x, e.y + bob);
    if (dying) {
      ctx.globalAlpha = dieT;
      ctx.rotate((1 - dieT) * 1.1);
      const squash = 0.25 + dieT * 0.75;
      ctx.scale(facing * squash * (1 + (1 - dieT) * 0.35), squash);
    } else {
      ctx.scale(facing, 1);
    }
    if (e.flash > 0) ctx.filter = "brightness(2.2)";
    if (img) {
      const h = CELL * e.scale * 1.25;
      const w = h * (img.width / img.height);
      ctx.drawImage(img, -w / 2, -h + 10, w, h);
    } else {
      this.drawBlob(e.scale);
    }
    ctx.filter = "none";
    ctx.restore();
    if (e.alive) {
      const w = 28 * e.scale + 10;
      const hp = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(e.x - w / 2, e.y - CELL * e.scale * 0.95, w, 4);
      ctx.fillStyle = hp > 0.45 ? "#7d9a78" : "#c45c4a";
      ctx.fillRect(e.x - w / 2, e.y - CELL * e.scale * 0.95, w * hp, 4);
    }
  }

  private drawBlob(scale: number) {
    const ctx = this.ctx;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#c9a07a";
    ctx.beginPath();
    ctx.ellipse(0, 6, 22, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-16, -8);
    ctx.lineTo(-12, -28);
    ctx.lineTo(-2, -8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, -8);
    ctx.lineTo(12, -30);
    ctx.lineTo(18, -6);
    ctx.fill();
    ctx.fillStyle = "#1a1512";
    ctx.beginPath();
    ctx.ellipse(-6, 0, 3.2, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(7, 0, 3.2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1512";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-12, 8);
    ctx.quadraticCurveTo(1, 20, 14, 8);
    ctx.stroke();
  }

  private drawShot(s: Shot) {
    const ctx = this.ctx;
    if (s.team === "foe") {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.kind === "arc" ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      return;
    }
    const frames = s.kind === "arc" ? this.assets.hairball : this.assets.yarn;
    const img = frames[Math.floor(this.time * 10) % Math.max(1, frames.length)];
    if (img) ctx.drawImage(img, s.x - 12, s.y - 12, 24, 24);
    else {
      ctx.fillStyle = s.kind === "arc" ? "#8a5a3a" : "#d4785a";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    if (s.kind === "homing") {
      ctx.strokeStyle = "rgba(212,120,90,0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 10, 6, this.time * 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

let mounted: GizmoEngine | null = null;

export function mountGizmoEngine(canvas: HTMLCanvasElement, onHud: (h: Hud) => void) {
  if (mounted && mounted.isLive()) {
    mounted.attachCanvas(canvas, onHud);
    return mounted;
  }
  mounted = new GizmoEngine(canvas, onHud);
  mounted.start();
  return mounted;
}
