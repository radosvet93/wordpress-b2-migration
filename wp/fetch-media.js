import { fetchAllPages } from "../utils/fetch-all-pages.js";

import 'dotenv/config'

const WP_BASE = process.env.WP_BASE_URL;

export async function fetchMedia() {
  return fetchAllPages(
    `${WP_BASE}/wp-json/wp/v2/media?per_page=100`
  );
}
