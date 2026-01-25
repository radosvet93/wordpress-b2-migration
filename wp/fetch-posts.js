import { fetchAllPages } from "../utils/fetch-all-pages.js";

import 'dotenv/config'

const WP_BASE = process.env.WP_BASE_URL;

export async function fetchPosts() {
  const posts = await fetchAllPages(
    `${WP_BASE}/wp-json/wp/v2/posts?per_page=100`
  );

  return posts.map((post) => ({
    id: post.id,
    slug: post.slug,
    year: new Date(post.date).getFullYear(),
  }));
}
