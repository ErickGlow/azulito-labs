/** Прогресс игрока хранится в браузере: какие города пройдены и лучший улов арандано. */
const KEY = "azulito-arandano-run:v1";

export type Progress = Record<string, number>; // "dept/cityIndex" -> лучший улов

export function cityKey(deptId: string, cityIndex: number): string {
  return `${deptId}/${cityIndex}`;
}

export function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Progress;
  } catch {
    return {};
  }
}

export function saveCity(deptId: string, cityIndex: number, berries: number): Progress {
  const p = loadProgress();
  const k = cityKey(deptId, cityIndex);
  p[k] = Math.max(p[k] ?? 0, berries);
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* приватный режим — прогресс живёт до перезагрузки */
  }
  return p;
}

export function isUnlocked(p: Progress, deptId: string, cityIndex: number): boolean {
  return cityIndex === 0 || cityKey(deptId, cityIndex - 1) in p;
}

export function completedCount(p: Progress, deptId: string, total: number): number {
  let n = 0;
  for (let i = 0; i < total; i++) if (cityKey(deptId, i) in p) n++;
  return n;
}
