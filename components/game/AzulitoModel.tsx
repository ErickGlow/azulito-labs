"use client";

import { forwardRef } from "react";
import * as THREE from "three";

/** Цвета — те же, что у 3D-героя на главной: светлая голова, бирюзово-синее тело. */
export const AZULITO = {
  head: "#eef2f5",
  body: "#2f8fc9",
  bodyDark: "#1d6a9e",
  belly: "#dde8ef",
  beak: "#f4a13a",
  eye: "#0a0a0a",
  legs: "#e0915a",
};

/**
 * Малыш Азулито — без хвоста (хвост вырастет, когда наестся арандано).
 * Смотрит в сторону -Z. Крылья — отдельные группы, чтобы ими махать.
 */
export const AzulitoModel = forwardRef<THREE.Group, { wingLeft?: React.Ref<THREE.Group>; wingRight?: React.Ref<THREE.Group> }>(
  function AzulitoModel({ wingLeft, wingRight }, ref) {
    return (
      <group ref={ref}>
        {/* тело */}
        <mesh position={[0, 0.34, 0.04]} scale={[1, 0.92, 1.08]} castShadow>
          <sphereGeometry args={[0.3, 32, 24]} />
          <meshStandardMaterial color={AZULITO.body} roughness={0.55} />
        </mesh>
        {/* светлое брюшко */}
        <mesh position={[0, 0.28, -0.1]} scale={[0.82, 0.8, 0.6]}>
          <sphereGeometry args={[0.27, 24, 16]} />
          <meshStandardMaterial color={AZULITO.belly} roughness={0.8} />
        </mesh>
        {/* голова */}
        <mesh position={[0, 0.66, -0.1]} castShadow>
          <sphereGeometry args={[0.21, 32, 24]} />
          <meshStandardMaterial color={AZULITO.head} roughness={0.7} />
        </mesh>
        {/* хохолок-пушок */}
        <mesh position={[0, 0.86, -0.06]} rotation={[0.4, 0, 0]}>
          <coneGeometry args={[0.06, 0.12, 8]} />
          <meshStandardMaterial color={AZULITO.head} roughness={0.9} />
        </mesh>
        {/* клюв */}
        <mesh position={[0, 0.63, -0.33]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.065, 0.16, 12]} />
          <meshStandardMaterial color={AZULITO.beak} roughness={0.4} />
        </mesh>
        {/* глаза с бликом */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.12, 0.7, -0.24]}>
            <mesh>
              <sphereGeometry args={[0.045, 16, 12]} />
              <meshStandardMaterial color={AZULITO.eye} roughness={0.15} />
            </mesh>
            <mesh position={[s * 0.01, 0.018, -0.03]}>
              <sphereGeometry args={[0.013, 8, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
        {/* крылья */}
        <group ref={wingLeft} position={[-0.27, 0.4, 0.06]}>
          <mesh position={[-0.03, -0.04, 0]} rotation={[0, 0, 0.25]} scale={[0.35, 0.8, 1.05]} castShadow>
            <sphereGeometry args={[0.22, 20, 14]} />
            <meshStandardMaterial color={AZULITO.bodyDark} roughness={0.55} />
          </mesh>
        </group>
        <group ref={wingRight} position={[0.27, 0.4, 0.06]}>
          <mesh position={[0.03, -0.04, 0]} rotation={[0, 0, -0.25]} scale={[0.35, 0.8, 1.05]} castShadow>
            <sphereGeometry args={[0.22, 20, 14]} />
            <meshStandardMaterial color={AZULITO.bodyDark} roughness={0.55} />
          </mesh>
        </group>
        {/* лапки */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.09, 0.05, -0.02]}>
            <cylinderGeometry args={[0.022, 0.022, 0.12, 6]} />
            <meshStandardMaterial color={AZULITO.legs} />
          </mesh>
        ))}
      </group>
    );
  },
);
