import * as THREE from "three";
import { Explodable, M, Selectable } from "../../three/Part";
import { G, capsule, finger, fingerInnerPoint, gear, rbox, shellPanel, tube } from "../../three/geometries";
import type { Vec3 } from "../types";
import { LEG_LAYOUT } from "./pose";

const PI = Math.PI;

export interface Rig {
  legs: { yaw?: THREE.Group | null; femur?: THREE.Group | null; knee?: THREE.Group | null; ankle?: THREE.Group | null }[];
  claws: {
    yaw?: THREE.Group | null;
    pitch?: THREE.Group | null;
    elbow?: THREE.Group | null;
    wrist?: THREE.Group | null;
    dactyl?: THREE.Group | null;
  }[];
  head?: THREE.Group | null;
  antenna?: THREE.Group | null;
  fan?: THREE.Group | null;
  gears: Map<string, { g: THREE.Group; ratio: number }>;
}

export function makeRig(): Rig {
  return {
    legs: Array.from({ length: 8 }, () => ({})),
    claws: [{}, {}],
    gears: new Map(),
  };
}

/* ======================= Shared mechanical primitives ======================= */

export function Servo({ r = 0.15, d = 0.26, axis = "z" }: { r?: number; d?: number; axis?: "z" | "y" }) {
  const rot: Vec3 = axis === "z" ? [PI / 2, 0, 0] : [0, 0, 0];
  return (
    <Selectable id="servo-actuators" category="servos">
      <group rotation={rot}>
        <M kind="black" geo={G.cyl} scale={[r, d, r]} />
        <M kind="steel" geo={G.cyl} scale={[r * 0.62, d + 0.04, r * 0.62]} />
        <M kind="accent" geo={G.torus} position={[0, d / 2, 0]} rotation={[PI / 2, 0, 0]} scale={r * 0.86} />
        <M kind="accent" geo={G.torus} position={[0, -d / 2, 0]} rotation={[PI / 2, 0, 0]} scale={r * 0.86} />
        <M kind="glow" geo={G.cylLow} position={[0, d / 2 + 0.024, 0]} scale={[r * 0.28, 0.01, r * 0.28]} shadow={false} />
        <M kind="glow" geo={G.cylLow} position={[0, -d / 2 - 0.024, 0]} scale={[r * 0.28, 0.01, r * 0.28]} shadow={false} />
      </group>
    </Selectable>
  );
}

function LegSegment({ length, r }: { length: number; r: number }) {
  const shellLen = Math.max(0.05, length - 2 * r - 0.1);
  return (
    <group>
      <M kind="metal" geo={G.box} position={[length / 2, 0, 0]} scale={[length * 0.88, r * 0.7, r * 0.9]} />
      <M kind="armor" geo={capsule(r, shellLen)} position={[length / 2, r * 0.18, 0]} rotation={[0, 0, PI / 2]} scale={[1, 1, 0.82]} />
      <M kind="trim" geo={G.box} position={[length / 2, r * 0.32, r * 0.83]} scale={[shellLen * 0.85, r * 0.28, 0.02]} />
      <M kind="trim" geo={G.box} position={[length / 2, r * 0.32, -r * 0.83]} scale={[shellLen * 0.85, r * 0.28, 0.02]} />
      <M kind="black" geo={G.cyl} position={[length * 0.36, -r * 0.95, 0]} rotation={[0, 0, PI / 2]} scale={[r * 0.32, length * 0.42, r * 0.32]} />
      <M kind="steel" geo={G.cyl} position={[length * 0.68, -r * 0.95, 0]} rotation={[0, 0, PI / 2]} scale={[r * 0.16, length * 0.36, r * 0.16]} />
      {[0.3, 0.7].map((u) => (
        <M key={u} kind="steel" geo={G.cylLow} position={[length * u, r * 0.02, r * 0.84]} rotation={[PI / 2, 0, 0]} scale={[0.017, 0.02, 0.017]} />
      ))}
    </group>
  );
}

function Tarsus() {
  return (
    <group>
      <M kind="armor" geo={capsule(0.085, 0.12)} position={[0.17, 0, 0]} rotation={[0, 0, PI / 2]} />
      <M kind="accent" geo={G.torus} position={[0.3, 0, 0]} rotation={[0, PI / 2, 0]} scale={0.074} />
      <M kind="black" geo={G.cone} position={[0.25 + 0.275, 0, 0]} rotation={[0, 0, -PI / 2]} scale={[0.075, 0.55, 0.075]} />
      <M kind="steel" geo={G.cone} position={[0.765, 0, 0]} rotation={[0, 0, -PI / 2]} scale={[0.024, 0.07, 0.024]} />
    </group>
  );
}

/* ================================ Legs ================================ */

export function Leg({ index, rig }: { index: number; rig: Rig }) {
  const right = index < 4;
  const k = index % 4;
  const s = right ? -1 : 1;
  const L = LEG_LAYOUT[k];
  const id = `leg-${right ? "R" : "L"}${k + 1}`;
  const dirX = (right ? 1 : -1) * Math.cos(L.fwd);
  const dirZ = Math.sin(L.fwd);
  const r = rig.legs[index];
  return (
    <Selectable
      id={id}
      category="limbs"
      position={[right ? 1.18 : -1.18, 0.92, L.z]}
      explode={[dirX * 1.25, 0.15, dirZ * 1.25]}
      anchor={[dirX * 1.05, 0.6, dirZ * 1.05]}
    >
      <group rotation={[0, (right ? 0 : PI) + s * L.fwd, 0]}>
        <group ref={(g) => { r.yaw = g; }}>
          <Servo r={0.15} d={0.24} axis="y" />
          <M kind="metal" geo={G.box} position={[0.12, 0, 0]} scale={[0.24, 0.12, 0.16]} />
          <Explodable offset={[0.3, 0.05, 0]} position={[0.24, 0, 0]}>
            <group ref={(g) => { r.femur = g; }}>
              <Servo r={0.14} d={0.27} />
              <LegSegment length={0.95} r={0.13} />
              <Explodable offset={[0.32, 0, 0]} position={[0.95, 0, 0]}>
                <group ref={(g) => { r.knee = g; }}>
                  <Servo r={0.125} d={0.24} />
                  <LegSegment length={1.0} r={0.11} />
                  <Explodable offset={[0.3, 0, 0]} position={[1.0, 0, 0]}>
                    <group ref={(g) => { r.ankle = g; }}>
                      <Servo r={0.1} d={0.2} />
                      <Tarsus />
                    </group>
                  </Explodable>
                </group>
              </Explodable>
            </group>
          </Explodable>
        </group>
      </group>
    </Selectable>
  );
}

/* ================================ Claws ================================ */

function FingerBlade() {
  return (
    <group>
      <M kind="accent" geo={finger()} />
      <M kind="armor" geo={capsule(0.075, 0.1)} position={[0.08, 0, 0]} rotation={[0, 0, PI / 2]} scale={[1, 1, 0.9]} />
      {[0.22, 0.34, 0.46, 0.58, 0.7].map((u) => {
        const p = fingerInnerPoint(u);
        return <M key={u} kind="black" geo={G.cone} position={[p.x, p.y + 0.02, 0]} scale={[0.022, 0.06, 0.022]} />;
      })}
    </group>
  );
}

function Palm({ rig, side }: { rig: Rig; side: string }) {
  return (
    <group>
      <M kind="armor" geo={capsule(0.24, 0.36)} position={[0.3, 0, 0]} rotation={[0, 0, PI / 2]} scale={[1, 1, 0.8]} />
      <M kind="trim" geo={G.torus} position={[0.5, 0, 0]} rotation={[0, PI / 2, 0]} scale={[0.2, 0.24, 0.24]} />
      <M kind="trim" geo={G.box} position={[0.26, 0.2, 0]} scale={[0.34, 0.04, 0.2]} />
      {[1, -1].map((z) => (
        <group key={z} position={[0.27, 0.0, z * 0.19]}>
          <group ref={(g) => { if (g) rig.gears.set(`palm-${side}-${z}`, { g, ratio: z * 1.6 }); }}>
            <M kind="metal" geo={gear(14, 0.12, 0.04)} />
          </group>
          <M kind="glow" geo={G.cylLow} rotation={[PI / 2, 0, 0]} position={[0, 0, z * 0.026]} scale={[0.028, 0.012, 0.028]} shadow={false} />
        </group>
      ))}
      <M kind="steel" geo={G.cyl} position={[0.52, 0.085, 0]} rotation={[PI / 2, 0, 0]} scale={[0.04, 0.28, 0.04]} />
    </group>
  );
}

export function Claw({ right, rig }: { right: boolean; rig: Rig }) {
  const s = right ? -1 : 1;
  const r = rig.claws[right ? 0 : 1];
  const sx = right ? 1 : -1;
  return (
    <Selectable
      id={right ? "claw-R" : "claw-L"}
      category="limbs"
      position={[sx * 0.78, 0.9, 0.98]}
      explode={[sx * 1.0, 0.35, 1.25]}
      anchor={[sx * 0.55, 0.85, 1.4]}
    >
      <group rotation={[0, (right ? 0 : PI) + s * 1.0, 0]}>
        <group ref={(g) => { r.yaw = g; }}>
          <group ref={(g) => { r.pitch = g; }}>
            <Servo r={0.17} d={0.3} />
            <LegSegment length={0.7} r={0.14} />
            <Explodable offset={[0.3, 0.05, 0]} position={[0.7, 0, 0]}>
              <group ref={(g) => { r.elbow = g; }}>
                <Servo r={0.15} d={0.32} axis="y" />
                <LegSegment length={0.45} r={0.15} />
                <Explodable offset={[0.35, 0.05, 0]} position={[0.45, 0, 0]}>
                  <group ref={(g) => { r.wrist = g; }}>
                    <Servo r={0.15} d={0.3} />
                    <group scale={1.25}>
                      <Palm rig={rig} side={right ? "R" : "L"} />
                      <Explodable offset={[0.25, -0.16, 0]} position={[0.58, -0.075, 0]}>
                        <FingerBlade />
                      </Explodable>
                      <Explodable offset={[0.25, 0.22, 0]} position={[0.52, 0.085, 0]}>
                        <group ref={(g) => { r.dactyl = g; }}>
                          <group scale={[1, -1, 1]}>
                            <FingerBlade />
                          </group>
                        </group>
                      </Explodable>
                    </group>
                  </group>
                </Explodable>
              </group>
            </Explodable>
          </group>
        </group>
      </group>
    </Selectable>
  );
}

/* ================================ Carapace ================================ */

const SX = 1.5,
  SY = 0.62,
  SZ = 1.2,
  CY = 1.12;
const SHELL_SCALE: Vec3 = [SX, SY, SZ];

function onShell(phi: number, theta: number, lift = 0.012) {
  const st = Math.sin(theta);
  const p = new THREE.Vector3(-Math.cos(phi) * st * SX, Math.cos(theta) * SY, Math.sin(phi) * st * SZ);
  const n = new THREE.Vector3(p.x / (SX * SX), p.y / (SY * SY), p.z / (SZ * SZ)).normalize();
  p.addScaledVector(n, lift);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  return { position: p.toArray() as Vec3, quaternion: q };
}

const GAP = 0.03;
const SECTORS = [
  { key: "front", c: PI / 2, off: [0, 0.25, 0.65] as Vec3, trim: false },
  { key: "right", c: PI, off: [0.65, 0.25, 0] as Vec3, trim: true },
  { key: "rear", c: (3 * PI) / 2, off: [0, 0.25, -0.65] as Vec3, trim: false },
  { key: "left", c: 0, off: [-0.65, 0.25, 0] as Vec3, trim: true },
];

const decal = onShell((3 * PI) / 4, 0.27 * PI, 0.03);
const VENTS = [
  onShell(PI, 0.24 * PI, 0.02),
  onShell(PI * 0.95, 0.3 * PI, 0.02),
  onShell(0, 0.24 * PI, 0.02),
  onShell(PI * 0.05, 0.3 * PI, 0.02),
  onShell(PI / 2 + 0.25, 0.2 * PI, 0.02),
  onShell(PI / 2 - 0.25, 0.2 * PI, 0.02),
];
const BOLTS = [0.2, 0.8, 1.2, 1.8].flatMap((k) => [onShell(k * PI, 0.13 * PI, 0.01), onShell(k * PI + 0.2, 0.42 * PI, 0.01)]);
const MECH_PLATE = onShell(PI / 4, 0.27 * PI, 0.02);

export function Carapace() {
  return (
    <Selectable id="carapace" category="armor" position={[0, CY, 0]} explode={[0, 1.55, 0]} anchor={[0.75, 0.62, -0.2]}>
      <Explodable offset={[0, 0.6, 0]}>
        <M kind="armor" geo={shellPanel(0, PI * 2, 0, 0.1 * PI)} scale={SHELL_SCALE} />
        <M kind="black" geo={G.box} position={[0, SY + 0.005, 0]} scale={[0.04, 0.02, 0.3]} />
      </Explodable>
      {SECTORS.map((s) => (
        <Explodable key={s.key} offset={s.off}>
          <M
            kind="armor"
            geo={shellPanel(s.c - PI / 4 + GAP, PI / 2 - 2 * GAP, 0.106 * PI, s.trim ? 0.29 * PI : 0.344 * PI)}
            scale={SHELL_SCALE}
          />
          {s.trim && (
            <M kind="trim" geo={shellPanel(s.c - PI / 4 + GAP, PI / 2 - 2 * GAP, 0.4 * PI, 0.05 * PI)} scale={SHELL_SCALE} />
          )}
          {s.key === "right" && <M kind="decal" geo={G.plane} position={decal.position} quaternion={decal.quaternion} scale={[0.56, 0.14, 1]} shadow={false} />}
          {s.key === "left" && (
            <M kind="black" geo={rbox(0.36, 0.12, 0.02, 0.01)} position={MECH_PLATE.position} quaternion={MECH_PLATE.quaternion} />
          )}
        </Explodable>
      ))}
      <Explodable offset={[0, -0.12, 0]}>
        <M kind="metal" geo={shellPanel(0, PI * 2, 0.45 * PI, 0.065 * PI)} scale={[SX * 1.012, SY * 1.012, SZ * 1.012]} />
      </Explodable>
      <Explodable offset={[0, 0.35, 0]}>
        {VENTS.map((v, i) => (
          <group key={i} position={v.position} quaternion={v.quaternion}>
            <M kind="black" geo={rbox(0.24, 0.07, 0.03, 0.012)} />
            <M kind="glow" geo={G.box} position={[0, 0, 0.016]} scale={[0.16, 0.012, 0.004]} shadow={false} />
          </group>
        ))}
        {BOLTS.map((b, i) => (
          <group key={i} position={b.position} quaternion={b.quaternion}>
            <M kind="steel" geo={G.cylLow} rotation={[PI / 2, 0, 0]} scale={[0.025, 0.025, 0.025]} />
          </group>
        ))}
      </Explodable>
    </Selectable>
  );
}

/* ================================ External modules ================================ */

export function SensorArray({ rig }: { rig: Rig }) {
  return (
    <Selectable id="sensor-array" category="sensors" position={[0, 1.68, 0.4]} explode={[0, 1.25, 0.35]} anchor={[0, 0.4, 0]}>
      <M kind="black" geo={G.cyl} position={[0, 0.03, 0]} scale={[0.09, 0.08, 0.09]} />
      <M kind="steel" geo={G.cyl} position={[0, 0.12, 0]} scale={[0.032, 0.18, 0.032]} />
      <group ref={(g) => { rig.head = g; }} position={[0, 0.25, 0]}>
        <M kind="armor" geo={rbox(0.44, 0.15, 0.22, 0.045)} />
        <M kind="trim" geo={G.box} position={[0, 0.077, -0.02]} scale={[0.28, 0.006, 0.12]} />
        <M kind="black" geo={rbox(0.36, 0.11, 0.04, 0.015)} position={[0, 0, 0.11]} />
        {[-0.1, 0.1].map((x) => (
          <group key={x}>
            <M kind="lens" geo={G.cyl} rotation={[PI / 2, 0, 0]} position={[x, 0, 0.13]} scale={[0.042, 0.03, 0.042]} />
            <M kind="accent" geo={G.torus} position={[x, 0, 0.142]} scale={0.046} />
          </group>
        ))}
        <M kind="glow" geo={G.sphere} position={[0, 0.012, 0.132]} scale={0.014} shadow={false} />
      </group>
    </Selectable>
  );
}

export function Antenna({ rig }: { rig: Rig }) {
  return (
    <Selectable id="antenna" category="sensors" position={[0.48, 1.6, -0.55]} explode={[0.35, 1.35, -0.5]} anchor={[0, 0.9, 0]}>
      <M kind="black" geo={G.cyl} position={[0, 0.04, 0]} scale={[0.06, 0.1, 0.06]} />
      <M kind="accent" geo={G.torus} position={[0, 0.07, 0]} rotation={[PI / 2, 0, 0]} scale={0.06} />
      <group ref={(g) => { rig.antenna = g; }} position={[0, 0.08, 0]}>
        <M kind="steel" geo={G.cylLow} position={[0, 0.45, 0]} scale={[0.012, 0.9, 0.012]} />
        <M kind="black" geo={G.cyl} position={[0, 0.3, 0]} scale={[0.022, 0.05, 0.022]} />
        <M kind="glow" geo={G.sphere} position={[0, 0.92, 0]} scale={0.026} shadow={false} />
      </group>
    </Selectable>
  );
}

export function OpticCluster() {
  return (
    <Selectable id="optic-cluster" category="sensors" position={[0, 0.98, 1.0]} explode={[0, 0.05, 1.35]} anchor={[0.1, -0.12, 0.18]}>
      <M kind="metal" geo={rbox(0.86, 0.3, 0.2, 0.05)} />
      <M kind="black" geo={rbox(0.62, 0.2, 0.06, 0.02)} position={[0, 0, 0.1]} />
      <M kind="lens" geo={G.cyl} rotation={[PI / 2, 0, 0]} position={[0, 0, 0.13]} scale={[0.11, 0.06, 0.11]} />
      <M kind="accent" geo={G.torus} position={[0, 0, 0.162]} scale={0.118} />
      <M kind="glow" geo={G.sphere} position={[0, 0, 0.15]} scale={0.045} shadow={false} />
      {[-0.29, 0.29].map((x) => (
        <group key={x}>
          <M kind="lens" geo={G.cyl} rotation={[PI / 2, 0, 0]} position={[x, 0.02, 0.12]} scale={[0.05, 0.04, 0.05]} />
          <M kind="glow" geo={G.sphere} position={[x, 0.02, 0.14]} scale={0.016} shadow={false} />
        </group>
      ))}
      {[-0.06, -0.1].map((y) => (
        <M key={y} kind="black" geo={G.box} position={[0, y - 0.03, 0.105]} scale={[0.5, 0.012, 0.02]} />
      ))}
    </Selectable>
  );
}

export function Chassis() {
  return (
    <Selectable id="chassis" category="chassis" explode={[0, -0.55, 0]} anchor={[1.05, 0.75, 0.9]}>
      <M kind="metal" geo={rbox(2.2, 0.38, 1.8, 0.08)} position={[0, 0.88, 0]} />
      {[1, -1].map((x) => (
        <group key={x}>
          <M kind="steel" geo={G.box} position={[x * 1.11, 0.96, 0]} scale={[0.04, 0.07, 1.6]} />
          <M kind="black" geo={rbox(0.24, 0.22, 0.24, 0.03)} position={[x * 0.74, 0.9, 0.92]} />
          {LEG_LAYOUT.map((L) => (
            <M key={L.z} kind="black" geo={rbox(0.26, 0.24, 0.24, 0.03)} position={[x * 1.12, 0.92, L.z]} />
          ))}
        </group>
      ))}
      <M kind="black" geo={rbox(1.1, 0.1, 0.12, 0.03)} position={[0, 0.72, 0.9]} />
      <Explodable offset={[0, -0.35, 0]}>
        <M kind="armor" geo={shellPanel(0, PI * 2, 0.5 * PI, 0.5 * PI)} position={[0, 0.72, 0]} scale={[1.18, 0.32, 0.95]} />
        <M kind="trim" geo={G.torusThin} position={[0, 0.66, 0]} rotation={[PI / 2, 0, 0]} scale={[1.08, 0.86, 1]} />
      </Explodable>
    </Selectable>
  );
}

/* ================================ Internal systems ================================ */

export function ControlUnit() {
  return (
    <Selectable id="control-unit" category="core" position={[0, 1.12, 0.12]} explode={[0, 1.05, 0.1]} anchor={[0.1, 0.1, 0]}>
      <M kind="pcb" geo={G.box} scale={[0.9, 0.035, 0.5]} />
      <M kind="metal" geo={rbox(0.26, 0.06, 0.26, 0.015)} position={[0, 0.045, 0]} />
      <M kind="glow" geo={G.box} position={[0, 0.077, 0]} scale={[0.1, 0.006, 0.1]} shadow={false} />
      {[-0.3, 0.3].flatMap((x) =>
        [-0.14, 0, 0.14].map((z) => (
          <M key={`${x}${z}`} kind="black" geo={G.box} position={[x, 0.03, z]} scale={[0.12, 0.025, 0.09]} />
        ))
      )}
      {[0.23, -0.23].map((z) => (
        <M key={z} kind="accent" geo={G.box} position={[0, 0.03, z]} scale={[0.3, 0.04, 0.035]} />
      ))}
      {[-0.15, 0.15].flatMap((x) =>
        [0.17, -0.17].map((z) => (
          <M key={`${x}${z}`} kind="steel" geo={G.cylLow} position={[x, 0.045, z]} scale={[0.024, 0.06, 0.024]} />
        ))
      )}
      <M kind="copper" geo={G.cylLow} position={[0, 0.05, -0.17]} rotation={[0, 0, PI / 2]} scale={[0.012, 0.5, 0.012]} />
    </Selectable>
  );
}

export function BatteryPack() {
  return (
    <Selectable id="battery-pack" category="battery" explode={[0, 0.75, -0.55]} anchor={[0.53, 1.34, -0.38]}>
      {[-1, 1].map((sx) => (
        <Explodable key={sx} offset={[sx * 0.35, 0, 0]} position={[sx * 0.53, 1.24, -0.38]}>
          <M kind="battery" geo={rbox(0.38, 0.2, 0.62, 0.04)} />
          <M kind="black" geo={rbox(0.4, 0.22, 0.06, 0.02)} position={[0, 0, 0.32]} />
          <M kind="black" geo={rbox(0.4, 0.22, 0.06, 0.02)} position={[0, 0, -0.32]} />
          {[-0.08, 0.08].map((x) => (
            <M key={x} kind="steel" geo={G.cylLow} position={[x, 0.03, 0.36]} rotation={[PI / 2, 0, 0]} scale={[0.022, 0.05, 0.022]} />
          ))}
          <M kind="glow" geo={G.box} position={[0, 0.102, 0]} scale={[0.03, 0.008, 0.36]} shadow={false} />
          <M kind="black" geo={G.box} position={[0, 0.101, 0.18]} scale={[0.3, 0.004, 0.04]} />
        </Explodable>
      ))}
    </Selectable>
  );
}

export function DriveMotors() {
  return (
    <Selectable id="drive-motors" category="motors" explode={[0, 0.35, 0]} anchor={[0.98, 1.2, 0.62]}>
      {LEG_LAYOUT.flatMap((L) =>
        [1, -1].map((sx) => (
          <Explodable key={`${L.z}${sx}`} offset={[sx * 0.45, 0.45, 0]} position={[sx * 0.98, 1.0, L.z]}>
            <M kind="metal" geo={G.cyl} scale={[0.12, 0.28, 0.12]} />
            <M kind="accent" geo={G.torus} position={[0, 0.07, 0]} rotation={[PI / 2, 0, 0]} scale={0.122} />
            {[-0.08, -0.04, 0].map((y) => (
              <M key={y} kind="steel" geo={G.cylLow} position={[0, y, 0]} scale={[0.135, 0.012, 0.135]} />
            ))}
            <M kind="steel" geo={G.cyl} position={[0, 0.16, 0]} scale={[0.07, 0.05, 0.07]} />
            <M kind="glow" geo={G.cylLow} position={[0, 0.188, 0]} scale={[0.03, 0.008, 0.03]} shadow={false} />
          </Explodable>
        ))
      )}
    </Selectable>
  );
}

export function GearTrain({ rig }: { rig: Rig }) {
  const reg = (key: string, ratio: number) => (g: THREE.Group | null) => {
    if (g) rig.gears.set(key, { g, ratio });
  };
  return (
    <Selectable id="gear-train" category="gears" explode={[0, 0.5, 1.0]} anchor={[0.56, 1.35, 0.8]}>
      {[1, -1].map((sx) => (
        <Explodable key={sx} offset={[sx * 0.4, 0.1, 0.2]} position={[sx * 0.56, 1.15, 0.72]}>
          <M kind="black" geo={G.box} position={[-sx * 0.06, 0.03, 0.1]} scale={[0.025, 0.36, 0.48]} />
          <M kind="steel" geo={G.cylLow} rotation={[0, 0, PI / 2]} scale={[0.022, 0.16, 0.022]} />
          <group rotation={[0, PI / 2, 0]}>
            <group ref={reg(`gb-${sx}-a`, 1)}>
              <M kind="copper" geo={gear(16, 0.15, 0.05)} />
            </group>
            <group position={[-0.22, 0.06, 0]}>
              <group ref={reg(`gb-${sx}-b`, -16 / 9)}>
                <M kind="steel" geo={gear(9, 0.085, 0.06)} />
              </group>
            </group>
          </group>
        </Explodable>
      ))}
      <Explodable offset={[0, 0.35, 0.25]} position={[0, 1.16, 0.45]}>
        {[-0.16, 0, 0.16].map((x, i) => (
          <group key={x} position={[x, 0, 0]} rotation={[-PI / 2, 0, 0]}>
            <group ref={reg(`idler-${i}`, i % 2 ? -1.5 : 1.5)}>
              <M kind={i === 1 ? "copper" : "steel"} geo={gear(12, 0.08, 0.035)} />
            </group>
          </group>
        ))}
      </Explodable>
    </Selectable>
  );
}

export function CoolingSystem({ rig }: { rig: Rig }) {
  return (
    <Selectable id="cooling-system" category="core" position={[0, 1.2, -0.82]} explode={[0, 0.5, -1.35]} anchor={[0, 0.2, -0.1]}>
      {Array.from({ length: 7 }, (_, i) => -0.16 + i * 0.053).map((x) => (
        <M key={x} kind="steel" geo={G.box} position={[x, 0, 0.05]} scale={[0.012, 0.2, 0.22]} />
      ))}
      <M kind="black" geo={G.box} position={[0, -0.11, 0.05]} scale={[0.38, 0.02, 0.24]} />
      {[-0.08, 0.08].map((x) => (
        <M key={x} kind="copper" geo={G.cylLow} position={[x, 0.06, 0.25]} rotation={[PI / 2, 0, 0]} scale={[0.015, 0.4, 0.015]} />
      ))}
      <M kind="black" geo={G.torus} position={[0, 0, -0.1]} scale={0.145} />
      <M kind="black" geo={G.box} position={[0, 0, -0.07]} scale={[0.32, 0.3, 0.02]} />
      <group ref={(g) => { rig.fan = g; }} position={[0, 0, -0.11]}>
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i * PI * 2) / 6]}>
            <M kind="metal" geo={G.box} position={[0, 0.07, 0]} rotation={[0, 0.55, 0]} scale={[0.045, 0.11, 0.008]} />
          </group>
        ))}
        <M kind="accent" geo={G.cyl} rotation={[PI / 2, 0, 0]} scale={[0.032, 0.04, 0.032]} />
      </group>
    </Selectable>
  );
}

export function SensorHub() {
  return (
    <Selectable id="sensor-hub" category="sensors" position={[0, 1.26, 0.66]} explode={[0, 1.4, 0.8]} anchor={[0, 0.12, 0]}>
      <M kind="black" geo={G.cyl} scale={[0.11, 0.09, 0.11]} />
      <M kind="lens" geo={G.cyl} position={[0, 0.06, 0]} scale={[0.085, 0.04, 0.085]} />
      <M kind="glow" geo={G.torusThin} rotation={[PI / 2, 0, 0]} scale={0.113} shadow={false} />
      {[0.22, -0.22].map((x) => (
        <M key={x} kind="metal" geo={rbox(0.14, 0.05, 0.12, 0.012)} position={[x, -0.03, 0]} />
      ))}
    </Selectable>
  );
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const WIRES: { key: string; pts: THREE.Vector3[]; r: number; kind: "wireO" | "wireB" }[] = [
  ...LEG_LAYOUT.flatMap((L, i) =>
    [1, -1].map((sx) => ({
      key: `m${i}${sx}`,
      pts: [V(sx * 0.12, 1.16, 0.12 + L.z * 0.2), V(sx * 0.45, 1.36, L.z * 0.7 + 0.06), V(sx * 0.98, 1.19, L.z)],
      r: 0.016,
      kind: (i % 2 ? "wireB" : "wireO") as "wireO" | "wireB",
    }))
  ),
  ...[1, -1].map((sx) => ({
    key: `b${sx}`,
    pts: [V(sx * 0.2, 1.15, -0.1), V(sx * 0.38, 1.36, -0.08), V(sx * 0.53, 1.35, -0.3)],
    r: 0.024,
    kind: "wireB" as const,
  })),
  ...[1, -1].map((sx) => ({
    key: `g${sx}`,
    pts: [V(sx * 0.3, 1.15, 0.33), V(sx * 0.45, 1.32, 0.52), V(sx * 0.5, 1.22, 0.7)],
    r: 0.014,
    kind: "wireO" as const,
  })),
  { key: "hub", pts: [V(0.05, 1.16, 0.36), V(0.06, 1.3, 0.5), V(0, 1.24, 0.6)], r: 0.016, kind: "wireO" },
  { key: "arr", pts: [V(-0.05, 1.16, 0.3), V(-0.08, 1.5, 0.36), V(0, 1.68, 0.4)], r: 0.014, kind: "wireO" },
  { key: "cool", pts: [V(0, 1.16, -0.12), V(0, 1.38, -0.5), V(0, 1.26, -0.72)], r: 0.018, kind: "wireB" },
  { key: "ant", pts: [V(0.1, 1.16, -0.1), V(0.35, 1.45, -0.4), V(0.48, 1.6, -0.55)], r: 0.012, kind: "wireO" },
];

export function WiringHarness() {
  return (
    <Selectable id="wiring-harness" category="wiring" explode={[0, 0.65, 0]} anchor={[-0.45, 1.38, 0.2]}>
      {WIRES.map((w) => (
        <M key={w.key} kind={w.kind} geo={tube(w.key, w.pts, w.r)} />
      ))}
    </Selectable>
  );
}
