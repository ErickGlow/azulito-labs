import { REGION_THEME, levelLength, type Department } from "@/lib/colombia";
import { seededRandom } from "@/lib/rng";
import { LANDMARKS } from "@/lib/landmarks";

export const HALF = 5; // играбельные колонки: -5..5
export const WRAP = 11; // машины и прохожие «заворачивают» за краем экрана

export type LaneKind = "grass" | "road" | "walk" | "plaza" | "finish";
export type MoverKind = "taxi" | "car" | "bus" | "moto" | "person" | "gordo";
export type PropKind =
  | "tree" | "palm" | "bush" | "bench" | "planter" | "lamp"
  | "bronze-gordo" | "bronze-horse" | "bronze-cat" | "bronze-woman" | "bronze-bird"
  | "plaza-tree" | "vendor";

export interface Mover {
  x0: number;
  len: number;
  kind: MoverKind;
  color: string;
  variant?: number; // для толстяков: 0 — сеньор в костюме, 1 — сеньора в платье
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
  houses: { x: number; h: number; w: number; color: string; roof: string; door: string; style?: "palacio" | "museo" }[];
  dashed: boolean; // разметка между соседними полосами
  decor: { x: number; dz: number; kind: "tuft" | "flower" | "pigeon"; color: string }[];
  zone?: string; // название достопримечательности, если ряд внутри неё
  checkpoint?: boolean; // начало под-уровня — отсюда можно продолжить
  metro?: boolean; // надземное метро над рядом
}

/** Высота поверхности ряда: тротуар и площадь чуть приподняты. */
export function laneHeight(kind: LaneKind | undefined): number {
  return kind === "walk" ? 0.12 : kind === "plaza" ? 0.06 : 0;
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
  const cityZones = LANDMARKS[`${dept.id}/${cityIndex}`] ?? [];
  const finishRow = levelLength(cityIndex) + cityZones.reduce((a, z) => a + z.rows, 0);
  const diff = cityIndex + (dept.cities.length >= 5 ? 1 : 0);
  const tropical = ["caribe", "insular", "pacifica"].includes(dept.region);
  const lanes: Lane[] = [];

  const base = (row: number, kind: LaneKind): Lane => ({
    row, kind, blocked: new Set(), berries: [], movers: [], speed: 0, dir: 1, props: [], houses: [], dashed: false, decor: [],
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

  const FLOWERS = ["#ff5d8f", "#ffd23f", "#ffffff", "#c77dff"];
  const grass = (row: number, safe = false): Lane => {
    const lane = base(row, "grass");
    edgeTrees(lane);
    for (let i = 0; i < 7; i++) {
      lane.decor.push({
        x: -HALF - 3 + rnd() * (HALF * 2 + 6),
        dz: -0.4 + rnd() * 0.8,
        kind: rnd() < 0.3 ? "flower" : "tuft",
        color: pick(FLOWERS),
      });
    }
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

  // палитра Ботеро: тёплые охры, терракота, приглушённые синие и зелёные
  const GORDO_COLORS = ["#c0392b", "#d68a3c", "#e9c46a", "#6b8f71", "#3e6990", "#8e5572", "#f2e8cf", "#4a4e69"];
  const BRONZE: PropKind[] = ["bronze-gordo", "bronze-horse", "bronze-bird", "bronze-cat", "bronze-woman"];

  /**
   * Plaza Botero (Медельин): большая площадь из каменных плит. По периметру — чёрно-белый
   * Palacio de la Cultura и Museo de Antioquia, внутри — бронзовые скульптуры Ботеро,
   * клумбы с деревьями, тележки торговцев, голуби и множество пухлых горожан. В конце — метро.
   */
  const plazaZone = (start: number, name: string, rows: number): Lane[] => {
    const out: Lane[] = [];
    let sculpture = 0;
    for (let i = 0; i < rows; i++) {
      const lane = base(start + i, "plaza");
      lane.zone = name;
      lane.checkpoint = i === 0 && start > 0;
      lane.metro = i === rows - 1;
      lane.houses.push({ x: -(HALF + 4.3), h: 3.6, w: 1, color: "#f1ede4", roof: "#2b2b2b", door: "#3d2b1f", style: "palacio" });
      lane.houses.push({ x: HALF + 4.3, h: 2.6, w: 1, color: "#c9894f", roof: "#8a4b2a", door: "#5a3a22", style: "museo" });
      if (i % 2 === 0) lane.props.push({ col: -(HALF + 1), kind: "lamp", scale: 1 }, { col: HALF + 1, kind: "lamp", scale: 1 });
      for (let k = 0; k < 5; k++) {
        if (rnd() < 0.55) lane.decor.push({ x: -HALF - 1 + rnd() * (HALF * 2 + 2), dz: -0.35 + rnd() * 0.7, kind: "pigeon", color: rnd() < 0.7 ? "#8d8f99" : "#b9bbc4" });
      }
      const safeStart = start === 0 && i < 2;
      const pattern = i % 3; // 0 — скульптуры/клумбы, 1 и 2 — гуляющие толстяки
      if (!safeStart && pattern === 0) {
        const n = 1 + (rnd() < 0.6 ? 1 : 0);
        for (let k = 0; k < n; k++) {
          const free = freeCols(lane).filter((c) => Math.abs(c) <= HALF - 1 && !lane.blocked.has(c - 1) && !lane.blocked.has(c + 1));
          if (!free.length) break;
          const col = free[Math.floor(rnd() * free.length)];
          const r = rnd();
          const kind: PropKind = r < 0.62 ? BRONZE[sculpture++ % BRONZE.length] : r < 0.82 ? "plaza-tree" : "vendor";
          lane.props.push({ col, kind, scale: 1 });
          lane.blocked.add(col);
        }
        sprinkleBerries(lane, 0.85);
      } else if (!safeStart) {
        lane.dir = rnd() < 0.5 ? 1 : -1;
        lane.speed = 0.4 + rnd() * 0.45 + diff * 0.03;
        const n = 3 + (rnd() < 0.5 ? 1 : 0);
        const spacing = (WRAP * 2) / n;
        for (let k = 0; k < n; k++) {
          lane.movers.push({
            x0: -WRAP + k * spacing + rnd() * (spacing - 2.2),
            len: 0.95,
            kind: "gordo",
            color: pick(GORDO_COLORS),
            variant: rnd() < 0.5 ? 0 : 1,
          });
        }
        sprinkleBerries(lane, 0.5);
      } else {
        sprinkleBerries(lane, 0.7);
      }
      out.push(lane);
    }
    return out;
  };

  const zones = cityZones.map((z) => ({ ...z, row: z.at === 0 ? 0 : Math.max(6, Math.floor(finishRow * z.at)), placed: false }));

  let row = 0;
  if (!zones.some((z) => z.row === 0)) for (; row < 4; row++) lanes.push(grass(row, true));
  while (row < finishRow) {
    const zone = zones.find((z) => !z.placed && row >= z.row && row + z.rows < finishRow);
    if (zone) {
      zone.placed = true;
      const zl = plazaZone(row, zone.name, zone.rows);
      lanes.push(...zl);
      row += zl.length;
      lanes.push(walk(row++));
      continue;
    }
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
