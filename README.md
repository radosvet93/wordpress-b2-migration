# WordPress Media Migration to Backblaze + Cloudflare CDN

This document describes the approach used to migrate WordPress media assets to Backblaze B2 and serve them via Cloudflare CDN for use in an Astro site.

The goal was to:
- Decouple media assets from the Astro build
- Avoid serving images from Cloudflare Workers
- Ensure fast, globally cached, immutable assets
- Support a large number of images without impacting build or runtime performance

---

## Architecture Overview

- **Source CMS**: WordPress (REST API)
- **Static Site**: Astro
- **Image Storage**: Backblaze B2 (public bucket)
- **CDN**: Cloudflare

Images are stored externally and referenced by absolute URLs in Markdown/HTML.

---

## URL Strategy

Public image URLs follow this structure:

https://images.<domain>/file/<bucket-name>/blog/{year}/{post-slug}/{filename}

Internal Backblaze storage structure mirrors this exactly.

Images are treated as **immutable**:
- Files are never overwritten
- Changes result in new filenames and URLs
- Long-term caching is safe and intentional

---

## Usage

- `pnpm i`
- `pnpm run download-images` - it will download all images in the tmp local folder and it will preserve the file structure
- `pnpm run upload-images` - NOTE: make sure to create the bucket and API key in backblaze (see below the steps)

## Step-by-Step Implementation

### 1. Export posts from WordPress

- Posts and media were fetched using the WordPress REST API:
  - `/wp-json/wp/v2/posts`
  - `/wp-json/wp/v2/media`
- A mapping of `postId → { slug, year }` was created to determine image paths.

---

### 2. Download original images locally

- Only original images (`source_url`) were downloaded (no thumbnails).
- Images were stored locally using the final public path structure:

`tmp/wp-images/blog/{year}/{post-slug}/{filename}`

This ensured deterministic, repeatable uploads.

---

### 3. Upload images to Backblaze B2

**Creating the backblaze bucket from the UI**
1. Create a public bucket
2. Create an application key
   1. Allow access to the new bucket just created
   2. Read and Write access 
   3. Add the B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, B2_S3_ENDPOINT to the .env (check .env.example file)

- Images were uploaded to a **public Backblaze B2 bucket** using the S3-compatible API.
- Directory structure was preserved exactly.
- Each file was uploaded with explicit headers:

```
Content-Type: image/*
Cache-Control: public, max-age=31536000, immutable
```

This guarantees correct browser and CDN caching behaviour.

### 4. Verify origin headers

curl -I https://f004.backblazeb2.com/file/your-bucket/blog/2026/my-post/hero.jpg

`Cache-Control: public, max-age=31536000, immutable`

### 5. Configure Cloudflare CDN

- Create a dedicated subdomain:

something like: `images.<domain>`

- DNS: CNAME → Backblaze endpoint
- Cloudflare proxy enabled (orange cloud)

If incoming requests match Custom filter expression
- (http.host eq "images.<domain>")
- Then eligible for cache
- Edge TTL - Use cache-control header if present, bypass cache if not
- Browser TTL - Respect origin TTL

### 6. Validate CDN behaviour

curl -I https://images.<domain>/file/<bucket-name>/blog/2026/my-blog/hero.jpg

Final verification confirmed:
- cf-cache-status: HIT
- Server: cloudflare
- Age: 1831

This confirms that:

- Images are served directly from Cloudflare's edge
- Backblaze egress is minimised


### 7. Use images in Astro

- Images are referenced via absolute URLs in Markdown or HTML.
- Images are not imported into Astro.
- No build-time image processing is performed.

Example:

```
<img
  src="https://images.<domain>/file/<bucket-name>blog/2024/post-slug/image.jpg"
  width="1200"
  height="800"
  loading="lazy"
  alt="Description"
/>
```

This keeps builds fast and the repository lightweight.

## Key Decisions and Constraints

- Images are external, immutable, and CDN-cached
- Cloudflare Workers are never used to serve or process images
- Cache invalidation is avoided by design
- Storage can be swapped in the future without content changes

## Result

- Fast Astro builds
- Unlimited image scaling
- Minimal operational overhead
- Predictable caching and costs
- Clean, first-party image URLs
- This setup is intentionally boring, stable, and production-ready.

## How to clear cache if needed

- Log in to Cloudflare → your site → Caching → Purge Cache
- Purge by URL (best for a single image): `https://images.<domain>/file/<bucket-name>/blog/2024/post-slug/image.jpg`
- Or Purge Everything if multiple images were removed/changed (use carefully; this invalidates all edge caches)
