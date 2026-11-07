"use client";

import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { AzulitoModel } from "./AzulitoModel";
import { HALF, WRAP, laneHeight, moverX, type Lane, type LevelData, type Mover } from "./levelGen";

export const HOP_TIME = 0.14;

export interface GameState {
  col: number;
  row: number;
  fromCol: number;
  fromRow: number;
  hopStart: number;
  hopping: boolean;
  queued: [number, number] | null;
  facing: number;
  status: "playing" | "dead" | "won";
  berries: number;
  maxRow: number;
  collected: Set<string>;
  deathAt: number;
  hitBy: string;
  now: number;
}

export function newGameState(startRow = 0, berries = 0, collected: Set<string> = new Set()): GameState {
  return {
    col: 0, row: startRow, fromCol: 0, fromRow: startRow, hopStart: 0, hopping: false, queued: null, facing: 0,
    status: "playing", berries, maxRow: startRow, collected: new Set(collected), deathAt: 0, hitBy: "", now: 0,
  };
}

const ease = (p: number) => 1 - (1 - p) * (1 - p);
const GROUND_W = WRAP * 2 + 8;

/* ---------- окружение ---------- */

function Ground({ lane, level }: { lane: Lane; level: LevelData }) {
  const { theme } = level;
  const z = -lane.row;
  if (lane.kind === "road") {
    return (
      <group position={[0, 0, z]}>
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[GROUND_W, 1]} />
          <meshStandardMaterial color="#3b3f46" roughness={0.95} />
        </mesh>
        {lane.dashed &&
          Array.from({ length: 13 }, (_, i) => (
            <mesh key={i} rotation-x={-Math.PI / 2} position={[-12 + i * 2, 0.005, 0.5]}>
              <planeGeometry args={[0.9, 0.06]} />
              <meshBasicMaterial color="#e9e9e9" />
            </mesh>
          ))}
      </group>
    );
  }
  if (lane.kind === "walk") {
    return (
      <group position={[0, 0, z]}>
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <boxGeometry args={[GROUND_W, 0.12, 1]} />
          <meshStandardMaterial color="#d7cfbf" roughness={0.9} />
        </mesh>
        {/* бордюр */}
        {[-0.47, 0.47].map((dz) => (
          <mesh key={dz} position={[0, 0.07, dz]}>
            <boxGeometry args={[GROUND_W, 0.14, 0.06]} />
            <meshStandardMaterial color="#b9b1a2" roughness={0.9} />
          </mesh>
        ))}
        {Array.from({ length: 15 }, (_, i) => (
          <mesh key={i} position={[-14 + i * 2, 0.121, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.03, 0.9]} />
            <meshBasicMaterial color="#c4bcac" />
          </mesh>
        ))}
      </group>
    );
  }
  if (lane.kind === "plaza") {
    return <PlazaGround row={lane.row} />;
  }
  if (lane.kind === "finish") {
    return (
      <group position={[0, 0, z]}>
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[GROUND_W, 1]} />
          <meshStandardMaterial color={theme.grass} />
        </mesh>
        {Array.from({ length: (HALF * 2 + 1) * 2 }, (_, i) => {
          const c = (i % (HALF * 2 + 1)) - HALF;
          const half = Math.floor(i / (HALF * 2 + 1));
          return (
            <mesh key={i} rotation-x={-Math.PI / 2} position={[c, 0.004, half ? 0.25 : -0.25]}>
              <planeGeometry args={[1, 0.5]} />
              <meshStandardMaterial color={(c + half) % 2 === 0 ? "#ffffff" : "#1f2430"} />
            </mesh>
          );
        })}
        {/* арка финиша */}
        {[-HALF - 0.6, HALF + 0.6].map((x) => (
          <mesh key={x} position={[x, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 2.4, 12]} />
            <meshStandardMaterial color="#2b3a86" />
          </mesh>
        ))}
        <mesh position={[0, 2.45, 0]} castShadow>
          <boxGeometry args={[HALF * 2 + 1.6, 0.35, 0.25]} />
          <meshStandardMaterial color="#3dd68c" />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[-4 + i, 2.45, 0.16]}>
            <sphereGeometry args={[0.13, 16, 12]} />
            <meshStandardMaterial color="#3a4fa0" roughness={0.4} />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, z]} receiveShadow>
      <planeGeometry args={[GROUND_W, 1]} />
      <meshStandardMaterial color={lane.row % 2 ? theme.grass : theme.grassAlt} roughness={1} />
    </mesh>
  );
}

/** Плиты площади: крупный камень двух тонов, тёмные швы, лёгкая разница высот. */
const PlazaGround = memo(function PlazaGround({ row }: { row: number }) {
  const tiles = useMemo(() => {
    const out: { x: number; c: string }[] = [];
    for (let i = -13; i <= 13; i++) {
      const h = Math.abs(Math.sin(i * 12.9898 + row * 78.233) * 43758.5453) % 1;
      out.push({ x: i, c: (i + row) % 2 === 0 ? (h < 0.5 ? "#d6ccb9" : "#d1c6b1") : h < 0.5 ? "#c9bea8" : "#cdc2ac" });
    }
    return out;
  }, [row]);
  return (
    <group position={[0, 0, -row]}>
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <boxGeometry args={[GROUND_W, 0.05, 1]} />
        <meshStandardMaterial color="#a89d88" roughness={0.95} />
      </mesh>
      {tiles.map((t) => (
        <mesh key={t.x} position={[t.x, 0.056, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[0.96, 0.96]} />
          <meshStandardMaterial color={t.c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
});

function Pigeon({ x, dz, color, i }: { x: number; dz: number; color: string; i: number }) {
  const head = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!head.current) return;
    const t = state.clock.elapsedTime * 3 + i * 1.7;
    head.current.rotation.x = Math.max(0, Math.sin(t)) * 0.9; // клюёт
  });
  return (
    <group position={[x, 0.06, dz]} rotation-y={i * 2.1} scale={0.8}>
      <mesh position={[0, 0.09, 0]} scale={[0.8, 0.7, 1.2]} castShadow>
        <sphereGeometry args={[0.08, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <group ref={head} position={[0, 0.13, -0.07]}>
        <mesh position={[0, 0.03, -0.03]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color="#5e6070" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.02, -0.08]} rotation-x={-Math.PI / 2}>
          <coneGeometry args={[0.012, 0.035, 6]} />
          <meshStandardMaterial color="#e3a35b" />
        </mesh>
      </group>
    </group>
  );
}

function Prop({ kind, scale, color }: { kind: string; scale: number; color: string }) {
  if (kind === "tree") {
    return (
      <group scale={scale}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 0.7, 8]} />
          <meshStandardMaterial color="#7a5230" />
        </mesh>
        <mesh position={[0, 0.95, 0]} castShadow>
          <icosahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
        <mesh position={[0.05, 1.35, 0]} castShadow>
          <icosahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      </group>
    );
  }
  if (kind === "palm") {
    return (
      <group scale={scale}>
        <mesh position={[0.08, 0.7, 0]} rotation-z={-0.12} castShadow>
          <cylinderGeometry args={[0.06, 0.1, 1.4, 8]} />
          <meshStandardMaterial color="#9c7a4f" />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[0.17, 1.42, 0]} rotation={[0, (i / 6) * Math.PI * 2, 0.9]} castShadow>
            <boxGeometry args={[0.7, 0.04, 0.2]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
        ))}
        <mesh position={[0.17, 1.38, 0]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color="#6b4b2a" />
        </mesh>
      </group>
    );
  }
  if (kind === "bush") {
    return (
      <mesh position={[0, 0.28, 0]} scale={scale} castShadow>
        <dodecahedronGeometry args={[0.36, 0]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    );
  }
  if (kind === "bench") {
    return (
      <group position={[0, 0.12, 0]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.8, 0.07, 0.32]} />
          <meshStandardMaterial color="#8d5b34" />
        </mesh>
        <mesh position={[0, 0.48, 0.14]} castShadow>
          <boxGeometry args={[0.8, 0.28, 0.05]} />
          <meshStandardMaterial color="#8d5b34" />
        </mesh>
        {[-0.32, 0.32].map((x) => (
          <mesh key={x} position={[x, 0.12, 0]}>
            <boxGeometry args={[0.06, 0.26, 0.3]} />
            <meshStandardMaterial color="#2f3337" />
          </mesh>
        ))}
      </group>
    );
  }
  if (kind === "planter") {
    return (
      <group position={[0, 0.12, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
          <meshStandardMaterial color="#c97b4a" />
        </mesh>
        <mesh position={[0, 0.55, 0]} castShadow>
          <dodecahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#d6336c" flatShading />
        </mesh>
      </group>
    );
  }
  if (kind.startsWith("bronze")) return <BoteroBronze kind={kind} />;
  if (kind === "plaza-tree") {
    return (
      <group>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.45, 0.48, 0.34, 24]} />
          <meshStandardMaterial color="#a8a093" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.02, 24]} />
          <meshStandardMaterial color="#4a3726" />
        </mesh>
        <mesh position={[0, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.1, 1.2, 8]} />
          <meshStandardMaterial color="#6b4b2a" />
        </mesh>
        {[[0, 1.75, 0, 0.55], [0.3, 1.55, 0.1, 0.38], [-0.28, 1.6, -0.1, 0.4], [0.05, 2.1, 0, 0.36]].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial color="#3f8f4a" roughness={0.85} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  if (kind === "vendor") {
    // тележка уличного торговца под зонтом в цветах флага Колумбии
    return (
      <group>
        <RoundedBox args={[0.8, 0.5, 0.5]} radius={0.05} smoothness={2} position={[0, 0.45, 0]} castShadow>
          <meshStandardMaterial color="#f4f1ea" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[0.7, 0.06, 0.4]} />
          <meshStandardMaterial color="#e76f51" />
        </mesh>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.14, 0.22]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.12, 0.12, 0.05, 14]} />
            <meshStandardMaterial color="#2b2d42" />
          </mesh>
        ))}
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.0, 6]} />
          <meshStandardMaterial color="#555" />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[0, 1.62, 0]} castShadow>
            <coneGeometry args={[0.75, 0.3, 4, 1, true, (i * Math.PI) / 3, Math.PI / 3]} />
            <meshStandardMaterial color={["#fcd116", "#003893", "#ce1126"][i % 3]} side={THREE.DoubleSide} roughness={0.7} />
          </mesh>
        ))}
      </group>
    );
  }
  // фонарь
  return (
    <group position={[0, 0.12, 0]}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 1.8, 6]} />
        <meshStandardMaterial color="#2f3337" />
      </mesh>
      <mesh position={[0, 1.82, 0]}>
        <sphereGeometry args={[0.11, 10, 8]} />
        <meshStandardMaterial color="#fff6d6" emissive="#ffe8a3" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

const BRONZE_MAT = { color: "#5b4330", metalness: 0.75, roughness: 0.32 } as const;

/** Пухлые бронзовые скульптуры в духе Фернандо Ботеро на каменных постаментах. */
function BoteroBronze({ kind }: { kind: string }) {
  const pedestal = (
    <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.86, 0.4, 0.86]} />
      <meshStandardMaterial color="#9a9488" roughness={0.9} />
    </mesh>
  );
  const B = (props: { p: [number, number, number]; s: [number, number, number]; r?: number }) => (
    <mesh position={props.p} scale={props.s} castShadow>
      <sphereGeometry args={[props.r ?? 0.3, 32, 24]} />
      <meshStandardMaterial {...BRONZE_MAT} />
    </mesh>
  );
  if (kind === "bronze-horse") {
    return (
      <group>
        {pedestal}
        <B p={[0, 0.82, 0]} s={[1.45, 0.95, 0.9]} />
        <B p={[0.42, 1.12, 0]} s={[0.55, 0.7, 0.55]} />
        <B p={[0.55, 1.35, 0]} s={[0.6, 0.45, 0.45]} />
        {[-0.25, 0.25].flatMap((x) => [-0.15, 0.15].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.52, z]} castShadow>
            <cylinderGeometry args={[0.07, 0.06, 0.28, 10]} />
            <meshStandardMaterial {...BRONZE_MAT} />
          </mesh>
        )))}
        {/* всадник */}
        <B p={[-0.05, 1.3, 0]} s={[0.9, 1.05, 0.85]} r={0.24} />
        <B p={[-0.02, 1.62, 0]} s={[0.55, 0.55, 0.55]} r={0.24} />
      </group>
    );
  }
  if (kind === "bronze-bird") {
    // «Pájaro» Ботеро — пухлая бронзовая птица (родственница Азулито)
    return (
      <group>
        {pedestal}
        <B p={[0, 0.85, 0.05]} s={[1.05, 0.95, 1.25]} r={0.36} />
        <B p={[0, 1.3, -0.2]} s={[0.7, 0.7, 0.7]} r={0.28} />
        <mesh position={[0, 1.28, -0.47]} rotation-x={-Math.PI / 2} castShadow>
          <coneGeometry args={[0.07, 0.2, 10]} />
          <meshStandardMaterial {...BRONZE_MAT} />
        </mesh>
        <mesh position={[0, 0.95, 0.5]} rotation-x={0.6} castShadow>
          <coneGeometry args={[0.16, 0.4, 4]} />
          <meshStandardMaterial {...BRONZE_MAT} />
        </mesh>
      </group>
    );
  }
  if (kind === "bronze-cat") {
    return (
      <group>
        {pedestal}
        <B p={[0, 0.72, 0]} s={[1.0, 0.85, 1.25]} />
        <B p={[0, 1.08, -0.18]} s={[0.75, 0.68, 0.7]} />
        {[-0.1, 0.1].map((x) => (
          <mesh key={x} position={[x, 1.32, -0.2]} castShadow>
            <coneGeometry args={[0.06, 0.14, 4]} />
            <meshStandardMaterial {...BRONZE_MAT} />
          </mesh>
        ))}
        <mesh position={[0.2, 0.62, 0.38]} rotation={[0.8, 0, 0.4]} castShadow>
          <torusGeometry args={[0.16, 0.045, 8, 16, Math.PI]} />
          <meshStandardMaterial {...BRONZE_MAT} />
        </mesh>
      </group>
    );
  }
  if (kind === "bronze-woman") {
    // полулежащая фигура
    return (
      <group>
        {pedestal}
        <B p={[0, 0.66, 0]} s={[1.5, 0.62, 0.95]} />
        <B p={[-0.38, 0.92, 0]} s={[0.85, 0.85, 0.8]} r={0.27} />
        <B p={[-0.52, 1.22, 0]} s={[0.45, 0.45, 0.45]} r={0.26} />
        <B p={[0.42, 0.7, 0.05]} s={[0.9, 0.5, 0.55]} />
      </group>
    );
  }
  // «Толстяк» стоя
  return (
    <group>
      {pedestal}
      <B p={[0, 0.95, 0]} s={[1.1, 1.25, 1.0]} r={0.36} />
      <B p={[0, 1.55, 0]} s={[0.55, 0.55, 0.55]} r={0.3} />
      {[-0.42, 0.42].map((x) => (
        <B key={x} p={[x, 1.0, 0]} s={[0.32, 0.65, 0.32]} r={0.3} />
      ))}
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.22, 10]} />
          <meshStandardMaterial {...BRONZE_MAT} />
        </mesh>
      ))}
    </group>
  );
}

/** Palacio de la Cultura Rafael Uribe Uribe: готический фасад в чёрно-белую «шахматку». */
function Palacio({ h }: { h: number }) {
  const cells = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let iy = 0; iy < Math.floor(h / 0.3); iy++) {
      for (let ix = 0; ix < 6; ix++) if ((ix + iy) % 2 === 0) out.push({ x: -0.75 + ix * 0.3 + 0.15, y: 0.15 + iy * 0.3 });
    }
    return out;
  }, [h]);
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, h, 1.0]} />
        <meshStandardMaterial color="#f1ede4" roughness={0.8} />
      </mesh>
      {cells.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, 0.505]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshStandardMaterial color="#1e1e1e" roughness={0.7} />
        </mesh>
      ))}
      {/* стрельчатые окна с подсветкой */}
      {[-0.45, 0, 0.45].map((x) => (
        <mesh key={x} position={[x, h * 0.62, 0.52]}>
          <planeGeometry args={[0.18, 0.5]} />
          <meshStandardMaterial color="#ffd98a" emissive="#ffb547" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, h + 0.35, 0.3]} castShadow>
          <coneGeometry args={[0.16, 0.7, 4]} />
          <meshStandardMaterial color="#2b2b2b" />
        </mesh>
      ))}
      <mesh position={[0, h + 0.5, 0]} castShadow>
        <coneGeometry args={[0.45, 1.0, 4]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
    </group>
  );
}

/** Museo de Antioquia: охристый фасад, белая колоннада, арочные окна. */
function Museo({ h }: { h: number }) {
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, h, 1.0]} />
        <meshStandardMaterial color="#c9894f" roughness={0.85} />
      </mesh>
      <mesh position={[0, h + 0.08, 0]} castShadow>
        <boxGeometry args={[1.95, 0.16, 1.1]} />
        <meshStandardMaterial color="#efe6d6" roughness={0.7} />
      </mesh>
      {[-0.6, -0.2, 0.2, 0.6].map((x) => (
        <group key={x}>
          <mesh position={[x, h * 0.35, 0.56]} castShadow>
            <cylinderGeometry args={[0.07, 0.08, h * 0.7, 12]} />
            <meshStandardMaterial color="#f3ece0" roughness={0.6} />
          </mesh>
          <mesh position={[x, h * 0.82, 0.505]}>
            <planeGeometry args={[0.2, 0.32]} />
            <meshStandardMaterial color="#ffe1a8" emissive="#ffb35c" emissiveIntensity={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Надземное метро Медельина: виадук поперёк улицы и проезжающий поезд. */
function MetroViaduct({ z }: { z: number }) {
  const train = useRef<THREE.Group>(null);
  const root = useRef<THREE.Group>(null);
  const mats = useRef<THREE.Material[]>([]);
  useLayoutEffect(() => {
    const list: THREE.Material[] = [];
    root.current?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && !list.includes(m)) {
        m.transparent = true;
        list.push(m);
      }
    });
    mats.current = list;
  }, []);
  useFrame((state) => {
    if (!train.current) return;
    const t = state.clock.elapsedTime;
    train.current.position.x = ((t * 4) % 60) - 30;
    // когда мост оказывается между камерой и птицей — делаем его полупрозрачным
    const between = state.camera.position.z - 8.5 < z + 3;
    const target = between ? 0.18 : 1;
    for (const m of mats.current) {
      m.opacity += (target - m.opacity) * 0.15;
      m.depthWrite = m.opacity > 0.9;
    }
  });
  return (
    <group ref={root} position={[0, 0, z - 0.2]}>
      <mesh position={[0, 3.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[GROUND_W, 0.35, 1.1]} />
        <meshStandardMaterial color="#c9c4ba" roughness={0.8} />
      </mesh>
      {[-12, -7.5, 7.5, 12].map((x) => (
        <mesh key={x} position={[x, 1.8, 0]} castShadow>
          <boxGeometry args={[0.45, 3.6, 0.45]} />
          <meshStandardMaterial color="#b9b3a8" roughness={0.85} />
        </mesh>
      ))}
      <group ref={train} position={[0, 4.15, 0]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[i * 3.1, 0, 0]}>
            <RoundedBox args={[3, 0.75, 0.85]} radius={0.12} smoothness={3} castShadow>
              <meshStandardMaterial color="#e9edf0" metalness={0.3} roughness={0.35} />
            </RoundedBox>
            <mesh position={[0, 0.08, 0.43]}>
              <boxGeometry args={[2.6, 0.28, 0.02]} />
              <meshStandardMaterial color="#20324d" emissive="#4a78b5" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0, -0.22, 0.43]}>
              <boxGeometry args={[3, 0.08, 0.02]} />
              <meshStandardMaterial color="#2e7d4f" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function House({ h, color, roof, door }: { h: number; color: string; roof: string; door: string }) {
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, h, 0.95]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, h + 0.18, 0]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 1.8, 3, 1, false]} />
        <meshStandardMaterial color={roof} flatShading />
      </mesh>
      {/* окна и дверь — со стороны улицы (камера смотрит по диагонали) */}
      <mesh position={[0, 0.38, 0.48]}>
        <boxGeometry args={[0.32, 0.6, 0.02]} />
        <meshStandardMaterial color={door} />
      </mesh>
      {h > 1.3 &&
        [-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, h - 0.5, 0.48]}>
            <boxGeometry args={[0.32, 0.32, 0.02]} />
            <meshStandardMaterial color="#cfe8ff" emissive="#9cc7ff" emissiveIntensity={0.15} />
          </mesh>
        ))}
    </group>
  );
}

/* ---------- транспорт и прохожие ---------- */

function Vehicle({ m }: { m: Mover }) {
  if (m.kind === "moto") {
    return (
      <group>
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[0.75, 0.22, 0.2]} />
          <meshStandardMaterial color={m.color} metalness={0.3} roughness={0.4} />
        </mesh>
        {[-0.28, 0.28].map((x) => (
          <mesh key={x} position={[x, 0.16, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.16, 0.16, 0.08, 14]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
        {/* мотоциклист в каске */}
        <mesh position={[-0.05, 0.62, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.25, 4, 8]} />
          <meshStandardMaterial color="#e76f51" />
        </mesh>
        <mesh position={[0.02, 0.92, 0]} castShadow>
          <sphereGeometry args={[0.13, 14, 10]} />
          <meshStandardMaterial color="#f1faee" />
        </mesh>
      </group>
    );
  }
  const bus = m.kind === "bus";
  const L = bus ? 2.5 : 1.45;
  const H = bus ? 0.95 : 0.42;
  return (
    <group>
      <RoundedBox args={[L, H, 0.78]} radius={0.1} smoothness={3} position={[0, 0.18 + H / 2, 0]} castShadow>
        <meshStandardMaterial color={m.color} roughness={0.28} metalness={0.35} />
      </RoundedBox>
      {bus ? (
        <>
          {/* полоса окон и цветная полоса как у колумбийских автобусов */}
          <mesh position={[0, 0.88, 0]}>
            <boxGeometry args={[L - 0.2, 0.3, 0.8]} />
            <meshStandardMaterial color="#bde0fe" emissive="#7fb7ff" emissiveIntensity={0.1} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[L + 0.01, 0.08, 0.8]} />
            <meshStandardMaterial color="#ffd166" />
          </mesh>
        </>
      ) : (
        <>
          <RoundedBox args={[0.82, 0.36, 0.68]} radius={0.1} smoothness={3} position={[-0.08, 0.76, 0]} castShadow>
            <meshStandardMaterial color={m.color} roughness={0.28} metalness={0.35} />
          </RoundedBox>
          <mesh position={[-0.08, 0.76, 0]}>
            <boxGeometry args={[0.7, 0.26, 0.68]} />
            <meshStandardMaterial color="#bde0fe" emissive="#7fb7ff" emissiveIntensity={0.1} />
          </mesh>
          {m.kind === "taxi" && (
            <mesh position={[-0.08, 0.97, 0]}>
              <boxGeometry args={[0.28, 0.1, 0.16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
            </mesh>
          )}
        </>
      )}
      {[-L / 2 + 0.32, L / 2 - 0.32].flatMap((x) =>
        [-0.36, 0.36].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.17, z]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.17, 0.17, 0.1, 14]} />
            <meshStandardMaterial color="#141414" />
          </mesh>
        )),
      )}
      {/* фары по направлению движения (+X) */}
      {[-0.24, 0.24].map((z) => (
        <mesh key={z} position={[L / 2 + 0.005, 0.38, z]}>
          <boxGeometry args={[0.02, 0.1, 0.14]} />
          <meshStandardMaterial color="#fff8db" emissive="#fff1b0" emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Person({ m }: { m: Mover }) {
  return (
    <group>
      <mesh position={[0, 0.62, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.32, 4, 10]} />
        <meshStandardMaterial color={m.color} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.13, 14, 10]} />
        <meshStandardMaterial color="#c68b59" />
      </mesh>
      {[-0.07, 0.07].map((z) => (
        <mesh key={z} position={[0, 0.25, z]}>
          <cylinderGeometry args={[0.045, 0.045, 0.32, 6]} />
          <meshStandardMaterial color="#2b2d42" />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Гуляющие горожане в духе Ботеро: огромное круглое тело, крошечные голова, ступни и ладони.
 * variant 0 — сеньор в костюме с усами и шляпой, 1 — сеньора в платье с сумочкой.
 */
function Gordo({ m }: { m: Mover }) {
  const lady = m.variant === 1;
  const skin = "#d9a77c";
  return (
    <group>
      {/* тело / костюм / платье */}
      <mesh position={[0, 0.66, 0]} scale={[1.2, 1.08, 1.05]} castShadow>
        <sphereGeometry args={[0.42, 36, 28]} />
        <meshStandardMaterial color={m.color} roughness={0.72} />
      </mesh>
      {lady ? (
        <mesh position={[0, 0.34, 0]} castShadow>
          <coneGeometry args={[0.5, 0.42, 28, 1, true]} />
          <meshStandardMaterial color={m.color} roughness={0.72} side={THREE.DoubleSide} />
        </mesh>
      ) : (
        <>
          {/* белая рубашка и галстук */}
          <mesh position={[0.36, 0.82, 0]} scale={[0.3, 0.55, 0.35]}>
            <sphereGeometry args={[0.3, 16, 12]} />
            <meshStandardMaterial color="#f5f1e8" />
          </mesh>
          <mesh position={[0.46, 0.8, 0]} rotation-z={0.15}>
            <boxGeometry args={[0.02, 0.28, 0.06]} />
            <meshStandardMaterial color="#8b1e1e" />
          </mesh>
        </>
      )}
      {/* шея и маленькая голова */}
      <mesh position={[0, 1.13, 0]} castShadow>
        <sphereGeometry args={[0.16, 22, 18]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      {lady ? (
        <>
          <mesh position={[-0.04, 1.24, 0]} scale={[1.05, 0.75, 1.05]}>
            <sphereGeometry args={[0.16, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#2a1d14" roughness={0.6} />
          </mesh>
          <mesh position={[-0.1, 1.3, 0]}>
            <sphereGeometry args={[0.07, 12, 10]} />
            <meshStandardMaterial color="#2a1d14" roughness={0.6} />
          </mesh>
          {/* сумочка */}
          <mesh position={[0.05, 0.55, 0.5]} castShadow>
            <boxGeometry args={[0.18, 0.14, 0.07]} />
            <meshStandardMaterial color="#5c3b23" roughness={0.5} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0.15, 1.1, 0]} rotation-z={Math.PI / 2}>
            <capsuleGeometry args={[0.018, 0.12, 4, 6]} />
            <meshStandardMaterial color="#2a1d14" />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.11, 18]} />
            <meshStandardMaterial color="#2b2d42" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.255, 0]}>
            <cylinderGeometry args={[0.23, 0.23, 0.02, 22]} />
            <meshStandardMaterial color="#2b2d42" roughness={0.6} />
          </mesh>
        </>
      )}
      {/* ручки и крошечные ладошки */}
      {[-0.44, 0.44].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.74, z]} scale={[0.55, 1, 0.55]} castShadow>
            <sphereGeometry args={[0.15, 14, 10]} />
            <meshStandardMaterial color={m.color} roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.58, z * 1.05]}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshStandardMaterial color={skin} />
          </mesh>
        </group>
      ))}
      {/* крошечные ножки */}
      {[-0.12, 0.12].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.1, z]}>
            <cylinderGeometry args={[0.045, 0.045, 0.16, 8]} />
            <meshStandardMaterial color={lady ? skin : "#2b2d42"} />
          </mesh>
          <mesh position={[0.04, 0.03, z]} scale={[1.6, 0.6, 1]}>
            <sphereGeometry args={[0.05, 10, 8]} />
            <meshStandardMaterial color="#1d1d1f" roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Movers({ lane }: { lane: Lane }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    lane.movers.forEach((m, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.x = moverX(m, lane, t);
      if (m.kind === "person") g.position.y = 0.12 + Math.abs(Math.sin(t * 9 + i)) * 0.05;
      if (m.kind === "gordo") {
        g.position.y = 0.06 + Math.abs(Math.sin(t * 5 + i)) * 0.04;
        g.rotation.z = Math.sin(t * 5 + i) * 0.06; // переваливается с ноги на ногу
      }
    });
  });
  return (
    <group position={[0, 0, -lane.row]}>
      {lane.movers.map((m, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }} rotation-y={lane.dir > 0 ? 0 : Math.PI}>
          {m.kind === "person" ? <Person m={m} /> : m.kind === "gordo" ? <Gordo m={m} /> : <Vehicle m={m} />}
        </group>
      ))}
    </group>
  );
}

function Berry({ lane, col, game }: { lane: Lane; col: number; game: React.RefObject<GameState> }) {
  const ref = useRef<THREE.Group>(null);
  const key = `${lane.row}:${col}`;
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const taken = game.current.collected.has(key);
    const t = state.clock.elapsedTime;
    if (taken) {
      g.scale.multiplyScalar(0.8);
      g.position.y += 0.06;
      if (g.scale.x < 0.02) g.visible = false;
      return;
    }
    g.position.y = laneHeight(lane.kind) + 0.32 + Math.sin(t * 3 + col) * 0.06;
    g.rotation.y = t * 1.5 + col;
  });
  return (
    <group ref={ref} position={[col, 0.32, -lane.row]}>
      <mesh castShadow>
        <sphereGeometry args={[0.17, 24, 18]} />
        <meshPhysicalMaterial color="#34479a" roughness={0.45} sheen={1} sheenColor="#a9bcff" emissive="#1a2a6a" emissiveIntensity={0.35} />
      </mesh>
      {/* «корона» черники */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.05, 0.16, Math.sin((i / 5) * Math.PI * 2) * 0.05]} rotation-z={0.5}>
          <coneGeometry args={[0.025, 0.06, 4]} />
          <meshStandardMaterial color="#1b1f45" />
        </mesh>
      ))}
    </group>
  );
}

const LaneView = memo(function LaneView({ lane, level, game }: { lane: Lane; level: LevelData; game: React.RefObject<GameState> }) {
  const { theme } = level;
  const yBase = laneHeight(lane.kind);
  return (
    <group>
      <Ground lane={lane} level={level} />
      {lane.props.map((p, i) => (
        <group key={i} position={[p.col, p.kind === "bench" || p.kind === "planter" || (p.kind === "lamp" && lane.kind === "walk") ? 0 : yBase, -lane.row]}>
          <Prop kind={p.kind} scale={p.scale} color={theme.tree} />
        </group>
      ))}
      {lane.houses.map((h, i) => (
        <group key={i} position={[h.x, yBase, -lane.row]}>
          {h.style === "palacio" ? <Palacio h={h.h} /> : h.style === "museo" ? <Museo h={h.h} /> : <House h={h.h} color={h.color} roof={h.roof} door={h.door} />}
        </group>
      ))}
      {lane.decor.map((d, i) =>
        d.kind === "pigeon" ? (
          <group key={`p${i}`} position={[0, 0, -lane.row]}>
            <Pigeon x={d.x} dz={d.dz} color={d.color} i={i + lane.row} />
          </group>
        ) : (
        <mesh key={`d${i}`} position={[d.x, d.kind === "tuft" ? 0.07 : 0.06, -lane.row + d.dz]} rotation-y={i}>
          {d.kind === "tuft" ? <coneGeometry args={[0.05, 0.16, 4]} /> : <sphereGeometry args={[0.05, 8, 6]} />}
          <meshStandardMaterial color={d.kind === "tuft" ? level.theme.tree : d.color} flatShading />
        </mesh>
        ),
      )}
      {lane.metro && <MetroViaduct z={-lane.row} />}
      {lane.berries.map((c) => (
        <Berry key={c} lane={lane} col={c} game={game} />
      ))}
      {lane.movers.length > 0 && <Movers lane={lane} />}
      {/* затемнение за пределами игрового поля */}
      {[-1, 1].map((s) => (
        <mesh key={s} rotation-x={-Math.PI / 2} position={[s * (HALF + 0.5 + 6), yBase + 0.02, -lane.row]}>
          <planeGeometry args={[12, 1]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
});

/* ---------- игрок, камера, свет ---------- */

function Player({ game, level, onLand, onDeath }: {
  game: React.RefObject<GameState>;
  level: LevelData;
  onLand: (row: number) => void;
  onDeath: () => void;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const { camera, scene } = useThree();
  const camTarget = useRef(new THREE.Vector3());

  useLayoutEffect(() => {
    if (light.current) scene.add(light.current.target);
    const z0 = -game.current.row;
    camera.position.set(3, 10.5, z0 + 8.5);
    camera.lookAt(0, 0, z0 - 2);
  }, [camera, scene, game]);

  useFrame((state, dt) => {
    const g = game.current;
    const t = state.clock.elapsedTime;
    g.now = t;

    // прыжок
    let p = 1;
    if (g.hopping) {
      p = Math.min(1, (t - g.hopStart) / HOP_TIME);
      if (p >= 1) {
        g.hopping = false;
        g.fromCol = g.col;
        g.fromRow = g.row;
        if (g.row > g.maxRow) g.maxRow = g.row;
        const lane = level.lanes[g.row];
        if (lane?.berries.includes(g.col) && !g.collected.has(`${g.row}:${g.col}`)) {
          g.collected.add(`${g.row}:${g.col}`);
          g.berries += 1;
        }
        if (g.row >= level.finishRow && g.status === "playing") g.status = "won";
        onLand(g.row);
        if (g.queued && g.status === "playing") {
          const [dc, dr] = g.queued;
          g.queued = null;
          tryMove(g, level, dc, dr);
        }
      }
    }
    const e = ease(p);
    const x = g.fromCol + (g.col - g.fromCol) * e;
    const zRow = g.fromRow + (g.row - g.fromRow) * e;
    const laneNow = level.lanes[Math.round(zRow)];
    const ground = laneHeight(laneNow?.kind);
    const arc = g.hopping ? Math.sin(Math.PI * p) * 0.5 : 0;

    // столкновение: на какой полосе птица «стоит» сейчас
    if (g.status === "playing") {
      const occRow = g.hopping && p > 0.5 ? g.row : g.fromRow;
      const lane = level.lanes[occRow];
      if (lane && lane.movers.length && arc < 0.35) {
        for (const m of lane.movers) {
          if (Math.abs(moverX(m, lane, t) - x) < m.len / 2 + 0.26) {
            g.status = "dead";
            g.deathAt = t;
            g.hitBy = m.kind;
            onDeath();
            break;
          }
        }
      }
    }

    const r = root.current!;
    r.position.set(x, ground + arc, -zRow);
    r.rotation.y += (g.facing - r.rotation.y) * Math.min(1, dt * 18);

    const b = body.current!;
    if (g.status === "dead") {
      const k = Math.min(1, (t - g.deathAt) / 0.15);
      b.scale.set(1 + 0.6 * k, 1 - 0.82 * k, 1 + 0.6 * k);
    } else if (g.hopping) {
      const s = Math.sin(Math.PI * p);
      b.scale.set(1 - 0.08 * s, 1 + 0.18 * s, 1 - 0.08 * s);
    } else {
      const breathe = Math.sin(t * 3) * 0.02;
      b.scale.set(1, 1 + breathe, 1);
    }
    const flap = g.hopping ? Math.sin(Math.PI * p) * 1.1 : Math.sin(t * 2) * 0.05;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;

    // камера следует мягко
    camTarget.current.set(x * 0.55, 0, -zRow);
    const k = 1 - Math.exp(-dt * 5);
    camera.position.x += (camTarget.current.x + 3 - camera.position.x) * k;
    camera.position.y += (10.5 - camera.position.y) * k;
    camera.position.z += (camTarget.current.z + 8.5 - camera.position.z) * k;
    camera.lookAt(camera.position.x - 3, 0, camera.position.z - 10.5);

    if (light.current) {
      light.current.position.set(x + 5, 12, -zRow + 6);
      light.current.target.position.set(x, 0, -zRow);
      light.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <group ref={root} scale={1.25}>
        <group ref={body}>
          <AzulitoModel wingLeft={wingL} wingRight={wingR} />
        </group>
      </group>
      <directionalLight
        ref={light}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0005}
      />
    </>
  );
}

/** Попытка шага. Вызывается из клавиатуры/свайпов и из очереди после приземления. */
export function tryMove(g: GameState, level: LevelData, dc: number, dr: number): void {
  if (g.status !== "playing") return;
  if (g.hopping) {
    g.queued = [dc, dr];
    return;
  }
  g.facing = dr > 0 ? 0 : dr < 0 ? Math.PI : dc > 0 ? -Math.PI / 2 : Math.PI / 2;
  const col = g.col + dc;
  const row = g.row + dr;
  if (Math.abs(col) > HALF || row < 0 || row < g.maxRow - 6 || row >= level.lanes.length) return;
  if (level.lanes[row]?.blocked.has(col)) return; // дерево/скамейка — только поворачиваемся
  g.fromCol = g.col;
  g.fromRow = g.row;
  g.col = col;
  g.row = row;
  g.hopStart = g.now;
  g.hopping = true;
}

export function Scene({ level, game, viewRow, onLand, onDeath, hq }: {
  level: LevelData;
  game: React.RefObject<GameState>;
  viewRow: number;
  onLand: (row: number) => void;
  onDeath: () => void;
  hq: boolean;
}) {
  const from = Math.max(0, viewRow - 7);
  const to = Math.min(level.lanes.length, viewRow + 22);
  const visible = level.lanes.slice(from, to);
  return (
    <>
      <color attach="background" args={[level.theme.sky]} />
      <fog attach="fog" args={[level.theme.sky, 16, 30]} />
      <hemisphereLight args={["#ffffff", level.theme.grass, 0.75]} />
      <ambientLight intensity={0.15} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -level.lanes.length / 2]} receiveShadow>
        <planeGeometry args={[80, level.lanes.length + 60]} />
        <meshStandardMaterial color={level.theme.grassAlt} roughness={1} />
      </mesh>
      {level.lanes[0]?.kind === "plaza" && viewRow < 12 &&
        Array.from({ length: 7 }, (_, i) => <PlazaGround key={`pre${i}`} row={-(i + 1)} />)}
      {visible.map((lane) => (
        <LaneView key={lane.row} lane={lane} level={level} game={game} />
      ))}
      <Player game={game} level={level} onLand={onLand} onDeath={onDeath} />
      {/* процедурное окружение для отражений на кузовах и бронзе — без загрузки HDR-файлов */}
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2} position={[0, 6, 4]} scale={[12, 4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1} position={[-6, 3, -4]} scale={[8, 3, 1]} color={level.theme.sky} />
        <Lightformer form="ring" intensity={1.5} position={[6, 4, 0]} scale={3} color="#ffe4b5" />
      </Environment>
      {hq && (
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={0.8} intensity={2.2} distanceFalloff={0.6} halfRes />
          <Bloom luminanceThreshold={0.95} intensity={0.35} mipmapBlur />
          <Vignette darkness={0.38} offset={0.25} />
        </EffectComposer>
      )}
    </>
  );
}
