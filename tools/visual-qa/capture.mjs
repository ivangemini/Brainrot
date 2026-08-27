import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const baseURL = process.env.VISUAL_QA_URL ?? 'http://127.0.0.1:4173';
const outputDir = 'artifacts/visual-qa';
mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const issues = [];

function attachIssueListeners(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(`${label}: console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => issues.push(`${label}: pageerror: ${error.message}`));
}

async function openPage(viewport, label) {
  const page = await browser.newPage({ viewport });
  attachIssueListeners(page, label);
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#game-canvas canvas', { state: 'visible' });
  return page;
}

const desktop = await openPage({ width: 1440, height: 900 }, 'desktop');
await desktop.screenshot({ path: `${outputDir}/desktop-main.png`, fullPage: true });
await desktop.close();

const mobile = await openPage({ width: 390, height: 844 }, 'mobile');
await mobile.screenshot({ path: `${outputDir}/mobile-main.png`, fullPage: true });
await mobile.close();

const eventContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await eventContext.addInitScript(() => {
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
const eventPage = await eventContext.newPage();
attachIssueListeners(eventPage, 'event');
await eventPage.goto(baseURL, { waitUntil: 'networkidle' });
await eventPage.waitForSelector('#game-canvas canvas', { state: 'visible' });
await eventPage.waitForSelector('.bread-rush-offer:not([hidden])', { timeout: 8000 });
await eventPage.screenshot({ path: `${outputDir}/desktop-event-ready.png`, fullPage: true });
await eventPage.click('.bread-rush-offer');
await eventPage.waitForSelector('.bread-rush-hud:not([hidden])');
await eventPage.waitForTimeout(3600);

const timeText = await eventPage.locator('.bread-rush-time strong').textContent();
const timeRemaining = Number(timeText);
const countdownVisible = await eventPage.locator('.bread-rush-countdown').evaluate((element) => element.classList.contains('visible'));
if (!Number.isFinite(timeRemaining) || timeRemaining >= 29.8 || countdownVisible) {
  issues.push(`event: Bread Rush clock did not advance correctly (time=${timeText}, countdownVisible=${countdownVisible})`);
}

await eventPage.screenshot({ path: `${outputDir}/desktop-bread-rush.png`, fullPage: true });
await eventPage.close();
await eventContext.close();

const summary = {
  url: baseURL,
  issues,
  eventTimeRemaining: Number.isFinite(timeRemaining) ? timeRemaining : null,
  screenshots: ['desktop-main.png', 'mobile-main.png', 'desktop-event-ready.png', 'desktop-bread-rush.png'],
};
writeFileSync(`${outputDir}/report.json`, JSON.stringify(summary, null, 2));
await browser.close();

if (issues.length > 0) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
}
