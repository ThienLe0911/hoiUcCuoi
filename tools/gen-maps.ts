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


// ---------- san-chinh (30×20 ô) ----------
// Bắc: nhà chính 3 tầng, lối vào giữa (→ hành lang lớp 12). Giữa: sân rộng, tượng, cây.
// Nam: cổng (→ cổng trường). Đông: lối sang sân thể chất (ref-09, ref-06).
function sanChinh(): MapBuilder {
  const m = new MapBuilder(30, 20);
  const W = 30;
  m.fill("ground", 0, 0, W, 6, "wall_cream");
  m.fill("ground", 0, 6, W, 1, "paving_brown");
  m.fill("ground", 0, 7, W, 11, "floor_corridor");
  m.fill("ground", 0, 18, W, 2, "paving_brown");

  for (let x = 0; x < W; x++) {
    if (x % 6 === 0) {
      m.set("walls", x, 1, "pillar_blue_top");
      for (let y = 2; y <= 4; y++) m.set("walls", x, y, "pillar_blue");
    } else if (x % 6 === 2 || x % 6 === 4) {
      m.set("walls", x, 1, "window_teal");
      m.set("walls", x, 3, "window_teal");
    }
    m.set("walls", x, 5, "wall_cream_base");
  }
  m.fill("walls", 13, 1, 4, 1, "sign_blue"); // khẩu hiệu RÈN ĐỨC – LUYỆN TÀI
  m.fill("walls", 14, 5, 2, 1, "door_teal");
  m.fill("walls", 14, 6, 2, 1, "stairs");
  m.set("walls", 11, 4, "flag_red");
  m.solid(0, 0, W, 6).open(14, 5, 2, 1);

  // bonsai sát chân nhà
  for (const x of [4, 8, 20, 24]) m.set("walls", x, 6, "bonsai").solid(x, 6);
  // tượng trước sảnh
  m.set("walls", 12, 8, "statue").solid(12, 8);
  // cây: tán phủ trên đầu, thân cản
  for (const [cx, ty] of [[3, 9], [25, 9], [3, 14], [25, 14]] as const) {
    m.set("overlay", cx, ty - 2, "tree_canopy_tl").set("overlay", cx + 1, ty - 2, "tree_canopy_tr");
    m.set("overlay", cx, ty - 1, "tree_canopy_bl").set("overlay", cx + 1, ty - 1, "tree_canopy_br");
    m.set("walls", cx, ty, "tree_trunk").solid(cx, ty);
  }
  // băng ghế
  for (const [x, y] of [[8, 11], [21, 11]] as const) m.set("walls", x, y, "bench").solid(x, y);
  // học sinh
  const kids: [string, number, number][] = [["student_boy", 9, 13], ["student_girl", 19, 13], ["student_girl", 12, 15], ["student_boy", 17, 11], ["student_boy", 6, 16], ["student_girl", 22, 16]];
  for (const [f, x, y] of kids) m.sprite(f, x * 16, y * 16 - 8).solid(x, y);

  // tường rào + cổng phía nam (x=14,15) + lối sang đông (x=29,y=12..13)
  for (let y = 7; y < 20; y++) {
    m.set("walls", 0, y, "low_wall_cream").solid(0, y);
    m.set("walls", 29, y, y % 3 === 1 ? "low_wall_diamond" : "low_wall_cream").solid(29, y);
  }
  m.open(29, 12, 1, 2);
  m.fill("walls", 29, 12, 1, 2, "paving_brown").fill("ground", 29, 12, 1, 2, "paving_brown");
  for (let x = 0; x < W; x++) m.set("walls", x, 19, x % 3 === 1 ? "low_wall_diamond" : "low_wall_cream");
  m.solid(0, 19, W, 1).open(14, 19, 2, 1);
  m.set("walls", 13, 19, "gate_pillar").set("walls", 16, 19, "gate_pillar");
  m.set("walls", 14, 19, "paving_brown").set("walls", 15, 19, "paving_brown");

  m.exit("to-cong-truong", 14, 19, 2, 1);
  m.exit("to-hanh-lang-lop-12", 14, 5, 2, 1);
  m.exit("to-san-the-chat", 29, 12, 1, 2);

  m.interact({ name: "khau-hieu", tx: 12, ty: 6, tw: 6, th: 1, kind: "text", text: "RÈN ĐỨC – LUYỆN TÀI" });
  m.interact({ name: "tuong", tx: 11, ty: 7, tw: 3, th: 3, kind: "text", text: "Bức tượng trước sảnh chính. Năm nào cũng có người hẹn nhau ở đây." });
  for (const [n, x] of [["bang-ghe-1", 7], ["bang-ghe-2", 20]] as const)
    m.interact({ name: n, tx: x, ty: 10, tw: 3, th: 3, kind: "activity", label: "Ngồi nghỉ", text: "Bạn ngồi nghỉ một lát trên băng ghế giữa sân.", cost: 1 });
  return m;
}

// ---------- hanh-lang-lop-12 (24×12 ô) ----------
// Hành lang 3 ô: bên trên là dãy lớp, bên dưới là lan can nhìn xuống sân (ref-05, ref-10).
// Đầu trái: thang xuống (→ sân chính). Đầu phải: thang lên (→ sân thượng).
function hanhLang(): MapBuilder {
  const m = new MapBuilder(24, 12);
  const W = 24;
  m.fill("ground", 0, 0, W, 3, "wall_cream");
  m.fill("ground", 0, 3, W, 4, "floor_corridor");
  m.fill("ground", 0, 3, W, 1, "floor_corridor_shadow");
  m.fill("ground", 0, 7, W, 5, "paving_brown");

  for (let x = 0; x < W; x++) {
    if (x % 4 === 0) {
      m.set("walls", x, 0, "pillar_blue_top").set("walls", x, 1, "pillar_blue").set("walls", x, 2, "pillar_blue");
    } else {
      m.set("walls", x, 0, "pipe_red");
      if (x % 4 === 2) m.set("walls", x, 1, "window_teal");
      m.set("walls", x, 2, "wall_cream_base");
    }
  }
  for (const x of [6, 14]) m.set("walls", x, 2, "door_teal");
  m.solid(0, 0, W, 3);

  // lan can: trụ ở vị trí cột, thanh ở giữa
  for (let x = 0; x < W; x++) m.set("walls", x, 6, x % 4 === 0 ? "railing_post" : "railing_teal");
  m.solid(0, 6, W, 6);

  // thang hai đầu (đi được)
  for (let y = 3; y <= 5; y++) {
    m.set("walls", 1, y, "stairs");
    m.set("walls", 22, y, "stairs");
  }
  // sân bên dưới: cây
  for (const cx of [3, 11, 19]) {
    m.set("overlay", cx, 7, "tree_canopy_tl").set("overlay", cx + 1, 7, "tree_canopy_tr");
    m.set("overlay", cx, 8, "tree_canopy_bl").set("overlay", cx + 1, 8, "tree_canopy_br");
    m.set("walls", cx, 9, "tree_trunk");
  }
  // ghế và học sinh trong hành lang
  m.set("walls", 12, 3, "bench").solid(12, 3);
  m.sprite("student_girl", 10 * 16, 3 * 16 - 8).solid(10, 3);
  m.sprite("student_boy", 17 * 16, 3 * 16 - 8).solid(17, 3);

  m.exit("to-san-chinh", 0, 3, 1, 3);
  m.exit("to-san-thuong", 23, 3, 1, 3);

  m.interact({ name: "lop-12a1", tx: 5, ty: 2, tw: 3, th: 3, kind: "text", text: "Lớp 12A1. Cửa còn hé mở, bên trong nghe tiếng quạt trần quay đều." });
  m.interact({ name: "lop-12a2", tx: 13, ty: 2, tw: 3, th: 3, kind: "text", text: "Lớp 12A2. Trên bảng vẫn còn dòng chữ đếm ngược ngày thi." });
  m.interact({ name: "bang-ghe", tx: 11, ty: 2, tw: 3, th: 3, kind: "activity", label: "Ngồi nghỉ", text: "Bạn ngồi xuống ghế cuối hành lang, nghe tiếng trống xa xa.", cost: 1 });
  m.interact({ name: "lan-can", tx: 4, ty: 5, tw: 5, th: 1, kind: "text", text: "Từ lan can nhìn xuống, tán phượng che kín cả góc sân." });
  return m;
}

// ---------- san-the-chat (26×14 ô) ----------
// Sân xanh dương có vạch trắng, hai rổ bóng rổ, nhà nhiều tầng bao quanh (ref-07, ref-08).
function sanTheChat(): MapBuilder {
  const m = new MapBuilder(26, 14);
  const W = 26;
  m.fill("ground", 0, 0, W, 4, "wall_cream");
  m.fill("ground", 0, 4, W, 9, "court_blue");
  m.fill("ground", 0, 13, W, 1, "paving_brown");
  for (let x = 0; x < W; x++) {
    if (x % 4 === 0) {
      m.set("walls", x, 0, "pillar_blue_top").set("walls", x, 1, "pillar_blue").set("walls", x, 2, "pillar_blue");
    } else {
      if (x % 4 === 2) m.set("walls", x, 1, "window_teal");
      m.set("walls", x, 2, "wall_cream_base");
    }
    m.set("walls", x, 3, x % 4 === 0 ? "railing_post" : "railing_teal");
  }
  m.solid(0, 0, W, 4);

  // vạch sân
  for (let x = 1; x <= 24; x++) m.set("ground", x, 4, "court_line_h").set("ground", x, 12, "court_line_h");
  for (let y = 4; y <= 12; y++) m.set("ground", 1, y, "court_line_v").set("ground", 24, y, "court_line_v").set("ground", 12, y, "court_line_v");
  m.fill("ground", 3, 6, 4, 5, "court_brown").fill("ground", 19, 6, 4, 5, "court_brown");
  // rổ bóng rổ
  for (const x of [2, 23]) {
    m.set("walls", x, 7, "hoop");
    m.set("walls", x, 8, "hoop_pole").solid(x, 8);
  }

  // tường bao + lối vào giữa phía nam (x=12,13)
  for (let y = 4; y < 14; y++) {
    m.set("walls", 0, y, "low_wall_cream").solid(0, y);
    m.set("walls", 25, y, "low_wall_cream").solid(25, y);
  }
  for (let x = 1; x < 25; x++) m.set("walls", x, 13, x % 3 === 1 ? "low_wall_diamond" : "low_wall_cream");
  m.solid(1, 13, 24, 1);
  m.set("walls", 11, 13, "gate_pillar").set("walls", 14, 13, "gate_pillar");
  m.set("walls", 12, 13, "paving_brown").set("walls", 13, 13, "paving_brown").open(12, 13, 2, 1);
  for (const x of [5, 19]) m.set("walls", x, 13, "bench").solid(x, 13);

  const kids: [string, number, number][] = [["student_boy", 8, 8], ["student_girl", 10, 10], ["student_boy", 16, 6], ["student_girl", 15, 9]];
  for (const [f, x, y] of kids) m.sprite(f, x * 16, y * 16 - 8).solid(x, y);

  m.exit("to-san-chinh", 12, 13, 2, 1);
  m.interact({ name: "ro-trai", tx: 1, ty: 6, tw: 4, th: 4, kind: "text", text: "Rổ bóng rổ cũ, lưới đã sờn nhưng vẫn còn nguyên vành." });
  m.interact({ name: "ro-phai", tx: 21, ty: 6, tw: 4, th: 4, kind: "text", text: "Vạch sơn đã phai, dấu giày còn in trên nền sân." });
  for (const [n, x] of [["bang-ghe-1", 4], ["bang-ghe-2", 18]] as const)
    m.interact({ name: n, tx: x, ty: 11, tw: 3, th: 3, kind: "activity", label: "Ngồi nghỉ", text: "Bạn ngồi nghỉ xem mọi người chơi bóng.", cost: 1 });
  return m;
}

// ---------- san-thuong (20×11 ô), khóa mặc định ----------
function sanThuong(): MapBuilder {
  const m = new MapBuilder(20, 11);
  const W = 20;
  const H = 11;
  m.fill("ground", 0, 0, W, H, "roof_floor");
  for (let x = 0; x < W; x++) m.set("walls", x, 0, "roof_fence");
  for (let y = 0; y < H; y++) m.set("walls", 0, y, "roof_fence").set("walls", W - 1, y, "roof_fence");
  for (let x = 0; x < W; x++) m.set("walls", x, H - 1, "roof_fence");
  m.solid(0, 0, W, 1).solid(0, 0, 1, H).solid(W - 1, 0, 1, H).solid(0, H - 1, W, 1);
  m.fill("walls", 9, H - 1, 2, 1, "stairs").open(9, H - 1, 2, 1);
  for (const x of [5, 14]) m.set("walls", x, 3, "bench").solid(x, 3);
  for (const x of [3, 16]) m.set("walls", x, 3, "bonsai").solid(x, 3);
  m.set("walls", 10, 2, "flag_red").solid(10, 2);

  m.exit("to-hanh-lang-lop-12", 9, H - 1, 2, 1);
  m.interact({ name: "ho-thanh", tx: 7, ty: 1, tw: 6, th: 2, kind: "text", text: "Từ sân thượng nhìn xuống, cả sân trường nhỏ xíu. Gió thổi mát rượi." });
  for (const [n, x] of [["bang-ghe-1", 4], ["bang-ghe-2", 13]] as const)
    m.interact({ name: n, tx: x, ty: 2, tw: 3, th: 3, kind: "activity", label: "Ngồi nghỉ", text: "Bạn ngồi nhìn bầu trời chiều đổi màu.", cost: 1 });
  return m;
}

const maps: Record<string, MapBuilder> = {
  "cong-truong": congTruong(),
  "san-chinh": sanChinh(),
  "hanh-lang-lop-12": hanhLang(),
  "san-the-chat": sanTheChat(),
  "san-thuong": sanThuong(),
};
for (const [id, m] of Object.entries(maps)) {
  writeFileSync(`data/maps/${id}.tmj`, m.toTmj());
  console.log(`đã ghi data/maps/${id}.tmj`);
}
