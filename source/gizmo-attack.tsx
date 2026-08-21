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
} from "lucide-react";
import { mountGizmoEngine, type Hud, type GizmoEngine } from "@/game/engine";
import { TOWERS, TOWER_ORDER, ATK_DMG_MULT, DEF_HP_MULT, RNG_MULT, RATE_MULT, type TowerId } from "@/game/config";

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

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#0A0A0A] text-white">
      {embedded ? null : <SiteNav />}

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
              best={best}
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
                    Start wave {hud.wave}
                  </button>
                ) : (
                  <span className="px-2 text-xs text-muted">{hud.remaining} on the path</span>
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
    <nav className="shrink-0 border-b border-[#f7931a]/30 bg-[#0A0A0A] text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:h-20 sm:px-6">
        <a href="https://gizmokitten.io" className="min-w-0">
          <span className="block font-['Playfair_Display',serif] text-xl font-bold tracking-tight sm:text-2xl">
            GIZMO
          </span>
          <span className="-mt-1 block text-[11px] text-[#f7931a] sm:text-sm">imaginary kitten</span>
        </a>
        <div className="hidden items-center gap-5 text-sm font-medium md:flex lg:gap-7">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`tracking-wide transition-colors hover:text-[#f7931a] ${l.active ? "text-[#f7931a]" : "text-white"}`}
            >
              {l.label}
            </a>
          ))}
        </div>
        <a
          href="https://gizmokitten.io/support/support.html"
          className="shrink-0 rounded-2xl bg-[#f7931a] px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 sm:px-5 sm:py-2.5 sm:text-sm"
        >
          SUPPORT GIZMO
        </a>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 pb-3 text-[11px] text-[#ccc] md:hidden">
        {links.map((l) => (
          <a key={l.label} href={l.href} className={l.active ? "text-[#f7931a]" : "hover:text-[#f7931a]"}>
            {l.label}
          </a>
        ))}
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
  best,
  ready,
  loadProgress,
}: {
  onPlay: () => void;
  best: number;
  ready: boolean;
  loadProgress: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(loadProgress * 100)));
  return (
    <div className="absolute inset-0 overflow-auto bg-bg">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-55"
        style={{ backgroundImage: `url(${assetUrl("cover.jpg?v=3")})` }}
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
            <Action onClick={onPlay} disabled={!ready}>
              {ready ? "Enter the garden" : "Loading…"}
            </Action>
            {best > 0 ? <span className="text-xs text-faint">Best {best}</span> : null}
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
        <p className="text-[11px] text-faint">Keys 1–5 place towers · Space starts the wave · F speeds up · P pauses</p>
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

function Ghost({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-fg"
    >
      {children}
    </button>
  );
}
