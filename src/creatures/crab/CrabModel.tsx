import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../../store";
import { live } from "../../three/live";
import { CLAW_REST, LEG_REST, computePose, lerpPose, makePose } from "./pose";
import {
  Antenna,
  BatteryPack,
  Carapace,
  Chassis,
  Claw,
  ControlUnit,
  CoolingSystem,
  DriveMotors,
  GearTrain,
  Leg,
  OpticCluster,
  SensorArray,
  SensorHub,
  WiringHarness,
  makeRig,
} from "./parts";

const BODY_Y = 0.92;

export default function CrabModel() {
  const rig = useMemo(makeRig, []);
  const cur = useMemo(makePose, []);
  const target = useMemo(makePose, []);
  const body = useRef<THREE.Group>(null);
  const spin = useRef(0);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = useStore.getState();
    if (s.playing) live.time += dt * s.speed;

    computePose(s.animation, live.time, s.manual, target);
    const k = s.playing ? 1 - Math.exp(-12 * dt * Math.max(s.speed, 0.6)) : 1 - Math.exp(-9 * dt);
    lerpPose(cur, target, k);

    if (s.playing) {
      live.scrollX += cur.vx * dt * s.speed;
      live.scrollZ += cur.vz * dt * s.speed;
    }
    live.load = cur.load;

    const b = body.current;
    if (b) {
      b.position.set(cur.bx, BODY_Y + cur.by, cur.bz);
      b.rotation.set(cur.rx, cur.ry, cur.rz);
    }

    for (let i = 0; i < 8; i++) {
      const g = rig.legs[i];
      const p = cur.legs[i];
      const sgn = i < 4 ? -1 : 1;
      if (g.yaw) g.yaw.rotation.y = sgn * p.yaw;
      if (g.femur) g.femur.rotation.z = LEG_REST.femur + p.lift;
      if (g.knee) g.knee.rotation.z = LEG_REST.knee + p.knee;
      if (g.ankle) g.ankle.rotation.z = LEG_REST.ankle + p.ankle;
    }
    for (let c = 0; c < 2; c++) {
      const g = rig.claws[c];
      const p = cur.claws[c];
      const sgn = c === 0 ? -1 : 1;
      if (g.yaw) g.yaw.rotation.y = sgn * p.yaw;
      if (g.pitch) g.pitch.rotation.z = CLAW_REST.pitch + p.pitch;
      if (g.elbow) g.elbow.rotation.y = sgn * (CLAW_REST.elbow + p.elbow);
      if (g.wrist) g.wrist.rotation.z = CLAW_REST.wrist + p.wrist;
      if (g.dactyl) g.dactyl.rotation.z = Math.max(0, CLAW_REST.open + p.open);
    }
    if (rig.head) rig.head.rotation.y = cur.eye;
    if (rig.antenna) {
      rig.antenna.rotation.z = cur.antenna;
      rig.antenna.rotation.x = cur.antenna * 0.6;
    }

    spin.current += dt * (s.playing ? s.speed : 0.12) * (1.5 + cur.load * 9);
    rig.gears.forEach(({ g, ratio }) => {
      g.rotation.z = spin.current * ratio;
    });
    if (rig.fan) rig.fan.rotation.z += dt * 16 * (0.3 + cur.load);
  });

  return (
    <group ref={body} position={[0, BODY_Y, 0]}>
      <group position={[0, -BODY_Y, 0]}>
        <Chassis />
        <Carapace />
        <SensorArray rig={rig} />
        <Antenna rig={rig} />
        <OpticCluster />
        <ControlUnit />
        <BatteryPack />
        <DriveMotors />
        <GearTrain rig={rig} />
        <CoolingSystem rig={rig} />
        <SensorHub />
        <WiringHarness />
        {Array.from({ length: 8 }, (_, i) => (
          <Leg key={i} index={i} rig={rig} />
        ))}
        <Claw right rig={rig} />
        <Claw right={false} rig={rig} />
      </group>
    </group>
  );
}
