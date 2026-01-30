import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir } from "../utils/ensure-dir.js";
import { fetchPortfolio, extractImageUrls } from "./fetch-portfolio.js";

export async function downloadPortfolioImages() {
  console.log("Fetching portfolio items...");
  const posts = await fetchPortfolio();
  console.log(`Found ${posts.length} portfolio items`);

  for (const post of posts) {
    const slug = post.slug;
    const content = post.content?.rendered || "";
    const imageUrls = extractImageUrls(content);

    if (imageUrls.length === 0) {
      console.log(`No images found for ${slug}`);
      continue;
    }

    console.log(`Downloading ${imageUrls.length} images for ${slug}...`);

    const outputDir = path.join("portfolio", slug);
    await ensureDir(outputDir);

    for (const imageUrl of imageUrls) {
      const filename = path.basename(imageUrl);

      // Skip resized versions (e.g., 008-Web-200x300.jpg)
      if (/-\d+x\d+\.(webp|jpg|jpeg|png|gif)$/i.test(filename)) {
        continue;
      }

      const outputPath = path.join(outputDir, filename);

      try {
        // Check if file already exists
        await fs.access(outputPath);
        console.log(`  Skipping ${filename} (already exists)`);
        continue;
      } catch {
        // File doesn't exist, download it
      }

      const res = await fetch(imageUrl);
      if (!res.ok) {
        console.error(`  Failed to download ${filename}: ${res.status}`);
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(outputPath, buffer);
      console.log(`  Downloaded ${filename}`);
    }
  }

  console.log("Done!");
}
