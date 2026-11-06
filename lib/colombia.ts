/**
 * Departamentos de Colombia: координаты маркера на глобусе (обычно столица)
 * и крупные города — это уровни игры, по порядку.
 */
export type Region = "caribe" | "andina" | "pacifica" | "llanos" | "amazonia" | "insular";

export interface Department {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: Region;
  cities: string[];
}

export const DEPARTMENTS: Department[] = [
  { id: "amazonas", name: "Amazonas", lat: -4.21, lon: -69.94, region: "amazonia", cities: ["Leticia", "Puerto Nariño"] },
  { id: "antioquia", name: "Antioquia", lat: 6.24, lon: -75.58, region: "andina", cities: ["Medellín", "Bello", "Itagüí", "Envigado", "Rionegro", "Apartadó", "Turbo"] },
  { id: "arauca", name: "Arauca", lat: 7.08, lon: -70.76, region: "llanos", cities: ["Arauca", "Saravena", "Tame"] },
  { id: "atlantico", name: "Atlántico", lat: 10.96, lon: -74.8, region: "caribe", cities: ["Barranquilla", "Soledad", "Malambo", "Sabanalarga"] },
  { id: "bogota", name: "Bogotá D.C.", lat: 4.71, lon: -74.07, region: "andina", cities: ["Chapinero", "Usaquén", "Teusaquillo", "Kennedy", "Suba"] },
  { id: "bolivar", name: "Bolívar", lat: 10.39, lon: -75.48, region: "caribe", cities: ["Cartagena", "Magangué", "Turbaco", "El Carmen de Bolívar"] },
  { id: "boyaca", name: "Boyacá", lat: 5.53, lon: -73.36, region: "andina", cities: ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá"] },
  { id: "caldas", name: "Caldas", lat: 5.07, lon: -75.52, region: "andina", cities: ["Manizales", "La Dorada", "Chinchiná"] },
  { id: "caqueta", name: "Caquetá", lat: 1.61, lon: -75.61, region: "amazonia", cities: ["Florencia", "San Vicente del Caguán"] },
  { id: "casanare", name: "Casanare", lat: 5.34, lon: -72.4, region: "llanos", cities: ["Yopal", "Aguazul", "Villanueva"] },
  { id: "cauca", name: "Cauca", lat: 2.44, lon: -76.61, region: "pacifica", cities: ["Popayán", "Santander de Quilichao", "Puerto Tejada"] },
  { id: "cesar", name: "Cesar", lat: 10.46, lon: -73.25, region: "caribe", cities: ["Valledupar", "Aguachica", "Agustín Codazzi"] },
  { id: "choco", name: "Chocó", lat: 5.69, lon: -76.66, region: "pacifica", cities: ["Quibdó", "Istmina"] },
  { id: "cordoba", name: "Córdoba", lat: 8.75, lon: -75.88, region: "caribe", cities: ["Montería", "Cereté", "Lorica", "Sahagún"] },
  { id: "cundinamarca", name: "Cundinamarca", lat: 4.95, lon: -74.4, region: "andina", cities: ["Soacha", "Fusagasugá", "Facatativá", "Zipaquirá", "Chía", "Girardot"] },
  { id: "guainia", name: "Guainía", lat: 3.87, lon: -67.92, region: "amazonia", cities: ["Inírida"] },
  { id: "guaviare", name: "Guaviare", lat: 2.57, lon: -72.64, region: "amazonia", cities: ["San José del Guaviare"] },
  { id: "huila", name: "Huila", lat: 2.93, lon: -75.28, region: "andina", cities: ["Neiva", "Pitalito", "Garzón", "La Plata"] },
  { id: "la-guajira", name: "La Guajira", lat: 11.54, lon: -72.91, region: "caribe", cities: ["Riohacha", "Maicao", "Uribia"] },
  { id: "magdalena", name: "Magdalena", lat: 11.24, lon: -74.2, region: "caribe", cities: ["Santa Marta", "Ciénaga", "Fundación", "El Banco"] },
  { id: "meta", name: "Meta", lat: 4.14, lon: -73.63, region: "llanos", cities: ["Villavicencio", "Acacías", "Granada", "Puerto López"] },
  { id: "narino", name: "Nariño", lat: 1.21, lon: -77.28, region: "pacifica", cities: ["Pasto", "Tumaco", "Ipiales"] },
  { id: "norte-de-santander", name: "Norte de Santander", lat: 7.89, lon: -72.5, region: "andina", cities: ["Cúcuta", "Ocaña", "Villa del Rosario", "Pamplona"] },
  { id: "putumayo", name: "Putumayo", lat: 1.15, lon: -76.65, region: "amazonia", cities: ["Mocoa", "Puerto Asís", "Orito"] },
  { id: "quindio", name: "Quindío", lat: 4.53, lon: -75.68, region: "andina", cities: ["Armenia", "Calarcá", "Montenegro"] },
  { id: "risaralda", name: "Risaralda", lat: 4.81, lon: -75.69, region: "andina", cities: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"] },
  { id: "san-andres", name: "San Andrés y Providencia", lat: 12.58, lon: -81.7, region: "insular", cities: ["San Andrés", "Providencia"] },
  { id: "santander", name: "Santander", lat: 7.12, lon: -73.12, region: "andina", cities: ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja"] },
  { id: "sucre", name: "Sucre", lat: 9.3, lon: -75.4, region: "caribe", cities: ["Sincelejo", "Corozal", "San Marcos"] },
  { id: "tolima", name: "Tolima", lat: 4.44, lon: -75.23, region: "andina", cities: ["Ibagué", "Espinal", "Melgar", "Honda"] },
  { id: "valle", name: "Valle del Cauca", lat: 3.45, lon: -76.53, region: "pacifica", cities: ["Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago", "Buga"] },
  { id: "vaupes", name: "Vaupés", lat: 1.25, lon: -70.23, region: "amazonia", cities: ["Mitú"] },
  { id: "vichada", name: "Vichada", lat: 6.19, lon: -67.49, region: "llanos", cities: ["Puerto Carreño"] },
];

/** Палитры по регионам: у Карибов песок и пальмы, в Амазонии — густая зелень. */
export const REGION_THEME: Record<Region, { grass: string; grassAlt: string; tree: string; accent: string; sky: string }> = {
  caribe:   { grass: "#9ccf5a", grassAlt: "#92c552", tree: "#2f9e57", accent: "#f2d38a", sky: "#ffd8a8" },
  andina:   { grass: "#7cc46a", grassAlt: "#72ba61", tree: "#2e7d4f", accent: "#d8c9a7", sky: "#bfe3ff" },
  pacifica: { grass: "#5fb86e", grassAlt: "#57ad66", tree: "#1f6e47", accent: "#c9d9c2", sky: "#cfe8e4" },
  llanos:   { grass: "#b6cf62", grassAlt: "#aac45a", tree: "#4f8a3a", accent: "#e8d69a", sky: "#ffe2b8" },
  amazonia: { grass: "#4fa95d", grassAlt: "#479f55", tree: "#14593a", accent: "#b9cf9b", sky: "#cfeccd" },
  insular:  { grass: "#a3d36a", grassAlt: "#98c962", tree: "#2aa06a", accent: "#fbe6b0", sky: "#b8ecff" },
};

/** Длина уровня растёт с номером города: первый город — разминка. */
export function levelLength(cityIndex: number): number {
  return 26 + cityIndex * 6;
}
