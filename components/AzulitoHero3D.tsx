"use client";

/**
 * AzulitoHero3D — объёмная 3D-сцена для hero-секции Azulito Labs.
 * ================================================================
 *
 * УСТАНОВКА (в папке website):
 *   npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
 *
 * ИСПОЛЬЗОВАНИЕ — замените статичную картинку в app/page.tsx (или в Hero-секции) на:
 *
 *   import AzulitoHero3D from "@/components/AzulitoHero3D";
 *   ...
 *   <div style={{ width: "100%", height: "600px" }}>
 *     <AzulitoHero3D />
 *   </div>
 *
 * Компонент сам занимает всё доступное место родителя — задайте
 * родителю нужную высоту (например, height: 100vh для полноэкранного hero).
 *
 * Птица собрана из примитивов (сферы, эллипсоиды, конусы) — стилизованная
 * low-poly форма, не фотореалистичная модель. Цвета взяты по мотивам
 * реального Азулито: белая/светлая голова, бирюзово-синее тело, оранжевый клюв.
 * Поправьте цвета в COLORS ниже, если не совпадает с реальной птицей.
 */

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Sparkles, Environment, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

const COLORS = {
  head: "#eef2f5",
  body: "#2f8fc9",
  bodyDark: "#123f63",
  beak: "#f4a13a",
  eye: "#0a0a0a",
  coinGold: "#ffcd45",
  coinGoldDark: "#a86b06",
  branch: "#5a3a20",
  berry: "#3b5fa8",
  bg: "#160f2e",
};

function Bird() {
  const group = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.3) * 0.25;
  });

  return (
    <group ref={group} position={[0, 0.4, 0]}>
      {/* Тело */}
      <mesh position={[0, 0, 0]} scale={[1, 0.85, 1.1]} castShadow>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.35} metalness={0.15} />
      </mesh>

      {/* Голова */}
      <mesh position={[-0.05, 0.95, 0.55]} scale={[0.62, 0.62, 0.62]} castShadow>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color={COLORS.head} roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Клюв */}
      <mesh position={[-0.05, 0.85, 1.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.16, 0.55, 24]} />
        <meshStandardMaterial color={COLORS.beak} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Глаза */}
      <mesh position={[0.32, 1.0, 0.95]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={COLORS.eye} roughness={0.1} metalness={0.4} />
      </mesh>
      <mesh position={[-0.42, 1.0, 0.95]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={COLORS.eye} roughness={0.1} metalness={0.4} />
      </mesh>

      {/* Крылья */}
      <mesh position={[0.95, 0.1, -0.1]} rotation={[0, 0, -0.3]} scale={[0.5, 0.9, 0.7]} castShadow>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color={COLORS.bodyDark} roughness={0.4} />
      </mesh>
      <mesh position={[-0.95, 0.1, -0.1]} rotation={[0, 0, 0.3]} scale={[0.5, 0.9, 0.7]} castShadow>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color={COLORS.bodyDark} roughness={0.4} />
      </mesh>

      {/* Хвост */}
      <mesh position={[0, -0.2, -1.15]} rotation={[0.5, 0, 0]} scale={[0.5, 0.25, 0.9]} castShadow>
        <coneGeometry args={[1, 1.6, 4]} />
        <meshStandardMaterial color={COLORS.bodyDark} roughness={0.4} />
      </mesh>

      {/* Лапки */}
      <mesh position={[0.25, -0.95, 0.1]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[-0.25, -0.95, 0.1]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </group>
  );
}

function Coin({ position, speed = 1 }: { position: [number, number, number]; speed?: number }) {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    mesh.current.rotation.y = state.clock.getElapsedTime() * speed;
  });
  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh ref={mesh} position={position} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.08, 32]} />
        <meshStandardMaterial color={COLORS.coinGold} roughness={0.2} metalness={0.8} emissive={COLORS.coinGoldDark} emissiveIntensity={0.15} />
      </mesh>
    </Float>
  );
}

function Branch() {
  return (
    <mesh position={[0, -1.3, 0]} rotation={[0, 0, 0.08]} castShadow receiveShadow>
      <cylinderGeometry args={[0.18, 0.24, 4.5, 12]} />
      <meshStandardMaterial color={COLORS.branch} roughness={0.9} />
    </mesh>
  );
}

function Berries() {
  const positions: [number, number, number][] = [
    [0.8, -1.1, 0.3],
    [1.0, -1.25, 0.25],
    [1.15, -1.05, 0.35],
    [0.65, -1.3, 0.2],
  ];
  return (
    <>
      {positions.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={COLORS.berry} roughness={0.3} metalness={0.1} />
        </mesh>
      ))}
    </>
  );
}

export default function AzulitoHero3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.5, 5.5], fov: 45 }}
      style={{ width: "100%", height: "100%", background: COLORS.bg }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-3, 1, -2]} intensity={0.6} color="#53a3ff" />

        <Bird />
        <Branch />
        <Berries />

        <Coin position={[-1.8, 1.4, -0.5]} speed={0.6} />
        <Coin position={[1.9, 1.7, -0.8]} speed={0.4} />
        <Coin position={[2.1, -0.2, -1.2]} speed={0.8} />

        <Sparkles count={80} scale={8} size={2} speed={0.3} color="#7fe8ff" />

        <ContactShadows position={[0, -1.55, 0]} opacity={0.5} scale={8} blur={2.5} far={2} />

        <Environment preset="sunset" />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.4}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate
          autoRotateSpeed={0.6}
        />

        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.4} luminanceSmoothing={0.9} />
          <Vignette eskil={false} offset={0.2} darkness={0.6} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
