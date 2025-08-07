// pages/api/product-details/[product_id].js
import { scrapeProductDetails } from '../../../lib/scrape';


export default async function handler(req, res) {
  const { product_id } = req.query;
  const { image_url } = req.query;

  try {
    const details = await scrapeProductDetails(product_id, image_url);
    return res.status(200).json(details);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
