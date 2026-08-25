import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Heart,
  Pause,
  Play,
  RotateCcw,
  FastForward,
  Crosshair,
  Shield,
  Radius,
  Zap,
  Wind,
  CircleHelp,
  X,
  Coins,
} from "lucide-react";
import { mountGizmoEngine, type Hud, type GizmoEngine } from "@/game/engine";
import {
  TOWERS,
  TOWER_ORDER,
  ENEMIES,
  ENEMY_IDS,
  ATK_DMG_MULT,
  DEF_HP_MULT,
  RNG_MULT,
  RATE_MULT,
  START_GOLD,
  START_LIVES,
  WAVES_PER_LEVEL,
  SELL_RATE,
  DESTROY_RATE,
  towerAtkCost,
  towerDefCost,
  towerRngCost,
  towerRateCost,
  loanPrincipal,
  loanPovertyLine,
  LOAN_TIERS,
  type TowerId,
} from "@/game/config";

const EMPTY: Hud = {
  phase: "title",
  gold: 200,
  lives: 20,
  wave: 1,
  waves: 8,
  remaining: 0,
  shop: null,
  selectedId: null,
  selected: null,
  speed: 1,
  kills: 0,
  leaks: 0,
  canStart: false,
  level: 1,
  levels: 20,
  levelName: "Moonlit Garden",
  nextName: "Whisperwood",
  ready: false,
  loadProgress: 0,
  hasSave: false,
  loanDebt: 0,
  loanGarnish: 0,
  loanCan: false,
  loanOffers: [],
};

const BEST_KEY = "gizmo-attack-best";

function assetUrl(path: string) {
  const root =
    (typeof window !== "undefined" && (window as unknown as { __GIZMO_ASSETS?: string }).__GIZMO_ASSETS) ||
    "/gizmo-attack";
  return `${String(root).replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function GizmoAttack() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GizmoEngine | null>(null);
  const [hud, setHud] = useState<Hud>(EMPTY);
  const [best, setBest] = useState(0);
  const [embedded, setEmbedded] = useState(false);
  const [codex, setCodex] = useState(false);
  const pausedForCodex = useRef(false);

  useEffect(() => {
    setEmbedded(
      (typeof window !== "undefined" &&
        (window.self !== window.top ||
          Boolean((window as unknown as { __GIZMO_EMBED?: boolean }).__GIZMO_EMBED))) ||
        false,
    );
  }, []);

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem(BEST_KEY) || 0));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (hud.phase === "victory" || hud.phase === "defeat") {
      const score = hud.kills * 10 + hud.wave * 25 + hud.gold;
      setBest((b) => {
        const n = Math.max(b, score);
        try {
          localStorage.setItem(BEST_KEY, String(n));
        } catch {
          /* ignore */
        }
        return n;
      });
    }
  }, [hud.phase, hud.kills, hud.wave, hud.gold]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = mountGizmoEngine(canvas, setHud);
    engineRef.current = engine;
    const ro = new ResizeObserver(() => engine!.resize());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => {
      ro.disconnect();
    };
  }, []);

  const e = engineRef.current;
  const playing = hud.phase === "build" || hud.phase === "combat" || hud.phase === "paused";

  const openCodex = () => {
    if (hud.phase === "combat") {
      e?.togglePause();
      pausedForCodex.current = true;
    }
    setCodex(true);
  };
  const closeCodex = () => {
    setCodex(false);
    if (pausedForCodex.current) {
      pausedForCodex.current = false;
      if (hud.phase === "paused") e?.togglePause();
    }
  };

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#0A0A0A] text-white">
      {embedded ? null : <SiteNav />}

      <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div ref={wrapRef} className="relative min-h-0 flex-1 touch-none bg-black">
          <canvas
            ref={canvasRef}
            className="block h-full w-full"
            style={{ touchAction: "none" }}
          />

          {hud.phase === "title" ? (
            <TitleOverlay
              onPlay={() => e?.play()}
              onContinue={() => e?.continueRun()}
              onNewGame={() => e?.newGame()}
              onCodex={openCodex}
              hasSave={hud.hasSave}
              ready={hud.ready}
              loadProgress={hud.loadProgress}
            />
          ) : null}
          {hud.phase === "paused" ? (
            <Modal title="Paused" onClose={() => e?.togglePause()}>
              <p className="text-sm text-muted">The path still waits. Resume when you are ready.</p>
              <div className="mt-4 flex gap-2">
                <Action onClick={() => e?.togglePause()}>Resume</Action>
                <Ghost onClick={() => e?.restart()}>Restart</Ghost>
              </div>
            </Modal>
          ) : null}
          {hud.phase === "defeat" ? (
            <Modal title="The village fell">
              <p className="text-sm text-muted">
                Wave {hud.wave} · {hud.kills} Gizmos stopped · {hud.leaks} leaked
              </p>
              <p className="mt-1 text-xs text-faint">Best score {best}</p>
              <div className="mt-4">
                <Action onClick={() => e?.restart()}>
                  <RotateCcw className="size-4" /> Play again
                </Action>
              </div>
            </Modal>
          ) : null}
          {hud.phase === "advance" ? (
            <Modal title={`${hud.levelName} holds`}>
              <p className="text-sm text-muted">
                The path is clear. Caravan gold is packed. Next: {hud.nextName}. Towers stay behind — a new map,
                meaner Gizmos.
              </p>
              <p className="mt-1 text-xs text-faint">
                Wave set done · {hud.kills} stopped · {hud.lives} lives · {hud.gold} gold
              </p>
              <div className="mt-4">
                <Action onClick={() => e?.advance()}>March to {hud.nextName}</Action>
              </div>
            </Modal>
          ) : null}
          {hud.phase === "victory" ? (
            <Modal title="The village holds">
              <p className="text-sm text-muted">
                All {hud.levels} lands cleared. {hud.kills} villains down, {hud.lives} lives left, {hud.gold} gold spare.
              </p>
              <p className="mt-1 text-xs text-faint">Best score {best}</p>
              <div className="mt-4">
                <Action onClick={() => e?.restart()}>
                  <RotateCcw className="size-4" /> Play again
                </Action>
              </div>
            </Modal>
          ) : null}

          {playing ? (
            <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center px-2">
              <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-surface/90 px-2 py-1 backdrop-blur-sm">
                {hud.canStart ? (
                  <button
                    type="button"
                    data-testid="start-wave"
                    onClick={() => e?.startWave()}
                    className="rounded-md bg-sage px-3 py-1.5 text-xs font-semibold text-sage-fg"
                  >
                    Land {hud.level}/{hud.levels} • Wave {hud.wave}/{hud.waves} • Start
                  </button>
                ) : (
                  <span className="px-2 text-xs text-muted">
                    Land {hud.level}/{hud.levels} • Wave {hud.wave}/{hud.waves} • {hud.remaining} on the path
                  </span>
                )}
                <span className="max-w-[9rem] truncate px-1 text-[11px] text-faint">{hud.levelName}</span>
                <button
                  type="button"
                  onClick={() => e?.togglePause()}
                  className="grid size-8 place-items-center rounded-md border border-border text-fg"
                  aria-label="Pause"
                >
                  {hud.phase === "paused" ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => e?.setSpeed(hud.speed === 1 ? 2 : 1)}
                  className={`grid size-8 place-items-center rounded-md border border-border ${hud.speed === 2 ? "bg-raised text-accent" : "text-fg"}`}
                  aria-label="Fast forward"
                >
                  <FastForward className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={openCodex}
                  className="grid size-8 place-items-center rounded-md border border-border text-fg"
                  aria-label="Game info"
                  title="Codex"
                >
                  <CircleHelp className="size-3.5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {playing ? (
          <aside className="flex shrink-0 flex-col gap-2 overflow-hidden border-t border-[#f7931a]/30 bg-[#111] p-2 lg:h-full lg:w-72 lg:border-t-0 lg:border-l lg:p-3">
            <div className="grid grid-cols-4 gap-1.5">
              <Stat icon={<Heart className="size-3" />} label="Lives" value={hud.lives} danger={hud.lives <= 5} />
              <Stat label="Gold" value={hud.gold} gold />
              <Stat label="Land" value={`${hud.level}/${hud.levels}`} />
              <Stat label="Wave" value={`${hud.wave}/${hud.waves}`} />
            </div>
            {hud.loanDebt > 0 ? (
              <p className="rounded-md border border-border bg-raised/60 px-2 py-1 text-[11px] text-muted">
                <Coins className="mr-1 inline size-3 text-accent" />
                Owe <span className="text-fg tabular-nums">{hud.loanDebt}g</span>
                {" · "}
                {Math.round(hud.loanGarnish * 100)}% of kill gold
              </p>
            ) : hud.loanCan ? (
              <div className="rounded-md border border-border bg-raised/60 p-1.5">
                <p className="mb-1 px-1 text-[10px] tracking-[0.14em] text-muted uppercase">Bank · one loan</p>
                <div className="grid grid-cols-3 gap-1">
                  {hud.loanOffers.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => e?.takeLoan(o.id)}
                      className="rounded-md border border-border bg-surface px-1 py-1.5 text-center hover:border-accent"
                    >
                      <span className="block text-[10px] text-muted">{o.name}</span>
                      <span className="block text-xs font-semibold text-accent tabular-nums">+{o.amount}g</span>
                      <span className="block text-[10px] text-faint">{Math.round(o.interest * 100)}% · owe {o.repay}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Towers</p>
            <div className={`flex gap-1.5 ${hud.selected ? "flex-row flex-wrap" : "overflow-x-auto pb-0.5 lg:flex-col lg:overflow-hidden"}`}>
              {TOWER_ORDER.map((id, i) => (
                <TowerCard
                  key={id}
                  id={id}
                  index={i + 1}
                  gold={hud.gold}
                  active={hud.shop === id}
                  compact={!!hud.selected}
                  onPick={() => e?.setShop(id)}
                />
              ))}
            </div>
            {hud.selected ? (
              <UpgradePanel
                sel={hud.selected}
                gold={hud.gold}
                onDmg={() => e?.upgradeDamage()}
                onDef={() => e?.upgradeDefense()}
                onRng={() => e?.upgradeRange()}
                onRate={() => e?.upgradeRate()}
                onRepair={() => e?.repairSelected()}
                onSell={() => e?.sellSelected()}
              />
            ) : (
              <p className="hidden text-[11px] leading-snug text-faint lg:block">
                Pick a tower, then tap grass beside the path to place it. A wrecked post returns a fifth of its buy
                price. Spend gold to raise attack, defense, range, or fire rate — once each. Repair hull twice: worse
                damage and the second patch cost more.
              </p>
            )}
          </aside>
        ) : null}
      </div>
      {codex ? <Codex onClose={closeCodex} /> : null}
      </div>
    </div>
  );
}

function SiteNav() {
  const links = [
    { href: "https://gizmokitten.io", label: "HOME", icon: "fa-home" },
    { href: "https://gizmokitten.io/gifs/gifs.html", label: "GIFS", icon: "fa-image" },
    { href: "https://gizmokitten.io/animations/animations.html", label: "ANIMATIONS", icon: "fa-film" },
    { href: "https://gizmokitten.io/music/music.html", label: "MUSIC", icon: "fa-music" },
    { href: "https://gizmokitten.io/games/games.html", label: "GAMES", icon: "fa-gamepad", active: true },
    { href: "https://gizmokitten.io/comics/comics.html", label: "COMICS", icon: "fa-book" },
    { href: "https://gizmokitten.io/shop/shop.html", label: "SHOP", icon: "fa-store" },
  ];
  return (
    <nav
      className="shrink-0 border-b border-[#f7931a]/30 bg-[#0A0A0A] text-white"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between">
          <a href="https://gizmokitten.io" className="flex items-center">
            <div>
              <span
                className="block text-2xl font-bold tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                GIZMO
              </span>
              <span className="-mt-1 block text-sm text-[#f7931a]">imaginary kitten</span>
            </div>
          </a>
          <div className="hidden items-center gap-6 text-sm font-medium md:flex lg:gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`flex items-center gap-1 font-medium tracking-[0.5px] transition-colors hover:text-[#f7931a] ${
                  l.active ? "text-[#f7931a]" : "text-white"
                }`}
              >
                <i className={`fas ${l.icon}`} /> {l.label}
              </a>
            ))}
          </div>
          <a
            href="https://gizmokitten.io/support/support.html"
            className="rounded-2xl bg-[#f7931a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 sm:px-6"
          >
            SUPPORT GIZMO
          </a>
        </div>
        <div className="pb-4 md:hidden">
          <div className="flex flex-wrap justify-center gap-1.5 px-1">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`min-w-[68px] rounded-xl px-2 py-2.5 text-center text-[9.5px] font-medium whitespace-nowrap transition-colors ${
                  l.active ? "bg-[#f7931a] text-[#0A0A0A]" : "bg-white/8 text-white hover:bg-[#f7931a]/20"
                }`}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Stat({
  icon,
  label,
  value,
  gold,
  danger,
}: {
  icon?: ReactNode;
  label: string;
  value: string | number;
  gold?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-raised px-1.5 py-1 text-right">
      <p className="text-[9px] tracking-wide text-muted uppercase">{label}</p>
      <p
        className={`flex items-center justify-end gap-1 font-display text-sm font-semibold tabular-nums ${danger ? "text-danger" : gold ? "text-gold" : "text-fg"}`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}

function TowerCard({
  id,
  index,
  gold,
  active,
  compact,
  onPick,
}: {
  id: TowerId;
  index: number;
  gold: number;
  active: boolean;
  compact?: boolean;
  onPick: () => void;
}) {
  const t = TOWERS[id];
  const afford = gold >= t.cost;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={!afford && !active}
      className={`flex items-center gap-1.5 rounded-lg border text-left transition-colors ${
        compact ? "min-w-0 flex-1 px-1 py-1 lg:px-1.5" : "min-w-[140px] px-2 py-1.5 lg:min-w-0"
      } ${
        active
          ? "border-accent bg-raised"
          : afford
            ? "border-border bg-bg hover:border-muted"
            : "border-border bg-bg opacity-45"
      }`}
    >
      <img src={assetUrl(`towers/${id}.png`)} alt="" className={compact ? "size-7 object-contain" : "size-9 object-contain"} />
      {compact ? (
        <span className="text-[10px] text-faint">{index}</span>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            <span className="mr-1 text-faint">{index}</span>
            {t.name}
          </p>
          <p className="text-[11px] text-muted">
            {t.cost}g · r{t.range.toFixed(1)} · {t.rate.toFixed(1)}/s
          </p>
        </div>
      )}
    </button>
  );
}

function upPct(mult: number) {
  const n = Math.round((mult - 1) * 1000) / 10;
  return Number.isInteger(n) ? `+${n}%` : `+${n.toFixed(1)}%`;
}

function UpgradePanel({
  sel,
  gold,
  onDmg,
  onDef,
  onRng,
  onRate,
  onRepair,
  onSell,
}: {
  sel: NonNullable<Hud["selected"]>;
  gold: number;
  onDmg: () => void;
  onDef: () => void;
  onRng: () => void;
  onRate: () => void;
  onRepair: () => void;
  onSell: () => void;
}) {
  const missing = sel.maxHp > 0 ? 1 - sel.hp / sel.maxHp : 0;
  return (
    <div className="min-h-0 rounded-lg border border-border bg-bg p-2">
      <p className="font-display text-sm font-semibold leading-tight">{sel.name}</p>
      <p className="mt-0.5 text-[10px] tabular-nums text-faint">
        Hull {sel.hp}/{sel.maxHp}
        {missing > 0.008 ? ` · ${Math.round(missing * 100)}% dmg` : ""}
      </p>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-raised">
        <div
          className="h-full rounded-full bg-sage"
          style={{ width: `${Math.max(0, Math.min(100, (sel.hp / sel.maxHp) * 100))}%` }}
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onDmg}
          disabled={sel.dmgCost === null || gold < (sel.dmgCost ?? 0)}
          className="rounded-md border border-border bg-raised px-1.5 py-1.5 text-left disabled:opacity-40"
        >
          <p className="flex items-center gap-1 text-[10px] text-muted">
            <Crosshair className="size-3" /> Atk {sel.dmgLv}/1
          </p>
          <p className="text-xs font-medium">
            {sel.dmgCost === null ? "Max" : `${sel.dmgCost}g`}{" "}
            <span className="text-[10px] font-normal text-sage">{upPct(ATK_DMG_MULT)}</span>
          </p>
        </button>
        <button
          type="button"
          onClick={onDef}
          disabled={sel.defCost === null || gold < (sel.defCost ?? 0)}
          className="rounded-md border border-border bg-raised px-1.5 py-1.5 text-left disabled:opacity-40"
        >
          <p className="flex items-center gap-1 text-[10px] text-muted">
            <Shield className="size-3" /> Def {sel.defLv}/1
          </p>
          <p className="text-xs font-medium">
            {sel.defCost === null ? "Max" : `${sel.defCost}g`}{" "}
            <span className="text-[10px] font-normal text-sage">{upPct(DEF_HP_MULT)}</span>
          </p>
        </button>
        <button
          type="button"
          onClick={onRng}
          disabled={sel.rngCost === null || gold < (sel.rngCost ?? 0)}
          className="rounded-md border border-border bg-raised px-1.5 py-1.5 text-left disabled:opacity-40"
        >
          <p className="flex items-center gap-1 text-[10px] text-muted">
            <Radius className="size-3" /> Rng {sel.rngLv}/1
          </p>
          <p className="text-xs font-medium">
            {sel.rngCost === null ? "Max" : `${sel.rngCost}g`}{" "}
            <span className="text-[10px] font-normal text-sage">{upPct(RNG_MULT)}</span>
          </p>
        </button>
        <button
          type="button"
          onClick={onRate}
          disabled={sel.rateCost === null || gold < (sel.rateCost ?? 0)}
          className="rounded-md border border-border bg-raised px-1.5 py-1.5 text-left disabled:opacity-40"
        >
          <p className="flex items-center gap-1 text-[10px] text-muted">
            <Zap className="size-3" /> Spd {sel.rateLv}/1
          </p>
          <p className="text-xs font-medium">
            {sel.rateCost === null ? "Max" : `${sel.rateCost}g`}{" "}
            <span className="text-[10px] font-normal text-sage">{upPct(RATE_MULT)}</span>
          </p>
        </button>
      </div>
      <button
        type="button"
        onClick={onRepair}
        disabled={sel.repairCost === null || sel.repairCost <= 0 || gold < sel.repairCost}
        className="mt-1.5 flex w-full items-center justify-between rounded-md border border-border bg-raised px-2 py-1.5 text-left disabled:opacity-40"
      >
        <span className="flex items-center gap-1 text-xs">
          <Heart className="size-3 text-danger" /> Repair {sel.repairsUsed}/2
        </span>
        <span className="text-xs font-medium">
          {sel.repairCost === null ? "Max" : sel.repairCost <= 0 ? "Full" : `${sel.repairCost}g`}
        </span>
      </button>
      <button
        type="button"
        onClick={onSell}
        className="mt-1 w-full rounded-md border border-border px-2 py-1 text-[11px] text-muted hover:text-fg"
      >
        Sell for {sel.sell}g
      </button>
    </div>
  );
}

function TitleOverlay({
  onPlay,
  onContinue,
  onNewGame,
  onCodex,
  hasSave,
  ready,
  loadProgress,
}: {
  onPlay: () => void;
  onContinue: () => void;
  onNewGame: () => void;
  onCodex: () => void;
  hasSave: boolean;
  ready: boolean;
  loadProgress: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(loadProgress * 100)));
  return (
    <div className="absolute inset-0 overflow-auto bg-bg">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-55"
        style={{ backgroundImage: `url(${assetUrl("cover.png?v=5")})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/30" />
      <div className="relative mx-auto flex min-h-full max-w-lg flex-col justify-center gap-5 px-5 py-10">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-muted uppercase">Gizmo Kitten · tower defense</p>
          <h2 className="mt-1 font-display text-4xl leading-none font-semibold sm:text-5xl">Gizmo Attack</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Twenty lands. Villain Gizmos march, shoot back, and will topple a post if you leave it exposed. Place
            towers, farm gold, and hold every vault from the garden to the Village.
          </p>
        </div>
        <ul className="grid gap-2 text-sm text-muted">
          <li className="flex gap-2">
            <Wind className="mt-0.5 size-4 shrink-0 text-accent" />
            Archer, Warrior, Mage, Ork, Horseman, Sorcerer, Tyrant, Warlord.
          </li>
          <li className="flex gap-2">
            <Zap className="mt-0.5 size-4 shrink-0 text-accent" />
            Clear eight waves to open the next map. Towers reset; gold and lives travel with you.
          </li>
        </ul>
        <div className="flex flex-col items-start gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {hasSave ? (
              <>
                <Action onClick={onContinue} disabled={!ready}>
                  {ready ? "Continue" : "Loading…"}
                </Action>
                <Ghost onClick={onNewGame} disabled={!ready}>
                  New game
                </Ghost>
              </>
            ) : (
              <Action onClick={onPlay} disabled={!ready}>
                {ready ? "Enter the garden" : "Loading…"}
              </Action>
            )}
            <Ghost onClick={onCodex}>
              <CircleHelp className="size-4" /> Codex
            </Ghost>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-1 flex items-center justify-between text-[10px] tracking-wide text-accent uppercase">
              <span>{ready ? "Ready" : "Loading game"}</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-accent/25">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-faint">
          {hasSave
            ? "Progress is saved on this device. Continue picks up land, gold, lives, and towers."
            : "Keys 1–5 place towers · Space starts the wave · F speeds up · P pauses"}
        </p>
      </div>
    </div>
  );
}

const CODEX_TABS = ["How to play", "Towers", "Villains", "Economy", "Loans", "Lands"] as const;
type CodexTab = (typeof CODEX_TABS)[number];

const VILLAIN_LORE: Record<string, { effect: string; lore: string }> = {
  archer: {
    effect: "Five Bows. A fan of five: center full power, next pair 70%, outer pair 40%. Each bow stops on the first post it meets — no pierce.",
    lore: "Garden sentries who turned their bows on the village after the Warlord’s call. Paper-thin, but they never miss a lonely post.",
  },
  warrior: {
    effect: "Twin Cut. Two overlapping dagger slashes. First hit enrages them: +18% attack rate until they leak or die.",
    lore: "Field knives and a grin. They rush the palisade and cut whatever is closest. Cheap to stop, costly if they swarm.",
  },
  mage: {
    effect: "Shockwave. A yellow ring hits every post; damage falls off sharply with distance.",
    lore: "Apprentices of the hedge school. Their starbolts sting from across the fountain. Glass hulls — laser food.",
  },
  ork: {
    effect: "Ground Crack. Club smash plus a fissure toward the target. Towers on that line permanently lose defense (take more damage, stacks to +40%).",
    lore: "Hill brutes hired as living rams. Every swing splits the turf. A cracked post never quite stands the same.",
  },
  cavalry: {
    effect: "Lance Ring. Tight steel circle, then the spear. First hit spurs the horse: +10% speed until the village.",
    lore: "Knight-horsemen of the dusk banner. They are through the bend before the mortar finishes winding.",
  },
  sorcerer: {
    effect: "Hex Ring. Purple spell around the caster. Towers in the ring permanently lose fire rate and range (stacks, floor 67%).",
    lore: "Adept of the purple orb. They do not chase posts — they curse the whole battery so the garden shoots slower and shorter.",
  },
  tyrant: {
    effect: "Axe Swipe. Wide crescent. Weakens tower attack −28% for 4s. Immune to Yarn Wrap. Each hit they take raises defense 2.5% (cap +30%).",
    lore: "Plate, skull-shield, and a two-handed axe. Slow as a siege, but one swipe leaves every nearby post trembling.",
  },
  warlord: {
    effect: "Quake Crown. Rocky ring, 1.72× damage. Immune to Yarn, Catnip, Laser burn, and Mortar shred. Each hit they take raises attack 3% (cap +35%). Kill: +2 lives.",
    lore: "The grinning commander. When he plants both swords, the earth stands up in a crown of stone. Bring him down and the village cheers you two lives back.",
  },
};

const TOWER_LORE: Record<TowerId, { effect: string; lore: string }> = {
  scratch: {
    effect: "Claw Swipe. Fast melee plus a small cleave. Scratch marks only — no extra status.",
    lore: "A rubbing post planted like a spear. Cats remember it; villains learn it. Cheap, tanky, and it shreds the lane lip.",
  },
  yarn: {
    effect: "Yarn Wrap. Homing spindle. Binds: −55% move speed for 2.4s. Tyrants and Warlords ignore the wrap.",
    lore: "A siege cannon stuffed with leftover knitting. The ball never forgets a face. Mid range, honest damage.",
  },
  laser: {
    effect: "Hot Dot. Instant beam, then a heavy burn for ~2.6s. Warlords ignore the burn.",
    lore: "A pointer stolen from a reading lamp. Fragile wood, cruel light. Best on armored hulls that outrun yarn.",
  },
  catnip: {
    effect: "Catnip Mist. Thick green fog. Confuses a cluster: −40% attack range and −45% attack rate for 2.6s. Does not slow feet. Warlords ignore the fog.",
    lore: "A crate of the good stuff. Villains wander, sneeze, and forget why they were running. Pair it with mortar.",
  },
  mortar: {
    effect: "Hairball Spin. Arcing splash. Spinning ring; enemies inside lose half their armor for 3.2s. Warlords ignore the shred.",
    lore: "A cauldron that coughs hairballs over walls. Slow to wind, rude to crowds, stout as a barn.",
  },
};

function Codex({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<CodexTab>("How to play");
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-[2px] sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-[min(100%,640px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-[10px] tracking-[0.18em] text-muted uppercase">Gizmo Attack</p>
            <h2 className="font-display text-2xl font-semibold">Codex</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-md border border-border"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-3 py-2">
          {CODEX_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium ${
                tab === t ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 text-sm leading-relaxed text-muted">
          {tab === "How to play" ? (
            <div className="grid gap-3">
              <p>
                Villain Gizmos spawn at the <strong className="text-fg">medieval gate</strong> and march the dirt path
                toward the <strong className="text-fg">village</strong>. If one arrives, you lose a life and recover 25%
                of that villain’s bounty as gold. Zero lives is defeat.
              </p>
              <p>
                Pick a tower (keys 1–5 or the right panel), then tap grass beside the path. Space starts the wave. F
                speeds time. P pauses. Salvage a standing post for {Math.round(SELL_RATE * 100)}% of gold spent on it.
                A wrecked post returns {Math.round(DESTROY_RATE * 100)}% of its buy price.
              </p>
              <p>
                You begin with {START_LIVES} lives and {START_GOLD} gold. Each land has {WAVES_PER_LEVEL} waves. Clear
                the set to march on — towers stay behind. You get a fresh-start purse (280g after land 1, more on later
                lands) plus a scrap of 33% of each leftover post’s invested gold, scaled by remaining hull. If that still
                sits under a floor, gold is topped up so you can plant again. Gold and lives travel. From land 2, a few
                more creeps spawn each map. Villain base stats stay the same; specials and counts do the work.
              </p>
              <p>
                Progress saves on this device. Codex is also on the title screen. Combat pauses while this book is open.
                If the board is thin (few towers, little gold) the next wave spawns fewer villains, slower. A wipe that
                leaves you with one post or none grants rebuild aid so you can plant a Scratch Post. Wave clear also
                pays extra rebuild gold when two or fewer towers still stand. If gold plus standing towers is thin, the
                Bank offers one Low / Mid / High loan. Codex → Loans.
              </p>
            </div>
          ) : null}
          {tab === "Towers" ? (
            <div className="grid gap-4">
              <p>
                Upgrades are once per post: Attack +{Math.round((ATK_DMG_MULT - 1) * 100)}%, Defense/HP +
                {Math.round((DEF_HP_MULT - 1) * 100)}%, Range +{Math.round((RNG_MULT - 1) * 100)}%, Fire rate +
                {Math.round((RATE_MULT - 1) * 100)}%. Repair hull twice (cost scales with missing HP; second patch is
                dearer).
              </p>
              {TOWER_ORDER.map((id) => {
                const t = TOWERS[id];
                const lore = TOWER_LORE[id];
                return (
                  <div key={id} className="rounded-lg border border-border bg-raised/50 p-3">
                    <div className="flex gap-3">
                      <img src={assetUrl(`towers/${id}.png`)} alt="" className="size-14 object-contain" />
                      <div>
                        <h3 className="text-fg font-semibold">{t.name}</h3>
                        <p className="text-[11px] text-faint">
                          {t.cost}g · dmg {t.damage} · range {t.range} · {t.rate}/s · hull {t.hp}
                        </p>
                        <p className="text-[11px] text-faint">
                          Atk up {towerAtkCost(id)}g · Def {towerDefCost(id)}g · Rng {towerRngCost(id)}g · Spd{" "}
                          {towerRateCost(id)}g
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-accent">{lore.effect}</p>
                    <p className="mt-1">{lore.lore}</p>
                  </div>
                );
              })}
            </div>
          ) : null}
          {tab === "Villains" ? (
            <div className="grid gap-4">
              <p>They appear in this order, light to heavy. Armor reduces incoming damage. Bounty is paid on a kill.</p>
              {ENEMY_IDS.map((id) => {
                const v = ENEMIES[id];
                const lore = VILLAIN_LORE[id];
                return (
                  <div key={id} className="rounded-lg border border-border bg-raised/50 p-3">
                    <div className="flex gap-3">
                      <img src={assetUrl(`enemies/${id}.png`)} alt="" className="h-16 w-12 object-contain" />
                      <div>
                        <h3 className="text-fg font-semibold">{v.name}</h3>
                        <p className="text-[11px] text-faint">
                          HP {v.hp} · spd {v.speed} · armor {Math.round(v.armor * 100)}% · atk {v.atkDmg} · range{" "}
                          {v.atkRange} · {v.atkRate}/s · bounty {v.gold}g
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-accent">{lore.effect}</p>
                    <p className="mt-1">{lore.lore}</p>
                  </div>
                );
              })}
            </div>
          ) : null}
          {tab === "Economy" ? (
            <ul className="grid list-disc gap-2 pl-4">
              <li>Kill bounty is listed on each villain. A leak pays 25% of that bounty and costs 1 life.</li>
              <li>Warlord kill: +2 lives (cap 30).</li>
              <li>Sell a standing tower: {Math.round(SELL_RATE * 100)}% of gold invested (buy + upgrades).</li>
              <li>Destroyed tower salvage: {Math.round(DESTROY_RATE * 100)}% of the original buy price. If that wreck leaves you with one post or none and under 90g, you get rebuild aid up to 90g so you can plant again.</li>
              <li>The next wave watches your board. Few towers or a thin stash means fewer villains, spaced further apart (never below ~62% of the listed wave). A healthy battery fights the full roster. You will see “the path thins — rebuild” when mercy is on.</li>
              <li>Wave clear pays extra rebuild gold if two or fewer posts remain (24g per missing post below 3).</li>
              <li>Repair: twice per post. Cost = buy × missing HP × 0.55 × (1st ×1, 2nd ×1.85).</li>
              <li>When you leave a land, leftover towers scrap for 33% of gold invested, multiplied by remaining HP. On top of that you get a fresh-start purse: 280g after the first land, +55g per land after that. If gold would still sit below 260g + 30g per land, it is topped up to that floor so you can rebuild a core (Scratch + Yarn + more as lands go on).</li>
              <li>That scrap stacks on top of the land-clear gold bonus. You also gain +3 lives (capped a little above the start).</li>
              <li>Progress is local to this browser until you add a cloud account.</li>
            </ul>
          ) : null}
          {tab === "Loans" ? (
            <div className="grid gap-3">
              <p>
                The village bank opens only when you are down bad: gold plus the gold invested in standing towers sits
                under {loanPovertyLine(0)}g on land 1, and the line rises about 38g per land. One loan at a time. A
                second note is refused until the first is paid in full with interest.
              </p>
              <p>
                Three notes, bigger on later lands. Interest is added up front (you owe principal + interest). A slice
                of every villain bounty (and leak gold) is garnished until the debt hits zero.
              </p>
              <div className="grid gap-2">
                {LOAN_TIERS.map((t) => (
                  <div key={t.id} className="rounded-lg border border-border bg-raised/50 p-3">
                    <h3 className="text-fg font-semibold">{t.name} note</h3>
                    <p className="text-[11px] text-faint">
                      Land 1: {loanPrincipal(0, t.id)}g · land 5: {loanPrincipal(4, t.id)}g · land 10:{" "}
                      {loanPrincipal(9, t.id)}g
                    </p>
                    <p className="mt-1">
                      Interest {Math.round(t.interest * 100)}%. Garnish {Math.round(t.garnish * 100)}% of opponent gold
                      until repaid.
                    </p>
                  </div>
                ))}
              </div>
              <p>
                High is a lot of posts right now and a long garnish. Low is a Scratch Post and a Yarn with a light bite.
                Land-clear purses and scrap are not garnished — that gold is yours to rebuild.
              </p>
            </div>
          ) : null}
          {tab === "Lands" ? (
            <div className="grid gap-2">
              <p>Twenty maps. Paths get twistier. From land 2, creep counts rise about 3% per land. Hazards:</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>Fountains and water — you cannot plant in the wet.</li>
                <li>Moving sand — swallows a post if it drifts over it.</li>
                <li>Lava — burns neighboring towers.</li>
                <li>Hedges, cliffs, and mazes starve you of plant tiles. Place early, spend later.</li>
              </ul>
              <p>
                Strategy: scratch + yarn hold the first lands. Laser burns Tyrants and Warlords. Catnip confuses casters
                so their hexes fire slower. Mortar shreds armor for the laser. Keep one cheap post as bait so Ork cracks
                and Sorcerer hexes do not land on your only laser.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-bg/70 px-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

function Action({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Ghost({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-fg disabled:opacity-40"
    >
      {children}
    </button>
  );
}
