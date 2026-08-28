import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
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

function baseState(branchLevels, mutationIds = []) {
  const total = Object.values(branchLevels).reduce((sum, level) => sum + level, 0);
  const thresholds = [0, 10, 25, 50, 90, 150, 240, 360, 420];
  const discoveredGrowthStages = thresholds
    .map((threshold, id) => ({ threshold, id }))
    .filter(({ threshold }) => total >= threshold)
    .map(({ id }) => id);
  return {
    schemaVersion: 1,
    balanceVersion: 'visual-qa',
    feathers: 1e20,
    branchLevels,
    mutationIds,
    comboCharge: 0,
    lastTapAt: 0,
    saveRevision: 11,
    lastSavedAt: Date.now(),
    discoveredGrowthStages,
    appliedRewardIds: [],
    events: {
      breadRushBestScore: 17,
      breadRushRuns: 2,
      breadRushCooldownSeconds: 0,
      pigeonDropBestScore: 12,
      pigeonDropRuns: 1,
      pigeonDropCooldownSeconds: 0,
      sharedCooldownSeconds: 0,
      lastEventId: null,
    },
  };
}

function withEventOverrides(state, overrides) {
  return { ...state, events: { ...state.events, ...overrides } };
}

function mutationSeed() {
  return baseState({ beak: 30, body: 30, nest: 25, wings: 25, swag: 20, brain: 20 });
}

const growthFixtures = [
  { stageId: 4, levels: { beak: 20, body: 20, nest: 15, wings: 15, swag: 10, brain: 10 } },
  { stageId: 5, levels: { beak: 30, body: 30, nest: 25, wings: 25, swag: 20, brain: 20 } },
  { stageId: 6, levels: { beak: 40, body: 40, nest: 40, wings: 40, swag: 40, brain: 40 } },
  { stageId: 7, levels: { beak: 60, body: 60, nest: 60, wings: 60, swag: 60, brain: 60 } },
  { stageId: 8, levels: { beak: 70, body: 70, nest: 70, wings: 70, swag: 70, brain: 70 } },
];

const desktop = await openPage({ width: 1440, height: 900 }, 'desktop');
await desktop.screenshot({ path: `${outputDir}/desktop-main.png`, fullPage: true });
await desktop.close();

const mobile = await openPage({ width: 390, height: 844 }, 'mobile');
await mobile.screenshot({ path: `${outputDir}/mobile-main.png`, fullPage: true });
await mobile.close();

const growthCanvasHashes = {};
for (const fixture of growthFixtures) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript((seed) => {
    localStorage.setItem('pigeon-maxxing:save:v1', JSON.stringify(seed));
  }, baseState(fixture.levels, ['business']));
  const page = await context.newPage();
  attachIssueListeners(page, `growth-${fixture.stageId}`);
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#game-canvas canvas', { state: 'visible' });
  await page.waitForTimeout(280);
  const canvasBuffer = await page.locator('#game-canvas canvas').screenshot();
  growthCanvasHashes[fixture.stageId] = createHash('sha256').update(canvasBuffer).digest('hex');
  await page.screenshot({ path: `${outputDir}/desktop-growth-stage-${fixture.stageId}.png`, fullPage: true });
  await page.close();
  await context.close();
}

if (new Set(Object.values(growthCanvasHashes)).size !== growthFixtures.length) {
  issues.push(`growth: major Growth stage canvas renders are not all distinct (${JSON.stringify(growthCanvasHashes)})`);
}

const growthMobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
await growthMobileContext.addInitScript((seed) => {
  localStorage.setItem('pigeon-maxxing:save:v1', JSON.stringify(seed));
}, baseState(growthFixtures[2].levels, ['business']));
const growthMobilePage = await growthMobileContext.newPage();
attachIssueListeners(growthMobilePage, 'growth-mobile-stage-6');
await growthMobilePage.goto(baseURL, { waitUntil: 'networkidle' });
await growthMobilePage.waitForSelector('#game-canvas canvas', { state: 'visible' });
await growthMobilePage.waitForTimeout(280);
await growthMobilePage.screenshot({ path: `${outputDir}/mobile-growth-stage-6.png`, fullPage: true });
await growthMobilePage.close();
await growthMobileContext.close();

// Bread Rush regression: force Pigeon Drop onto cooldown so this path is deterministic.
const breadEventContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await breadEventContext.addInitScript((seed) => {
  localStorage.setItem('pigeon-maxxing:save:v1', JSON.stringify(seed));
}, withEventOverrides(baseState(growthFixtures[2].levels, ['business']), {
  pigeonDropCooldownSeconds: 999,
  lastEventId: 'pigeon-drop',
}));
const breadEventPage = await breadEventContext.newPage();
attachIssueListeners(breadEventPage, 'bread-event');
await breadEventPage.goto(baseURL, { waitUntil: 'networkidle' });
await breadEventPage.waitForSelector('#game-canvas canvas', { state: 'visible' });
await breadEventPage.waitForSelector('.bread-rush-offer:not([hidden])', { timeout: 8000 });
await breadEventPage.screenshot({ path: `${outputDir}/desktop-event-ready.png`, fullPage: true });
await breadEventPage.click('.bread-rush-offer');
await breadEventPage.waitForSelector('.bread-rush-hud:not([hidden])');
await breadEventPage.waitForTimeout(3600);

const breadTimeText = await breadEventPage.locator('.bread-rush-time strong').textContent();
const breadTimeRemaining = Number(breadTimeText);
const breadCountdownVisible = await breadEventPage.locator('.bread-rush-countdown').evaluate((element) => element.classList.contains('visible'));
if (!Number.isFinite(breadTimeRemaining) || breadTimeRemaining >= 29.8 || breadCountdownVisible) {
  issues.push(`bread-event: Bread Rush clock did not advance correctly (time=${breadTimeText}, countdownVisible=${breadCountdownVisible})`);
}

await breadEventPage.screenshot({ path: `${outputDir}/desktop-bread-rush.png`, fullPage: true });
await breadEventPage.close();
await breadEventContext.close();

// Pigeon Drop desktop: force Bread Rush onto cooldown and exercise a live drop plus result persistence.
const pigeonDropContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const pigeonDropSeed = withEventOverrides(baseState(growthFixtures[2].levels, ['business']), {
  breadRushCooldownSeconds: 999,
  lastEventId: 'bread-rush',
});
await pigeonDropContext.addInitScript((seed) => {
  localStorage.setItem('pigeon-maxxing:save:v1', JSON.stringify(seed));
}, pigeonDropSeed);
const pigeonDropPage = await pigeonDropContext.newPage();
attachIssueListeners(pigeonDropPage, 'pigeon-drop-desktop');
await pigeonDropPage.goto(baseURL, { waitUntil: 'networkidle' });
await pigeonDropPage.waitForSelector('#game-canvas canvas', { state: 'visible' });
await pigeonDropPage.waitForSelector('.pigeon-drop-offer:not([hidden])', { timeout: 8000 });
await pigeonDropPage.screenshot({ path: `${outputDir}/desktop-pigeon-drop-ready.png`, fullPage: true });
await pigeonDropPage.click('.pigeon-drop-offer');
await pigeonDropPage.waitForSelector('.pigeon-drop-hud:not([hidden])');
await pigeonDropPage.waitForSelector('.pigeon-drop-action:not([disabled])', { timeout: 6000 });

const pigeonDropTimeText = await pigeonDropPage.locator('.pigeon-drop-time strong').textContent();
const pigeonDropTimeRemaining = Number(pigeonDropTimeText);
if (!Number.isFinite(pigeonDropTimeRemaining) || pigeonDropTimeRemaining >= 29.9) {
  issues.push(`pigeon-drop-desktop: event clock did not enter active time (time=${pigeonDropTimeText})`);
}

await pigeonDropPage.click('.pigeon-drop-action');
await pigeonDropPage.waitForTimeout(540);
const pigeonDropAttempts = Number(await pigeonDropPage.locator('.pigeon-drop-attempts strong').textContent());
if (!Number.isFinite(pigeonDropAttempts) || pigeonDropAttempts < 1) {
  issues.push(`pigeon-drop-desktop: a live drop did not resolve an attempt (${pigeonDropAttempts})`);
}
await pigeonDropPage.screenshot({ path: `${outputDir}/desktop-pigeon-drop-active.png`, fullPage: true });

await pigeonDropPage.waitForSelector('.pigeon-drop-result-shell:not([hidden])', { timeout: 35000 });
const persistedPigeonDropState = await pigeonDropPage.evaluate(() => {
  const raw = localStorage.getItem('pigeon-maxxing:save:v1');
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return {
    events: parsed.events,
    appliedRewardIds: parsed.appliedRewardIds,
  };
});
if (
  !persistedPigeonDropState
  || persistedPigeonDropState.events?.pigeonDropRuns !== pigeonDropSeed.events.pigeonDropRuns + 1
  || persistedPigeonDropState.events?.lastEventId !== 'pigeon-drop'
  || !(persistedPigeonDropState.events?.sharedCooldownSeconds > 0)
  || !Array.isArray(persistedPigeonDropState.appliedRewardIds)
  || !persistedPigeonDropState.appliedRewardIds.some((id) => typeof id === 'string' && id.startsWith('event:pigeon-drop:') && id.endsWith(':base'))
) {
  issues.push(`pigeon-drop-desktop: result did not persist exactly once (${JSON.stringify(persistedPigeonDropState)})`);
}
await pigeonDropPage.screenshot({ path: `${outputDir}/desktop-pigeon-drop-result.png`, fullPage: true });
await pigeonDropPage.close();
await pigeonDropContext.close();

// Compact portrait Pigeon Drop layout.
const pigeonDropMobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
await pigeonDropMobileContext.addInitScript((seed) => {
  localStorage.setItem('pigeon-maxxing:save:v1', JSON.stringify(seed));
}, withEventOverrides(baseState(growthFixtures[2].levels, ['business']), {
  breadRushCooldownSeconds: 999,
  lastEventId: 'bread-rush',
}));
const pigeonDropMobilePage = await pigeonDropMobileContext.newPage();
attachIssueListeners(pigeonDropMobilePage, 'pigeon-drop-mobile');
await pigeonDropMobilePage.goto(baseURL, { waitUntil: 'networkidle' });
await pigeonDropMobilePage.waitForSelector('.pigeon-drop-offer:not([hidden])', { timeout: 8000 });
await pigeonDropMobilePage.click('.pigeon-drop-offer');
await pigeonDropMobilePage.waitForSelector('.pigeon-drop-action:not([disabled])', { timeout: 6000 });
await pigeonDropMobilePage.screenshot({ path: `${outputDir}/mobile-pigeon-drop-active.png`, fullPage: true });
await pigeonDropMobilePage.close();
await pigeonDropMobileContext.close();

const mutationContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await mutationContext.addInitScript((seed) => {
  localStorage.setItem('pigeon-maxxing:save:v1', JSON.stringify(seed));
}, mutationSeed());
const mutationPage = await mutationContext.newPage();
attachIssueListeners(mutationPage, 'mutation-desktop');
await mutationPage.goto(baseURL, { waitUntil: 'networkidle' });
await mutationPage.waitForSelector('#game-canvas canvas', { state: 'visible' });
await mutationPage.waitForSelector('.mutation-host:not([hidden])', { timeout: 8000 });

const mutationCardCount = await mutationPage.locator('.mutation-card').count();
if (mutationCardCount !== 3) {
  issues.push(`mutation-desktop: expected 3 mutation cards, found ${mutationCardCount}`);
}
await mutationPage.screenshot({ path: `${outputDir}/desktop-mutation-choice.png`, fullPage: true });
await mutationPage.click('.mutation-select[data-mutation="business"]');
await mutationPage.waitForSelector('.mutation-host', { state: 'hidden', timeout: 5000 });

const savedMutationIds = await mutationPage.evaluate(() => {
  const raw = localStorage.getItem('pigeon-maxxing:save:v1');
  return raw ? JSON.parse(raw).mutationIds : null;
});
if (!Array.isArray(savedMutationIds) || savedMutationIds[0] !== 'business') {
  issues.push(`mutation-desktop: Business mutation did not persist (${JSON.stringify(savedMutationIds)})`);
}
await mutationPage.screenshot({ path: `${outputDir}/desktop-business-mutation.png`, fullPage: true });
await mutationPage.close();
await mutationContext.close();

const mutationMobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
await mutationMobileContext.addInitScript((seed) => {
  localStorage.setItem('pigeon-maxxing:save:v1', JSON.stringify(seed));
}, mutationSeed());
const mutationMobilePage = await mutationMobileContext.newPage();
attachIssueListeners(mutationMobilePage, 'mutation-mobile');
await mutationMobilePage.goto(baseURL, { waitUntil: 'networkidle' });
await mutationMobilePage.waitForSelector('.mutation-host:not([hidden])', { timeout: 8000 });
await mutationMobilePage.screenshot({ path: `${outputDir}/mobile-mutation-choice.png`, fullPage: true });
await mutationMobilePage.close();
await mutationMobileContext.close();

const screenshots = [
  'desktop-main.png',
  'mobile-main.png',
  'desktop-growth-stage-4.png',
  'desktop-growth-stage-5.png',
  'desktop-growth-stage-6.png',
  'desktop-growth-stage-7.png',
  'desktop-growth-stage-8.png',
  'mobile-growth-stage-6.png',
  'desktop-event-ready.png',
  'desktop-bread-rush.png',
  'desktop-pigeon-drop-ready.png',
  'desktop-pigeon-drop-active.png',
  'desktop-pigeon-drop-result.png',
  'mobile-pigeon-drop-active.png',
  'desktop-mutation-choice.png',
  'desktop-business-mutation.png',
  'mobile-mutation-choice.png',
];
const summary = {
  url: baseURL,
  issues,
  breadRushTimeRemaining: Number.isFinite(breadTimeRemaining) ? breadTimeRemaining : null,
  pigeonDropTimeRemaining: Number.isFinite(pigeonDropTimeRemaining) ? pigeonDropTimeRemaining : null,
  pigeonDropAttempts,
  persistedPigeonDropState,
  mutationCardCount,
  savedMutationIds,
  growthCanvasHashes,
  screenshots,
};
writeFileSync(`${outputDir}/report.json`, JSON.stringify(summary, null, 2));
await browser.close();

if (issues.length > 0) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
}
