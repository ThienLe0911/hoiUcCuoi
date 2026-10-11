// Cấu hình kiểm thử end-to-end (Playwright). Chạy: npm run e2e
// - Game chỉ nhận ?area=&day=&period= và window.__game ở chế độ DEV, nên e2e chạy trên dev server (không phải bản build).
// - Dev server do Playwright tự khởi động/tắt ở cổng riêng 5199 (--strictPort, không dùng lại server nào đang chạy
//   để không gắn nhầm vào phiên làm việc khác).
import { defineConfig } from "@playwright/test";

const PORT = 5199;

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  // Game chạy theo thời gian thực; 2 worker đủ nhanh mà không làm tụt khung hình gây test chập chờn.
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    {
      name: "desktop",
      testIgnore: "**/*cam-ung*.e2e.ts",
      use: { browserName: "chromium", viewport: { width: 960, height: 540 } },
    },
    {
      // Màn hình cảm ứng nằm ngang (game ưu tiên ngang trên điện thoại).
      name: "cam-ung",
      testMatch: "**/*cam-ung*.e2e.ts",
      use: { browserName: "chromium", viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
  ],
});
