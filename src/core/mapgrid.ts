// Đọc lớp "collision" từ một bản đồ Tiled (.tmj đã parse) — logic thuần.
// Quy ước (map-format.md): ô khác 0 ở lớp `collision` là cản. Ngoài bản đồ coi như cản.
interface TmjLayer {
  name: string;
  data?: number[];
}
interface Tmj {
  width: number;
  height: number;
  layers: TmjLayer[];
}

/** Trả về hàm cellBlocked(x, y) cho một bản đồ đã parse. */
export function collisionGrid(map: unknown): (x: number, y: number) => boolean {
  const m = map as Tmj;
  const layer = m.layers?.find((l) => l.name === "collision");
  const w = m.width;
  const h = m.height;
  const data = layer?.data ?? [];
  return (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= w || y >= h) return true;
    return (data[y * w + x] ?? 0) !== 0;
  };
}
