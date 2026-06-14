// tests/e2e/gallery.test.js
const puppeteer = require('puppeteer');
const path = require('path');

/** Helper to wait for selector while scrolling if needed */
async function waitForSelector(page, selector) {
  await page.waitForSelector(selector, { visible: true, timeout: 15000 });
}

describe('Product Gallery End‑to‑End Verification', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    page = await browser.newPage();
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
  }, 30000);

  afterAll(async () => {
    await browser.close();
  });

  const productNames = [
    'Pastel Tulips', // single‑image
    'Sunny Sunflower', // multi‑image (has 2 images in seed)
    'Rose Bouquet', // local fallback image
    'Cozy Plushies' // Cloudinary image
  ];

  test.each(productNames)('Verify gallery for %s', async (name) => {
    // Locate product card
    const cardSelector = `div.product-card-container[data-product-name="${name}"]`;
    await waitForSelector(page, cardSelector);
    const card = await page.$(cardSelector);
    await card.click(); // opens Quick View

    // Quick View image should be visible
    await waitForSelector(page, '#qv-img');
    const qvImgSrc = await page.$eval('#qv-img', el => el.src);
    expect(qvImgSrc).toBeTruthy();

    // Click main image to open fullscreen gallery
    await page.click('#qv-img');
    await waitForSelector(page, '#gallery-main-img');

    // Verify navigation arrows work
    const nextBtn = await page.$('#gallery-next');
    const prevBtn = await page.$('#gallery-prev');
    await nextBtn.click();
    await page.waitForTimeout(500);
    await prevBtn.click();
    await page.waitForTimeout(500);

    // Keyboard navigation
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    // Mobile swipe simulation (touch events)
    const mainImg = await page.$('#gallery-main-img');
    const bounding = await mainImg.boundingBox();
    await page.touchscreen.tap(bounding.x + bounding.width / 2, bounding.y + bounding.height / 2);
    // Swipe left → right
    await page.touchscreen.swipe(bounding.x + bounding.width - 10, bounding.y + bounding.height / 2,
      bounding.x + 10, bounding.y + bounding.height / 2, 200);

    // Close gallery with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }, 20000);
});
