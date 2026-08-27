import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const baseURL = process.env.VISUAL_QA_URL ?? 'http://127.0.0.1:4173';
const outputDir = 'artifacts/visual-qa';
mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const issues = [];

async function openPage(viewport, label) {
  const page = await browser.newPage({ viewport });
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(`${label}: console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => issues.push(`${label}: pageerror: ${error.message}`));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#game-canvas canvas', { state: 'visible' });
  return page;
}

const desktop = await openPage({ width: 1440, height: 900 }, 'desktop');
await desktop.screenshot({ path: `${outputDir}/desktop-main.png`, fullPage: true });

const mobile = await openPage({ width: 390, height: 844 }, 'mobile');
await mobile.screenshot({ path: `${outputDir}/mobile-main.png`, fullPage: true });
await mobile.close();

await desktop.evaluate(() => {
  const now = Date.now();
  const state = {
    schemaVersion: 1,
    balanceVersion: 'visual-qa',
    feathers: 250000,
    branchLevels: { beak: 25, body: 20, nest: 15, wings: 10, swag: 10, brain: 10 },
    comboCharge: 0,
    lastTapAt: 0,
    saveRevision: 7,
    lastSavedAt: now,
    discoveredGrowthStages: [0, 1, 2, 3, 4],
    appliedRewardIds: [],
    events: { breadRushBestScore: 17, breadRushRuns: 2, breadRushCooldownSeconds: 0 },
  };
  localStorage.setItem('pigeon-maxxing:save:v1', JSON.stringify(state));
});
await desktop.reload({ waitUntil: 'networkidle' });
await desktop.waitForSelector('.bread-rush-offer:not([hidden])', { timeout: 8000 });
await desktop.screenshot({ path: `${outputDir}/desktop-event-ready.png`, fullPage: true });
await desktop.click('.bread-rush-offer');
await desktop.waitForSelector('.bread-rush-hud:not([hidden])');
await desktop.waitForTimeout(3600);
await desktop.screenshot({ path: `${outputDir}/desktop-bread-rush.png`, fullPage: true });

const summary = {
  url: baseURL,
  issues,
  screenshots: ['desktop-main.png', 'mobile-main.png', 'desktop-event-ready.png', 'desktop-bread-rush.png'],
};
writeFileSync(`${outputDir}/report.json`, JSON.stringify(summary, null, 2));
await desktop.close();
await browser.close();

if (issues.length > 0) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
}
