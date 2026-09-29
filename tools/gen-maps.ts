// Sinh bản đồ khởi đầu (.tmj) cho từng khu vực:  npm run gen-maps
// Mở kết quả trong Tiled để chỉnh; đã chỉnh tay thì đừng chạy lại cho bản đồ đó.
import { mkdirSync, writeFileSync } from "node:fs";
import { MapBuilder } from "./maps-lib.ts";

mkdirSync("data/maps", { recursive: true });

// ---------- cong-truong (32×16 ô) ----------
// Bắc: dãy nhà + cổng (lối vào sân chính). Giữa: vỉa hè có quầy hàng, băng ghế, cây.
// Nam: đường có xe buýt 67, hàng bụi cây phía dưới (theo ref-01, ref-03).
function congTruong(): MapBuilder {
  const m = new MapBuilder(32, 16);
  const W = 32;

  // nền
  m.fill("ground", 0, 0, W, 4, "wall_cream");
  m.fill("ground", 0, 4, W, 5, "paving_brown");
  m.fill("ground", 0, 9, W, 1, "road_curb");
  m.fill("ground", 0, 10, W, 5, "road");
  m.fill("ground", 0, 15, W, 1, "grass");

  // dãy nhà phía sau (y0..3): cột xanh mỗi 4 ô, cửa sổ, chân tường
  for (let x = 0; x < W; x++) {
    if (x % 4 === 0 && x !== 16) {
      m.set("walls", x, 1, "pillar_blue_top");
      m.set("walls", x, 2, "pillar_blue");
      m.set("walls", x, 3, "pillar_blue");
    } else {
      if (x % 4 === 2) m.set("walls", x, 2, "window_teal");
      m.set("walls", x, 3, "wall_cream_base");
    }
  }
  m.solid(0, 0, W, 4);

  // tường thấp + cổng (y4). Lối vào ở x=15,16.
  for (let x = 0; x < W; x++) m.set("walls", x, 4, x % 3 === 1 ? "low_wall_diamond" : "low_wall_cream");
  m.solid(0, 4, W, 1);
  m.set("walls", 12, 4, "gate_pillar").set("walls", 19, 4, "gate_pillar");
  m.fill("walls", 13, 4, 2, 1, "gate_iron").fill("walls", 17, 4, 2, 1, "gate_iron");
  m.open(15, 4, 2, 1);
  // sảnh sau cổng + biển tên + mái vòm (phủ trên đầu người chơi)
  m.fill("walls", 14, 1, 4, 1, "sign_blue");
  m.fill("walls", 15, 3, 2, 1, "door_teal");
  m.set("overlay", 12, 3, "gate_arch_l").fill("overlay", 13, 3, 6, 1, "gate_arch_m").set("overlay", 19, 3, "gate_arch_r");
  m.set("walls", 11, 3, "flag_red");

  // chậu bonsai hai bên cổng
  for (const x of [11, 20]) m.set("walls", x, 5, "bonsai").solid(x, 5);

  // cây (tán phủ trên đầu, thân cản)
  for (const cx of [3, 22]) {
    m.set("overlay", cx, 5, "tree_canopy_tl").set("overlay", cx + 1, 5, "tree_canopy_tr");
    m.set("overlay", cx, 6, "tree_canopy_bl").set("overlay", cx + 1, 6, "tree_canopy_br");
    m.set("walls", cx, 7, "tree_trunk").solid(cx, 7);
  }

  // băng ghế
  for (const x of [9, 24]) m.set("walls", x, 6, "bench").solid(x, 6);

  // quầy kem (trái) và cháo lòng (phải)
  m.sprite("cart_kem", 16, 112).solid(1, 7, 2, 2);
  m.sprite("cart_chao_long", 432, 112).solid(27, 7, 3, 2);

  // học sinh đứng nền
  m.sprite("student_boy", 208, 104).solid(13, 7);
  m.sprite("student_girl", 288, 104).solid(18, 7);
  m.sprite("student_boy", 96, 120).solid(6, 8);
  m.sprite("student_girl", 320, 120).solid(20, 8);

  // đường: vạch đứt, vạch qua đường, xe buýt 67, xe máy
  for (let x = 0; x < W; x += 2) m.set("ground", x, 12, "road_dash");
  for (const x of [25, 26]) m.fill("ground", x, 10, 1, 5, "crosswalk");
  m.sprite("bus_67", 80, 176).solid(5, 11, 5, 3);
  m.sprite("motorbike", 272, 200).solid(17, 12, 2, 2);

  // hàng bụi cây phía dưới
  for (let x = 0; x < W; x++) m.set("ground", x, 15, "bush");
  m.solid(0, 15, W, 1);

  // chuyển khu vực
  m.exit("to-san-chinh", 15, 4, 2, 1);

  // tương tác
  m.interact({ name: "bang-ten", tx: 13, ty: 5, tw: 6, th: 1, kind: "text", text: "TRƯỜNG TRUNG HỌC PHỔ THÔNG TRẦN PHÚ" });
  m.interact({ name: "bang-ghe-1", tx: 8, ty: 5, tw: 3, th: 3, kind: "activity", label: "Ngồi nghỉ", text: "Bạn ngồi nghỉ một lát trên băng ghế.", cost: 1 });
  m.interact({ name: "bang-ghe-2", tx: 23, ty: 5, tw: 3, th: 3, kind: "activity", label: "Ngồi nghỉ", text: "Bạn ngồi nghỉ một lát trên băng ghế.", cost: 1 });
  m.interact({ name: "xe-kem", tx: 0, ty: 6, tw: 4, th: 4, kind: "text", text: "Xe kem của cô Sáu. Mùi kem cốm thơm ngọt, y như hồi xưa." });
  m.interact({ name: "xe-chao-long", tx: 26, ty: 6, tw: 5, th: 4, kind: "text", text: "Xe cháo lòng nghi ngút khói. Hai chục ngàn một tô." });
  m.interact({ name: "xe-buyt", tx: 4, ty: 10, tw: 7, th: 5, kind: "text", text: "Xe buýt số 67, chuyến quen thuộc đưa học sinh đến trường." });
  return m;
}

const maps: Record<string, MapBuilder> = { "cong-truong": congTruong() };
for (const [id, m] of Object.entries(maps)) {
  writeFileSync(`data/maps/${id}.tmj`, m.toTmj());
  console.log(`đã ghi data/maps/${id}.tmj`);
}
