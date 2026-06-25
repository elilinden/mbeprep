import { z } from "zod";

const serverEnvSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    NEXT_PUBLIC_APP_NAME: z.string().min(1).default("MBE Prep"),
    AUTH_SECRET: z
      .string()
      .min(16)
      .default("development-auth-secret-change-me"),
    ONBOARDING_EXTENDED_TIME_MULTIPLIER_MIN: z.coerce
      .number()
      .min(1)
      .default(1),
    ONBOARDING_EXTENDED_TIME_MULTIPLIER_MAX: z.coerce
      .number()
      .min(1)
      .default(2),
    PODCAST_STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    PODCAST_LOCAL_STORAGE_DIR: z.string().min(1).default("./storage/podcasts"),
    PODCAST_MAX_UPLOAD_BYTES: z.coerce.number().min(1).default(104_857_600),
    PODCAST_SIGNED_URL_SECRET: z
      .string()
      .min(16)
      .default("development-storage-secret-change-me"),
    PODCAST_SIGNED_URL_TTL_SECONDS: z.coerce.number().min(60).default(900),
    S3_ENDPOINT: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .superRefine((value, ctx) => {
    if (value.PODCAST_STORAGE_DRIVER !== "s3") {
      return;
    }

    for (const key of [
      "S3_ENDPOINT",
      "S3_BUCKET",
      "S3_REGION",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
    ] as const) {
      if (!value[key]?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: `${key} is required when PODCAST_STORAGE_DRIVER is s3.`,
          path: [key],
        });
      }
    }
  });

export const env = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  AUTH_SECRET: process.env.AUTH_SECRET,
  ONBOARDING_EXTENDED_TIME_MULTIPLIER_MIN:
    process.env.ONBOARDING_EXTENDED_TIME_MULTIPLIER_MIN,
  ONBOARDING_EXTENDED_TIME_MULTIPLIER_MAX:
    process.env.ONBOARDING_EXTENDED_TIME_MULTIPLIER_MAX,
  PODCAST_STORAGE_DRIVER: process.env.PODCAST_STORAGE_DRIVER,
  PODCAST_LOCAL_STORAGE_DIR: process.env.PODCAST_LOCAL_STORAGE_DIR,
  PODCAST_MAX_UPLOAD_BYTES: process.env.PODCAST_MAX_UPLOAD_BYTES,
  PODCAST_SIGNED_URL_SECRET: process.env.PODCAST_SIGNED_URL_SECRET,
  PODCAST_SIGNED_URL_TTL_SECONDS: process.env.PODCAST_SIGNED_URL_TTL_SECONDS,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_REGION: process.env.S3_REGION,
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
  NODE_ENV: process.env.NODE_ENV,
});
