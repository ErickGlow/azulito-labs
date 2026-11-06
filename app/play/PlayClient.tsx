"use client";

import dynamic from "next/dynamic";

const ArandanoRun = dynamic(() => import("@/components/game/ArandanoRun"), {
  ssr: false,
  loading: () => <div className="game-loading">Loading Arándano Run…</div>,
});

export default function PlayClient() {
  return <ArandanoRun />;
}
