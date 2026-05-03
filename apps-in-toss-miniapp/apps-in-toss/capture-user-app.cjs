const { chromium } = require('playwright');
const path = require('path');

const baseUrl = 'http://127.0.0.1:8082';
const outDir = path.join(__dirname, 'captures');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 636, height: 1048 },
    deviceScaleFactor: 1,
    isMobile: true,
  });

  await page.route('https://mulmumu-backend-aqjxa3obfa-du.a.run.app/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        result: {
          jwt: 'capture-token',
          fisrtLogin: 'false',
        },
      }),
    });
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByText('로그인').first().waitFor({ timeout: 10000 });
  await page.getByPlaceholder('아이디를 입력해주세요').fill('capture');
  await page.getByPlaceholder('비밀번호를 입력해주세요').fill('capture');
  await page.getByText('로그인').nth(1).click();

  await page.getByText('내 식자재', { exact: true }).first().waitFor({ timeout: 10000 });
  await page.screenshot({ path: path.join(outDir, '01-fridge.png') });

  await page.getByRole('tab', { name: '레시피' }).click();
  await page.getByText('내 식자재로 레시피 추천받기').waitFor({ timeout: 10000 });
  await page.screenshot({ path: path.join(outDir, '02-recipe-list.png') });

  await page.getByText('내 식자재로 레시피 추천받기').click();
  await page.getByText('선택한 재료로 레시피 추천받기').waitFor({ timeout: 10000 });
  await page.screenshot({ path: path.join(outDir, '03-recipe-select.png') });

  await page.getByText('선택한 재료로 레시피 추천받기').click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '04-recipe-result.png') });

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
