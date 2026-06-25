import { NextResponse } from "next/server";

import {
  createPodcastStorageAdapter,
  verifyPodcastSignedUrl,
} from "@/server/storage/storage-adapter";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const objectKey = url.searchParams.get("key") ?? "";
  const expires = url.searchParams.get("expires") ?? "";
  const signature = url.searchParams.get("signature") ?? "";

  if (
    !objectKey ||
    !verifyPodcastSignedUrl({ objectKey, expires, signature })
  ) {
    return NextResponse.json({ error: "Invalid playback URL." }, { status: 403 });
  }

  const storage = createPodcastStorageAdapter();
  const object = await storage.readObject?.({ objectKey });

  if (!object) {
    return NextResponse.json({ error: "Audio not found." }, { status: 404 });
  }

  return new Response(Buffer.from(object.bytes), {
    headers: {
      "Content-Length": String(object.sizeBytes),
      "Content-Type": object.mimeType,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
