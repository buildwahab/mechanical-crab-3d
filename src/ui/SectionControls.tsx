import { Boxes, Eye, EyeOff, Layers, Pause, Play, RotateCcw, Scissors, Snail, Tag } from "lucide-react";
import { useStore } from "../store";
import type { CreatureDefinition } from "../creatures/types";
import { cameraApi } from "../three/live";
import { Btn, Card, Segmented, Slider, Toggle } from "./kit";
import { BlueprintSheet, InternalLayout } from "./Diagrams";
import { cn } from "../utils/cn";

function OverviewControls({ creature }: { creature: CreatureDefinition }) {
  const autoRotate = useStore((s) => s.autoRotate);
  const setAutoRotate = useStore((s) => s.setAutoRotate);
  const showLabels = useStore((s) => s.showLabels);
  const setShowLabels = useStore((s) => s.setShowLabels);
  const select = useStore((s) => s.select);
  const selected = useStore((s) => s.selectedId);
  const external = creature.components.filter((c) => c.callout || ["optic-cluster", "antenna", "chassis"].includes(c.id));
  return (
    <Card title="Overview" sub="Section 01">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Toggle label="Auto-rotate" checked={autoRotate} onChange={setAutoRotate} icon={<RotateCcw size={13} />} />
        <Toggle label="Callouts" checked={showLabels} onChange={setShowLabels} icon={<Tag size={13} />} />
      </div>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-black/45">External components</div>
      <div className="flex flex-wrap gap-1.5">
        {external.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              select(c.id);
              cameraApi.focus(c.id);
            }}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition",
              selected === c.id ? "border-orange bg-orange text-white" : "border-black/10 bg-white/70 hover:border-orange/50"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
    </Card>
  );
}

function StructureControls({ creature }: { creature: CreatureDefinition }) {
  const armor = useStore((s) => s.armorOpacity);
  const setArmor = useStore((s) => s.setArmorOpacity);
  const hidden = useStore((s) => s.hiddenCategories);
  const toggle = useStore((s) => s.toggleCategory);
  const setHidden = useStore((s) => s.setHiddenCategories);
  const clip = useStore((s) => s.clipEnabled);
  const setClip = useStore((s) => s.setClipEnabled);
  const clipPos = useStore((s) => s.clipPos);
  const setClipPos = useStore((s) => s.setClipPos);
  return (
    <Card title="Internal Structure" sub="Section 02">
      <Slider label="Armor opacity" value={armor} min={0} max={1} onChange={setArmor} format={(v) => `${Math.round(v * 100)}%`} />
      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
        <Btn onClick={() => setArmor(0)} active={armor < 0.02}>Remove</Btn>
        <Btn onClick={() => setArmor(0.15)} active={armor > 0.05 && armor < 0.5}>Ghost</Btn>
        <Btn onClick={() => setArmor(1)} active={armor > 0.98}>Solid</Btn>
      </div>
      <div className="mb-1.5 mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-black/45">
        <span>System layers</span>
        <button className="text-orange hover:underline" onClick={() => setHidden([])}>Show all</button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {creature.categories.map((c) => {
          const on = !hidden.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[10.5px] font-medium transition",
                on ? "border-black/10 bg-white/80 text-ink" : "border-transparent bg-black/[0.03] text-black/35 line-through"
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: c.color }} />
              <span className="flex-1 truncate">{c.label}</span>
              {on ? <Eye size={12} className="text-black/40" /> : <EyeOff size={12} />}
            </button>
          );
        })}
      </div>
      <div className="mt-3">
        <Toggle label="Cross-section cut (X)" checked={clip} onChange={setClip} icon={<Scissors size={13} />} />
        {clip && (
          <div className="mt-2">
            <Slider label="Cut plane" value={clipPos} min={-3.4} max={3.4} onChange={setClipPos} format={(v) => `${(v * 0.123).toFixed(2)} m`} />
          </div>
        )}
      </div>
      <div className="mt-4 border-t border-black/5 pt-3">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-black/45">Cross section · click to inspect</div>
        <InternalLayout />
      </div>
    </Card>
  );
}

function SystemsControls({ creature }: { creature: CreatureDefinition }) {
  const selected = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const setHover = useStore((s) => s.setHover);
  const cats = creature.categories;
  const main = creature.components.filter((c) => !c.group);
  const claws = creature.components.filter((c) => c.group === "claws");
  const legs = creature.components.filter((c) => c.group === "legs");
  return (
    <Card title="Component Explorer" sub="Section 05">
      <p className="mb-2.5 text-[11px] leading-snug text-black/55">Select a component to isolate it. The rest of the assembly is ghosted and the camera frames a close-up.</p>
      <ul className="space-y-1">
        {main.map((c) => {
          const cat = cats.find((k) => k.id === c.category);
          return (
            <li key={c.id}>
              <button
                onClick={() => select(c.id)}
                onMouseEnter={() => setHover(c.id)}
                onMouseLeave={() => setHover(null)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition",
                  selected === c.id ? "bg-ink text-white" : "hover:bg-black/[0.04]"
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: cat?.color }} />
                <span className="flex-1 text-[11.5px] font-semibold">{c.name}</span>
                <span className={cn("font-mono text-[9px] uppercase", selected === c.id ? "text-white/60" : "text-black/35")}>{cat?.label.split(" ")[0]}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mb-1.5 mt-3 font-mono text-[10px] uppercase tracking-wider text-black/45">Manipulators</div>
      <div className="grid grid-cols-2 gap-1.5">
        {claws.map((c) => (
          <Btn key={c.id} onClick={() => select(c.id)} active={selected === c.id}>
            {c.name.replace("Adaptive ", "")}
          </Btn>
        ))}
      </div>
      <div className="mb-1.5 mt-3 font-mono text-[10px] uppercase tracking-wider text-black/45">Walking legs</div>
      <div className="grid grid-cols-4 gap-1.5">
        {legs.map((c) => (
          <Btn key={c.id} onClick={() => select(c.id)} active={selected === c.id} className="px-1">
            {c.id.replace("leg-", "")}
          </Btn>
        ))}
      </div>
    </Card>
  );
}

function AnimationControls({ creature }: { creature: CreatureDefinition }) {
  const anim = useStore((s) => s.animation);
  const setAnim = useStore((s) => s.setAnimation);
  const manual = useStore((s) => s.manual);
  const setManual = useStore((s) => s.setManual);
  const legNames = ["R1", "R2", "R3", "R4", "L1", "L2", "L3", "L4"];
  return (
    <Card title="Movement Simulation" sub="Section 04">
      <div className="space-y-1">
        {creature.animations.map((a) => (
          <button
            key={a.id}
            onClick={() => setAnim(a.id)}
            className={cn(
              "w-full rounded-lg border px-2.5 py-2 text-left transition",
              anim === a.id ? "border-orange/50 bg-orange/[0.08]" : "border-transparent hover:bg-black/[0.03]"
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("h-1.5 w-1.5 rounded-full", anim === a.id ? "animate-pulse bg-orange" : "bg-black/20")} />
              <span className="text-[11.5px] font-bold">{a.label}</span>
              <span className="ml-auto font-mono text-[9.5px] text-black/40">{a.id === "manual" ? "RIG" : `${a.duration.toFixed(1)}s`}</span>
            </div>
            {anim === a.id && <p className="mt-1 pl-3.5 text-[10.5px] leading-snug text-black/55">{a.description}</p>}
          </button>
        ))}
      </div>
      {anim === "manual" && (
        <div className="mt-3 space-y-2.5 border-t border-black/5 pt-3">
          <div className="grid grid-cols-4 gap-1">
            {legNames.map((n, i) => (
              <Btn key={n} onClick={() => setManual({ leg: i })} active={manual.leg === i} className="px-1 py-1.5">
                {n}
              </Btn>
            ))}
          </div>
          <Slider label="Coxa yaw" value={manual.yaw} min={-0.6} max={0.6} onChange={(v) => setManual({ yaw: v })} format={(v) => `${Math.round((v * 180) / Math.PI)}°`} />
          <Slider label="Femur lift" value={manual.lift} min={-0.4} max={1.1} onChange={(v) => setManual({ lift: v })} format={(v) => `${Math.round((v * 180) / Math.PI)}°`} />
          <Slider label="Tibia (knee)" value={manual.knee} min={-0.6} max={1.0} onChange={(v) => setManual({ knee: v })} format={(v) => `${Math.round((v * 180) / Math.PI)}°`} />
          <Slider label="Tarsus (ankle)" value={manual.ankle} min={-0.6} max={0.9} onChange={(v) => setManual({ ankle: v })} format={(v) => `${Math.round((v * 180) / Math.PI)}°`} />
          <Slider label="Claw opening" value={manual.claw} min={0} max={0.9} onChange={(v) => setManual({ claw: v })} format={(v) => `${Math.round((v / 0.9) * 100)}%`} />
        </div>
      )}
    </Card>
  );
}

function ExplodedControls() {
  const explode = useStore((s) => s.explode);
  const setExplode = useStore((s) => s.setExplode);
  const explodeTo = useStore((s) => s.explodeTo);
  const slowMo = useStore((s) => s.slowMo);
  const setSlowMo = useStore((s) => s.setSlowMo);
  const showLabels = useStore((s) => s.showLabels);
  const setShowLabels = useStore((s) => s.setShowLabels);
  const playing = useStore((s) => s.playing);
  const setPlaying = useStore((s) => s.setPlaying);
  return (
    <Card title="Exploded View" sub="Section 03">
      <Slider label="Explosion distance" value={explode} min={0} max={1.5} onChange={setExplode} format={(v) => `${Math.round(v * 100)}%`} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Btn variant="primary" onClick={() => explodeTo(Math.max(1, explode + 0.0001))}>
          <Boxes size={13} /> Explode
        </Btn>
        <Btn variant="dark" onClick={() => explodeTo(0)}>
          <Layers size={13} /> Reassemble
        </Btn>
      </div>
      <div className="mb-1.5 mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-black/45">
        <Snail size={12} /> Slow motion
      </div>
      <Segmented
        value={String(slowMo)}
        options={[
          { id: "1", label: "1×" },
          { id: "0.5", label: "0.5×" },
          { id: "0.25", label: "0.25×" },
          { id: "0.1", label: "0.1×" },
        ]}
        onChange={(v) => setSlowMo(parseFloat(v))}
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Toggle label="Labels" checked={showLabels} onChange={setShowLabels} icon={<Tag size={13} />} />
        <Btn onClick={() => setPlaying(!playing)} active={playing}>
          {playing ? <Pause size={12} /> : <Play size={12} />} Idle
        </Btn>
      </div>
      <p className="mt-3 text-[10.5px] leading-snug text-black/50">Click any separated part to inspect it. Double-click to fly the camera to it.</p>
    </Card>
  );
}

function BlueprintControls({ creature }: { creature: CreatureDefinition }) {
  const style = useStore((s) => s.renderStyle);
  const setStyle = useStore((s) => s.setRenderStyle);
  const clip = useStore((s) => s.clipEnabled);
  const setClip = useStore((s) => s.setClipEnabled);
  const axis = useStore((s) => s.clipAxis);
  const setAxis = useStore((s) => s.setClipAxis);
  const clipPos = useStore((s) => s.clipPos);
  const setClipPos = useStore((s) => s.setClipPos);
  const dims = useStore((s) => s.showDims);
  const setDims = useStore((s) => s.setShowDims);
  const range = axis === "y" ? [0, 2.6] : axis === "x" ? [-3.4, 3.4] : [-2.3, 3.4];
  return (
    <Card title="Technical Blueprint" sub="Section 06">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-black/45">Camera views</div>
      <div className="grid grid-cols-4 gap-1.5">
        {(["top", "front", "side", "iso"] as const).map((p) => (
          <Btn key={p} onClick={() => cameraApi.goTo(creature.cameraPresets[p])} className="px-1">
            {p}
          </Btn>
        ))}
      </div>
      <div className="mb-1.5 mt-3 font-mono text-[10px] uppercase tracking-wider text-black/45">Render style</div>
      <Segmented
        value={style}
        options={[
          { id: "shaded", label: "Shaded" },
          { id: "wire", label: "Wireframe" },
          { id: "xray", label: "X-Ray" },
        ]}
        onChange={setStyle}
      />
      <div className="mt-3 space-y-2">
        <Toggle label="Dimension lines" checked={dims} onChange={setDims} />
        <Toggle label="Section cut" checked={clip} onChange={setClip} icon={<Scissors size={13} />} />
      </div>
      {clip && (
        <div className="mt-2.5 space-y-2">
          <Segmented
            value={axis}
            options={[
              { id: "x", label: "X · Sagittal" },
              { id: "z", label: "Z · Frontal" },
              { id: "y", label: "Y · Plan" },
            ]}
            onChange={setAxis}
          />
          <Slider label="Plane offset" value={clipPos} min={range[0]} max={range[1]} onChange={setClipPos} format={(v) => `${(v * 0.123).toFixed(3)} m`} />
        </div>
      )}
      <div className="mt-4 overflow-hidden rounded-lg">
        <BlueprintSheet />
      </div>
    </Card>
  );
}

export default function SectionControls({ creature }: { creature: CreatureDefinition }) {
  const section = useStore((s) => s.section);
  switch (section) {
    case "structure":
      return <StructureControls creature={creature} />;
    case "systems":
      return <SystemsControls creature={creature} />;
    case "animation":
      return <AnimationControls creature={creature} />;
    case "exploded":
      return <ExplodedControls />;
    case "blueprint":
      return <BlueprintControls creature={creature} />;
    default:
      return <OverviewControls creature={creature} />;
  }
}
