import { REGION_THEME, levelLength, type Department } from "@/lib/colombia";
import { seededRandom } from "@/lib/rng";

export const HALF = 5; // играбельные колонки: -5..5
export const WRAP = 11; // машины и прохожие «заворачивают» за краем экрана

export type LaneKind = "grass" | "road" | "walk" | "finish";
export type MoverKind = "taxi" | "car" | "bus" | "moto" | "person";
export type PropKind = "tree" | "palm" | "bush" | "bench" | "planter" | "lamp";

export interface Mover {
  x0: number;
  len: number;
  kind: MoverKind;
  color: string;
}

export interface Lane {
  row: number;
  kind: LaneKind;
  blocked: Set<number>;
  berries: number[];
  movers: Mover[];
  speed: number;
  dir: 1 | -1;
  props: { col: number; kind: PropKind; scale: number }[];
  houses: { x: number; h: number; w: number; color: string; roof: string; door: string }[];
  dashed: boolean; // разметка между соседними полосами
}

export interface LevelData {
  lanes: Lane[];
  finishRow: number;
  theme: (typeof REGION_THEME)[keyof typeof REGION_THEME];
  tropical: boolean;
}

/** Позиция машины/прохожего в момент t — чистая функция, поэтому столкновения точные. */
export function moverX(m: Mover, lane: Lane, t: number): number {
  const span = WRAP * 2;
  const x = m.x0 + lane.dir * lane.speed * t + WRAP;
  return (((x % span) + span) % span) - WRAP;
}

const CAR_COLORS = ["#e63946", "#457b9d", "#f1faee", "#2a9d8f", "#6d597a", "#264653", "#adb5bd"];
const BUS_COLORS = ["#3a86ff", "#ff006e", "#fb5607", "#8338ec", "#06d6a0"];
const SHIRTS = ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#f4a261", "#e76f51", "#8ecae6", "#ffffff"];
const HOUSES = ["#f4d35e", "#ee964b", "#f95738", "#5fa8d3", "#62b6cb", "#c3d350", "#f7a1c4", "#fdfcdc", "#9bc1bc"];
const ROOFS = ["#b5523b", "#9c3d2e", "#c1694f"];
const DOORS = ["#3d405b", "#264653", "#6a4c93", "#2a9d8f"];

export function buildLevel(dept: Department, cityIndex: number): LevelData {
  const rnd = seededRandom(`${dept.id}/${cityIndex}`);
  const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
  const finishRow = levelLength(cityIndex);
  const diff = cityIndex + (dept.cities.length >= 5 ? 1 : 0);
  const tropical = ["caribe", "insular", "pacifica"].includes(dept.region);
  const lanes: Lane[] = [];

  const base = (row: number, kind: LaneKind): Lane => ({
    row, kind, blocked: new Set(), berries: [], movers: [], speed: 0, dir: 1, props: [], houses: [], dashed: false,
  });

  const addHouses = (lane: Lane) => {
    for (const side of [-1, 1]) {
      if (rnd() < 0.8) {
        lane.houses.push({
          x: side * (HALF + 3.2 + rnd() * 1.4) - (side < 0 ? 1.2 : 0),
          h: 0.9 + rnd() * 1.0,
          w: 0.9,
          color: pick(HOUSES),
          roof: pick(ROOFS),
          door: pick(DOORS),
        });
      }
    }
  };

  const freeCols = (lane: Lane) => {
    const out: number[] = [];
    for (let c = -HALF; c <= HALF; c++) if (!lane.blocked.has(c)) out.push(c);
    return out;
  };

  const sprinkleBerries = (lane: Lane, chance: number) => {
    if (rnd() > chance) return;
    const free = freeCols(lane);
    const n = rnd() < 0.3 ? 2 : 1;
    for (let i = 0; i < n && free.length; i++) {
      lane.berries.push(free.splice(Math.floor(rnd() * free.length), 1)[0]);
    }
  };

  const edgeTrees = (lane: Lane) => {
    for (const side of [-1, 1]) {
      lane.props.push({ col: side * (HALF + 1), kind: tropical ? "palm" : "tree", scale: 0.85 + rnd() * 0.4 });
    }
  };

  const grass = (row: number, safe = false): Lane => {
    const lane = base(row, "grass");
    edgeTrees(lane);
    addHouses(lane);
    if (!safe) {
      for (let c = -HALF; c <= HALF; c++) {
        if (rnd() < 0.2 && lane.blocked.size < 5) {
          const kind: PropKind = rnd() < 0.35 ? "bush" : tropical && rnd() < 0.5 ? "palm" : "tree";
          lane.props.push({ col: c, kind, scale: 0.8 + rnd() * 0.35 });
          lane.blocked.add(c);
        }
      }
      sprinkleBerries(lane, 0.55);
    }
    return lane;
  };

  const walk = (row: number): Lane => {
    const lane = base(row, "walk");
    addHouses(lane);
    for (let c = -HALF; c <= HALF; c++) {
      if (rnd() < 0.12 && lane.blocked.size < 3) {
        lane.props.push({ col: c, kind: rnd() < 0.5 ? "bench" : "planter", scale: 1 });
        lane.blocked.add(c);
      }
    }
    lane.props.push({ col: -(HALF + 1), kind: "lamp", scale: 1 }, { col: HALF + 1, kind: "lamp", scale: 1 });
    lane.dir = rnd() < 0.5 ? 1 : -1;
    lane.speed = 0.55 + rnd() * 0.5 + diff * 0.04;
    const n = 1 + Math.floor(rnd() * (diff > 2 ? 3 : 2));
    const spacing = (WRAP * 2) / n;
    for (let i = 0; i < n; i++) {
      lane.movers.push({ x0: -WRAP + i * spacing + rnd() * (spacing - 1.2), len: 0.55, kind: "person", color: pick(SHIRTS) });
    }
    sprinkleBerries(lane, 0.5);
    return lane;
  };

  const road = (row: number): Lane => {
    const lane = base(row, "road");
    lane.dir = rnd() < 0.5 ? 1 : -1;
    lane.speed = 1.5 + rnd() * 1.5 + diff * 0.2;
    const n = 2 + Math.floor(rnd() * 2) + (diff > 3 ? 1 : 0);
    const spacing = (WRAP * 2) / n;
    for (let i = 0; i < n; i++) {
      const r = rnd();
      const kind: MoverKind = r < 0.38 ? "taxi" : r < 0.72 ? "car" : r < 0.86 ? "bus" : "moto";
      const len = kind === "bus" ? 2.6 : kind === "moto" ? 0.9 : 1.55;
      const color = kind === "taxi" ? "#f7c600" : kind === "bus" ? pick(BUS_COLORS) : kind === "moto" ? "#1d1d1f" : pick(CAR_COLORS);
      lane.movers.push({ x0: -WRAP + i * spacing + rnd() * Math.max(0.1, spacing - len - 2.4), len, kind, color });
    }
    return lane;
  };

  let row = 0;
  for (; row < 4; row++) lanes.push(grass(row, true));
  while (row < finishRow) {
    const r = rnd();
    if (r < 0.5) {
      const n = 1 + Math.floor(rnd() * Math.min(4, 2 + diff / 2));
      if (rnd() < 0.55 && row < finishRow) lanes.push(walk(row++));
      for (let i = 0; i < n && row < finishRow; i++) lanes.push(road(row++));
      if (rnd() < 0.55 && row < finishRow) lanes.push(walk(row++));
    } else if (r < 0.68) {
      lanes.push(walk(row++));
    } else {
      const n = 1 + Math.floor(rnd() * 2);
      for (let i = 0; i < n && row < finishRow; i++) lanes.push(grass(row++));
    }
  }
  const finish = base(finishRow, "finish");
  addHouses(finish);
  lanes.push(finish);
  for (let r2 = finishRow + 1; r2 <= finishRow + 12; r2++) lanes.push(grass(r2, true));

  for (let i = 1; i < lanes.length; i++) {
    if (lanes[i].kind === "road" && lanes[i - 1].kind === "road") lanes[i].dashed = true;
  }
  return { lanes, finishRow, theme: REGION_THEME[dept.region], tropical };
}
