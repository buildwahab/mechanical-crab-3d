import { useEffect, useState } from "react";
import { Box, Pause, Play, RotateCcw, SkipBack, SkipForward, Video } from "lucide-react";
import { useStore } from "../store";
import type { CameraPresetId, CreatureDefinition } from "../creatures/types";
import { cameraApi, live } from "../three/live";
import { SystemStatus } from "./Panels";
import { cn } from "../utils/cn";

function fmt(t: number) {
  const s = Math.floor(t);
  const cs = Math.floor((t - s) * 100);
  return `00:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function Timeline({ creature }: { creature: CreatureDefinition }) {
  const anim = useStore((s) => s.animation);
  const setAnim = useStore((s) => s.setAnimation);
  const playing = useStore((s) => s.playing);
  const setPlaying = useStore((s) => s.setPlaying);
  const speed = useStore((s) => s.speed);
  const setSpeed = useStore((s) => s.setSpeed);
  const def = creature.animations.find((a) => a.id === anim) ?? creature.animations[0];
  const dur = def?.duration ?? 1;
  const [prog, setProg] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = -1;
    const loop = () => {
      const p = (((live.time % dur) + dur) % dur) / dur;
      if (Math.abs(p - last) > 0.002) {
        last = p;
        setProg(p);
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [dur]);

  const seek = (p: number) => {
    live.time = Math.floor(live.time / dur) * dur + p * dur;
  };
  const step = (d: number) => {
    setPlaying(false);
    live.time = Math.max(0, live.time + d * dur);
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-[13px] font-extrabold uppercase tracking-[0.04em]">Animation Timeline</h3>
        <select
          aria-label="Animation"
          value={anim}
          onChange={(e) => setAnim(e.target.value)}
          className="rounded-md border border-black/10 bg-white/80 px-2 py-1 text-[11px] font-semibold outline-none focus:border-orange"
        >
          {creature.animations.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <span className="ml-auto font-mono text-[10.5px] text-black/55">
          {fmt(prog * dur)} / {fmt(dur)}
        </span>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-[-2px] h-[22px]">
          {def?.keyframes.map((k, i) => (
            <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: `${k.at * 100}%` }}>
              <span className="h-2 w-2 rotate-45 border border-ink/60 bg-white" />
            </div>
          ))}
        </div>
        <input
          aria-label="Animation timeline"
          type="range"
          className="range range-timeline"
          min={0}
          max={1}
          step={0.001}
          value={prog}
          style={{ ["--pct" as string]: `${prog * 100}%` }}
          onPointerDown={() => setPlaying(false)}
          onChange={(e) => seek(parseFloat(e.target.value))}
        />
        <div className="mt-1 flex justify-between font-mono text-[8.5px] uppercase text-black/35">
          {def?.keyframes.slice(0, 8).map((k, i) => (
            <span key={i}>{k.label}</span>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button onClick={() => step(-1 / 24)} className="dock-btn" title="Step back">
            <SkipBack size={14} />
          </button>
          <button
            onClick={() => setPlaying(!playing)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-orange text-white shadow-[0_6px_18px_-6px_rgba(255,106,19,0.8)] transition active:scale-95"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button onClick={() => step(1 / 24)} className="dock-btn" title="Step forward">
            <SkipForward size={14} />
          </button>
          <button onClick={() => (live.time = 0)} className="dock-btn" title="Restart">
            <RotateCcw size={13} />
          </button>
        </div>
        <div className="flex min-w-[170px] flex-1 items-center gap-2">
          <span className="font-mono text-[9.5px] uppercase tracking-wider text-black/45">Speed</span>
          <input
            aria-label="Playback speed"
            type="range"
            className="range flex-1"
            min={0.1}
            max={2.5}
            step={0.05}
            value={speed}
            style={{ ["--pct" as string]: `${((speed - 0.1) / 2.4) * 100}%` }}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <span className="w-9 text-right font-mono text-[11px] font-semibold">{speed.toFixed(2)}×</span>
        </div>
        <div className="flex gap-1">
          {[0.25, 0.5, 1, 2].map((v) => (
            <button
              key={v}
              onClick={() => setSpeed(v)}
              className={cn(
                "rounded-md px-1.5 py-1 font-mono text-[9.5px] font-semibold",
                Math.abs(speed - v) < 0.01 ? "bg-ink text-white" : "bg-black/[0.04] text-black/55 hover:text-ink"
              )}
            >
              {v}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const PRESETS: { id: CameraPresetId; label: string }[] = [
  { id: "iso", label: "Iso" },
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "top", label: "Top" },
  { id: "rear", label: "Rear" },
];

function CameraPresets({ creature }: { creature: CreatureDefinition }) {
  return (
    <div className="w-full 2xl:w-[210px]">
      <h3 className="mb-2 flex items-center gap-1.5 font-display text-[13px] font-extrabold uppercase tracking-[0.04em]">
        <Video size={14} /> Camera
      </h3>
      <div className="grid grid-cols-3 gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => cameraApi.goTo(creature.cameraPresets[p.id])} className="cam-btn">
            <Box size={12} />
            {p.label}
          </button>
        ))}
        <button onClick={() => cameraApi.reset()} className="cam-btn !bg-ink !text-white">
          <RotateCcw size={12} />
          Reset
        </button>
      </div>
    </div>
  );
}

export default function BottomDock({ creature }: { creature: CreatureDefinition }) {
  return (
    <div className="panel-card glass flex flex-col gap-4 rounded-2xl p-4 2xl:flex-row 2xl:items-stretch 2xl:gap-5">
      <Timeline creature={creature} />
      <div className="hidden w-px bg-black/[0.07] 2xl:block" />
      <CameraPresets creature={creature} />
      <div className="hidden w-px bg-black/[0.07] 2xl:block" />
      <div className="w-full 2xl:w-[290px]">
        <h3 className="mb-2 font-display text-[13px] font-extrabold uppercase tracking-[0.04em]">System Status</h3>
        <SystemStatus />
      </div>
    </div>
  );
}
