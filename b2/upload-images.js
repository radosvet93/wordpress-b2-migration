import fs from "node:fs/promises";
import path from "node:path";
import mime from "mime-types";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import 'dotenv/config'

const LOCAL_ROOT = "portfolio";
const BUCKET = process.env.B2_BUCKET_NAME;

if (!BUCKET) {
  throw new Error("Missing B2_BUCKET_NAME");
}

const s3 = new S3Client({
  region: "us-west-004", // required but ignored by B2
  endpoint: process.env.B2_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function uploadFile(filePath) {
  const key = "portfolio/" + path
    .relative(LOCAL_ROOT, filePath)
    .replace(/\\/g, "/"); // Windows safety

  const contentType = mime.lookup(filePath);
  if (!contentType || !contentType.startsWith("image/")) {
    console.log(`Skipping non-image: ${key}`);
    return;
  }

  const body = await fs.readFile(filePath);

  console.log(`Uploading ${key}`);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

async function run() {
  console.log("Scanning local images...");
  const files = await walk(LOCAL_ROOT);

  for (const file of files) {
    await uploadFile(file);
  }

  console.log("Upload complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
