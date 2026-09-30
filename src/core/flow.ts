// Tiêu hao khoảng thời gian khi làm hoạt động (logic thuần, không phụ thuộc Phaser).
import type { GameTime } from "./time";

export interface AdvanceResult {
  /** Số ngày vừa kết thúc (nếu đã qua khoảng cuối của ngày), ngược lại null. */
  dayEnded: number | null;
  /** true nếu đã hết ngày cuối cùng (hết thời gian). */
  timeEnded: boolean;
}

/**
 * Qua `n` khoảng. Dừng ngay khi gặp hết ngày hoặc hết thời gian để giao diện kịp
 * hiện màn hình tổng kết; phần dư (nếu có) bị bỏ, vì mọi hoạt động MVP chỉ tốn 1 khoảng.
 */
export function advancePeriods(time: GameTime, n: number): AdvanceResult {
  for (let i = 0; i < n; i++) {
    const day = time.day;
    const wasLast = time.isLastPeriodOfDay;
    time.advancePeriod();
    if (time.ended) return { dayEnded: null, timeEnded: true };
    if (wasLast) return { dayEnded: day, timeEnded: false };
  }
  return { dayEnded: null, timeEnded: false };
}
