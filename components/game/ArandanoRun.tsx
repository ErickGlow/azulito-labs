"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { DEPARTMENTS, type Department } from "@/lib/colombia";
import { completedCount, cityKey, isUnlocked, loadProgress, saveCity, type Progress } from "@/lib/progress";

const Globe = dynamic(() => import("./Globe"), { ssr: false });
const Level = dynamic(() => import("./Level"), { ssr: false });

const REGION_NAME: Record<Department["region"], string> = {
  caribe: "Región Caribe", andina: "Región Andina", pacifica: "Región Pacífica",
  llanos: "Orinoquía", amazonia: "Amazonía", insular: "Región Insular",
};

export default function ArandanoRun() {
  const [progress, setProgress] = useState<Progress>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState<{ dept: Department; index: number } | null>(null);

  useEffect(() => setProgress(loadProgress()), []);

  const doneIds = useMemo(
    () => new Set(DEPARTMENTS.filter((d) => completedCount(progress, d.id, d.cities.length) === d.cities.length).map((d) => d.id)),
    [progress],
  );
  const dept = DEPARTMENTS.find((d) => d.id === selected) ?? null;
  const totalBerries = Object.values(progress).reduce((a, b) => a + b, 0);
  const totalCities = DEPARTMENTS.reduce((a, d) => a + d.cities.length, 0);

  if (playing) {
    const { dept: d, index } = playing;
    return (
      <Level
        key={`${d.id}/${index}`}
        dept={d}
        cityIndex={index}
        hasNext={index + 1 < d.cities.length}
        onExit={() => setPlaying(null)}
        onWin={(berries) => setProgress(saveCity(d.id, index, berries))}
        onNext={() => setPlaying({ dept: d, index: index + 1 })}
      />
    );
  }

  return (
    <div className="globe-screen">
      <div className="globe-canvas">
        <Globe selected={selected} doneIds={doneIds} onSelect={setSelected} />
      </div>

      <header className="globe-head">
        <a href="/" className="back-home">← Azulito Labs</a>
        <h1>Arándano Run</h1>
        <p>
          Help baby Azulito hop across Colombia — dodge taxis, buses and motos, and collect arándanos.
        </p>
        <div className="totals">
          <span><b className="berry-dot" /> {totalBerries}</span>
          <span>{Object.keys(progress).length}/{totalCities} cities</span>
        </div>
      </header>

      <aside className={`dept-panel ${dept ? "open" : ""}`}>
        {dept ? (
          <>
            <button className="close" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <span className="chip">{REGION_NAME[dept.region]}</span>
            <h2>{dept.name}</h2>
            <p className="muted">
              {completedCount(progress, dept.id, dept.cities.length)}/{dept.cities.length} cities cleared
            </p>
            <ol className="cities">
              {dept.cities.map((c, i) => {
                const best = progress[cityKey(dept.id, i)];
                const open = isUnlocked(progress, dept.id, i);
                return (
                  <li key={c} className={best !== undefined ? "done" : open ? "open" : "locked"}>
                    <span className="num">{i + 1}</span>
                    <span className="name">{c}</span>
                    {best !== undefined ? (
                      <button onClick={() => setPlaying({ dept, index: i })} title="Play again">
                        ✓ <b className="berry-dot sm" />{best}
                      </button>
                    ) : open ? (
                      <button className="play" onClick={() => setPlaying({ dept, index: i })}>▶ Play</button>
                    ) : (
                      <span className="lock" aria-label="Locked">🔒</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <>
            <h2>Pick a department</h2>
            <p className="muted">Spin the blueberry and tap a glowing berry — or choose from the list.</p>
            <div className="dept-list">
              {DEPARTMENTS.map((d) => (
                <button key={d.id} onClick={() => setSelected(d.id)} className={doneIds.has(d.id) ? "done" : ""}>
                  {d.name}
                  <small>{completedCount(progress, d.id, d.cities.length)}/{d.cities.length}</small>
                </button>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
