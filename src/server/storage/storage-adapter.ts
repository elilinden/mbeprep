import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/env/server";

export type StorageFile = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  bytes: Uint8Array;
};

export type SignedUrl = {
  url: string;
  expiresAt: Date;
};

export interface PodcastStorageAdapter {
  putObject?(input: { objectKey: string; file: StorageFile }): Promise<void>;
  createSignedPlaybackUrl(input: { objectKey: string }): Promise<SignedUrl>;
  readObject?(input: { objectKey: string }): Promise<{
    bytes: Uint8Array;
    mimeType: string;
    sizeBytes: number;
  } | null>;
}

export function createPodcastStorageAdapter(): PodcastStorageAdapter {
  if (env.PODCAST_STORAGE_DRIVER === "s3") {
    return new S3CompatiblePodcastStorageAdapter();
  }

  return new LocalPodcastStorageAdapter(env.PODCAST_LOCAL_STORAGE_DIR);
}

export function verifyPodcastSignedUrl(input: {
  objectKey: string;
  expires: string;
  signature: string;
}) {
  const expiresAt = Number(input.expires);

  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = signPlaybackUrl(input.objectKey, input.expires);
  const actualBuffer = Buffer.from(input.signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.byteLength === expectedBuffer.byteLength &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

class LocalPodcastStorageAdapter implements PodcastStorageAdapter {
  constructor(private readonly storageDir: string) {}

  async putObject(input: { objectKey: string; file: StorageFile }) {
    validateAudioFile(input.file);
    const targetPath = this.resolveObjectPath(input.objectKey);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, input.file.bytes);
  }

  async createSignedPlaybackUrl(input: { objectKey: string }) {
    const expiresAtSeconds =
      Math.floor(Date.now() / 1000) + env.PODCAST_SIGNED_URL_TTL_SECONDS;
    const expires = String(expiresAtSeconds);

    return {
      url: `/api/storage/podcast?key=${encodeURIComponent(
        input.objectKey,
      )}&expires=${expires}&signature=${signPlaybackUrl(
        input.objectKey,
        expires,
      )}`,
      expiresAt: new Date(expiresAtSeconds * 1000),
    };
  }

  async readObject(input: { objectKey: string }) {
    const targetPath = this.resolveObjectPath(input.objectKey);
    let bytes: Uint8Array;
    let metadata: Awaited<ReturnType<typeof stat>>;

    try {
      [bytes, metadata] = await Promise.all([
        readFile(targetPath),
        stat(targetPath),
      ]);
    } catch (error) {
      if (isNodeErrorCode(error, "ENOENT")) {
        return null;
      }

      throw error;
    }

    return {
      bytes,
      mimeType: mimeTypeForObjectKey(input.objectKey),
      sizeBytes: metadata.size,
    };
  }

  private resolveObjectPath(objectKey: string) {
    const normalizedKey = path.normalize(objectKey).replace(/^(\.\.(\/|\\|$))+/, "");
    const root = path.resolve(this.storageDir);
    const targetPath = path.resolve(root, normalizedKey);

    if (!targetPath.startsWith(root)) {
      throw new Error("Invalid storage object key.");
    }

    return targetPath;
  }
}

class S3CompatiblePodcastStorageAdapter implements PodcastStorageAdapter {
  async createSignedPlaybackUrl(): Promise<SignedUrl> {
    throw new Error("S3-compatible podcast storage is not configured yet.");
  }
}

function isNodeErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

function validateAudioFile(file: StorageFile) {
  if (file.sizeBytes > env.PODCAST_MAX_UPLOAD_BYTES) {
    throw new Error("Podcast audio file is too large.");
  }

  if (!["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/m4a"].includes(file.mimeType)) {
    throw new Error("Podcast audio must be an MP3 or M4A file.");
  }

  if (!hasValidAudioSignature(file.bytes)) {
    throw new Error("Podcast audio signature is invalid.");
  }
}

function hasValidAudioSignature(bytes: Uint8Array) {
  const header = Buffer.from(bytes.slice(0, 12));
  const startsWithId3 = header.subarray(0, 3).toString("ascii") === "ID3";
  const startsWithMp3Frame = header[0] === 0xff && (header[1] & 0xe0) === 0xe0;
  const hasM4aBox = header.subarray(4, 8).toString("ascii") === "ftyp";

  return startsWithId3 || startsWithMp3Frame || hasM4aBox;
}

function signPlaybackUrl(objectKey: string, expires: string) {
  return createHmac("sha256", env.PODCAST_SIGNED_URL_SECRET)
    .update(`${objectKey}:${expires}`)
    .digest("hex");
}

function mimeTypeForObjectKey(objectKey: string) {
  return objectKey.toLowerCase().endsWith(".m4a") ? "audio/mp4" : "audio/mpeg";
}
