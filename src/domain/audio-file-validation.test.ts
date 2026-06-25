import { describe, expect, it } from "vitest";

import { validateAudioFile } from "./audio-file-validation";

const maxBytes = 1024;

describe("validateAudioFile", () => {
  it("accepts an MP3 with an ID3 signature", () => {
    const errors = validateAudioFile(
      {
        filename: "DEMO_NOT_FOR_PUBLICATION.mp3",
        mimeType: "audio/mpeg",
        sizeBytes: 16,
        bytes: new TextEncoder().encode("ID3DEMO_AUDIO"),
      },
      maxBytes,
    );

    expect(errors).toEqual([]);
  });

  it("accepts an M4A container signature", () => {
    const errors = validateAudioFile(
      {
        filename: "DEMO_NOT_FOR_PUBLICATION.m4a",
        mimeType: "audio/mp4",
        sizeBytes: 16,
        bytes: new Uint8Array([
          0, 0, 0, 16, 102, 116, 121, 112, 77, 52, 65, 32,
        ]),
      },
      maxBytes,
    );

    expect(errors).toEqual([]);
  });

  it("rejects unsupported MIME types, oversized files, and bad signatures", () => {
    const errors = validateAudioFile(
      {
        filename: "DEMO_NOT_FOR_PUBLICATION.txt",
        mimeType: "text/plain",
        sizeBytes: 2048,
        bytes: new TextEncoder().encode("not audio"),
      },
      maxBytes,
    );

    expect(errors).toContain("Audio MIME type is not allowed.");
    expect(errors).toContain("Audio file exceeds the configured size limit.");
    expect(errors).toContain("Audio file signature is not MP3 or M4A.");
  });
});
