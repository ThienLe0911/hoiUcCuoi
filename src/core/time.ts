// Module thời gian (logic thuần, không phụ thuộc Phaser/DOM).
// Một ngày có 4 khoảng; ngày 1 = Thứ Hai, chu kỳ 6 ngày học (Thứ Hai → Thứ Bảy).

export const PERIOD_NAMES = ["Trước giờ học", "Trong giờ học", "Giờ ra chơi", "Sau giờ học"] as const;
export const WEEKDAY_NAMES = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"] as const;
export const PERIODS_PER_DAY = PERIOD_NAMES.length;

export type TimeEventName = "period-changed" | "day-changed" | "time-ended";
export interface TimeSnapshot {
  day: number;
  period: number;
}
type Listener = (snapshot: TimeSnapshot) => void;

export class GameTime {
  private _day = 1;
  private _period = 0;
  private _ended = false;
  private listeners: Record<TimeEventName, Listener[]> = {
    "period-changed": [],
    "day-changed": [],
    "time-ended": [],
  };

  constructor(readonly totalDays: number, start?: Partial<TimeSnapshot>) {
    if (!Number.isInteger(totalDays) || totalDays < 1) {
      throw new Error(`totalDays phải là số nguyên ≥ 1 (nhận: ${totalDays})`);
    }
    if (start) this.restore({ day: start.day ?? 1, period: start.period ?? 0 });
  }

  get day(): number {
    return this._day;
  }
  get period(): number {
    return this._period;
  }
  get ended(): boolean {
    return this._ended;
  }
  get periodName(): string {
    return PERIOD_NAMES[this._period];
  }
  get weekdayName(): string {
    return WEEKDAY_NAMES[(this._day - 1) % WEEKDAY_NAMES.length];
  }
  get isLastPeriodOfDay(): boolean {
    return this._period === PERIODS_PER_DAY - 1;
  }
  snapshot(): TimeSnapshot {
    return { day: this._day, period: this._period };
  }

  /** Đặt lại từ trạng thái đã lưu (không phát sự kiện). */
  restore(s: TimeSnapshot): void {
    if (!Number.isInteger(s.day) || s.day < 1 || s.day > this.totalDays) {
      throw new Error(`day không hợp lệ: ${s.day} (1..${this.totalDays})`);
    }
    if (!Number.isInteger(s.period) || s.period < 0 || s.period >= PERIODS_PER_DAY) {
      throw new Error(`period không hợp lệ: ${s.period} (0..${PERIODS_PER_DAY - 1})`);
    }
    this._day = s.day;
    this._period = s.period;
    this._ended = false;
  }

  on(event: TimeEventName, listener: Listener): () => void {
    this.listeners[event].push(listener);
    return () => {
      this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
    };
  }

  private emit(event: TimeEventName): void {
    const snap = this.snapshot();
    for (const l of [...this.listeners[event]]) l(snap);
  }

  /** Qua một khoảng. Sau khoảng cuối của ngày N phát 'time-ended' và không tiến thêm. */
  advancePeriod(): void {
    if (this._ended) return;
    if (this._period < PERIODS_PER_DAY - 1) {
      this._period += 1;
      this.emit("period-changed");
      return;
    }
    if (this._day >= this.totalDays) {
      this._ended = true;
      this.emit("time-ended");
      return;
    }
    this._day += 1;
    this._period = 0;
    this.emit("day-changed");
    this.emit("period-changed");
  }
}
