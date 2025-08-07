// pages/api/search.js
import { scrapeNoonProducts } from '../../lib/scrape';

export default async function handler(req, res) {
    try {
      const products = await scrapeNoonProducts();
      console.log("Scraped products:", products); // ✅ Add this
      res.status(200).json(products);
    } catch (error) {
      console.error("API error:", error.message);
      res.status(500).json({ error: error.message });
    }
  }