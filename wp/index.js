import { fetchPosts } from "./fetch-posts.js";
import { fetchMedia } from "./fetch-media.js";
import { downloadImages } from "./download-images.js";

async function run() {
  console.log("Fetching posts...");
  const posts = await fetchPosts();

  console.log("Fetching media...");
  const media = await fetchMedia();

  console.log("Downloading images...");
  await downloadImages({ posts, media });

  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
