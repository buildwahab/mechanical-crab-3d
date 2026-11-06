// Procedural pose generator for the CR-01 rig.
// All leg/claw values are deltas from the rest pose.

export const LEG_REST = { femur: 0.55, knee: -1.25, ankle: -0.75 };
export const CLAW_REST = { pitch: 0.3, elbow: 0.6, wrist: -0.4, open: 0.12 };

/** Leg layout (right side). Index 0..3 = R1..R4, 4..7 = L1..L4 (mirrored) */
export const LEG_LAYOUT = [
  { z: 0.62, fwd: 0.58 },
  { z: 0.2, fwd: 0.2 },
  { z: -0.22, fwd: -0.2 },
  { z: -0.6, fwd: -0.58 },
];

const FOOT_Z = [1.54, 0.49, -0.59, -1.59, 1.54, 0.49, -0.59, -1.59];
const FOOT_X = [3, 3, 3, 3, -3, -3, -3, -3];
const GROUP_A = [true, false, true, false, false, true, false, true];
const REACH = 1.65;
const TAU = Math.PI * 2;

export interface LegPose {
  yaw: number;
  lift: number;
  knee: number;
  ankle: number;
}
export interface ClawPose {
  yaw: number;
  pitch: number;
  elbow: number;
  wrist: number;
  open: number;
}
export interface Pose {
  bx: number;
  by: number;
  bz: number;
  rx: number;
  ry: number;
  rz: number;
  legs: LegPose[];
  claws: ClawPose[];
  eye: number;
  antenna: number;
  vx: number;
  vz: number;
  load: number;
}

export interface ManualRig {
  leg: number;
  yaw: number;
  lift: number;
  knee: number;
  ankle: number;
  claw: number;
}

export function makePose(): Pose {
  return {
    bx: 0,
    by: 0,
    bz: 0,
    rx: 0,
    ry: 0,
    rz: 0,
    legs: Array.from({ length: 8 }, () => ({ yaw: 0, lift: 0, knee: 0, ankle: 0 })),
    claws: Array.from({ length: 2 }, () => ({ yaw: 0, pitch: 0, elbow: 0, wrist: 0, open: 0 })),
    eye: 0,
    antenna: 0,
    vx: 0,
    vz: 0,
    load: 0.15,
  };
}

function reset(p: Pose) {
  p.bx = p.by = p.bz = p.rx = p.ry = p.rz = 0;
  for (const l of p.legs) l.yaw = l.lift = l.knee = l.ankle = 0;
  for (const c of p.claws) c.yaw = c.pitch = c.elbow = c.wrist = c.open = 0;
  p.eye = p.antenna = p.vx = p.vz = 0;
  p.load = 0.15;
}

const env = (u: number) => {
  const s = Math.sin(Math.PI * Math.min(Math.max(u, 0), 1));
  return s * s;
};
const ease = (x: number) => x * x * (3 - 2 * x);

function snap(x: number) {
  if (x < 0.6) return ease(x / 0.6) * 0.85;
  if (x < 0.68) return 0.85 * (1 - (x - 0.6) / 0.08);
  return 0;
}
function pulse(u: number, at: number, w: number) {
  const d = (u - at) / w;
  return d >= 0 && d <= 1 ? env(d) : 0;
}

function compensate(p: Pose, skip = -1) {
  for (let i = 0; i < 8; i++) {
    if (i === skip) continue;
    p.legs[i].lift += (p.rx * FOOT_Z[i] - p.by - p.rz * FOOT_X[i]) / REACH;
  }
}

export function computePose(anim: string, t: number, manual: ManualRig, out: Pose): Pose {
  reset(out);
  switch (anim) {
    case "walk": {
      const base = (TAU * t) / 1.2;
      for (let i = 0; i < 8; i++) {
        const phi = base + (GROUP_A[i] ? 0 : Math.PI);
        const sw = Math.max(0, Math.sin(phi));
        const l = out.legs[i];
        l.lift = sw * 0.36;
        l.knee = -sw * 0.18;
        l.ankle = -sw * 0.1;
        l.yaw = -Math.cos(phi) * 0.24;
      }
      out.by = 0.02 * Math.cos(2 * base);
      out.ry = 0.03 * Math.sin(base);
      out.rz = 0.012 * Math.sin(base);
      out.claws.forEach((c, i) => {
        c.pitch = 0.05 + 0.04 * Math.sin(base + i * Math.PI);
        c.elbow = 0.1;
        c.wrist = 0.04 * Math.sin(base + 1);
        c.open = 0.04;
        c.yaw = 0.06 * Math.sin(base + i * Math.PI);
      });
      out.eye = 0.15 * Math.sin(base * 0.5);
      out.antenna = 0.08 * Math.sin(base * 2);
      out.vz = 1.5;
      out.load = 0.58;
      compensate(out);
      break;
    }
    case "sideways": {
      const base = TAU * t;
      for (let i = 0; i < 8; i++) {
        const right = i < 4;
        const phi = base + (GROUP_A[i] ? 0 : Math.PI);
        const sw = Math.max(0, Math.sin(phi));
        const c = Math.cos(phi);
        const l = out.legs[i];
        l.lift = sw * 0.4;
        l.knee = (right ? -c : c) * 0.28 - sw * 0.05;
        l.ankle = (right ? -c : c) * 0.12;
      }
      out.rz = 0.02 * Math.sin(2 * base);
      out.by = 0.02 * Math.cos(2 * base);
      out.bx = 0.03 * Math.sin(base);
      out.claws.forEach((c, i) => {
        c.pitch = 0.15;
        c.elbow = 0.25;
        c.open = 0.08 + 0.05 * Math.sin(base + i);
      });
      out.antenna = 0.1 * Math.sin(base * 2);
      out.vx = 1.3;
      out.load = 0.62;
      compensate(out);
      break;
    }
    case "claws": {
      const u = (t % 3) / 3;
      for (let i = 0; i < 8; i++) out.legs[i].lift = 0.02 * Math.sin(t * 1.4 + i);
      out.claws.forEach((c, i) => {
        c.pitch = 0.32 + 0.05 * Math.sin(TAU * u + i);
        c.elbow = -0.25;
        c.wrist = 0.15;
        c.yaw = 0.1 * Math.sin(TAU * u + i * Math.PI);
        c.open = snap(i === 0 ? u : (u + 0.5) % 1);
      });
      out.rx = -0.05;
      out.eye = 0.4 * Math.sin(TAU * u);
      out.load = 0.38;
      compensate(out);
      break;
    }
    case "articulation": {
      const tt = t % 7.2;
      const k = Math.floor(tt / 0.9) % 8;
      const u = (tt % 0.9) / 0.9;
      const e = env(u);
      for (let i = 0; i < 8; i++) {
        const l = out.legs[i];
        if (i === k) {
          l.lift = 0.95 * e;
          l.knee = 0.7 * e;
          l.ankle = 0.5 * e;
          l.yaw = 0.25 * Math.sin(TAU * u) * e;
        } else l.lift = 0.02 * Math.sin(t * 2 + i);
      }
      out.rz = (k < 4 ? 1 : -1) * 0.025 * e;
      out.claws.forEach((c) => {
        c.open = 0.15;
        c.pitch = 0.1;
      });
      out.eye = (k < 4 ? -0.6 : 0.6) * e;
      out.load = 0.32;
      compensate(out, k);
      break;
    }
    case "defensive": {
      const u = (t % 4) / 4;
      out.by = -0.1;
      out.rx = -0.16 + 0.01 * Math.sin(t * 2);
      out.ry = 0.12 * Math.sin(t * 1.3);
      for (let i = 0; i < 8; i++) {
        const l = out.legs[i];
        l.lift = -0.05 + 0.01 * Math.sin(t * 13 + i);
        l.knee = 0.22;
        l.ankle = 0.12;
      }
      const sn = pulse(u, 0.5, 0.06) + pulse(u, 0.9, 0.06);
      out.claws.forEach((c, i) => {
        c.pitch = 0.75 + 0.04 * Math.sin(t * 3 + i);
        c.elbow = -0.55;
        c.wrist = 0.35;
        c.yaw = -0.1;
        c.open = 0.85 - 0.85 * sn;
      });
      out.eye = 0.5 * Math.sin(t * 2.2);
      out.antenna = 0.1 * Math.sin(t * 3);
      out.load = 0.72;
      compensate(out);
      break;
    }
    case "swim": {
      const base = (TAU * t) / 1.4;
      out.by = 0.45 + 0.06 * Math.sin(base);
      out.rx = 0.05 * Math.sin(base + 1);
      for (let i = 0; i < 8; i++) {
        const k = i % 4;
        const l = out.legs[i];
        if (k === 3) {
          l.yaw = 0.55 * Math.sin(base);
          l.lift = 0.2;
          l.ankle = 0.5;
          l.knee = 0.3 * Math.cos(base);
        } else {
          l.lift = 0.25 + 0.1 * Math.sin(base + k);
          l.knee = -0.35;
          l.ankle = -0.2;
          l.yaw = 0.15 * Math.sin(base + k * 0.8);
        }
      }
      out.claws.forEach((c) => {
        c.pitch = -0.1;
        c.elbow = 0.5;
        c.wrist = -0.1;
        c.open = 0;
      });
      out.antenna = 0.15 * Math.sin(base);
      out.vz = 0.9;
      out.load = 0.5;
      break;
    }
    case "manual": {
      const l = out.legs[manual.leg] ?? out.legs[0];
      l.yaw = manual.yaw;
      l.lift = manual.lift;
      l.knee = manual.knee;
      l.ankle = manual.ankle;
      out.claws.forEach((c) => (c.open = manual.claw));
      out.load = 0.2;
      break;
    }
    default: {
      // idle
      out.by = Math.sin(t * 1.1) * 0.022;
      out.rx = Math.sin(t * 0.55) * 0.012;
      out.ry = Math.sin(t * 0.3) * 0.03;
      const w = 1.4;
      const tk = (Math.floor(t / w) * 3) % 8;
      const u = (t % w) / w;
      for (let i = 0; i < 8; i++) {
        const l = out.legs[i];
        l.lift = 0.025 * Math.sin(t * 1.1 + i * 0.7);
        if (i === tk && u < 0.5) {
          const e = env(u * 2);
          l.lift += 0.3 * e;
          l.knee += 0.2 * e;
          l.yaw += 0.08 * Math.sin(u * 2 * TAU);
        }
      }
      out.claws.forEach((c, i) => {
        c.open = 0.18 * Math.max(0, Math.sin(t * 0.9 + i * 1.7));
        c.pitch = 0.05 * Math.sin(t * 0.7 + i);
        c.elbow = 0.05 * Math.sin(t * 0.5 + i * 2);
        c.wrist = 0.06 * Math.sin(t * 0.8 + i);
      });
      out.eye = Math.sin(t * 0.45) * 0.7;
      out.antenna = Math.sin(t * 1.8) * 0.06;
      out.load = 0.15;
      compensate(out);
    }
  }
  return out;
}

export function lerpPose(a: Pose, b: Pose, k: number) {
  const L = (x: number, y: number) => x + (y - x) * k;
  a.bx = L(a.bx, b.bx);
  a.by = L(a.by, b.by);
  a.bz = L(a.bz, b.bz);
  a.rx = L(a.rx, b.rx);
  a.ry = L(a.ry, b.ry);
  a.rz = L(a.rz, b.rz);
  for (let i = 0; i < 8; i++) {
    const p = a.legs[i];
    const q = b.legs[i];
    p.yaw = L(p.yaw, q.yaw);
    p.lift = L(p.lift, q.lift);
    p.knee = L(p.knee, q.knee);
    p.ankle = L(p.ankle, q.ankle);
  }
  for (let i = 0; i < 2; i++) {
    const p = a.claws[i];
    const q = b.claws[i];
    p.yaw = L(p.yaw, q.yaw);
    p.pitch = L(p.pitch, q.pitch);
    p.elbow = L(p.elbow, q.elbow);
    p.wrist = L(p.wrist, q.wrist);
    p.open = L(p.open, q.open);
  }
  a.eye = L(a.eye, b.eye);
  a.antenna = L(a.antenna, b.antenna);
  a.vx = b.vx;
  a.vz = b.vz;
  a.load = L(a.load, b.load);
}
