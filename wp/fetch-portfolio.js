// Fetch all portfolio items from WordPress REST API
// https://mellsnap.co.uk/wp-json/wp/v2/portfolio

export async function fetchPortfolio() {
  const baseUrl = 'https://mellsnap.co.uk/wp-json/wp/v2/portfolio';
  const allPosts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${baseUrl}?page=${page}&per_page=100`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 400) {
        // No more pages
        hasMore = false;
        break;
      }
      throw new Error(`Failed to fetch portfolio: ${response.status}`);
    }

    const posts = await response.json();

    if (posts.length === 0) {
      hasMore = false;
    } else {
      allPosts.push(...posts);
      page++;
    }
  }

  return allPosts;
}

// Extract all image URLs from content
export function extractImageUrls(content) {
  const imageRegex = /https:\/\/mellsnap\.co\.uk\/wp-content\/uploads\/[^\s"'<>]+?\.(webp|jpg|jpeg|png|gif)/gi;
  const matches = content.match(imageRegex) || [];
  return [...new Set(matches)]; // Remove duplicates
}
