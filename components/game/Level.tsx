"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { Department } from "@/lib/colombia";
import { buildLevel } from "./levelGen";
import { Scene, newGameState, tryMove, type GameState } from "./LevelScene";

const HIT_TEXT: Record<string, string> = {
  taxi: "¡Un taxi amarillo! Azulito got hit.",
  car: "Watch the traffic — Azulito got hit.",
  bus: "¡La buseta! Azulito got hit by a bus.",
  moto: "¡Moto! Azulito got hit by a motorbike.",
  person: "Oops — a pedestrian stepped on Azulito.",
  gordo: "¡Uy! A very Botero gentleman sat on Azulito.",
};

interface Props {
  dept: Department;
  cityIndex: number;
  onExit: () => void;
  onWin: (berries: number) => void;
  onNext: () => void;
  hasNext: boolean;
}

export default function Level({ dept, cityIndex, onExit, onWin, onNext, hasNext }: Props) {
  const level = useMemo(() => buildLevel(dept, cityIndex), [dept, cityIndex]);
  const game = useRef<GameState>(newGameState());
  // чекпоинт под-уровня: ряд, улов и собранные ягоды на момент входа
  const checkpoint = useRef<{ row: number; berries: number; collected: Set<string>; name: string } | null>(null);
  const [zone, setZone] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  // тяжёлые эффекты (AO, свечение) только на десктопе
  const [hq] = useState(() => new URLSearchParams(window.location.search).has("hq") || typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches && (navigator.hardwareConcurrency ?? 4) > 4);
  const [run, setRun] = useState(0); // смена ключа = рестарт
  const [viewRow, setViewRow] = useState(0);
  const [hud, setHud] = useState({ berries: 0, row: 0 });
  const [status, setStatus] = useState<GameState["status"]>("playing");
  const [showHint, setShowHint] = useState(true);
  const city = dept.cities[cityIndex];

  // если уровень начинается прямо в достопримечательности — показать её сразу
  useEffect(() => {
    const z = level.lanes[0]?.zone;
    if (!z) return;
    setZone(z);
    setBanner(z);
    const t = setTimeout(() => setBanner(null), 2600);
    return () => clearTimeout(t);
  }, [level, run]);

  const restart = useCallback((fromCheckpoint = false) => {
    const cp = fromCheckpoint ? checkpoint.current : null;
    if (!fromCheckpoint) checkpoint.current = null;
    game.current = cp ? newGameState(cp.row, cp.berries, cp.collected) : newGameState();
    setRun((r) => r + 1);
    setViewRow(cp?.row ?? 0);
    setHud({ berries: cp?.berries ?? 0, row: cp?.row ?? 0 });
    setZone(cp?.name ?? null);
    setStatus("playing");
  }, []);

  const onLand = useCallback(
    (row: number) => {
      const g = game.current;
      setViewRow(row);
      setHud({ berries: g.berries, row: g.maxRow });
      const lane = level.lanes[row];
      const z = lane?.zone ?? null;
      setZone((prev) => {
        if (z && z !== prev) {
          setBanner(z);
          setTimeout(() => setBanner(null), 2600);
        }
        return z;
      });
      if (lane?.checkpoint && checkpoint.current?.row !== row) {
        checkpoint.current = { row, berries: g.berries, collected: new Set(g.collected), name: lane.zone ?? "" };
      }
      if (g.status === "won") {
        setStatus("won");
        onWin(g.berries);
      }
    },
    [onWin, level],
  );
  const onDeath = useCallback(() => setTimeout(() => setStatus("dead"), 650), []);

  const move = useCallback(
    (dc: number, dr: number) => {
      setShowHint(false);
      tryMove(game.current, level, dc, dr);
    },
    [level],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const map: Record<string, [number, number]> = {
        arrowup: [0, 1], w: [0, 1], arrowdown: [0, -1], s: [0, -1],
        arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], " ": [0, 1],
      };
      if (map[k]) {
        e.preventDefault();
        move(...map[k]);
      } else if ((k === "r" || k === "enter") && game.current.status === "dead") {
        restart(checkpoint.current !== null);
      } else if (k === "escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, restart, onExit]);

  // свайпы: вверх/тап — вперёд, вниз — назад, в стороны — вбок
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { touch.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!touch.current) return;
    const dx = e.clientX - touch.current.x;
    const dy = e.clientY - touch.current.y;
    touch.current = null;
    if (Math.hypot(dx, dy) < 24) return move(0, 1);
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0);
    else move(0, dy < 0 ? 1 : -1);
  };

  const progress = Math.min(1, hud.row / level.finishRow);

  return (
    <div className="level" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <Canvas key={run} shadows="soft" dpr={[1, hq ? 2 : 1.5]} camera={{ fov: 40, near: 0.1, far: 80 }} gl={{ antialias: !hq }}>
        <Scene level={level} game={game} viewRow={viewRow} onLand={onLand} onDeath={onDeath} hq={hq} />
      </Canvas>

      {banner && (
        <div className="zone-banner" key={banner}>
          <small>Sub-level</small>
          📍 {banner}
        </div>
      )}

      <div className="hud" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
        <button className="hud-btn" onClick={onExit} aria-label="Back to the globe">← Globe</button>
        <div className="hud-city">
          <span>{dept.name}{zone ? ` · ${zone}` : ""}</span>
          <strong>{city}</strong>
          <div className="hud-bar"><i style={{ width: `${progress * 100}%` }} /></div>
        </div>
        <div className="hud-berries" aria-label="Arándanos collected">
          <b className="berry-dot" /> {hud.berries}
        </div>
      </div>

      {showHint && status === "playing" && (
        <div className="hint">↑ ← → ↓ / WASD &nbsp;·&nbsp; swipe or tap on mobile</div>
      )}

      {status !== "playing" && (
        <div className="overlay" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
          <div className="overlay-card">
            {status === "won" ? (
              <>
                <h2>¡Llegaste a {city}!</h2>
                <p>
                  Azulito collected <b>{hud.berries}</b> arándano{hud.berries === 1 ? "" : "s"}.
                </p>
                <div className="overlay-actions">
                  {hasNext && <button className="primary" onClick={onNext}>Next city →</button>}
                  <button onClick={() => restart(false)}>Play again</button>
                  <button onClick={onExit}>Globe</button>
                </div>
              </>
            ) : (
              <>
                <h2>¡Cuidado!</h2>
                <p>{HIT_TEXT[game.current.hitBy] ?? "Azulito got hit."}</p>
                <div className="overlay-actions">
                  {checkpoint.current ? (
                    <>
                      <button className="primary" onClick={() => restart(true)} autoFocus>
                        Continue from {checkpoint.current.name} (R)
                      </button>
                      <button onClick={() => restart(false)}>Restart city</button>
                    </>
                  ) : (
                    <button className="primary" onClick={() => restart(false)} autoFocus>Try again (R)</button>
                  )}
                  <button onClick={onExit}>Globe</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
