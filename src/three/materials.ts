import * as THREE from "three";
import type { RenderStyle } from "../creatures/types";
import { clipPlane } from "./live";

export type MatKind =
  | "armor"
  | "trim"
  | "accent"
  | "metal"
  | "steel"
  | "black"
  | "rubber"
  | "glow"
  | "lens"
  | "copper"
  | "pcb"
  | "battery"
  | "wireO"
  | "wireB"
  | "decal";

export type PartState = "normal" | "hover" | "highlight" | "ghost";

export const ORANGE = "#ff6a13";
export const ARMOR_KINDS = new Set<MatKind>(["armor", "trim", "decal"]);

let decalTex: THREE.CanvasTexture | null = null;
function makeDecalTexture() {
  if (decalTex) return decalTex;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 512, 128);
  g.fillStyle = "#1c1d20";
  g.font = "italic 800 88px Inter, Arial, sans-serif";
  g.textBaseline = "middle";
  g.fillText("CR-01", 24, 62);
  g.fillStyle = ORANGE;
  g.fillRect(300, 92, 190, 10);
  g.fillRect(300, 26, 60, 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  decalTex = t;
  return t;
}

function base(kind: MatKind): THREE.Material {
  switch (kind) {
    case "armor":
      return new THREE.MeshPhysicalMaterial({
        color: "#f3f2ef",
        roughness: 0.38,
        metalness: 0.02,
        clearcoat: 0.7,
        clearcoatRoughness: 0.25,
        side: THREE.DoubleSide,
        transparent: true,
      });
    case "trim":
      return new THREE.MeshPhysicalMaterial({
        color: ORANGE,
        roughness: 0.4,
        metalness: 0.05,
        clearcoat: 0.5,
        side: THREE.DoubleSide,
        transparent: true,
      });
    case "accent":
      return new THREE.MeshPhysicalMaterial({
        color: ORANGE,
        roughness: 0.36,
        metalness: 0.05,
        clearcoat: 0.6,
      });
    case "metal":
      return new THREE.MeshStandardMaterial({ color: "#3b3e44", roughness: 0.38, metalness: 0.85 });
    case "steel":
      return new THREE.MeshStandardMaterial({ color: "#a7adb4", roughness: 0.22, metalness: 0.95 });
    case "black":
      return new THREE.MeshStandardMaterial({ color: "#17181b", roughness: 0.5, metalness: 0.45 });
    case "rubber":
      return new THREE.MeshStandardMaterial({ color: "#222326", roughness: 0.9, metalness: 0 });
    case "glow":
      return new THREE.MeshStandardMaterial({
        color: "#ff8a3d",
        emissive: new THREE.Color(ORANGE),
        emissiveIntensity: 2.6,
        toneMapped: false,
      });
    case "lens":
      return new THREE.MeshPhysicalMaterial({
        color: "#0a0b0d",
        roughness: 0.04,
        metalness: 0.3,
        clearcoat: 1,
      });
    case "copper":
      return new THREE.MeshStandardMaterial({ color: "#b8834a", roughness: 0.3, metalness: 1 });
    case "pcb":
      return new THREE.MeshStandardMaterial({ color: "#26292e", roughness: 0.6, metalness: 0.3 });
    case "battery":
      return new THREE.MeshPhysicalMaterial({
        color: "#f0863a",
        roughness: 0.45,
        metalness: 0.15,
        clearcoat: 0.4,
      });
    case "wireO":
      return new THREE.MeshStandardMaterial({ color: "#ff7a24", roughness: 0.55 });
    case "wireB":
      return new THREE.MeshStandardMaterial({ color: "#1d1e21", roughness: 0.6 });
    case "decal":
      return new THREE.MeshStandardMaterial({
        map: makeDecalTexture(),
        transparent: true,
        roughness: 0.4,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      });
  }
}

const cache = new Map<string, THREE.Material>();
const all: THREE.Material[] = [];
const armorShaded: THREE.Material[] = [];
let clipping = false;

let lastArmor = -1;
function applyOpacityTo(m: THREE.Material, o: number) {
  const isDecal = (m as THREE.MeshStandardMaterial).map != null;
  m.opacity = o;
  m.depthWrite = !isDecal && o > 0.97;
  m.visible = o > 0.015;
}

function track(m: THREE.Material, armor: boolean) {
  m.clippingPlanes = clipping ? [clipPlane] : null;
  all.push(m);
  if (armor) {
    armorShaded.push(m);
    if (lastArmor >= 0) applyOpacityTo(m, lastArmor);
  }
  return m;
}

export function getMat(kind: MatKind, state: PartState, style: RenderStyle): THREE.Material {
  const key = `${kind}|${state}|${style}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let m: THREE.Material;
  const isArmor = ARMOR_KINDS.has(kind);

  if (style === "wire") {
    const color = state === "highlight" ? ORANGE : state === "hover" ? "#e07a35" : "#2b5aa0";
    const opacity = state === "ghost" ? 0.05 : state === "highlight" ? 0.9 : state === "hover" ? 0.7 : 0.32;
    m = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: kind === "decal" ? 0 : opacity,
      depthWrite: false,
    });
    return cache.set(key, track(m, false)), m;
  }

  if (state === "ghost") {
    m = new THREE.MeshStandardMaterial({
      color: "#b7bcc3",
      transparent: true,
      opacity: kind === "decal" ? 0 : 0.06,
      depthWrite: false,
      roughness: 1,
      side: THREE.DoubleSide,
    });
    return cache.set(key, track(m, false)), m;
  }

  m = base(kind);

  if (state !== "normal" && kind !== "glow") {
    const sm = m as THREE.MeshStandardMaterial;
    sm.emissive = new THREE.Color(ORANGE);
    sm.emissiveIntensity = state === "highlight" ? 0.42 : 0.16;
  }

  if (style === "xray") {
    m.transparent = true;
    m.depthWrite = false;
    m.opacity = state === "highlight" ? 0.92 : isArmor ? 0.07 : 0.4;
    m.side = THREE.DoubleSide;
    return cache.set(key, track(m, false)), m;
  }

  return cache.set(key, track(m, isArmor)), m;
}

export function applyArmorOpacity(o: number) {
  if (Math.abs(o - lastArmor) < 0.002) return;
  lastArmor = o;
  for (const m of armorShaded) applyOpacityTo(m, o);
}

export function setClipping(enabled: boolean) {
  if (enabled === clipping) return;
  clipping = enabled;
  for (const m of all) {
    m.clippingPlanes = enabled ? [clipPlane] : null;
    m.needsUpdate = true;
  }
}

/** pulse all glow materials */
export function pulseGlow(t: number) {
  for (const [key, m] of cache) {
    if (key.startsWith("glow|") && !key.endsWith("wire") && !key.includes("ghost")) {
      (m as THREE.MeshStandardMaterial).emissiveIntensity = 2.2 + Math.sin(t * 2.4) * 0.8;
    }
  }
}
