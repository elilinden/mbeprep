import type { AudioFileCandidate, AudioMimeType } from "./podcast-types";

export const ALLOWED_AUDIO_MIME_TYPES: AudioMimeType[] = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
];

export function validateAudioFile(
  file: AudioFileCandidate,
  maxUploadBytes: number,
) {
  const errors: string[] = [];

  if (file.sizeBytes <= 0) {
    errors.push("Audio file is empty.");
  }

  if (file.sizeBytes > maxUploadBytes) {
    errors.push("Audio file exceeds the configured size limit.");
  }

  if (!ALLOWED_AUDIO_MIME_TYPES.includes(file.mimeType as AudioMimeType)) {
    errors.push("Audio MIME type is not allowed.");
  }

  if (!hasAllowedAudioSignature(file.bytes)) {
    errors.push("Audio file signature is not MP3 or M4A.");
  }

  return errors;
}

export function assertValidAudioFile(
  file: AudioFileCandidate,
  maxUploadBytes: number,
) {
  const errors = validateAudioFile(file, maxUploadBytes);

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
}

export function hasAllowedAudioSignature(bytes: Uint8Array) {
  return hasMp3Signature(bytes) || hasM4aSignature(bytes);
}

function hasMp3Signature(bytes: Uint8Array) {
  return (
    startsWithAscii(bytes, "ID3") ||
    (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0)
  );
}

function hasM4aSignature(bytes: Uint8Array) {
  return (
    bytes.length >= 12 &&
    startsWithAscii(bytes.subarray(4, 8), "ftyp") &&
    ["M4A ", "M4B ", "mp42", "isom"].some((brand) =>
      startsWithAscii(bytes.subarray(8, 12), brand),
    )
  );
}

function startsWithAscii(bytes: Uint8Array, value: string) {
  const encoded = new TextEncoder().encode(value);

  if (bytes.length < encoded.length) {
    return false;
  }

  return encoded.every((byte, index) => bytes[index] === byte);
}
