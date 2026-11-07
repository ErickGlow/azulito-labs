/**
 * Достопримечательности — под-уровни внутри города.
 * Ключ: "департамент/номер города". `at` — где в уровне начинается зона (доля длины).
 */
export type LandmarkKind = "botero";

export interface Landmark {
  name: string;
  kind: LandmarkKind;
  at: number; // 0 — уровень начинается прямо в зоне
  rows: number; // длина зоны в рядах
}

export const LANDMARKS: Record<string, Landmark[]> = {
  "antioquia/0": [{ name: "Plaza Botero", kind: "botero", at: 0, rows: 16 }], // Medellín
};
