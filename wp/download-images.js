import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir } from "../utils/ensure-dir.js";

export async function downloadImages({ posts, media }) {
  const postMap = new Map(
    posts.map((post) => [post.id, post])
  );

  for (const item of media) {
    const post = postMap.get(item.post);
    if (!post) continue; // unattached media

    const imageUrl = item.source_url;
    const filename = path.basename(imageUrl);

    const outputDir = path.join(
      "tmp/wp-images",
      "blog",
      String(post.year),
      post.slug
    );
    await ensureDir(outputDir);

    const outputPath = path.join(outputDir, filename);

    console.log(`Downloading ${imageUrl}`);
    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.warn(`Failed: ${imageUrl}`);
      continue;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  }
}
