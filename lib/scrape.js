// pages/api/search.js
import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    let allProducts = [];
    let currentPage = 1;
    let nextPageUrl = 'https://minutes.noon.com/uae-en/search/?f[category]=fruits_vegetables';

    const seenProductIds = new Set();

    while (nextPageUrl) {
      console.log(`Loading page ${currentPage}: ${nextPageUrl}`);
      await page.goto(nextPageUrl, { waitUntil: 'networkidle2' });

      const products = await page.evaluate(() => {
        const items = [];
        const cards = document.querySelectorAll("div.catalogList_instantCatalogList__gUTOP a");

        cards.forEach((card) => {
          const href = card.getAttribute('href') || '';
          const match = href.match(/\/now-product\/([^/]+)\//);
          if (!match) return;

          const product_id = match[1];
          const img = card.querySelector('img');
          const image_url = img?.src?.includes('f.nooncdn.com') ? img.src : '';

          const textParts = Array.from(card.querySelectorAll('*')).map(el => el.textContent.trim()).filter(Boolean);

          const filtered = textParts.filter(item => {
            const upper = item.toUpperCase();
            return !["ADD", "OFF", "ON", "SALE", "NEW", "HOT"].includes(upper) &&
              !/%/.test(item) &&
              !/^AED/.test(item) &&
              !/^\d{1,2}$/.test(item) &&
              !/^[A-Za-z]{1,2}$/.test(item);
          });

          let price = '', original_price = '';
          const prices = filtered.filter(d => /AED|\d+[.,]?\d*/.test(d)).map(d => d.replace('AED', '').trim());
          if (prices.length === 1) price = prices[0];
          if (prices.length >= 2) { price = prices[0]; original_price = prices[1]; }

          if (filtered.length < 3) return;

          items.push({
            product_id,
            origin: filtered[0],
            name: filtered[1],
            size: filtered[2],
            price,
            original_price,
            image_url,
          });
        });

        return items;
      });

      for (const p of products) {
        if (!seenProductIds.has(p.product_id)) {
          seenProductIds.add(p.product_id);
          p.page = currentPage;
          allProducts.push(p);
        }
      }

      const hasNext = await page.$("a[role='button'][aria-label='Next page'][rel='next'][aria-disabled='false']");
      if (hasNext) {
        nextPageUrl = await page.evaluate(() => {
          const next = document.querySelector("a[role='button'][aria-label='Next page'][rel='next']");
          return next?.href || '';
        });
        currentPage++;
        await new Promise(r => setTimeout(r, 2000));
      } else {
        nextPageUrl = null;
      }
    }

    await browser.close();
    return res.status(200).json(allProducts);

  } catch (err) {
    console.error("Scraper Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
