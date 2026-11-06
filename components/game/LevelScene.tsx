"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AzulitoModel } from "./AzulitoModel";
import { HALF, WRAP, moverX, type Lane, type LevelData, type Mover } from "./levelGen";

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

export function newGameState(): GameState {
  return {
    col: 0, row: 0, fromCol: 0, fromRow: 0, hopStart: 0, hopping: false, queued: null, facing: 0,
    status: "playing", berries: 0, maxRow: 0, collected: new Set(), deathAt: 0, hitBy: "", now: 0,
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
      <mesh position={[0, 0.18 + H / 2, 0]} castShadow>
        <boxGeometry args={[L, H, 0.78]} />
        <meshStandardMaterial color={m.color} roughness={0.35} metalness={0.2} />
      </mesh>
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
          <mesh position={[-0.08, 0.76, 0]} castShadow>
            <boxGeometry args={[0.8, 0.34, 0.66]} />
            <meshStandardMaterial color={m.color} roughness={0.35} metalness={0.2} />
          </mesh>
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

function Movers({ lane }: { lane: Lane }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    lane.movers.forEach((m, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.x = moverX(m, lane, t);
      if (m.kind === "person") g.position.y = 0.12 + Math.abs(Math.sin(t * 9 + i)) * 0.05;
    });
  });
  return (
    <group position={[0, 0, -lane.row]}>
      {lane.movers.map((m, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }} rotation-y={lane.dir > 0 ? 0 : Math.PI}>
          {m.kind === "person" ? <Person m={m} /> : <Vehicle m={m} />}
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
    g.position.y = (lane.kind === "walk" ? 0.12 : 0) + 0.32 + Math.sin(t * 3 + col) * 0.06;
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
  const yBase = lane.kind === "walk" ? 0.12 : 0;
  return (
    <group>
      <Ground lane={lane} level={level} />
      {lane.props.map((p, i) => (
        <group key={i} position={[p.col, p.kind === "bench" || p.kind === "planter" || p.kind === "lamp" ? 0 : yBase, -lane.row]}>
          <Prop kind={p.kind} scale={p.scale} color={theme.tree} />
        </group>
      ))}
      {lane.houses.map((h, i) => (
        <group key={i} position={[h.x, yBase, -lane.row]}>
          <House h={h.h} color={h.color} roof={h.roof} door={h.door} />
        </group>
      ))}
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
    camera.position.set(3, 10.5, 8.5);
    camera.lookAt(0, 0, -2);
  }, [camera, scene]);

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
    const ground = laneNow?.kind === "walk" ? 0.12 : 0;
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

export function Scene({ level, game, viewRow, onLand, onDeath }: {
  level: LevelData;
  game: React.RefObject<GameState>;
  viewRow: number;
  onLand: (row: number) => void;
  onDeath: () => void;
}) {
  const from = Math.max(0, viewRow - 7);
  const to = Math.min(level.lanes.length, viewRow + 22);
  const visible = level.lanes.slice(from, to);
  return (
    <>
      <color attach="background" args={[level.theme.sky]} />
      <fog attach="fog" args={[level.theme.sky, 16, 30]} />
      <hemisphereLight args={["#ffffff", level.theme.grass, 0.9]} />
      <ambientLight intensity={0.25} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -level.lanes.length / 2]} receiveShadow>
        <planeGeometry args={[80, level.lanes.length + 60]} />
        <meshStandardMaterial color={level.theme.grassAlt} roughness={1} />
      </mesh>
      {visible.map((lane) => (
        <LaneView key={lane.row} lane={lane} level={level} game={game} />
      ))}
      <Player game={game} level={level} onLand={onLand} onDeath={onDeath} />
    </>
  );
}
