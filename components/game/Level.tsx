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
  const [run, setRun] = useState(0); // смена ключа = рестарт
  const [viewRow, setViewRow] = useState(0);
  const [hud, setHud] = useState({ berries: 0, row: 0 });
  const [status, setStatus] = useState<GameState["status"]>("playing");
  const [showHint, setShowHint] = useState(true);
  const city = dept.cities[cityIndex];

  const restart = useCallback(() => {
    game.current = newGameState();
    setRun((r) => r + 1);
    setViewRow(0);
    setHud({ berries: 0, row: 0 });
    setStatus("playing");
  }, []);

  const onLand = useCallback(
    (row: number) => {
      const g = game.current;
      setViewRow(row);
      setHud({ berries: g.berries, row: g.maxRow });
      if (g.status === "won") {
        setStatus("won");
        onWin(g.berries);
      }
    },
    [onWin],
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
        restart();
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
      <Canvas key={run} shadows dpr={[1, 2]} camera={{ fov: 40, near: 0.1, far: 80 }} gl={{ antialias: true }}>
        <Scene level={level} game={game} viewRow={viewRow} onLand={onLand} onDeath={onDeath} />
      </Canvas>

      <div className="hud" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
        <button className="hud-btn" onClick={onExit} aria-label="Back to the globe">← Globe</button>
        <div className="hud-city">
          <span>{dept.name}</span>
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
                  <button onClick={restart}>Play again</button>
                  <button onClick={onExit}>Globe</button>
                </div>
              </>
            ) : (
              <>
                <h2>¡Cuidado!</h2>
                <p>{HIT_TEXT[game.current.hitBy] ?? "Azulito got hit."}</p>
                <div className="overlay-actions">
                  <button className="primary" onClick={restart} autoFocus>Try again (R)</button>
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
