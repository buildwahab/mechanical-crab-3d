import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Battery,
  Boxes,
  ChevronDown,
  Cpu,
  Crosshair,
  Eye,
  Gauge,
  Layers,
  Lock,
  Mountain,
  Radio,
  Ruler,
  Thermometer,
  Weight,
  X,
  Zap,
} from "lucide-react";
import { useStore } from "../store";
import type { CreatureDefinition, SectionId } from "../creatures/types";
import { CREATURES } from "../creatures/registry";
import { cameraApi, live } from "../three/live";
import { Btn, Card, Num } from "./kit";
import { InternalLayout, KeyDimensions, ModeGlyph } from "./Diagrams";
import { cn } from "../utils/cn";

/* ================================ Top navigation ================================ */
export const NAV: { id: SectionId; label: string; icon: typeof Eye }[] = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "structure", label: "Structure", icon: Layers },
  { id: "systems", label: "Systems", icon: Cpu },
  { id: "animation", label: "Animation", icon: Activity },
  { id: "exploded", label: "Exploded View", icon: Boxes },
  { id: "blueprint", label: "Blueprint", icon: Ruler },
];

export function TopNav({ creature }: { creature: CreatureDefinition }) {
  const section = useStore((s) => s.section);
  const setSection = useStore((s) => s.setSection);
  const [fps, setFps] = useState(60);
  useEffect(() => {
    const id = setInterval(() => setFps(live.fps), 600);
    return () => clearInterval(id);
  }, []);
  return (
    <nav className="relative z-30 flex items-center gap-3 px-3 py-3 2xl:absolute 2xl:inset-x-0 2xl:top-0 2xl:px-5">
      <div className="hidden shrink-0 items-center gap-2 2xl:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-mono text-[10px] font-bold text-orange">{creature.code.split("-")[0]}</div>
        <div className="leading-tight">
          <div className="font-display text-[12px] font-extrabold tracking-wide">MECH·BIO LAB</div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-black/45">Robotics Research</div>
        </div>
      </div>
      <div className="no-scrollbar mx-auto flex max-w-full gap-1 overflow-x-auto rounded-full p-1 glass">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = section === n.id;
          return (
            <button
              key={n.id}
              aria-label={n.label}
              aria-current={active ? "page" : undefined}
              onClick={() => setSection(n.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] transition",
                active ? "bg-orange text-white shadow-[0_6px_18px_-6px_rgba(255,106,19,0.8)]" : "text-ink/75 hover:bg-black/[0.04] hover:text-ink"
              )}
            >
              <Icon size={14} strokeWidth={2} />
              <span className={cn(active ? "inline" : "hidden sm:inline")}>{n.label}</span>
            </button>
          );
        })}
      </div>
      <div className="hidden shrink-0 items-center gap-3 2xl:flex">
        <div className="text-right font-mono text-[9.5px] uppercase leading-tight tracking-wider text-black/45">
          <div>
            Render <span className="font-bold text-ink">{fps} fps</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> System online
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ================================ Left panel ================================ */
const STAT_ICONS = [Mountain, Ruler, Weight, Zap];

export function LeftPanel({ creature }: { creature: CreatureDefinition }) {
  const setSection = useStore((s) => s.setSection);
  const anim = useStore((s) => s.animation);
  const setAnim = useStore((s) => s.setAnimation);
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <section className="panel-card relative pl-1">
        <span className="inline-block rounded-md bg-orange px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-white">{creature.series}</span>
        <div className="relative mt-2 border-l-2 border-orange pl-3">
          <h1 className="font-display text-[34px] font-black uppercase leading-[0.92] tracking-tight text-ink xl:text-[38px]">
            {creature.name.split(" ").map((w) => (
              <span key={w} className="block">
                {w}
              </span>
            ))}
          </h1>
          <div className="mt-1.5 text-[14px] font-medium text-ink/85">{creature.subtitle}</div>
        </div>
        <p className="mt-2.5 text-[12px] leading-relaxed text-black/60">{creature.description}</p>
        <dl className="mt-3 space-y-1.5">
          {creature.stats.map((s, i) => {
            const Icon = STAT_ICONS[i] ?? Gauge;
            return (
              <div key={s.label} className="flex items-center gap-2 text-[12px]">
                <Icon size={14} className="text-ink/70" />
                <dt className="w-14 font-semibold">{s.label}</dt>
                <dd className="text-black/60">: {s.value}</dd>
              </div>
            );
          })}
        </dl>
        <div className="relative mt-4 flex gap-2">
          <Btn variant="primary" onClick={() => setSection("overview")}>
            Overview
          </Btn>
          <Btn onClick={() => setOpen((o) => !o)}>
            Explore <ChevronDown size={13} className={cn("transition", open && "rotate-180")} />
          </Btn>
          {open && (
            <div className="glass absolute left-0 top-11 z-40 w-64 rounded-xl p-1.5">
              <div className="px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-black/40">Creature library</div>
              {CREATURES.map((c) => (
                <button
                  key={c.id}
                  disabled={c.status !== "online"}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left",
                    c.status === "online" ? "bg-orange/[0.08]" : "cursor-not-allowed opacity-60"
                  )}
                >
                  <span className="w-11 font-mono text-[10px] font-bold text-orange">{c.code}</span>
                  <span className="flex-1">
                    <span className="block text-[11.5px] font-semibold">{c.name}</span>
                    <span className="block text-[9.5px] text-black/45">{c.subtitle}</span>
                  </span>
                  {c.status === "online" ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  ) : (
                    <Lock size={11} className="text-black/40" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <Card title="Mode" sub="Operating">
        <div className="space-y-1">
          {creature.modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setAnim(m.animation)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-1.5 py-1 text-left transition",
                anim === m.animation ? "border-orange/50 bg-orange/[0.07]" : "border-transparent hover:bg-black/[0.03]"
              )}
            >
              <div className="rounded-md bg-white/80 ring-1 ring-black/5">
                <ModeGlyph icon={m.icon} />
              </div>
              <span className="text-[12px] font-semibold">
                {m.label} <span className="font-normal text-black/50">({m.terrain})</span>
              </span>
              {anim === m.animation && <span className="ml-auto mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-orange" />}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Key Dimensions">
        <KeyDimensions width={creature.dimensions.width} height={creature.dimensions.height} />
        <div className="mt-2 grid grid-cols-3 gap-1 text-center">
          {(["width", "length", "height"] as const).map((k) => (
            <div key={k} className="rounded-md bg-black/[0.03] py-1">
              <div className="font-mono text-[8.5px] uppercase tracking-wider text-black/40">{k}</div>
              <div className="text-[11.5px] font-bold">{creature.dimensions[k]}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ================================ Component details ================================ */
export function ComponentDetails({ creature }: { creature: CreatureDefinition }) {
  const selected = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const setSection = useStore((s) => s.setSection);
  const section = useStore((s) => s.section);
  const info = creature.components.find((c) => c.id === selected);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
  }, [selected]);

  if (!info) {
    return (
      <Card title="Selected Component">
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-black/15 p-4">
          <Crosshair className="text-orange" size={22} />
          <p className="text-[11.5px] leading-snug text-black/55">
            Click any part of the model to inspect it. <b className="text-ink">Double-click</b> to focus the camera.
          </p>
        </div>
      </Card>
    );
  }
  const cat = creature.categories.find((c) => c.id === info.category);
  return (
    <Card
      title="Selected Component"
      right={
        <button onClick={() => select(null)} className="rounded p-0.5 text-black/40 hover:bg-black/5 hover:text-ink" title="Clear selection">
          <X size={14} />
        </button>
      }
    >
      <div ref={ref}>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="font-display text-[19px] font-extrabold leading-tight">{info.name}</div>
            <div className="text-[11.5px] text-black/55">{info.subtitle}</div>
          </div>
          <span className="mt-1 flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full" style={{ background: cat?.color }} />
            {cat?.label}
          </span>
        </div>

        <div className="mt-3 space-y-2.5 text-[11.5px]">
          <div>
            <div className="mb-0.5 font-mono text-[9.5px] uppercase tracking-wider text-black/40">Function</div>
            <p className="leading-relaxed text-black/70">{info.function}</p>
          </div>
          <div>
            <div className="mb-0.5 font-mono text-[9.5px] uppercase tracking-wider text-black/40">Material</div>
            <p className="font-medium">{info.material}</p>
          </div>
          <div>
            <div className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-black/40">Mechanical connections</div>
            <div className="flex flex-wrap gap-1">
              {info.connections.map((cid) => {
                const target = creature.components.find((c) => c.id === cid);
                return (
                  <button
                    key={cid}
                    onClick={() => target && select(cid)}
                    className="rounded-md border border-black/10 bg-white/80 px-1.5 py-0.5 text-[10.5px] font-medium hover:border-orange hover:text-orange"
                  >
                    {target?.name ?? cid}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {info.specs.map((s) => (
            <div key={s.label} className="rounded-lg bg-black/[0.035] px-2 py-1.5">
              <div className="font-mono text-[8.5px] uppercase tracking-wider text-black/40">{s.label}</div>
              <div className="text-[12px] font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-wider text-black/40">Internal construction</div>
          <div className="relative flex items-center gap-1 overflow-hidden rounded-lg bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.035)_0_1px,transparent_1px_14px)] px-2 py-2.5">
            {info.construction.map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center">
                <div
                  className="rounded-full border-2 border-ink/80 bg-gradient-to-br from-neutral-500 to-neutral-800 shadow-inner"
                  style={{ width: 18 + (i % 3) * 5, height: 26 + ((i + 1) % 3) * 5, borderColor: i === 0 ? "#ff6a13" : undefined }}
                />
              </div>
            ))}
          </div>
          <ol className="mt-2 space-y-1">
            {info.construction.map((c, i) => (
              <li key={c} className="flex items-center gap-2 text-[11.5px]">
                <Num n={i + 1} /> {c}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Btn variant="primary" onClick={() => cameraApi.focus(info.id)}>
            <Crosshair size={13} /> Close-up
          </Btn>
          <Btn onClick={() => (section === "systems" ? cameraApi.reset() : setSection("systems"))}>
            {section === "systems" ? "Reset view" : "Isolate"}
          </Btn>
        </div>
      </div>
    </Card>
  );
}

export function RightPanelExtras({ creature }: { creature: CreatureDefinition }) {
  const section = useStore((s) => s.section);
  return (
    <>
      {section !== "structure" && section !== "blueprint" && (
        <Card title="Internal Layout" sub="Top view">
          <InternalLayout />
        </Card>
      )}
      <Card title="Specs" sub="Mechanical">
        <ul className="space-y-1.5">
          {creature.specs.map((s) => (
            <li key={s.label} className="flex items-baseline gap-2 border-b border-dashed border-black/[0.07] pb-1.5 text-[11.5px] last:border-0">
              <span className="font-semibold">{s.label}</span>
              <span className="ml-auto text-right text-black/60">{s.value}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

/* ================================ Bottom: system status ================================ */
export function SystemStatus() {
  const [st, setSt] = useState({ power: 87, load: 15, temp: 36, link: -58 });
  useEffect(() => {
    let power = 87;
    const id = setInterval(() => {
      power = Math.max(12, power - live.load * 0.02);
      setSt({
        power,
        load: Math.round(live.load * 100 + Math.random() * 4),
        temp: 34 + live.load * 20 + Math.random() * 0.6,
        link: -56 - Math.round(Math.random() * 6),
      });
    }, 300);
    return () => clearInterval(id);
  }, []);
  const rows = [
    { icon: Battery, label: "Power", value: `${st.power.toFixed(1)}%`, pct: st.power, color: "bg-emerald-500" },
    { icon: Gauge, label: "Motor load", value: `${st.load}%`, pct: st.load, color: "bg-orange" },
    { icon: Thermometer, label: "Core temp", value: `${st.temp.toFixed(1)}°C`, pct: ((st.temp - 20) / 50) * 100, color: "bg-amber-500" },
    { icon: Radio, label: "Link", value: `${st.link} dBm`, pct: 100 + st.link, color: "bg-sky-600" },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-center gap-1.5 text-[10.5px]">
            <r.icon size={12} className="text-black/50" />
            <span className="text-black/55">{r.label}</span>
            <span className="ml-auto font-mono font-semibold">{r.value}</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/[0.07]">
            <div className={cn("h-full rounded-full transition-all duration-300", r.color)} style={{ width: `${Math.min(100, Math.max(2, r.pct))}%` }} />
          </div>
        </div>
      ))}
      <div className="col-span-2 mt-0.5 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-wider text-black/45">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Servos 30/30
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Motors 8/8
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> IMU lock
      </div>
    </div>
  );
}
