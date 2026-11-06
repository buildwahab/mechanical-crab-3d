import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, Environment, Grid, Html, Lightformer, Line } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../store";
import type { CreatureDefinition, Vec3 } from "../creatures/types";
import { InfoCtx } from "../three/Part";
import { cameraApi, clipPlane, live, pointer } from "../three/live";
import { applyArmorOpacity, pulseGlow, setClipping } from "../three/materials";

function Stage() {
  const section = useStore((s) => s.section);
  const bp = section === "blueprint";
  const grid = useRef<THREE.Group>(null);
  const arc = useRef<THREE.Mesh>(null);
  const arc2 = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (grid.current) {
      grid.current.position.x = -(live.scrollX % 2.5);
      grid.current.position.z = -(live.scrollZ % 2.5);
    }
    if (arc.current) arc.current.rotation.z += dt * 0.12;
    if (arc2.current) arc2.current.rotation.z -= dt * 0.07;
  });

  const lineColor = bp ? "#8fa9cf" : "#c9c4ba";
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#ffffff", "#d6d1c7", 0.6]} />
      <directionalLight
        position={[6, 11, 7]}
        intensity={2.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      >
        <orthographicCamera attach="shadow-camera" args={[-7, 7, 7, -7, 0.5, 32]} />
      </directionalLight>
      <directionalLight position={[-7, 5, -5]} intensity={0.75} color="#e8eef8" />
      <pointLight position={[0, 1.1, 3.6]} intensity={2.2} distance={6} color="#ff8a3d" />

      <Environment resolution={256} environmentIntensity={0.6}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-6, 2, 3]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[6, 2, -2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" color="#ff8a3d" intensity={0.8} position={[0, 2, -8]} scale={4} />
        <Lightformer form="rect" intensity={0.6} position={[0, 1, 8]} scale={[10, 2, 1]} />
      </Environment>

      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0}>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial transparent opacity={bp ? 0.06 : 0.17} />
      </mesh>

      <group ref={grid}>
        <Grid
          position={[0, 0.002, 0]}
          args={[30, 30]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor={bp ? "#b9c9e2" : "#d6d2ca"}
          sectionSize={2.5}
          sectionThickness={1}
          sectionColor={bp ? "#7f9cc8" : "#bdb7ac"}
          fadeDistance={30}
          fadeStrength={1.6}
          infiniteGrid
        />
      </group>

      <group rotation-x={-Math.PI / 2} position-y={0.006}>
        <mesh>
          <ringGeometry args={[3.7, 3.715, 160]} />
          <meshBasicMaterial color={lineColor} transparent opacity={0.9} />
        </mesh>
        <mesh>
          <ringGeometry args={[4.7, 4.71, 160]} />
          <meshBasicMaterial color={lineColor} transparent opacity={0.6} />
        </mesh>
        <mesh ref={arc}>
          <ringGeometry args={[3.78, 3.83, 80, 1, 0, Math.PI / 3]} />
          <meshBasicMaterial color="#ff6a13" transparent opacity={0.85} />
        </mesh>
        <mesh ref={arc2}>
          <ringGeometry args={[4.62, 4.65, 80, 1, Math.PI, Math.PI / 5]} />
          <meshBasicMaterial color={bp ? "#2b5aa0" : "#16181b"} transparent opacity={0.5} />
        </mesh>
      </group>
    </>
  );
}

function DimLine({ a, b, label, tick }: { a: Vec3; b: Vec3; label: string; tick: Vec3 }) {
  const mid: Vec3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const t = (p: Vec3, s: number): Vec3 => [p[0] + tick[0] * s, p[1] + tick[1] * s, p[2] + tick[2] * s];
  return (
    <group>
      <Line points={[a, b]} color="#2b5aa0" lineWidth={1.3} />
      <Line points={[t(a, -1), t(a, 1)]} color="#2b5aa0" lineWidth={1.3} />
      <Line points={[t(b, -1), t(b, 1)]} color="#2b5aa0" lineWidth={1.3} />
      <Html position={mid} center zIndexRange={[12, 0]} style={{ pointerEvents: "none" }}>
        <div className="dim-label">{label}</div>
      </Html>
    </group>
  );
}

function Dimensions({ creature }: { creature: CreatureDefinition }) {
  const show = useStore((s) => s.showDims);
  if (!show) return null;
  const { min, max } = creature.bounds;
  const y = 0.03;
  const o = 0.55;
  return (
    <group>
      <DimLine a={[min[0], y, max[2] + o]} b={[max[0], y, max[2] + o]} label={`W ${creature.dimensions.width}`} tick={[0, 0, 0.14]} />
      <Line points={[[min[0], y, max[2] - 0.4], [min[0], y, max[2] + o + 0.2]]} color="#2b5aa0" lineWidth={0.8} dashed dashSize={0.08} gapSize={0.06} />
      <Line points={[[max[0], y, max[2] - 0.4], [max[0], y, max[2] + o + 0.2]]} color="#2b5aa0" lineWidth={0.8} dashed dashSize={0.08} gapSize={0.06} />
      <DimLine a={[max[0] + o, y, min[2]]} b={[max[0] + o, y, max[2]]} label={`L ${creature.dimensions.length}`} tick={[0.14, 0, 0]} />
      <DimLine a={[max[0] + o, 0, min[2] - 0.2]} b={[max[0] + o, max[1], min[2] - 0.2]} label={`H ${creature.dimensions.height}`} tick={[0.14, 0, 0]} />
      <Line points={[[0, y, min[2] - 0.6], [0, y, max[2] + 0.6]]} color="#ff6a13" lineWidth={0.8} dashed dashSize={0.2} gapSize={0.08} />
      <Line points={[[min[0] - 0.4, y, 0], [max[0] + 0.4, y, 0]]} color="#ff6a13" lineWidth={0.8} dashed dashSize={0.2} gapSize={0.08} />
    </group>
  );
}

function CameraRig({ creature }: { creature: CreatureDefinition }) {
  const ref = useRef<CameraControls>(null);
  useEffect(() => {
    cameraApi.controls = ref.current;
    cameraApi.home = creature.cameraPresets.iso;
    cameraApi.goTo(creature.cameraPresets.iso, false);
    return () => {
      cameraApi.controls = null;
    };
  }, [creature]);
  useFrame((_, dt) => {
    if (useStore.getState().autoRotate && ref.current) ref.current.rotate(dt * 0.16, 0, true);
  });
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={1.2}
      maxDistance={24}
      smoothTime={0.45}
      draggingSmoothTime={0.12}
      maxPolarAngle={Math.PI * 0.53}
    />
  );
}

function LiveUpdater() {
  const fps = useRef({ n: 0, t: 0 });
  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    const s = useStore.getState();
    live.explode += (s.explode - live.explode) * (1 - Math.exp(-9 * s.slowMo * dt));
    live.armor += (s.armorOpacity - live.armor) * (1 - Math.exp(-10 * dt));
    applyArmorOpacity(live.armor);
    setClipping(s.clipEnabled);
    if (s.clipEnabled) {
      if (s.clipAxis === "x") clipPlane.normal.set(-1, 0, 0);
      else if (s.clipAxis === "y") clipPlane.normal.set(0, -1, 0);
      else clipPlane.normal.set(0, 0, -1);
      clipPlane.constant = s.clipPos;
    }
    pulseGlow(state.clock.elapsedTime);
    fps.current.n++;
    fps.current.t += dtRaw;
    if (fps.current.t > 0.5) {
      live.fps = Math.round(fps.current.n / fps.current.t);
      fps.current.n = 0;
      fps.current.t = 0;
    }
  });
  return null;
}

export default function Viewer({ creature }: { creature: CreatureDefinition }) {
  const infoMap = useMemo(() => new Map(creature.components.map((c) => [c.id, c])), [creature]);
  const Model = creature.Model;
  const home = creature.cameraPresets.iso;
  return (
    <div
      className="absolute inset-0 touch-none"
      onPointerDown={(e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      }}
    >
      <Canvas
        fallback={<div role="status" className="p-6 pt-28 text-center">The 3D viewer requires WebGL. Enable hardware acceleration or try another browser. Component details and diagrams remain available below.</div>}
        shadows
        dpr={[1, 1.5]}
        camera={{ position: home.position, fov: 35, near: 0.1, far: 120 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
        }}
        onPointerMissed={(e) => {
          const dx = e.clientX - pointer.x;
          const dy = e.clientY - pointer.y;
          if (dx * dx + dy * dy < 25) useStore.getState().select(null);
        }}
      >
        <InfoCtx.Provider value={infoMap}>
          <Stage />
          <Suspense fallback={null}>{Model && <Model />}</Suspense>
          <Dimensions creature={creature} />
          <CameraRig creature={creature} />
          <LiveUpdater />
        </InfoCtx.Provider>
      </Canvas>
    </div>
  );
}
