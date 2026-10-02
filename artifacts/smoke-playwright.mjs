import { chromium } from 'playwright';

const url = 'https://life-rpg-opal-nine.vercel.app/';
const screenshotPath = '/workspace/artifacts/life-rpg-smoke.png';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = { url, steps: [] };

try {
  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  results.httpStatus = resp?.status() ?? null;
  results.title = await page.title();
  results.steps.push(`loaded title=${results.title}`);

  await page.waitForSelector('#root', { timeout: 30000 });
  await page.waitForTimeout(3000);

  const bodyText = (await page.locator('body').innerText()).slice(0, 2000);
  results.bodyPreview = bodyText.replace(/\s+/g, ' ').trim().slice(0, 400);
  results.steps.push('root rendered');

  const questTab = page.getByText('Quests', { exact: true }).first();
  if (await questTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await questTab.click();
    await page.waitForTimeout(1500);
    results.steps.push('clicked Quests tab');
  }

  await page.screenshot({ path: screenshotPath, fullPage: false });
  results.screenshot = screenshotPath;
} catch (err) {
  results.error = String(err);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  results.screenshot = screenshotPath;
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
