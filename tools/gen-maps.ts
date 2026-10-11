// Sinh bản đồ khởi đầu (.tmj) cho từng khu vực:  npm run gen-maps
// Mở kết quả trong Tiled để chỉnh; đã chỉnh tay thì đừng chạy lại cho bản đồ đó.
import { mkdirSync, writeFileSync } from "node:fs";
import { MapBuilder } from "./maps-lib.ts";

mkdirSync("data/maps", { recursive: true });

// ---------- cong-truong (32×11 ô) ----------
// Theo ảnh pixel mẫu ref-01 (người dùng cung cấp). Cao đúng một màn hình (11 ô = 176px) nên thấy trọn mặt tiền.
// Hàng 0–5: nền xám, tường gạch men trắng, lưới xanh, dải khung tranh đỏ; cổng chính ở giữa (ô 11–20) là một
// sprite lớn (mái vòm, biển "TRẦN PHÚ", cột gạch, song sắt, cánh cổng); lối vào sân chính ở chân cổng.
// Hàng 6–7: vỉa hè gạch nâu hai bên, lối xe nhựa ở giữa, hai cây lớn trong bồn gạch.
// Hàng 8–10: đường có xe buýt 67, xe máy, vạch qua đường; hàng bụi cây dưới cùng.
function congTruong(): MapBuilder {
  const W = 32;
  const m = new MapBuilder(W, 11);
  const GATE_L = 11; // ô trái của cổng
  const GATE_R = 20; // ô phải của cổng
  const outside = (x: number) => x < GATE_L || x > GATE_R;

  // nền
  m.fill("ground", 0, 0, W, 2, "backdrop_gray");
  m.fill("ground", 0, 2, W, 1, "wall_white_tile");
  const mural = ["mural_post", "mural_cream", "mural_diamond", "mural_cream", "mural_diamond", "mural_cream"];
  for (let x = 0; x < W; x++) {
    if (outside(x)) {
      m.set("ground", x, 3, "lattice_blue").set("ground", x, 4, "lattice_blue_base");
      // dải khung tranh đỏ: trụ ngay sát cột cổng, rồi cứ 6 ô lặp lại (trụ, kem, thoi, kem, thoi, kem)
      const d = x < GATE_L ? GATE_L - 1 - x : x - (GATE_R + 1);
      m.set("ground", x, 5, mural[d % 6]);
    } else {
      m.fill("ground", x, 3, 1, 3, "wall_white_tile"); // nền sau sprite cổng
    }
  }
  m.fill("ground", 0, 6, W, 2, "paving_brown");
  m.fill("ground", GATE_L, 6, GATE_R - GATE_L + 1, 2, "road"); // lối xe trước cổng
  m.fill("ground", 0, 8, W, 1, "road_curb");
  m.fill("ground", GATE_L, 8, GATE_R - GATE_L + 1, 1, "road");
  m.fill("ground", 0, 9, W, 1, "road");
  m.fill("ground", 0, 10, W, 1, "grass");
  m.solid(0, 0, W, 6); // cả mặt tiền cản, chỉ chừa chân cổng (bên dưới)

  // cổng chính (sprite 176×96 đặt tại px 168,0) + lối vào sân chính ở chân cổng (ô 15–16, hàng 5)
  m.sprite("gate_main", 168, 0);
  m.open(15, 5, 2, 1);

  // bồn cây gạch (3 ô) + cây lớn: cây là sprite, gốc nằm trong bồn
  for (const x of [8, 9, 10, 21, 22, 23]) m.set("walls", x, 6, "planter_brick").solid(x, 6);
  m.sprite("tree_big", 128, 40).sprite("tree_big_r", 336, 40);

  // băng ghế
  for (const x of [4, 25]) m.set("walls", x, 7, "bench").solid(x, 7);

  // quầy kem (trái) và cháo lòng (phải) đứng trước dải khung tranh
  m.sprite("cart_kem", 16, 80).solid(1, 6, 2, 1);
  m.sprite("cart_chao_long", 432, 80).solid(27, 6, 3, 1);

  // học sinh đứng nền hai bên lối xe
  m.sprite("student_boy", 192, 88).solid(12, 6);
  m.sprite("student_girl", 304, 88).solid(19, 6);

  // đường: vạch đứt, vạch qua đường, xe buýt 67, xe máy
  for (let x = 0; x < W; x += 2) m.set("ground", x, 9, "road_dash");
  for (const x of [25, 26]) m.fill("ground", x, 8, 1, 2, "crosswalk");
  m.sprite("bus_67", 80, 128).solid(5, 8, 5, 2);
  m.sprite("motorbike", 288, 136).solid(18, 8, 2, 2);

  // hàng bụi cây phía dưới
  for (let x = 0; x < W; x++) m.set("ground", x, 10, "bush");
  m.solid(0, 10, W, 1);

  // chuyển khu vực
  m.exit("to-san-chinh", 15, 5, 2, 1);

  // tương tác
  m.interact({ name: "bang-ten", tx: 13, ty: 6, tw: 6, th: 1, kind: "text", text: "TRƯỜNG TRUNG HỌC PHỔ THÔNG TRẦN PHÚ" });
  m.interact({ name: "bang-ghe-1", tx: 3, ty: 7, tw: 3, th: 2, kind: "activity", label: "Ngồi nghỉ", text: "Bạn ngồi nghỉ một lát trên băng ghế.", cost: 1 });
  m.interact({ name: "bang-ghe-2", tx: 24, ty: 7, tw: 3, th: 2, kind: "activity", label: "Ngồi nghỉ", text: "Bạn ngồi nghỉ một lát trên băng ghế.", cost: 1 });
  m.interact({ name: "xe-kem", tx: 0, ty: 5, tw: 4, th: 3, kind: "text", text: "Xe kem của cô Sáu. Mùi kem cốm thơm ngọt, y như hồi xưa." });
  m.interact({ name: "xe-chao-long", tx: 26, ty: 5, tw: 5, th: 3, kind: "text", text: "Xe cháo lòng nghi ngút khói. Hai chục ngàn một tô." });
  m.interact({ name: "xe-buyt", tx: 4, ty: 7, tw: 7, th: 4, kind: "text", text: "Xe buýt số 67, chuyến quen thuộc đưa học sinh đến trường." });
  return m;
}


// ---------- san-chinh (30×22 ô) ----------
// Cùng phong cách cổng trường (ref-01) + ảnh thật ref-09, ref-06. Giữ nguyên vùng đi được, exit, spawn, vùng tương tác.
// Bắc (hàng 0–5): nhà chính 3 tầng — sảnh giữa là sprite lớn (biển "RÈN ĐỨC – LUYỆN TÀI", cờ, cột gạch, cửa vào
// hành lang lớp 12), hai cánh là dải cửa sổ + lan can + cột xanh. Hàng 6: gạch nâu, hai cây lớn trong bồn gạch.
// Giữa: lối gạch nâu nối cổng với sảnh; sân bê tông có vạch kẻ trắng; tường rào đông/tây là dải khung tranh đỏ.
// Nam (hàng 16–21): dãy lầu lớp 10 (hành lang hở nhìn ra sân, 2 cầu thang) và cổng chính ở giữa với hai cột gạch.
function sanChinh(): MapBuilder {
  const m = new MapBuilder(30, 22);
  const W = 30;
  m.fill("ground", 0, 0, W, 6, "wall_cream");
  m.fill("ground", 0, 6, W, 1, "paving_brown");
  m.fill("ground", 0, 7, W, 9, "yard_concrete");
  m.fill("ground", 13, 7, 4, 9, "paving_brown"); // lối gạch giữa sân
  m.fill("ground", 0, 16, W, 6, "wall_cream");

  // vạch sân kẻ trắng: hai khung chữ nhật đối xứng hai bên lối giữa
  for (const [x0, x1] of [[2, 10], [19, 27]] as const) {
    const y0 = 9;
    const y1 = 14;
    m.set("ground", x0, y0, "yard_line_tl").set("ground", x1, y0, "yard_line_tr");
    m.set("ground", x0, y1, "yard_line_bl").set("ground", x1, y1, "yard_line_br");
    for (let x = x0 + 1; x < x1; x++) m.set("ground", x, y0, "yard_line_h").set("ground", x, y1, "yard_line_h");
    for (let y = y0 + 1; y < y1; y++) m.set("ground", x0, y, "yard_line_v").set("ground", x1, y, "yard_line_v");
  }

  // nhà chính phía bắc (y0..5): mái đua, ba tầng cửa sổ, sàn ban công; cột xanh đối xứng (giữa là sảnh)
  const pillars = new Set([0, 6, 23, 29]);
  for (let x = 0; x < W; x++) {
    m.set("walls", x, 0, "facade_roof");
    if (pillars.has(x)) {
      m.set("walls", x, 1, "pillar_blue_top");
      for (let y = 2; y <= 5; y++) m.set("walls", x, y, "pillar_blue");
    } else {
      m.set("walls", x, 1, "facade_window").set("walls", x, 2, "facade_slab");
      m.set("walls", x, 3, "facade_window").set("walls", x, 4, "facade_slab");
      m.set("walls", x, 5, "facade_window_ground");
    }
  }
  m.sprite("hall_main", 176, 0); // sảnh chính: ô 11–18, hàng 0–5
  m.fill("walls", 14, 6, 2, 1, "stairs");
  m.solid(0, 0, W, 6).open(14, 5, 2, 1);

  // chân nhà (hàng 6): hai cây lớn trong bồn gạch, chậu bonsai
  for (const x of [7, 8, 9, 20, 21, 22]) m.set("walls", x, 6, "planter_brick").solid(x, 6);
  m.sprite("tree_big", 112, 40).sprite("tree_big_r", 320, 40);
  for (const x of [2, 4, 12, 17, 25, 27]) m.set("walls", x, 6, "bonsai").solid(x, 6);

  // dãy nhà nam (y16..21): hành lang hở nhìn ra sân (lan can xanh ngọc), 2 cầu thang, cổng chính ở giữa
  const mural = ["", "mural_cream", "mural_diamond", "mural_cream", "mural_diamond", "mural_cream"];
  for (let x = 0; x < W; x++) {
    m.set("ground", x, 16, "floor_corridor");
    m.set("walls", x, 16, x % 6 === 0 ? "railing_post" : "railing_teal");
    m.set("ground", x, 17, "floor_corridor");
    m.set("ground", x, 18, "floor_corridor_shadow");
    if (x % 6 === 0) {
      m.set("walls", x, 19, "pillar_blue_top");
      for (let y = 20; y <= 21; y++) m.set("walls", x, y, "pillar_blue");
    } else {
      m.set("walls", x, 19, "pipe_red");
      m.set("walls", x, 20, "facade_window");
      m.set("walls", x, 21, mural[x % 6]);
    }
  }
  m.solid(0, 16, W, 6);
  for (const sx of [8, 20]) {
    m.set("walls", sx, 16, "stairs_rail_l").set("walls", sx + 1, 16, "stairs_rail_r");
    m.set("walls", sx, 17, "stairs_rail_l").set("walls", sx + 1, 17, "stairs_rail_r");
    m.open(sx, 16, 2, 2);
  }
  // cổng chính (x=14,15) xuyên qua dãy nhà nam, hai cột gạch xanh như cột cổng trường
  for (let y = 16; y < 22; y++) {
    m.set("ground", 13, y, "paving_brown").set("ground", 14, y, "paving_brown").set("ground", 15, y, "paving_brown").set("ground", 16, y, "paving_brown");
    m.set("walls", 14, y, "empty").set("walls", 15, y, "empty");
    const pillar = y === 16 ? "pillar_brick_top" : "pillar_brick";
    m.set("walls", 13, y, pillar).set("walls", 16, y, pillar);
    m.solid(13, y).solid(16, y).open(14, y, 2, 1);
  }

  // tượng trước sảnh
  m.set("walls", 12, 8, "statue").solid(12, 8);
  // băng ghế
  for (const [x, y] of [[8, 11], [21, 11]] as const) m.set("walls", x, y, "bench").solid(x, y);
  // học sinh
  const kids: [string, number, number][] = [["student_boy", 9, 13], ["student_girl", 19, 13], ["student_girl", 12, 15], ["student_boy", 17, 11], ["student_boy", 6, 14], ["student_girl", 22, 14]];
  for (const [f, x, y] of kids) m.sprite(f, x * 16, y * 16 - 8).solid(x, y);

  // tường rào hai bên (y7..15): dải khung tranh đỏ như dải tường ở cổng; lối sang sân thể chất ở phía TÂY (x=0, y=12..13)
  for (let y = 7; y < 16; y++) {
    const id = y % 3 === 1 ? "mural_diamond" : "mural_cream";
    m.set("walls", 0, y, id).solid(0, y);
    m.set("walls", 29, y, id).solid(29, y);
  }
  m.open(0, 12, 1, 2);
  m.fill("walls", 0, 12, 1, 2, "empty").fill("ground", 0, 12, 1, 2, "paving_brown");

  m.exit("to-cong-truong", 14, 21, 2, 1);
  m.exit("to-hanh-lang-bac", 14, 5, 2, 1);
  m.exit("to-hanh-lang-10-trai", 8, 17, 2, 1);
  m.exit("to-hanh-lang-10-phai", 20, 17, 2, 1);
  m.exit("to-san-the-chat", 0, 12, 1, 2);

  m.interact({ name: "khau-hieu", tx: 12, ty: 6, tw: 6, th: 1, kind: "text", text: "RÈN ĐỨC – LUYỆN TÀI" });
  m.interact({ name: "tuong", tx: 11, ty: 7, tw: 3, th: 3, kind: "text", text: "Bức tượng trước sảnh chính. Năm nào cũng có người hẹn nhau ở đây." });
  for (const [n, x] of [["bang-ghe-1", 7], ["bang-ghe-2", 20]] as const)
    m.interact({ name: n, tx: x, ty: 10, tw: 3, th: 3, kind: "activity", label: "Ngồi nghỉ", text: "Bạn ngồi nghỉ một lát trên băng ghế giữa sân.", cost: 1 });
  return m;
}

// ---------- dãy hành lang 3 tầng (30×26 ô): hanh-lang-lop-12 và hanh-lang-lop-10 ----------
// Một khu vực gồm 3 dải hành lang xếp chồng (tầng 3 trên, tầng 2 giữa, tầng 1 dưới/trệt), mỗi tầng 3 lớp.
// Cầu thang ở hai đầu (x=1..2 và x=27..28) nối các tầng; đi bộ để đổi tầng.
// Lối từ sân chính (gaps) vào tầng 1; lối lên sân thượng (nếu có) ở đầu trên cầu thang phải.
interface HallOptions {
  /** Từ tầng 3 (trên) xuống tầng 1 (dưới). */
  floors: { label: string; classes: string[] }[];
  /** Lối xuống sân chính ở tầng 1: x của ô trái, id exit. */
  gaps: { x: number; exit: string }[];
  rooftopExit: boolean;
  stairsText: string;
}
function hall(o: HallOptions): MapBuilder {
  const m = new MapBuilder(30, 26);
  const W = 30;
  const shaft = (x: number) => x === 1 || x === 2 || x === 27 || x === 28;
  const DOORS = [6, 14, 22]; // cột cửa lớp (3 lớp mỗi tầng)
  m.fill("ground", 0, 21, W, 5, "paving_brown"); // sân nhìn từ tầng trệt
  m.solid(0, 0, W, 26);

  o.floors.forEach((f, fi) => {
    const y0 = fi * 7;
    m.fill("ground", 0, y0, W, 3, "wall_cream");
    m.fill("ground", 0, y0 + 3, W, 4, "floor_corridor");
    m.fill("ground", 0, y0 + 3, W, 1, "floor_corridor_shadow");
    for (let x = 0; x < W; x++) {
      if (shaft(x)) continue;
      if (x % 4 === 0) {
        m.set("walls", x, y0, "pillar_blue_top").set("walls", x, y0 + 1, "pillar_blue").set("walls", x, y0 + 2, "pillar_blue");
      } else {
        m.set("walls", x, y0, "pipe_red");
        if (x % 4 === 2 && !DOORS.includes(x)) m.set("walls", x, y0 + 1, "window_teal"); // cột có cửa lớp: biển tên lớp thay cửa sổ
        m.set("walls", x, y0 + 2, "wall_cream_base");
      }
      m.set("walls", x, y0 + 6, x % 4 === 0 ? "railing_post" : "railing_teal");
    }
    m.open(1, y0 + 3, 28, 3); // hành lang đi được

    // 3 lớp mỗi tầng
    f.classes.forEach((c, i) => {
      const dx = DOORS[i];
      m.set("walls", dx, y0 + 2, "door_teal");
      m.sprite(`plate_${c.toLowerCase()}`, dx * 16 - 4, (y0 + 1) * 16 + 3); // biển tên lớp trên cửa
      m.interact({
        name: `lop-${c.toLowerCase()}`,
        tx: dx - 1,
        ty: y0 + 2,
        tw: 3,
        th: 3,
        kind: "text",
        text: `${f.label} – Lớp ${c}. Cửa còn hé mở, bên trong nghe tiếng quạt trần quay đều.`,
      });
    });
    const first = f.classes[0];
    const last = f.classes[f.classes.length - 1];
    m.interact({ name: `nhan-tang-${y0}`, tx: 3, ty: y0 + 3, tw: 3, th: 3, kind: "text", text: `${f.label} – các lớp ${first} đến ${last}.` });
  });

  // cầu thang hai đầu: đi được từ tầng 3 xuống tầng 1; mỗi tầng có chiếu nghỉ (sàn phẳng), giữa các tầng là bậc có tay vịn
  for (const sx of [1, 2, 27, 28]) {
    const left = sx === 1 || sx === 27;
    for (let y = 0; y <= 19; y++) {
      const landing = y % 7 >= 3 && y % 7 <= 5;
      if (!landing) m.set("walls", sx, y, left ? "stairs_rail_l" : "stairs_rail_r");
      m.set("ground", sx, y, "floor_corridor");
    }
    m.set("walls", sx, 20, sx % 2 === 0 ? "railing_post" : "railing_teal");
    m.open(sx, 0, 1, 20);
  }
  m.interact({ name: "cau-thang-trai", tx: 0, ty: 3, tw: 4, th: 17, kind: "text", text: o.stairsText });

  // lối xuống sân chính ở tầng 1: cầu thang qua hàng lan can
  for (const g of o.gaps) {
    m.fill("walls", g.x, 20, 2, 1, "stairs").fill("ground", g.x, 20, 2, 1, "floor_corridor");
    m.fill("walls", g.x, 21, 2, 1, "stairs");
    m.open(g.x, 20, 2, 2);
    m.exit(g.exit, g.x, 21, 2, 1);
  }
  // sân bên dưới (nhìn từ tầng trệt): gạch nâu, bốn cây lớn trong bồn gạch như ở cổng, hàng bụi dưới cùng
  for (let x = 0; x < W; x++) m.set("ground", x, 25, "bush");
  [3, 10, 17, 24].forEach((px, i) => {
    for (let x = px; x < px + 3; x++) m.set("walls", x, 24, "planter_brick");
    m.sprite(i % 2 === 0 ? "tree_big" : "tree_big_r", px * 16, 24 * 16 + 8 - 64);
  });

  // ghế + học sinh
  m.set("walls", 11, 17, "bench").solid(11, 17);
  m.interact({ name: "bang-ghe", tx: 10, ty: 16, tw: 3, th: 3, kind: "activity", label: "Ngồi nghỉ", text: "Bạn ngồi xuống ghế hành lang tầng trệt, nghe tiếng trống xa xa.", cost: 1 });
  m.sprite("student_girl", 5 * 16, 17 * 16 - 8).solid(5, 17);
  m.sprite("student_boy", 24 * 16, 18 * 16 - 8).solid(24, 18);
  m.sprite("student_boy", 16 * 16, 11 * 16 - 8).solid(16, 11);
  m.sprite("student_girl", 23 * 16, 4 * 16 - 8).solid(23, 4);

  if (o.rooftopExit) m.exit("to-san-thuong", 27, 0, 2, 1);
  return m;
}

function hanhLang12(): MapBuilder {
  return hall({
    floors: [
      { label: "Tầng 3", classes: ["11B4", "11B5", "11B6"] },
      { label: "Tầng 2", classes: ["11B1", "11B2", "11B3"] },
      { label: "Tầng 1", classes: ["12A1", "12A2", "12A3"] },
    ],
    gaps: [{ x: 14, exit: "to-san-chinh-bac" }],
    rooftopExit: true,
    stairsText: "Cầu thang lên xuống các tầng. Tầng trệt là lớp 12, hai tầng trên là lớp 11.",
  });
}

function hanhLang10(): MapBuilder {
  return hall({
    floors: [
      { label: "Tầng 3", classes: ["10C7", "10C8", "10C9"] },
      { label: "Tầng 2", classes: ["10C4", "10C5", "10C6"] },
      { label: "Tầng 1", classes: ["10C1", "10C2", "10C3"] },
    ],
    gaps: [
      { x: 8, exit: "to-san-chinh-nam-trai" },
      { x: 20, exit: "to-san-chinh-nam-phai" },
    ],
    rooftopExit: false,
    stairsText: "Cầu thang lên xuống các tầng của khu lầu phía nam, toàn lớp 10.",
  });
}

// ---------- san-the-chat (26×14 ô) ----------
// Nằm phía TÂY sân chính, lối vào ở cạnh đông. Sân xanh dương có vạch trắng, hai rổ bóng rổ,
// nhà nhiều tầng bao quanh (ref-07, ref-08).
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
  m.fill("ground", 3, 6, 4, 5, "court_brown").fill("ground", 18, 6, 4, 5, "court_brown");
  // rổ bóng rổ
  for (const x of [2, 22]) {
    m.set("walls", x, 7, "hoop");
    m.set("walls", x, 8, "hoop_pole").solid(x, 8);
  }

  // tường bao + lối vào ở cạnh ĐÔNG (x=25, y=8..9)
  for (let y = 4; y < 14; y++) {
    m.set("walls", 0, y, "low_wall_cream").solid(0, y);
    m.set("walls", 25, y, y % 3 === 1 ? "low_wall_diamond" : "low_wall_cream").solid(25, y);
  }
  m.open(25, 8, 1, 2);
  m.fill("walls", 25, 8, 1, 2, "empty").fill("ground", 25, 8, 1, 2, "paving_brown");
  for (let x = 1; x < 25; x++) m.set("walls", x, 13, x % 3 === 1 ? "low_wall_diamond" : "low_wall_cream");
  m.solid(1, 13, 24, 1);
  for (const x of [5, 19]) m.set("walls", x, 13, "bench").solid(x, 13);

  const kids: [string, number, number][] = [["student_boy", 8, 8], ["student_girl", 10, 10], ["student_boy", 16, 6], ["student_girl", 15, 9]];
  for (const [f, x, y] of kids) m.sprite(f, x * 16, y * 16 - 8).solid(x, y);

  m.exit("to-san-chinh", 25, 8, 1, 2);
  m.interact({ name: "ro-trai", tx: 1, ty: 6, tw: 4, th: 4, kind: "text", text: "Rổ bóng rổ cũ, lưới đã sờn nhưng vẫn còn nguyên vành." });
  m.interact({ name: "ro-phai", tx: 20, ty: 6, tw: 5, th: 4, kind: "text", text: "Vạch sơn đã phai, dấu giày còn in trên nền sân." });
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
  "hanh-lang-lop-12": hanhLang12(),
  "hanh-lang-lop-10": hanhLang10(),
  "san-the-chat": sanTheChat(),
  "san-thuong": sanThuong(),
};
// Không truyền tham số: ghi TẤT CẢ bản đồ. `npm run gen-maps -- cong-truong` chỉ ghi các bản đồ được nêu
// (để không ghi đè bản đồ đã chỉnh tay trong Tiled).
const only = process.argv.slice(2);
for (const [id, m] of Object.entries(maps)) {
  if (only.length > 0 && !only.includes(id)) continue;
  writeFileSync(`data/maps/${id}.tmj`, m.toTmj());
  console.log(`đã ghi data/maps/${id}.tmj`);
}
