"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { DEPARTMENTS, type Department } from "@/lib/colombia";

const R = 10;
const D2R = Math.PI / 180;
const CENTER = { lat: 6.3, lon: -74.5 };

/**
 * Позиции маркеров на «игровой карте». В плотном андском кластере
 * (Кальдас, Рисаральда, Киндио, Богота…) точки слегка разнесены,
 * чтобы по ним можно было попасть пальцем. Остальные — около столиц.
 */
const PIN: Record<string, [number, number]> = {
  antioquia: [6.6, -75.6], choco: [5.6, -77.0], caldas: [5.45, -75.3], risaralda: [4.95, -76.2],
  quindio: [4.05, -75.75], tolima: [3.9, -74.85], bogota: [4.65, -74.05], cundinamarca: [5.55, -74.4],
  boyaca: [5.8, -73.2], valle: [3.5, -76.5], huila: [2.6, -75.4], meta: [3.9, -73.0], casanare: [5.3, -71.9],
  santander: [7.0, -73.4], "norte-de-santander": [8.1, -72.8], atlantico: [10.7, -74.9], magdalena: [10.3, -74.0],
  bolivar: [9.4, -74.5], sucre: [9.0, -75.45], cesar: [9.6, -73.35], "la-guajira": [11.4, -72.6],
  cordoba: [8.1, -75.9], narino: [1.4, -77.6], cauca: [2.4, -76.7], putumayo: [0.7, -76.2], caqueta: [1.0, -74.5],
};

/** Упрощённый контур Колумбии (широта, долгота) — стилизация, не картография. */
const COLOMBIA: [number, number][] = [
  [12.45, -71.7], [11.6, -72.9], [11.25, -74.2], [11.0, -74.8], [10.4, -75.5], [9.5, -75.7], [9.0, -76.2],
  [8.6, -76.9], [8.0, -76.8], [8.68, -77.36], [7.2, -77.9], [6.0, -77.4], [4.0, -77.4], [2.6, -78.2],
  [1.8, -78.8], [1.4, -78.9], [0.8, -77.7], [0.3, -76.5], [0.1, -75.5], [-0.9, -74.3], [-1.6, -73.2],
  [-2.4, -72.0], [-2.3, -70.9], [-3.2, -70.1], [-4.2, -69.95], [-1.2, -69.4], [-0.15, -70.05], [1.2, -69.9],
  [1.7, -69.8], [1.1, -67.1], [2.0, -67.3], [4.0, -67.8], [6.1, -67.5], [6.3, -69.4], [7.0, -70.1],
  [7.0, -71.9], [8.0, -72.4], [9.1, -72.8], [10.4, -72.9], [11.1, -72.2], [12.45, -71.7],
];

function toVec(lat: number, lon: number, r: number): THREE.Vector3 {
  const p = lat * D2R;
  const l = lon * D2R;
  return new THREE.Vector3(r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l));
}

function Marker({ dept, selected, done, hovered, onHover, onSelect }: {
  dept: Department;
  selected: boolean;
  done: boolean;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [lat, lon] = PIN[dept.id] ?? [dept.lat, dept.lon];
  const pos = useMemo(() => toVec(lat, lon, R + 0.04), [lat, lon]);
  const color = selected ? "#39ff88" : done ? "#ffcd45" : hovered ? "#dfe6ff" : "#7f93ff";
  useFrame((state) => {
    if (!ref.current) return;
    const s = selected ? 1.6 + Math.sin(state.clock.elapsedTime * 5) * 0.2 : hovered ? 1.35 : 1;
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), 0.2);
  });
  return (
    <group position={pos}>
      <mesh
        ref={ref}
        onPointerOver={(e) => { e.stopPropagation(); onHover(dept.id); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = ""; }}
        onClick={(e) => { e.stopPropagation(); onSelect(dept.id); }}
      >
        <sphereGeometry args={[0.07, 20, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.8 : 0.25} roughness={0.35} />
      </mesh>
      {(selected || hovered) && (
        <Html center distanceFactor={9} style={{ pointerEvents: "none" }} position={[0, 0.32, 0]}>
          <div className={`globe-label ${selected ? "on" : ""}`}>{dept.name}</div>
        </Html>
      )}
    </group>
  );
}

/** Сама черника: глянцево-пыльная кожица (sheen) и чашелистик-«корона» на полюсе. */
function Blueberry() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[R, 96, 64]} />
        <meshPhysicalMaterial color="#26387f" roughness={0.55} sheen={1} sheenColor="#8fa6ff" sheenRoughness={0.6} clearcoat={0.25} clearcoatRoughness={0.6} />
      </mesh>
      {/* «восковой налёт» — едва заметная внешняя оболочка */}
      <mesh>
        <sphereGeometry args={[R * 1.012, 64, 48]} />
        <meshBasicMaterial color="#9fb3ff" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <group position={[0, R * 0.985, 0]}>
        <mesh>
          <cylinderGeometry args={[0.9, 1.3, 0.25, 24]} />
          <meshStandardMaterial color="#141838" roughness={0.9} />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.0, 0.35, Math.sin(a) * 1.0]} rotation={[Math.sin(a) * 0.6, -a, -Math.cos(a) * 0.6]}>
              <coneGeometry args={[0.35, 1.0, 4]} />
              <meshStandardMaterial color="#1c2250" roughness={0.8} flatShading />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function ColombiaOutline() {
  const pts = useMemo(() => COLOMBIA.map(([la, lo]) => toVec(la, lo, R + 0.015)), []);
  return (
    <>
      <Line points={pts} color="#39ff88" lineWidth={2} transparent opacity={0.55} />
      <Line points={pts} color="#39ff88" lineWidth={7} transparent opacity={0.08} />
    </>
  );
}

/** Вступление: камера стартует далеко (видна вся черника) и подлетает к Колумбии. */
function CameraIntro({ onDone }: { onDone: () => void }) {
  const { camera } = useThree();
  const done = useRef(false);
  useFrame((state) => {
    if (done.current) return;
    const p = Math.min(1, state.clock.elapsedTime / 2.6);
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    camera.position.set(0, 0, R + 30 - 23.5 * e);
    camera.lookAt(0, 0, 0);
    if (p >= 1) {
      done.current = true;
      onDone();
    }
  });
  return null;
}

function SpinningGlobe(props: {
  selected: string | null;
  doneIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  const spin = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  // эффект «раскрутки» при открытии: полтора оборота с плавной остановкой на Колумбии
  useFrame((state) => {
    if (!spin.current) return;
    const p = Math.min(1, state.clock.elapsedTime / 2.6);
    const e = 1 - Math.pow(1 - p, 3);
    spin.current.rotation.y = -CENTER.lon * D2R + (1 - e) * Math.PI * 3;
  });
  return (
    <group rotation-x={CENTER.lat * D2R}>
      <group ref={spin}>
        <Blueberry />
        <ColombiaOutline />
        {DEPARTMENTS.map((d) => (
          <Marker
            key={d.id}
            dept={d}
            selected={props.selected === d.id}
            done={props.doneIds.has(d.id)}
            hovered={hovered === d.id}
            onHover={setHovered}
            onSelect={props.onSelect}
          />
        ))}
      </group>
    </group>
  );
}

export default function Globe(props: { selected: string | null; doneIds: Set<string>; onSelect: (id: string) => void }) {
  const [ready, setReady] = useState(false);
  return (
    <Canvas camera={{ position: [0, 0, R + 30], fov: 40, near: 0.1, far: 300 }} dpr={[1, 2]}>
      <color attach="background" args={["#05061a"]} />
      <Stars radius={120} depth={40} count={2500} factor={4} fade speed={0.6} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 10, 14]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-12, -4, 6]} intensity={0.8} color="#7aa2ff" />
      <SpinningGlobe {...props} />
      <CameraIntro onDone={() => setReady(true)} />
      <OrbitControls enabled={ready} enablePan={false} minDistance={R + 3.5} maxDistance={R + 30} rotateSpeed={0.4} zoomSpeed={0.6} />
    </Canvas>
  );
}
