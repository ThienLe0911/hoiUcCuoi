// Cảnh một khu vực: dựng bản đồ Tiled, nhân vật đi lại có va chạm, camera, tương tác.
import Phaser from "phaser";
import { FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH, TILE } from "../config";
import type { Direction } from "../core/actions";
import { attachKeyboard } from "../core/keyboard";
import type { Session } from "../core/session";
import { Dialog } from "../ui/Dialog";

const SPEED = 60; // px/giây
const FADE_MS = 250; // ≤ 0,5 s (FR3.3)
const BODY_W = 10;
const BODY_H = 6;
const SPRITE_W = 16;
const SPRITE_H = 24;

interface TiledProp {
  name: string;
  value: unknown;
}
interface TiledObject {
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: TiledProp[];
}

export interface InteractPoint {
  name: string;
  rect: Phaser.Geom.Rectangle;
  kind: "text" | "activity";
  text: string;
  label: string;
  cost: number;
}
export interface ExitZone {
  id: string;
  rect: Phaser.Geom.Rectangle;
}

export interface AreaSceneData {
  areaId?: string;
  spawn?: string;
}

/** Phát trên game.events khi một hoạt động (kind = activity) kết thúc hộp thoại. */
export const ACTIVITY_EVENT = "activity";

export class AreaScene extends Phaser.Scene {
  private session!: Session;
  private player!: Phaser.Physics.Arcade.Sprite;
  private facing: Direction = "down";
  private dialog!: Dialog;
  private prompt!: Phaser.GameObjects.Text;
  private interactPoints: InteractPoint[] = [];
  private exits: ExitZone[] = [];
  private detachKeyboard?: () => void;
  private transitioning = false;
  /** Lối ra vừa bị báo khóa: chỉ báo lại sau khi người chơi rời khỏi vùng đó. */
  private blockedExit?: string;

  constructor() {
    super("Area");
  }

  get exitZones(): readonly ExitZone[] {
    return this.exits;
  }

  create(data: AreaSceneData): void {
    this.session = this.registry.get("session") as Session;
    const { state, content, actions } = this.session;
    const areaId = data.areaId ?? state.areaId;
    const area = content.areas.get(areaId);
    if (!area) throw new Error(`Khu vực không tồn tại: ${areaId}`);
    state.areaId = area.id;
    const spawn = area.spawns[data.spawn ?? "default"];
    if (!spawn) throw new Error(`Khu vực '${area.id}' không có spawn '${data.spawn}'`);

    // bản đồ
    const map = this.make.tilemap({ key: `map-${area.id}` });
    const tileset = map.addTilesetImage("tileset", "tileset")!;
    map.createLayer("ground", tileset)!.setDepth(0);
    map.createLayer("walls", tileset)!.setDepth(1);
    const collision = map.createLayer("collision", tileset)!;
    collision.setVisible(false);
    collision.setCollisionByExclusion([-1, 0]);
    map.createLayer("overlay", tileset)!.setDepth(100000);

    const mapW = map.widthInPixels;
    const mapH = map.heightInPixels;

    // đối tượng
    this.interactPoints = [];
    this.exits = [];
    const objects = (map.getObjectLayer("objects")?.objects ?? []) as unknown as TiledObject[];
    for (const o of objects) {
      const props = Object.fromEntries((o.properties ?? []).map((p) => [p.name, p.value]));
      const rect = new Phaser.Geom.Rectangle(o.x, o.y, o.width, o.height);
      if (o.type === "sprite") {
        this.add.image(o.x, o.y, "sprites", props.frame as string).setOrigin(0, 0).setDepth(o.y + o.height);
      } else if (o.type === "exit") {
        this.exits.push({ id: o.name, rect });
      } else if (o.type === "interact") {
        this.interactPoints.push({
          name: o.name,
          rect,
          kind: props.kind as "text" | "activity",
          text: String(props.text ?? ""),
          label: String(props.label ?? "Xem"),
          cost: Number(props.cost ?? 0),
        });
      }
    }

    // nhân vật: gốc ở chân, thân va chạm nhỏ ở chân
    this.player = this.physics.add.sprite(spawn.x * TILE + TILE / 2, spawn.y * TILE + TILE - 1, "sprites", "player_down_0");
    this.player.setOrigin(0.5, 1);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(BODY_W, BODY_H);
    body.setOffset((SPRITE_W - BODY_W) / 2, SPRITE_H - BODY_H);
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.player.setCollideWorldBounds(true);
    this.transitioning = false;
    this.blockedExit = undefined;
    this.physics.add.collider(this.player, collision);
    this.facing = "down";

    // camera: bám nhân vật; khu nhỏ hơn màn hình thì căn giữa
    const cam = this.cameras.main;
    const bx = mapW < GAME_WIDTH ? -(GAME_WIDTH - mapW) / 2 : 0;
    const by = mapH < GAME_HEIGHT ? -(GAME_HEIGHT - mapH) / 2 : 0;
    cam.setBounds(bx, by, Math.max(mapW, GAME_WIDTH), Math.max(mapH, GAME_HEIGHT));
    cam.startFollow(this.player, true);
    cam.roundPixels = true;

    // giao diện
    this.dialog = new Dialog(this);
    this.prompt = this.add
      .text(8, GAME_HEIGHT - 16, "", { fontFamily: FONT_FAMILY, fontSize: "12px", color: "#ffffff", backgroundColor: "#10182bcc", padding: { x: 3, y: 1 } })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(19999)
      .setVisible(false);

    // vào cảnh: mờ dần vào + hiện tên khu vực
    cam.fadeIn(FADE_MS, 0, 0, 0);
    this.showAreaName(area.name);

    // đầu vào
    actions.reset();
    this.detachKeyboard = attachKeyboard(actions);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.detachKeyboard?.());
  }

  /** Đi qua một lối ra: khu vực khóa thì báo "Bị khóa", ngược lại chuyển cảnh. */
  private useExit(zone: ExitZone): void {
    const { state, content } = this.session;
    const from = content.areas.get(state.areaId)!;
    const exit = from.exits.find((e) => e.id === zone.id);
    if (!exit) return;
    if (state.areaLocks[exit.toArea]) {
      this.blockedExit = zone.id;
      const back: Record<Direction, [number, number]> = { up: [0, 10], down: [0, -10], left: [10, 0], right: [-10, 0] };
      const [dx, dy] = back[this.facing];
      this.player.setPosition(this.player.x + dx, this.player.y + dy);
      this.dialog.show(["Bị khóa."]);
      return;
    }
    this.transitioning = true;
    const cam = this.cameras.main;
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart({ areaId: exit.toArea, spawn: exit.toSpawn } satisfies AreaSceneData));
    cam.fadeOut(FADE_MS, 0, 0, 0);
  }

  /** Hiện tên khu vực ở giữa phía trên vài giây rồi mờ đi. */
  private showAreaName(name: string): void {
    const label = this.add
      .text(GAME_WIDTH / 2, 10, name, { fontFamily: FONT_FAMILY, fontSize: "16px", color: "#ffffff", backgroundColor: "#10182bcc", padding: { x: 6, y: 2 } })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(19998)
      .setAlpha(0);
    this.tweens.chain({
      targets: label,
      tweens: [
        { alpha: 1, duration: 300 },
        { alpha: 1, duration: 2000 },
        { alpha: 0, duration: 500 },
      ],
      onComplete: () => label.destroy(),
    });
  }

  private playerRect(): Phaser.Geom.Rectangle {
    const b = this.player.body as Phaser.Physics.Arcade.Body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  private nearestInteract(): InteractPoint | undefined {
    const pr = this.playerRect();
    let best: InteractPoint | undefined;
    let bestD = Infinity;
    for (const p of this.interactPoints) {
      if (!Phaser.Geom.Intersects.RectangleToRectangle(pr, p.rect)) continue;
      const d = Phaser.Math.Distance.Between(pr.centerX, pr.centerY, p.rect.centerX, p.rect.centerY);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }

  update(): void {
    const { actions } = this.session;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.player.setDepth(this.player.y);

    if (this.dialog.isOpen) {
      body.setVelocity(0, 0);
      this.player.anims.stop();
      this.player.setFrame(`player_${this.facing}_0`);
      this.prompt.setVisible(false);
      if (actions.consumePressed("interact")) this.dialog.advance();
      return;
    }

    if (this.transitioning) {
      body.setVelocity(0, 0);
      return;
    }

    // di chuyển 4 hướng
    const dir = actions.getMoveDirection();
    body.setVelocity(0, 0);
    if (dir) {
      this.facing = dir;
      body.setVelocityX(dir === "left" ? -SPEED : dir === "right" ? SPEED : 0);
      body.setVelocityY(dir === "up" ? -SPEED : dir === "down" ? SPEED : 0);
      this.player.anims.play(`walk-${dir}`, true);
    } else {
      this.player.anims.stop();
      this.player.setFrame(`player_${this.facing}_0`);
    }

    this.session.state.position = { x: Math.round(this.player.x), y: Math.round(this.player.y) };

    // lối ra
    const pr = this.playerRect();
    const zone = this.exits.find((z) => Phaser.Geom.Intersects.RectangleToRectangle(pr, z.rect));
    if (!zone) {
      this.blockedExit = undefined;
    } else if (zone.id !== this.blockedExit) {
      this.useExit(zone);
      if (this.transitioning) return;
    }

    // tương tác
    const near = this.nearestInteract();
    if (near) {
      const key = this.sys.game.device.input.touch ? "" : "[E] ";
      this.prompt.setText(key + near.label).setVisible(true);
    } else {
      this.prompt.setVisible(false);
    }
    if (actions.consumePressed("interact") && near) {
      const pages = near.text.split("\n");
      this.dialog.show(pages, near.kind === "activity" ? () => this.game.events.emit(ACTIVITY_EVENT, { name: near.name, label: near.label, cost: near.cost }) : undefined);
    }
  }
}
