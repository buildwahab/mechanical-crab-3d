import type { ComponentType } from "react";

export type SectionId =
  | "overview"
  | "structure"
  | "systems"
  | "animation"
  | "exploded"
  | "blueprint";

export type CameraPresetId = "iso" | "front" | "side" | "top" | "rear";
export type RenderStyle = "shaded" | "wire" | "xray";
export type Vec3 = [number, number, number];

export interface CameraPreset {
  position: Vec3;
  target: Vec3;
}

export interface SpecItem {
  label: string;
  value: string;
}

export interface CategoryDef {
  id: string;
  label: string;
  color: string;
}

export interface ComponentInfo {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  function: string;
  material: string;
  /** ids of other components (or free text) */
  connections: string[];
  specs: SpecItem[];
  construction: string[];
  /** show label in exploded view */
  label?: boolean;
  /** show callout in overview */
  callout?: boolean;
  /** optional grouping in explorer list */
  group?: string;
}

export interface AnimationDef {
  id: string;
  label: string;
  description: string;
  duration: number;
  keyframes: { at: number; label: string }[];
}

export interface OperatingMode {
  id: string;
  label: string;
  terrain: string;
  animation: string;
  icon: "walk" | "crawl" | "swim" | "defend";
}

export interface CreatureDefinition {
  id: string;
  code: string;
  name: string;
  series: string;
  subtitle: string;
  description: string;
  status: "online" | "development";
  stats: SpecItem[];
  specs: SpecItem[];
  dimensions: { width: string; length: string; height: string };
  bounds: { min: Vec3; max: Vec3 };
  modes: OperatingMode[];
  categories: CategoryDef[];
  components: ComponentInfo[];
  animations: AnimationDef[];
  cameraPresets: Record<CameraPresetId, CameraPreset>;
  sectionCameras: Partial<Record<SectionId, CameraPreset>>;
  defaultSelection: string;
  /** Procedural / loaded 3D model root */
  Model?: ComponentType;
}
