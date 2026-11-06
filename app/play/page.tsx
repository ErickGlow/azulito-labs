import type { Metadata } from "next";
import PlayClient from "./PlayClient";
import "../../styles/game.css";

export const metadata: Metadata = {
  title: "Arándano Run — Azulito Labs",
  description: "Help baby Azulito hop across the cities of Colombia and collect arándanos.",
};

export default function PlayPage() {
  return <PlayClient />;
}
