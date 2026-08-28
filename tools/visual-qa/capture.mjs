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

async function assertHeroContract(page, label) {
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#game-canvas canvas');
    return canvas?.dataset.heroCentered && canvas?.dataset.heroSafe && canvas?.dataset.heroLayers;
  }, { timeout: 8000 });

  const result = await page.locator('#game-canvas canvas').evaluate((canvas) => ({
    centered: canvas.dataset.heroCentered,
    safe: canvas.dataset.heroSafe,
    layers: canvas.dataset.heroLayers,
  }));

  if (result.centered !== 'true') issues.push(`${label}: hero is not centered on the viewport`);
  if (result.safe !== 'true') issues.push(`${label}: hero overlaps a reserved UI zone`);
  if (result.layers !== '1') issues.push(`${label}: meme pigeon is rendered more than once`);
}

async function assertDesktopFooter(page, label, eventMode = false) {
  const footer = await page.locator('#game-ui').evaluate((root) => {
    const style = getComputedStyle(root, '::before');
    return {
      height: Number.parseFloat(style.height),
      bottom: Number.parseFloat(style.bottom),
      content: style.content,
    };
  });
  if (!Number.isFinite(footer.height) || footer.height < 70 || footer.height > 92) {
    issues.push(`${label}: desktop interaction footer is missing or has invalid height (${footer.height})`);
  }
  if (!Number.isFinite(footer.bottom) || footer.bottom < 8) {
    issues.push(`${label}: desktop interaction footer is not inside the viewport`);
  }
  if (eventMode && !footer.content.includes('BREAD RUSH')) {
    issues.push(`${label}: Bread Rush footer did not switch to event copy`);
  }

  if (!eventMode) {
    const hintBox = await page.locator('#tap-hint').boundingBox();
    if (!hintBox || hintBox.y < 800 || hintBox.y + hintBox.height > 892) {
      issues.push(`${label}: TAP THE PIGEON CTA is not contained in the desktop footer`);
    }
  }
}

async function openPage(viewport, label) {
  const page = await browser.newPage({ viewport });
  attachIssueListeners(page, label);
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#game-canvas canvas', { state: 'visible' });
  await assertHeroContract(page, label);
  return page;
}

const desktop = await openPage({ width: 1440, height: 900 }, 'desktop');
await assertDesktopFooter(desktop, 'desktop');
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
await assertHeroContract(eventPage, 'event-ready');
await eventPage.waitForSelector('.bread-rush-offer:not([hidden])', { timeout: 8000 });
await eventPage.screenshot({ path: `${outputDir}/desktop-event-ready.png`, fullPage: true });
await eventPage.click('.bread-rush-offer');
await eventPage.waitForSelector('.bread-rush-hud:not([hidden])');
await eventPage.waitForTimeout(3600);
await assertHeroContract(eventPage, 'bread-rush');
await assertDesktopFooter(eventPage, 'bread-rush', true);

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
