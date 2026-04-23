export default {
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'off',
    headless: true,
  },
  webServer: {
    command: 'node scripts/serve-for-test.cjs',
    port: 4173,
    reuseExistingServer: true,
    timeout: 10000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
};
