import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";

const cache = new Map<string, THREE.BufferGeometry>();
function memo<T extends THREE.BufferGeometry>(key: string, fn: () => T): T {
  let g = cache.get(key);
  if (!g) cache.set(key, (g = fn()));
  return g as T;
}

export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 32),
  cylLow: new THREE.CylinderGeometry(1, 1, 1, 12),
  sphere: new THREE.SphereGeometry(1, 32, 16),
  cone: new THREE.ConeGeometry(1, 1, 24),
  torus: new THREE.TorusGeometry(1, 0.09, 10, 40),
  torusThin: new THREE.TorusGeometry(1, 0.04, 8, 48),
  plane: new THREE.PlaneGeometry(1, 1),
};

export const capsule = (r: number, len: number) =>
  memo(`cap-${r}-${len}`, () => new THREE.CapsuleGeometry(r, len, 8, 20));

export const rbox = (w: number, h: number, d: number, r = 0.04) =>
  memo(`rb-${w}-${h}-${d}-${r}`, () => new RoundedBoxGeometry(w, h, d, 3, r));

export const shellPanel = (
  phiStart: number,
  phiLength: number,
  thetaStart: number,
  thetaLength: number
) =>
  memo(
    `sp-${phiStart.toFixed(3)}-${phiLength.toFixed(3)}-${thetaStart.toFixed(3)}-${thetaLength.toFixed(3)}`,
    () => new THREE.SphereGeometry(1, 56, 14, phiStart, phiLength, thetaStart, thetaLength)
  );

export const gear = (teeth: number, r: number, depth: number) =>
  memo(`gear-${teeth}-${r}-${depth}`, () => {
    const s = new THREE.Shape();
    const rr = r * 0.82;
    const step = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      const pts = [
        [rr, a],
        [r, a + step * 0.15],
        [r, a + step * 0.45],
        [rr, a + step * 0.6],
      ];
      pts.forEach(([rad, ang], j) => {
        const x = Math.cos(ang) * rad;
        const y = Math.sin(ang) * rad;
        if (i === 0 && j === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      });
    }
    s.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, r * 0.22, 0, Math.PI * 2, true);
    s.holes.push(hole);
    // lightening holes
    if (r > 0.1) {
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + 0.4;
        const h = new THREE.Path();
        h.absarc(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52, r * 0.14, 0, Math.PI * 2, true);
        s.holes.push(h);
      }
    }
    const g = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelThickness: depth * 0.12,
      bevelSize: r * 0.02,
      bevelSegments: 1,
      curveSegments: 6,
    });
    g.translate(0, 0, -depth / 2);
    return g;
  });

/** Curved, tapered claw finger blade lying in XY, extending along +X */
export const finger = () =>
  memo("finger", () => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.1);
    s.quadraticCurveTo(0.46, -0.17, 0.8, 0.07);
    s.quadraticCurveTo(0.42, -0.02, 0, 0.085);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.022,
      bevelSegments: 3,
      curveSegments: 20,
    });
    g.translate(0, 0, -0.045);
    g.computeVertexNormals();
    return g;
  });

/** Points along the inner edge of the finger for teeth placement */
export function fingerInnerPoint(u: number) {
  // inner curve from tip (0.8,0.07) via (0.42,-0.02) to (0,0.085)
  const p0 = new THREE.Vector2(0.8, 0.07);
  const p1 = new THREE.Vector2(0.42, -0.02);
  const p2 = new THREE.Vector2(0, 0.085);
  const a = (1 - u) * (1 - u);
  const b = 2 * (1 - u) * u;
  const c = u * u;
  return new THREE.Vector2(a * p0.x + b * p1.x + c * p2.x, a * p0.y + b * p1.y + c * p2.y);
}

export const tube = (key: string, points: THREE.Vector3[], radius: number) =>
  memo(`tube-${key}`, () => {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 40, radius, 8, false);
  });
