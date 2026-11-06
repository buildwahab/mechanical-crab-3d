import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../store";
import type { ComponentInfo, RenderStyle, Vec3 } from "../creatures/types";
import { ARMOR_KINDS, getMat, type MatKind, type PartState } from "./materials";
import { cameraApi, live, registerObject, wasDrag } from "./live";

interface PartCtxValue {
  state: PartState;
  style: RenderStyle;
}
const PartCtx = createContext<PartCtxValue>({ state: "normal", style: "shaded" });

export const InfoCtx = createContext<Map<string, ComponentInfo>>(new Map());

/* ---------- smart raycast: skip hidden / ghosted armor / transparent armor ---------- */
function smartRaycast(this: THREE.Mesh, rc: THREE.Raycaster, hits: THREE.Intersection[]) {
  let o: THREE.Object3D | null = this;
  while (o) {
    if (!o.visible) return;
    o = o.parent;
  }
  const m = this.material as THREE.Material;
  if (!m.visible || m.opacity < 0.02) return;
  const ud = this.userData;
  if (ud.armor && (ud.ghost || live.armor < 0.35)) return;
  THREE.Mesh.prototype.raycast.call(this, rc, hits);
}

type MeshProps = {
  kind: MatKind;
  geo: THREE.BufferGeometry;
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3 | number;
  quaternion?: THREE.Quaternion;
  shadow?: boolean;
};

/** Mesh that picks its material from the surrounding part context */
export function M({ kind, geo, shadow = true, ...rest }: MeshProps) {
  const ctx = useContext(PartCtx);
  const mat = getMat(kind, ctx.state, ctx.style);
  return (
    <mesh
      geometry={geo}
      material={mat}
      castShadow={shadow && ctx.state !== "ghost" && ctx.style === "shaded"}
      receiveShadow={ctx.style === "shaded"}
      raycast={smartRaycast}
      userData={{ armor: ARMOR_KINDS.has(kind), ghost: ctx.state === "ghost" }}
      {...rest}
    />
  );
}

/* ---------- Explodable ---------- */
export function Explodable({
  offset,
  position = [0, 0, 0],
  rotation,
  children,
}: {
  offset: Vec3;
  position?: Vec3;
  rotation?: Vec3;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const e = live.explode;
    g.position.set(position[0] + offset[0] * e, position[1] + offset[1] * e, position[2] + offset[2] * e);
  });
  return (
    <group ref={ref} position={position} rotation={rotation}>
      {children}
    </group>
  );
}

/* ---------- Selectable component ---------- */
export function Selectable({
  id,
  category,
  position = [0, 0, 0],
  rotation,
  explode = [0, 0, 0],
  anchor,
  children,
}: {
  id: string;
  category: string;
  position?: Vec3;
  rotation?: Vec3;
  explode?: Vec3;
  /** local anchor point for label */
  anchor?: Vec3;
  children: ReactNode;
}) {
  const parent = useContext(PartCtx);
  const selected = useStore((s) => s.selectedId === id);
  const hovered = useStore((s) => s.hoveredId === id);
  const ghostMode = useStore((s) => s.section === "systems" && s.selectedId !== null);
  const hidden = useStore((s) => s.hiddenCategories.includes(category));
  const style = useStore((s) => s.renderStyle);
  const ref = useRef<THREE.Group>(null);

  let state: PartState = "normal";
  if (selected || parent.state === "highlight") state = "highlight";
  else if (hovered) state = "hover";
  else if (ghostMode) state = "ghost";
  else if (parent.state === "hover") state = "hover";

  useEffect(() => {
    if (ref.current) return registerObject(id, ref.current);
  }, [id]);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const e = live.explode;
    g.position.set(position[0] + explode[0] * e, position[1] + explode[1] * e, position[2] + explode[2] * e);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (wasDrag(e)) return;
    useStore.getState().select(id);
  };
  const onDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    useStore.getState().select(id);
    cameraApi.focus(id);
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    useStore.getState().setHover(id);
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    if (useStore.getState().hoveredId === id) useStore.getState().setHover(null);
    document.body.style.cursor = "";
  };

  return (
    <PartCtx.Provider value={{ state, style }}>
      <group
        ref={ref}
        position={position}
        rotation={rotation}
        visible={!hidden}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onPointerOver={onOver}
        onPointerOut={onOut}
      >
        {children}
        {anchor && <PartLabel id={id} anchor={anchor} selected={selected} hidden={hidden} />}
      </group>
    </PartCtx.Provider>
  );
}

/* ---------- Labels ---------- */
function PartLabel({
  id,
  anchor,
  selected,
  hidden,
}: {
  id: string;
  anchor: Vec3;
  selected: boolean;
  hidden: boolean;
}) {
  const info = useContext(InfoCtx).get(id);
  const section = useStore((s) => s.section);
  const showLabels = useStore((s) => s.showLabels);
  const explode = useStore((s) => s.explode);
  if (!info) return null;

  const callout = section === "overview" && showLabels && info.callout;
  const exploded = section === "exploded" && showLabels && info.label && explode > 0.2;
  // Keep the Html root mounted across section changes. Rapid root teardown and
  // recreation can race React DOM's cleanup inside Drei's separate label root.
  const show = !hidden && (callout || exploded || selected);

  return (
    <Html position={anchor} zIndexRange={[12, 0]} style={{ pointerEvents: "none", display: show ? undefined : "none" }}>
      <div className={`part-label ${selected ? "is-selected" : ""} ${callout && !selected ? "is-callout" : ""}`}>
        <span className="part-label-dot" />
        <span className="part-label-line" />
        <div className="part-label-box">
          <div className="part-label-name">{info.name}</div>
          <div className="part-label-sub">{info.subtitle}</div>
        </div>
      </div>
    </Html>
  );
}
