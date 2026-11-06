import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Crosshair, Hand, MousePointerClick, RotateCcw, ZoomIn } from "lucide-react";
import Viewer from "./scene/Viewer";
import { useStore } from "./store";
import { getCreature } from "./creatures/registry";
import type { SectionId } from "./creatures/types";
import { cameraApi } from "./three/live";
import { ComponentDetails, LeftPanel, RightPanelExtras, TopNav } from "./ui/Panels";
import SectionControls from "./ui/SectionControls";
import BottomDock from "./ui/BottomDock";

const SECTION_META: Record<SectionId, { n: string; title: string; text: string }> = {
  overview: { n: "01", title: "Overview", text: "Complete assembly with live idle systems. Hover and click any component." },
  structure: { n: "02", title: "Internal Structure", text: "Fade or remove the armor to reveal chassis, motors, gears, batteries and wiring." },
  exploded: { n: "03", title: "Exploded View", text: "Every part separates along its assembly axis while keeping relative position." },
  animation: { n: "04", title: "Movement Simulation", text: "Procedural gaits driven by an articulated 38-joint rig." },
  systems: { n: "05", title: "Component Explorer", text: "Isolate any component to inspect function, material and construction." },
  blueprint: { n: "06", title: "Technical Blueprint", text: "Engineering views, section cuts and principal dimensions." },
};

function ViewerOverlay() {
  const section = useStore((s) => s.section);
  const meta = SECTION_META[section];
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current!.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: "power3.out" });
    });
    return () => ctx.revert();
  }, [section]);
  return (
    <>
      <div ref={ref} className="pointer-events-none absolute left-1/2 top-3 z-10 w-[min(92%,460px)] -translate-x-1/2 text-center 2xl:top-[78px]">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-orange">Section {meta.n}</div>
        <div className="font-display text-[20px] font-black uppercase tracking-tight text-ink 2xl:text-[24px]">{meta.title}</div>
        <div className="mx-auto mt-0.5 hidden max-w-sm text-[11.5px] text-black/50 sm:block">{meta.text}</div>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 2xl:bottom-[204px]">
        <div className="glass hidden items-center gap-3 rounded-full px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-black/55 md:flex">
          <span className="flex items-center gap-1"><Hand size={12} /> Drag rotate</span>
          <span className="flex items-center gap-1"><ZoomIn size={12} /> Scroll / pinch zoom</span>
          <span className="flex items-center gap-1"><MousePointerClick size={12} /> Click select</span>
          <span className="flex items-center gap-1"><Crosshair size={12} /> Double-click focus</span>
        </div>
        <button
          onClick={() => cameraApi.reset()}
          className="glass pointer-events-auto flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-ink hover:text-orange"
        >
          <RotateCcw size={12} /> Reset camera
        </button>
      </div>
    </>
  );
}

export default function App() {
  const creatureId = useStore((s) => s.creatureId);
  const section = useStore((s) => s.section);
  const selectedId = useStore((s) => s.selectedId);
  const creature = getCreature(creatureId);
  const root = useRef<HTMLDivElement>(null);

  // camera transitions between sections
  useEffect(() => {
    if (section === "systems") return;
    const p = creature.sectionCameras[section] ?? creature.cameraPresets.iso;
    const t = setTimeout(() => cameraApi.goTo(p), 30);
    return () => clearTimeout(t);
  }, [section, creature]);

  // component explorer close-up
  useEffect(() => {
    if (section !== "systems") return;
    const t = setTimeout(() => {
      if (selectedId) cameraApi.focus(selectedId);
      else cameraApi.reset();
    }, 80);
    return () => clearTimeout(t);
  }, [section, selectedId]);

  // entrance animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".panel-card", { y: 18, opacity: 0, duration: 0.8, stagger: 0.05, ease: "power3.out", delay: 0.15 });
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("is-blueprint", section === "blueprint");
    return () => document.body.classList.remove("is-blueprint");
  }, [section]);

  return (
    <div ref={root} className="app-bg relative flex min-h-screen flex-col text-ink 2xl:block 2xl:h-screen 2xl:overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <TopNav creature={creature} />

      <main className="relative order-1 h-[62vh] min-h-[420px] overflow-hidden 2xl:absolute 2xl:inset-0 2xl:h-auto">
        <Viewer creature={creature} />
        <ViewerOverlay />
      </main>

      <aside className="side-scroll relative z-20 order-4 p-3 2xl:absolute 2xl:bottom-[196px] 2xl:left-4 2xl:top-[72px] 2xl:w-[268px] 2xl:overflow-y-auto 2xl:p-0 2xl:pr-1 xl:w-[296px]">
        <LeftPanel creature={creature} />
      </aside>

      <aside className="side-scroll relative z-20 order-2 space-y-3 p-3 2xl:absolute 2xl:bottom-[196px] 2xl:right-4 2xl:top-[72px] 2xl:w-[310px] 2xl:overflow-y-auto 2xl:p-0 2xl:pl-1 xl:w-[348px]">
        <SectionControls creature={creature} />
        <ComponentDetails creature={creature} />
        <RightPanelExtras creature={creature} />
      </aside>

      <footer className="relative z-20 order-3 p-3 2xl:absolute 2xl:inset-x-4 2xl:bottom-4 2xl:p-0">
        <BottomDock creature={creature} />
      </footer>
    </div>
  );
}
