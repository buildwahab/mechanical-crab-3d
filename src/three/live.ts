import * as THREE from "three";
import type { CameraPreset } from "../creatures/types";
import type { CameraControls } from "@react-three/drei";

/** Mutable per-frame state (not React state) shared between render loop and UI polling. */
export const live = {
  explode: 0,
  armor: 1,
  time: 0,
  scrollX: 0,
  scrollZ: 0,
  load: 0.15,
  fps: 60,
};

/** Pointer-down position, used to distinguish click from drag */
export const pointer = { x: 0, y: 0 };
export function wasDrag(e: { nativeEvent: { clientX: number; clientY: number } }) {
  const dx = e.nativeEvent.clientX - pointer.x;
  const dy = e.nativeEvent.clientY - pointer.y;
  return dx * dx + dy * dy > 25;
}

/** Component id -> registered scene objects (for focusing) */
export const objectRegistry = new Map<string, Set<THREE.Object3D>>();

export function registerObject(id: string, obj: THREE.Object3D) {
  let set = objectRegistry.get(id);
  if (!set) objectRegistry.set(id, (set = new Set()));
  set.add(obj);
  return () => {
    set!.delete(obj);
    if (set!.size === 0) objectRegistry.delete(id);
  };
}

type Controls = CameraControls;

export const cameraApi = {
  controls: null as Controls | null,
  home: null as CameraPreset | null,
  goTo(p: CameraPreset, smooth = true) {
    const c = this.controls;
    if (!c) return;
    // pull back on narrow (portrait / mobile) viewports
    const aspect = c.camera instanceof THREE.PerspectiveCamera ? c.camera.aspect : 1.6;
    const f = aspect < 1.35 ? Math.min(2.3, 1.5 / aspect) : 1;
    const [px, py, pz] = p.position;
    const [tx, ty, tz] = p.target;
    c.setLookAt(tx + (px - tx) * f, ty + (py - ty) * f, tz + (pz - tz) * f, tx, ty, tz, smooth);
  },
  reset() {
    if (this.home) this.goTo(this.home);
  },
  focus(id: string) {
    const c = this.controls;
    const set = objectRegistry.get(id);
    if (!c || !set || set.size === 0) return;
    const box = new THREE.Box3();
    set.forEach((o) => {
      o.updateWorldMatrix(true, true);
      box.expandByObject(o);
    });
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3()).length();
    const pad = Math.max(0.15, size * 0.18);
    c.fitToBox(box, true, {
      paddingTop: pad,
      paddingBottom: pad,
      paddingLeft: pad,
      paddingRight: pad,
    });
  },
};

export const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10);
