import { create } from "zustand";
import gsap from "gsap";
import type { RenderStyle, SectionId } from "./creatures/types";
import type { ManualRig } from "./creatures/crab/pose";

export type ClipAxis = "x" | "y" | "z";

interface AppState {
  creatureId: string;
  section: SectionId;
  selectedId: string | null;
  hoveredId: string | null;
  armorOpacity: number;
  hiddenCategories: string[];
  explode: number;
  slowMo: number;
  showLabels: boolean;
  animation: string;
  playing: boolean;
  speed: number;
  renderStyle: RenderStyle;
  clipEnabled: boolean;
  clipAxis: ClipAxis;
  clipPos: number;
  showDims: boolean;
  autoRotate: boolean;
  manual: ManualRig;

  setSection: (s: SectionId) => void;
  select: (id: string | null) => void;
  setHover: (id: string | null) => void;
  setArmorOpacity: (v: number) => void;
  toggleCategory: (id: string) => void;
  setHiddenCategories: (ids: string[]) => void;
  setExplode: (v: number) => void;
  explodeTo: (v: number) => void;
  setSlowMo: (v: number) => void;
  setShowLabels: (v: boolean) => void;
  setAnimation: (id: string) => void;
  setPlaying: (v: boolean) => void;
  setSpeed: (v: number) => void;
  setRenderStyle: (v: RenderStyle) => void;
  setClipEnabled: (v: boolean) => void;
  setClipAxis: (v: ClipAxis) => void;
  setClipPos: (v: number) => void;
  setShowDims: (v: boolean) => void;
  setAutoRotate: (v: boolean) => void;
  setManual: (m: Partial<ManualRig>) => void;
}

const explodeProxy = { v: 0 };
const armorProxy = { v: 1 };

export const useStore = create<AppState>((set, get) => ({
  creatureId: "crab",
  section: "overview",
  selectedId: null,
  hoveredId: null,
  armorOpacity: 1,
  hiddenCategories: [],
  explode: 0,
  slowMo: 1,
  showLabels: true,
  animation: "idle",
  playing: true,
  speed: 1,
  renderStyle: "shaded",
  clipEnabled: false,
  clipAxis: "x",
  clipPos: 0,
  showDims: false,
  autoRotate: false,
  manual: { leg: 0, yaw: 0, lift: 0.4, knee: 0.3, ankle: 0.2, claw: 0.4 },

  setSection: (section) => {
    const s = get();
    const tweenArmor = (to: number) => {
      gsap.killTweensOf(armorProxy);
      armorProxy.v = get().armorOpacity;
      gsap.to(armorProxy, {
        v: to,
        duration: 0.9,
        ease: "power2.inOut",
        onUpdate: () => set({ armorOpacity: armorProxy.v }),
      });
    };
    const base = {
      section,
      clipEnabled: false,
      clipAxis: "x" as ClipAxis,
      clipPos: 0,
      hoveredId: null,
      renderStyle: "shaded" as RenderStyle,
      showDims: false,
      hiddenCategories: [] as string[],
    };
    switch (section) {
      case "overview":
        set({ ...base, animation: "idle", playing: true, selectedId: null });
        tweenArmor(1);
        s.explodeTo(0);
        break;
      case "structure":
        set({ ...base, animation: "idle", playing: true });
        tweenArmor(0.12);
        s.explodeTo(0);
        break;
      case "systems":
        set({ ...base, animation: "idle", playing: true, selectedId: s.selectedId ?? "claw-R" });
        tweenArmor(1);
        s.explodeTo(0);
        break;
      case "animation":
        set({ ...base, animation: s.animation === "idle" ? "walk" : s.animation, playing: true });
        tweenArmor(1);
        s.explodeTo(0);
        break;
      case "exploded":
        set({ ...base, animation: "idle", playing: false });
        tweenArmor(1);
        s.explodeTo(0.85);
        break;
      case "blueprint":
        set({ ...base, renderStyle: "wire", showDims: true, animation: "idle", playing: false });
        tweenArmor(1);
        s.explodeTo(0);
        break;
    }
  },
  select: (selectedId) => set({ selectedId }),
  setHover: (hoveredId) => set({ hoveredId }),
  setArmorOpacity: (armorOpacity) => {
    gsap.killTweensOf(armorProxy);
    set({ armorOpacity });
  },
  toggleCategory: (id) =>
    set((s) => ({
      hiddenCategories: s.hiddenCategories.includes(id)
        ? s.hiddenCategories.filter((c) => c !== id)
        : [...s.hiddenCategories, id],
    })),
  setHiddenCategories: (hiddenCategories) => set({ hiddenCategories }),
  setExplode: (explode) => {
    gsap.killTweensOf(explodeProxy);
    set({ explode });
  },
  explodeTo: (to) => {
    gsap.killTweensOf(explodeProxy);
    explodeProxy.v = get().explode;
    const dist = Math.abs(to - explodeProxy.v);
    if (dist < 0.001) return;
    gsap.to(explodeProxy, {
      v: to,
      duration: (0.6 + dist * 1.4) / get().slowMo,
      ease: "power3.inOut",
      onUpdate: () => set({ explode: explodeProxy.v }),
    });
  },
  setSlowMo: (slowMo) => set({ slowMo }),
  setShowLabels: (showLabels) => set({ showLabels }),
  setAnimation: (animation) => set({ animation, playing: true }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  setRenderStyle: (renderStyle) => set({ renderStyle }),
  setClipEnabled: (clipEnabled) => set({ clipEnabled }),
  setClipAxis: (clipAxis) => set({ clipAxis, clipPos: 0 }),
  setClipPos: (clipPos) => set({ clipPos }),
  setShowDims: (showDims) => set({ showDims }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setManual: (m) => set((s) => ({ manual: { ...s.manual, ...m } })),
}));
